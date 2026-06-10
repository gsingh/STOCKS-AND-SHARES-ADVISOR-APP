import { db, withErrorHandling } from './db'
import type { FundamentalRow } from './db'
import type { DataEnvelope } from '../types/envelope'
import { toSlug } from './screener-slugs'

const FUNDAMENTAL_TTL = 24 * 60 * 60 * 1000

export interface FundamentalData {
  marketCap: number
  peRatio: number
  pbRatio: number
  roe: number
  roce: number
  debtToEquity: number
  operatingMargin: number
  netProfitMargin: number
  eps: number
  dividendYield: number
  bookValue: number
  promoterHolding: number
  freeCashFlow: number
  currentPrice?: number
  revenueGrowth?: number
  epsGrowth?: number
  pledgedShares?: number
  governanceQuality?: number
}

export function getSlug(symbol: string): string {
  return toSlug(symbol)
}

function isStale(fetchedAt: string | undefined): boolean {
  if (!fetchedAt) return true
  return Date.now() - new Date(fetchedAt).getTime() > FUNDAMENTAL_TTL
}

function parseNumber(value: string): number | null {
  const cleaned = value.replace(/[₹,%,\s,]/g, '').replace(/,/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function tryParse(text: string, label: string): number | null {
  const regex = new RegExp(
    `<span class="name">\\s*${label}\\s*<\\/span>[\\s\\S]*?<span class="nowrap value">[\\s\\S]*?<span class="number">([^<]+)`,
    'i',
  )
  const match = text.match(regex)
  return match ? parseNumber(match[1].trim()) : null
}

function extractFromMeta(html: string): Partial<FundamentalData> {
  const m = html.match(/<meta name="description" content="([^"]+)"/)
  if (!m) return {}
  const desc = m[1]

  const result: Partial<FundamentalData> = {}

  const pb = desc.match(/trading at ([\d.]+) times/)
  if (pb) result.pbRatio = parseFloat(pb[1])

  const ph = desc.match(/Promoter Holding: ([\d.]+)%/)
  if (ph) result.promoterHolding = parseFloat(ph[1])

  const rev = desc.match(/Revenue: ([\d,]+) Cr/)
  if (rev) {
    const n = parseNumber(rev[1])
    if (n !== null) result.revenueGrowth = n
  }

  return result
}

function parseFundamentals(html: string) {
  if (!html || html.length < 100) return null
  const text = html.replace(/\n/g, ' ')
  const meta = extractFromMeta(html)
  const mc = tryParse(text, 'Market Cap')
  return {
    fundamentals: {
      marketCap: mc ?? 0,
      peRatio: tryParse(text, 'Stock P/E') ?? 0,
      pbRatio: meta.pbRatio ?? 0,
      roe: tryParse(text, 'ROE') ?? 0,
      roce: tryParse(text, 'ROCE') ?? 0,
      debtToEquity: 0,
      operatingMargin: 0,
      netProfitMargin: 0,
      eps: 0,
      dividendYield: tryParse(text, 'Dividend Yield') ?? 0,
      bookValue: tryParse(text, 'Book Value') ?? 0,
      promoterHolding: meta.promoterHolding ?? 0,
      freeCashFlow: 0,
      currentPrice: tryParse(text, 'Current Price') ?? undefined,
      revenueGrowth: meta.revenueGrowth,
      epsGrowth: undefined,
      pledgedShares: undefined,
      governanceQuality: undefined,
    } as FundamentalData,
    currentPrice: tryParse(text, 'Current Price'),
  }
}

function toFundamentalRow(symbol: string, data: FundamentalData, fetchedAt: string) {
  return {
    symbol,
    marketCap: data.marketCap,
    peRatio: data.peRatio,
    pbRatio: data.pbRatio,
    roe: data.roe,
    roce: data.roce,
    debtToEquity: data.debtToEquity,
    operatingMargin: data.operatingMargin,
    netProfitMargin: data.netProfitMargin,
    eps: data.eps,
    dividendYield: data.dividendYield,
    bookValue: data.bookValue,
    promoterHolding: data.promoterHolding,
    freeCashFlow: data.freeCashFlow,
    revenueGrowth: data.revenueGrowth,
    epsGrowth: data.epsGrowth,
    pledgedShares: data.pledgedShares,
    governanceQuality: data.governanceQuality,
    fetchedAt,
  }
}

function fromFundamentalRow(row: FundamentalRow): FundamentalData {
  return {
    marketCap: row.marketCap ?? 0,
    peRatio: row.peRatio ?? 0,
    pbRatio: row.pbRatio ?? 0,
    roe: row.roe ?? 0,
    roce: row.roce ?? 0,
    debtToEquity: row.debtToEquity ?? 0,
    operatingMargin: row.operatingMargin ?? 0,
    netProfitMargin: row.netProfitMargin ?? 0,
    eps: row.eps ?? 0,
    dividendYield: row.dividendYield ?? 0,
    bookValue: row.bookValue ?? 0,
    promoterHolding: row.promoterHolding ?? 0,
    freeCashFlow: row.freeCashFlow ?? 0,
    revenueGrowth: row.revenueGrowth,
    epsGrowth: row.epsGrowth,
    pledgedShares: row.pledgedShares,
    governanceQuality: row.governanceQuality,
  }
}

async function fetchFromScreener(slug: string): Promise<{ fundamentals: FundamentalData; currentPrice: number | null }> {
  const proxyUrl = `/api/screener/company/${slug}/`
  let res: Response
  try {
    res = await fetch(proxyUrl, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
  } catch (err) {
    if (err instanceof TypeError && err.message?.includes('fetch failed')) {
      console.warn(`[Screener] Connection failed for ${slug} — upstream may be blocking this network`)
      throw new Error(`Screener.in unreachable (connection refused)`)
    }
    throw err
  }
  if (!res.ok) throw new Error(`Screener API returned ${res.status}`)
  const html = await res.text()
  const parsed = parseFundamentals(html)
  if (!parsed) throw new Error('Failed to parse fundamental data from Screener.in')
  return parsed
}

export async function getFundamentals(symbol: string): Promise<DataEnvelope<FundamentalData>> {
  const cached = await withErrorHandling(() => db.fundamental.get(symbol), undefined)
  const now = new Date().toISOString()

  if (cached && !isStale(cached.fetchedAt)) {
    return {
      data: fromFundamentalRow(cached),
      fetchedAt: cached.fetchedAt ?? null,
      source: 'cache',
    }
  }

  try {
    const slug = getSlug(symbol)
    const result = await fetchFromScreener(slug)
    await withErrorHandling(
      () => db.fundamental.put(toFundamentalRow(symbol, result.fundamentals, now)),
      undefined,
    )
    if (result.currentPrice != null && result.currentPrice > 0) {
      await withErrorHandling(
        () => db.stock.where('symbol').equals(symbol).modify({ lastPrice: result.currentPrice ?? undefined }),
        undefined,
      )
    }
    return {
      data: result.fundamentals,
      fetchedAt: now,
      source: 'scraper',
      currentPrice: result.currentPrice ?? undefined,
    }
  } catch (err) {
    if (cached) {
      return {
        data: fromFundamentalRow(cached),
        fetchedAt: cached.fetchedAt ?? null,
        source: 'cache',
        error: err instanceof Error ? err.message : 'Failed to fetch fundamentals',
      }
    }
    return {
      data: null,
      fetchedAt: null,
      source: 'scraper',
      error: err instanceof Error ? err.message : 'Failed to fetch fundamentals',
    }
  }
}
