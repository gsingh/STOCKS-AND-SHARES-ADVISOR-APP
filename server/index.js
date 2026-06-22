/**
 * Yahoo Finance Crumb Proxy Server
 *
 * This server solves Yahoo Finance's anti-bot protection by:
 *   1. Fetching session cookies from query1.finance.yahoo.com
 *   2. Requesting a crumb token via /v1/test/getcrumb
 *   3. Caching both for 30 minutes
 *   4. Proxying /v10/finance/quoteSummary requests with the crumb attached
 *
 * Requires Node.js 18+ (native fetch).
 * Run with: node server/index.js
 */

import http from 'node:http'
import url from 'node:url'

const PORT = process.env.PORT || 3001
const YAHOO_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const YAHOO_HEADERS = {
  'User-Agent': YAHOO_UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
}

let crumbStore = null // { crumb, cookies, expiresAt }
let nseSymbolsCache = null // { data, expiresAt }
const stats = { 429: 0, 401: 0, other: 0, total: 0, bySymbol: {}, recent429Timestamps: [], recent429s: 0 }

// ─── Rate Limiter ──────────────────────────────────────────────────
// Token bucket: max 3 requests/sec to Yahoo to avoid 429s
class RateLimiter {
  constructor(maxPerSec = 3) {
    this.maxPerSec = maxPerSec
    this.tokens = maxPerSec
    this.lastRefill = Date.now()
  }

  async wait() {
    const now = Date.now()
    const elapsed = (now - this.lastRefill) / 1000
    this.lastRefill = now
    this.tokens = Math.min(this.maxPerSec, this.tokens + elapsed * this.maxPerSec)

    if (this.tokens >= 1) {
      this.tokens -= 1
      return
    }

    const waitMs = ((1 - this.tokens) / this.maxPerSec) * 1000
    console.warn(`[Proxy] Rate limiter: waiting ${Math.round(waitMs)}ms before next request`)
    await new Promise((r) => setTimeout(r, waitMs))
    this.tokens = 0
  }
}

// Global cooldown: when set, all requests wait before proceeding
let cooldownUntil = 0

async function checkpointCooldown() {
  const remaining = cooldownUntil - Date.now()
  if (remaining > 0) {
    console.warn(`[Proxy] Cooldown active, pausing ${Math.round(remaining)}ms`)
    await new Promise((r) => setTimeout(r, remaining))
  }
}

function trigger429Cooldown() {
  const recent429s = stats.recent429s || 0
  let delay
  if (recent429s < 3) delay = 3000
  else if (recent429s < 6) delay = 6000
  else if (recent429s < 10) delay = 15000
  else delay = 30000
  cooldownUntil = Date.now() + delay
  console.warn(`[Proxy] ⚠️  429 received! Cooldown for ${delay}ms (${recent429s} recent 429s)`)
}

function record429() {
  const now = Date.now()
  stats.recent429Timestamps.push(now)
  stats.recent429Timestamps = stats.recent429Timestamps.filter((t) => now - t < 60000)
  stats.recent429s = stats.recent429Timestamps.length
}

const rateLimiter = new RateLimiter(3)

// ─── End Rate Limiter ──────────────────────────────────────────────

function getSetCookie(response) {
  if (typeof response.headers.getSetCookie === 'function') {
    return response.headers.getSetCookie()
  }
  const raw = response.headers.get('set-cookie')
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

async function refreshCrumb() {
  console.log('[Proxy] Refreshing Yahoo crumb...')

  const maxAttempts = 3
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const initRes = await fetch('https://query1.finance.yahoo.com', {
        headers: YAHOO_HEADERS,
        redirect: 'follow',
      })

      const cookies = getSetCookie(initRes)
        .map((c) => c.split(';')[0])
        .join('; ')

      if (!cookies) {
        throw new Error('No cookies received from Yahoo Finance')
      }

      const crumbRes = await fetch(
        'https://query1.finance.yahoo.com/v1/test/getcrumb',
        {
          headers: {
            ...YAHOO_HEADERS,
            Cookie: cookies,
          },
        },
      )

      const crumb = (await crumbRes.text()).trim()
      if (!crumb || crumb.includes('error')) {
        throw new Error(`Invalid crumb received: ${crumb}`)
      }

      crumbStore = {
        crumb,
        cookies,
        expiresAt: Date.now() + 30 * 60 * 1000,
      }

      console.log('[Proxy] Crumb refreshed successfully')
      return crumbStore
    } catch (err) {
      console.warn(`[Proxy] Crumb refresh attempt ${attempt}/${maxAttempts} failed: ${err.message}`)
      if (attempt < maxAttempts) {
        const delay = attempt * 2000
        await new Promise((r) => setTimeout(r, delay))
      } else {
        throw err
      }
    }
  }
}

async function getCrumb() {
  if (crumbStore && Date.now() < crumbStore.expiresAt) {
    return crumbStore
  }
  return refreshCrumb()
}

// ─── NSE Symbols ─────────────────────────────────────────────────────

async function fetchNseSymbols() {
  if (nseSymbolsCache && Date.now() < nseSymbolsCache.expiresAt) {
    return nseSymbolsCache.data
  }

  console.log('[Proxy] Fetching NSE equity list...')

  const NSE_CSV_URL = 'https://archives.nseindia.com/content/equities/EQUITY_L.csv'

  const res = await fetch(NSE_CSV_URL, {
    headers: {
      'User-Agent': YAHOO_UA,
      Accept: 'text/csv, text/plain, */*',
      Referer: 'https://www.nseindia.com/',
    },
    redirect: 'follow',
  })

  if (!res.ok) {
    throw new Error(`NSE returned ${res.status} when fetching equity list`)
  }

  const csvText = await res.text()
  const lines = csvText.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) {
    throw new Error('NSE CSV appears empty or malformed')
  }

  // Parse header
  const header = lines[0].split(',').map((h) => h.trim())
  const idxSymbol = header.indexOf('SYMBOL')
  const idxName = header.indexOf('NAME OF COMPANY')
  const idxSeries = header.indexOf('SERIES')
  const idxIsin = header.indexOf('ISIN NUMBER')

  if (idxSymbol === -1 || idxName === -1) {
    throw new Error('NSE CSV missing required columns')
  }

  const stocks = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    if (cols.length < Math.max(idxSymbol, idxName, idxSeries, idxIsin) + 1) continue

    const symbol = cols[idxSymbol]?.trim()
    const name = cols[idxName]?.trim()
    const series = cols[idxSeries]?.trim()
    const isin = idxIsin >= 0 ? cols[idxIsin]?.trim() : undefined

    if (!symbol || !name) continue
    // Only equity series (EQ = normal equity, BE = trade-to-trade, etc.)
    // We include all series types so the app shows the full universe
    stocks.push({ symbol, name, series, isin })
  }

  nseSymbolsCache = {
    data: stocks,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h cache
  }

  console.log(`[Proxy] Loaded ${stocks.length} NSE symbols`)
  return stocks
}

function parseCsvLine(line) {
  const cols = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      cols.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  cols.push(current)
  return cols
}

// ─── End NSE Symbols ───────────────────────────────────────────────

async function proxyQuoteSummary(symbol, modules) {
  const { crumb, cookies } = await getCrumb()
  const targetUrl =
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/` +
    `${encodeURIComponent(symbol)}?modules=${encodeURIComponent(modules)}` +
    `&crumb=${encodeURIComponent(crumb)}`

  const maxRetries = 3
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await checkpointCooldown()
    await rateLimiter.wait()

    const res = await fetch(targetUrl, {
      headers: {
        ...YAHOO_HEADERS,
        Cookie: cookies,
      },
    })

    if (res.ok) {
      stats.total++
      return res.json()
    }

    const text = await res.text()

    if (res.status === 429) {
      stats[429]++
      stats.bySymbol[symbol] = (stats.bySymbol[symbol] || 0) + 1
      record429()
      trigger429Cooldown()
      if (attempt < maxRetries) {
        const jitter = Math.random() * 1000
        const delay = Math.pow(2, attempt) * 2000 + jitter
        console.warn(`[Proxy] 429 for ${symbol}, retry ${attempt + 1}/${maxRetries} in ${Math.round(delay)}ms`)
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      console.error(`[Proxy] 429 for ${symbol}, all retries exhausted`)
      throw new Error(`Yahoo returned 429 (Too Many Requests) for ${symbol}`)
    }

    if (res.status === 401) {
      stats[401]++
      stats.bySymbol[symbol] = (stats.bySymbol[symbol] || 0) + 1
      crumbStore = null
      throw new Error(`Yahoo returned 401 (Unauthorized): ${text}`)
    }

    stats.other++
    throw new Error(`Yahoo returned ${res.status}: ${text}`)
  }
}

async function proxyV7Quote(symbols) {
  const { crumb, cookies } = await getCrumb()
  const targetUrl =
    `https://query1.finance.yahoo.com/v7/finance/quote?` +
    `symbols=${encodeURIComponent(symbols)}` +
    `&crumb=${encodeURIComponent(crumb)}`

  const maxRetries = 3
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await checkpointCooldown()
    await rateLimiter.wait()

    const res = await fetch(targetUrl, {
      headers: {
        ...YAHOO_HEADERS,
        Cookie: cookies,
      },
    })

    if (res.ok) {
      stats.total++
      return res.json()
    }

    const text = await res.text()

    if (res.status === 429) {
      stats[429]++
      for (const sym of symbols.split(',')) {
        const s = sym.trim()
        if (s) stats.bySymbol[s] = (stats.bySymbol[s] || 0) + 1
      }
      record429()
      trigger429Cooldown()
      if (attempt < maxRetries) {
        const jitter = Math.random() * 1000
        const delay = Math.pow(2, attempt) * 2000 + jitter
        console.warn(`[Proxy] 429 for [${symbols}], retry ${attempt + 1}/${maxRetries} in ${Math.round(delay)}ms`)
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      console.error(`[Proxy] 429 for [${symbols}], all retries exhausted`)
      throw new Error(`Yahoo returned 429 (Too Many Requests) for [${symbols}]`)
    }

    if (res.status === 401) {
      stats[401]++
      crumbStore = null
      throw new Error(`Yahoo returned 401 (Unauthorized): ${text}`)
    }

    stats.other++
    throw new Error(`Yahoo returned ${res.status}: ${text}`)
  }
}

// ─── V8 Chart Proxy ─────────────────────────────────────────────────
async function proxyV8Chart(symbol, interval, range) {
  const { crumb, cookies } = await getCrumb()
  const targetUrl =
    `https://query1.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(symbol)}?interval=${encodeURIComponent(interval)}` +
    `&range=${encodeURIComponent(range)}` +
    `&crumb=${encodeURIComponent(crumb)}`

  await checkpointCooldown()
  await rateLimiter.wait()

  const res = await fetch(targetUrl, {
    headers: {
      ...YAHOO_HEADERS,
      Cookie: cookies,
    },
  })

  if (!res.ok) {
    const text = await res.text()

    if (res.status === 429) {
      stats[429]++
      record429()
      trigger429Cooldown()
      throw new Error(`Yahoo returned 429 (Too Many Requests) for ${symbol}`)
    }

    if (res.status === 401) {
      stats[401]++
      crumbStore = null
      throw new Error(`Yahoo returned 401 (Unauthorized): ${text}`)
    }

    stats.other++
    throw new Error(`Yahoo returned ${res.status}: ${text}`)
  }

  stats.total++
  return res.json()
}

// ─── Batch Fundamentals ────────────────────────────────────────

async function fetchSingleFundamental(symbol, modules, crumb, cookies) {
  const targetUrl =
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/` +
    `${encodeURIComponent(symbol)}?modules=${encodeURIComponent(modules)}` +
    `&crumb=${encodeURIComponent(crumb)}`

  const maxRetries = 3
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await checkpointCooldown()
      await rateLimiter.wait()

      const res = await fetch(targetUrl, {
        headers: {
          ...YAHOO_HEADERS,
          Cookie: cookies,
        },
      })

      if (res.ok) {
        stats.total++
        const json = await res.json()
        return { symbol, data: json }
      }

      if (res.status === 429) {
        stats[429]++
        record429()
        trigger429Cooldown()
        if (attempt < maxRetries) {
          const jitter = Math.random() * 1000
          const delay = Math.pow(2, attempt) * 2000 + jitter
          await new Promise(r => setTimeout(r, delay))
          continue
        }
        return { symbol, error: `Yahoo returned 429` }
      }

      if (res.status === 401) {
        stats[401]++
        crumbStore = null
        return { symbol, error: `Yahoo returned 401 (Unauthorized)` }
      }

      stats.other++
      return { symbol, error: `Yahoo returned ${res.status}` }
    } catch (err) {
      if (attempt < maxRetries) {
        const jitter = Math.random() * 1000
        const delay = Math.pow(2, attempt) * 2000 + jitter
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      return { symbol, error: err.message }
    }
  }
  return { symbol, error: 'Max retries exceeded' }
}

async function handleBatchFundamentals(req, res, parsed) {
  try {
    const symbolsParam = parsed.query.symbols || ''
    const modules = parsed.query.modules || 'summaryDetail,defaultKeyStatistics,financialData'
    const rawSymbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean)

    if (rawSymbols.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'No symbols provided' }))
      return
    }

    console.log(`[Proxy] Batch fundamentals: ${rawSymbols.length} symbols`)

    const { crumb, cookies } = await getCrumb()
    const results = {}
    const SERVER_CONCURRENCY = 3
    const queue = [...rawSymbols]
    let active = 0

    const processNext = async () => {
      while (queue.length > 0) {
        const symbol = queue.shift()
        active++
        const result = await fetchSingleFundamental(symbol, modules, crumb, cookies)
        const key = symbol.replace(/\.(NS|BO)$/i, '')
        results[key] = {
          symbol: key,
          data: result.data || null,
          error: result.error || null,
        }
        active--
      }
    }

    const workers = []
    for (let i = 0; i < Math.min(SERVER_CONCURRENCY, queue.length || 1); i++) {
      workers.push(processNext())
      // Stagger worker starts by 500ms to avoid burst at startup
      if (i < SERVER_CONCURRENCY - 1) {
        await new Promise(r => setTimeout(r, 500))
      }
    }
    await Promise.all(workers)

    console.log(`[Proxy] Batch fundamentals complete: ${Object.keys(results).length} results`)

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(results))
  } catch (err) {
    console.error('[Proxy] Batch fundamentals error:', err.message)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Batch fundamentals failed', message: err.message }))
  }
}

// ─── End Batch Fundamentals ────────────────────────────────────

const server = http.createServer(async (req, res) => {
  // CORS headers (allow Vite dev server)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const parsed = url.parse(req.url, true)

  // Handle /api/nse-symbols
  if (parsed.pathname === '/api/nse-symbols') {
    try {
      const stocks = await fetchNseSymbols()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(stocks))
      return
    } catch (err) {
      console.error('[Proxy] Error fetching NSE symbols:', err.message)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Failed to fetch NSE symbols', message: err.message }))
      return
    }
  }

  // Handle /api/proxy-stats
  if (parsed.pathname === '/api/proxy-stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(stats, null, 2))
    return
  }

  // Handle /api/yahoo/batch-fundamentals
  if (parsed.pathname === '/api/yahoo/batch-fundamentals') {
    await handleBatchFundamentals(req, res, parsed)
    return
  }

  // Handle /v10/finance/quoteSummary/*
  const v10Match = parsed.pathname.match(
    /^\/v10\/finance\/quoteSummary\/(.+)$/,
  )

  // Handle /v7/finance/quote
  const v7Match = parsed.pathname === '/v7/finance/quote'

  // Handle /v8/finance/chart/{symbol}
  const v8Match = parsed.pathname.match(
    /^\/v8\/finance\/chart\/(.+)$/,
  )

  if (!v10Match && !v7Match && !v8Match) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        error: 'Not found. Expected /api/nse-symbols, /api/proxy-stats, /api/yahoo/batch-fundamentals, /v10/finance/quoteSummary/{symbol} or /v7/finance/quote',
      }),
    )
    return
  }

  try {
    if (v10Match) {
      const symbol = decodeURIComponent(v10Match[1])
      const modules = parsed.query.modules || 'summaryDetail'
      const data = await proxyQuoteSummary(symbol, modules)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(data))
    } else if (v7Match) {
      const symbols = parsed.query.symbols || ''
      const data = await proxyV7Quote(symbols)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(data))
    } else if (v8Match) {
      const symbol = decodeURIComponent(v8Match[1])
      const interval = parsed.query.interval || '1d'
      const range = parsed.query.range || '1y'
      const data = await proxyV8Chart(symbol, interval, range)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(data))
    }
  } catch (err) {
    console.error('[Proxy] Error:', err.message)

    // If unauthorized, clear crumb so next request retries
    if (
      err.message.includes('Unauthorized') ||
      err.message.includes('Invalid Crumb')
    ) {
      crumbStore = null
    }

    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        error: 'Proxy error',
        message: err.message,
      }),
    )
  }
})

server.listen(PORT, () => {
  console.log(`[Server] Yahoo Finance Crumb Proxy on http://localhost:${PORT}`)
  console.log(
    `[Server] Test: curl "http://localhost:${PORT}/v10/finance/quoteSummary/RELIANCE.NS?modules=summaryDetail"`,
  )
  console.log(
    `[Server] NSE symbols: curl "http://localhost:${PORT}/api/nse-symbols"`,
  )
  console.log(
    `[Server] Batch fundamentals: curl "http://localhost:${PORT}/api/yahoo/batch-fundamentals?symbols=RELIANCE.NS,TCS.NS&modules=summaryDetail,defaultKeyStatistics,financialData"`,
  )
})
