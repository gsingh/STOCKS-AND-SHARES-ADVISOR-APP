import { db, withErrorHandling, type StockRow } from './db'
import type { DataEnvelope } from '../types/envelope'

const QUOTE_TTL = 15 * 60 * 1000

export interface QuoteData {
  lastPrice: number
  change: number
  changePercent: number
  dayHigh: number
  dayLow: number
  volume: number
  fetchedAt: string
  source: 'cache' | 'api'
}

function isStale(fetchedAt: string | undefined): boolean {
  if (!fetchedAt) return true
  return Date.now() - new Date(fetchedAt).getTime() > QUOTE_TTL
}

function toQuoteData(row: StockRow): QuoteData {
  return {
    lastPrice: row.lastPrice ?? 0,
    change: row.change ?? 0,
    changePercent: row.changePercent ?? 0,
    dayHigh: row.dayHigh ?? 0,
    dayLow: row.dayLow ?? 0,
    volume: row.volume ?? 0,
    fetchedAt: row.fetchedAt ?? '',
    source: 'cache',
  }
}

async function fetchFromYahoo(symbol: string): Promise<QuoteData> {
  const yahooSymbol = `${symbol}.NS`
  const res = await fetch(`/api/yahoo/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`)
  if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status}`)
  const json = await res.json()
  const meta = json.chart?.result?.[0]?.meta
  if (!meta) throw new Error('Invalid Yahoo Finance response')

  const lastPrice = meta.regularMarketPrice ?? 0
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? 0
  const change = prevClose ? lastPrice - prevClose : 0
  const changePercent = prevClose ? (change / prevClose) * 100 : 0

  const now = new Date().toISOString()
  return {
    lastPrice,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    dayHigh: meta.regularMarketDayHigh ?? 0,
    dayLow: meta.regularMarketDayLow ?? 0,
    volume: meta.regularMarketVolume ?? 0,
    fetchedAt: now,
    source: 'api',
  }
}

async function fetchQuotesBatchFromYahoo(symbols: string[]): Promise<Record<string, QuoteData>> {
  const yahooSymbols = symbols.map((s) => `${s}.NS`).join(',')
  const url = `/api/yahoo/v7/finance/quote?symbols=${encodeURIComponent(yahooSymbols)}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Yahoo batch quote returned ${res.status}`)

  const json = await res.json()
  const items = json.quoteResponse?.result ?? []

  const quoteMap: Record<string, QuoteData> = {}
  const now = new Date().toISOString()

  for (const item of items) {
    const rawSymbol = item.symbol as string | undefined
    if (!rawSymbol) continue
    const symbol = rawSymbol.replace('.NS', '')

    const lastPrice = (item.regularMarketPrice as number) ?? 0
    const prevClose = (item.regularMarketPreviousClose as number) ?? 0
    const change = prevClose ? lastPrice - prevClose : 0
    const changePercent = prevClose ? (change / prevClose) * 100 : 0

    quoteMap[symbol] = {
      lastPrice,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      dayHigh: (item.regularMarketDayHigh as number) ?? 0,
      dayLow: (item.regularMarketDayLow as number) ?? 0,
      volume: (item.regularMarketVolume as number) ?? 0,
      fetchedAt: now,
      source: 'api',
    }
  }

  return quoteMap
}

async function persist(symbol: string, data: QuoteData): Promise<void> {
  await withErrorHandling(
    () =>
      db.stock.put({
        symbol,
        name: '',
        sector: '',
        lastPrice: data.lastPrice,
        change: data.change,
        changePercent: data.changePercent,
        dayHigh: data.dayHigh,
        dayLow: data.dayLow,
        volume: data.volume,
        fetchedAt: data.fetchedAt,
      }),
    undefined,
  )
}

export async function getQuote(symbol: string): Promise<DataEnvelope<QuoteData>> {
  const cached = await withErrorHandling(() => db.stock.get(symbol), undefined)

  if (cached && !isStale(cached.fetchedAt)) {
    return {
      data: toQuoteData(cached),
      fetchedAt: cached.fetchedAt ?? null,
      source: 'cache',
    }
  }

  try {
    const fresh = await fetchFromYahoo(symbol)
    await persist(symbol, fresh)
    return {
      data: fresh,
      fetchedAt: fresh.fetchedAt,
      source: 'api',
    }
  } catch (err) {
    if (cached) {
      return {
        data: toQuoteData(cached),
        fetchedAt: cached.fetchedAt ?? null,
        source: 'cache',
        error: err instanceof Error ? err.message : 'Failed to fetch quote',
      }
    }
    return {
      data: null,
      fetchedAt: null,
      source: 'api',
      error: err instanceof Error ? err.message : 'Failed to fetch quote',
    }
  }
}

export async function getQuotes(symbols: string[]): Promise<Record<string, DataEnvelope<QuoteData>>> {
  if (symbols.length <= 1) {
    // Single symbol: use existing path
    const results: Record<string, DataEnvelope<QuoteData>> = {}
    await Promise.all(
      symbols.map(async (symbol) => {
        results[symbol] = await getQuote(symbol)
      }),
    )
    return results
  }

  // Multiple symbols: try batch fetch first
  try {
    const batchResults = await fetchQuotesBatchFromYahoo(symbols)
    const results: Record<string, DataEnvelope<QuoteData>> = {}
    const persistPromises: Promise<void>[] = []

    for (const symbol of symbols) {
      const quote = batchResults[symbol]
      if (quote) {
        results[symbol] = {
          data: quote,
          fetchedAt: quote.fetchedAt,
          source: 'api',
        }
        persistPromises.push(persist(symbol, quote))
      }
    }

    await Promise.all(persistPromises)

    // Fallback to individual calls for any symbols missing from batch response
    const missing = symbols.filter((s) => !batchResults[s])
    if (missing.length > 0) {
      const fallbackResults = await Promise.all(
        missing.map(async (symbol) => [symbol, await getQuote(symbol)] as const),
      )
      for (const [symbol, envelope] of fallbackResults) {
        results[symbol] = envelope
      }
    }

    return results
  } catch (err) {
    console.warn('Batch quote fetch failed, falling back to individual calls:', err)
    const results: Record<string, DataEnvelope<QuoteData>> = {}
    await Promise.all(
      symbols.map(async (symbol) => {
        results[symbol] = await getQuote(symbol)
      }),
    )
    return results
  }
}
