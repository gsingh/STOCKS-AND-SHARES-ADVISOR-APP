import { getQuote } from './quote-service'
import { getFundamentals } from './fundamentals-service'
import { getStockData } from './stock-service'
import { db, withErrorHandling } from './db'
import type { DataEnvelope } from '../types/envelope'
import type { StockData } from './stock-service'

export const QUOTE_TTL = 15 * 60 * 1000
export const FUNDAMENTAL_TTL = 24 * 60 * 60 * 1000

function isQuoteStale(fetchedAt: string | undefined): boolean {
  if (!fetchedAt) return true
  return Date.now() - new Date(fetchedAt).getTime() > QUOTE_TTL
}

function isFundamentalStale(fetchedAt: string | undefined): boolean {
  if (!fetchedAt) return true
  return Date.now() - new Date(fetchedAt).getTime() > FUNDAMENTAL_TTL
}

export async function refreshIfStale(symbol: string): Promise<DataEnvelope<StockData>> {
  const [cachedQuote, cachedFundamental] = await Promise.all([
    withErrorHandling(() => db.stock.get(symbol), undefined),
    withErrorHandling(() => db.fundamental.get(symbol), undefined),
  ])

  const quoteStale = isQuoteStale(cachedQuote?.fetchedAt)
  const fundamentalStale = isFundamentalStale(cachedFundamental?.fetchedAt)

  if (quoteStale || fundamentalStale) {
    const promises: Promise<unknown>[] = []
    if (quoteStale) promises.push(getQuote(symbol))
    if (fundamentalStale) promises.push(getFundamentals(symbol))
    await Promise.allSettled(promises)
  }

  return getStockData(symbol)
}

export async function refreshWatchlist(watchlist: string[]): Promise<void> {
  await Promise.allSettled(watchlist.map((symbol) => refreshIfStale(symbol)))
}
