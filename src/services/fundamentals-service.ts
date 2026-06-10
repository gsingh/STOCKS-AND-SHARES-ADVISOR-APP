import { db, withErrorHandling, type FundamentalRow } from './db'
import { fetchFundamentalsFromYahoo } from './yahoo-fundamentals-service'
import { getFundamentals as getFundamentalsFromScreener } from './screener-service'
import type { FundamentalData } from './screener-service'
import type { DataEnvelope } from '../types/envelope'

export type { FundamentalData }

const FUNDAMENTAL_TTL = 24 * 60 * 60 * 1000

function isStale(fetchedAt: string | undefined): boolean {
  if (!fetchedAt) return true
  return Date.now() - new Date(fetchedAt).getTime() > FUNDAMENTAL_TTL
}

function toDbRow(symbol: string, data: FundamentalData, fetchedAt: string) {
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

function fromDbRow(row: FundamentalRow): FundamentalData {
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

export async function getFundamentals(
  symbol: string,
): Promise<DataEnvelope<FundamentalData>> {
  const cached = await withErrorHandling(() => db.fundamental.get(symbol), undefined)

  if (cached && !isStale(cached.fetchedAt)) {
    return {
      data: fromDbRow(cached),
      fetchedAt: cached.fetchedAt ?? null,
      source: 'cache',
    }
  }

  const now = new Date().toISOString()

  // Primary: Yahoo Finance (via crumb proxy)
  const yahooResult = await fetchFundamentalsFromYahoo(symbol)
  if (yahooResult.data) {
    await withErrorHandling(
      () => db.fundamental.put(toDbRow(symbol, yahooResult.data!, now)),
      undefined,
    )

    if (yahooResult.data!.currentPrice != null && yahooResult.data!.currentPrice > 0) {
      await withErrorHandling(
        () =>
          db.stock.where('symbol').equals(symbol).modify({ lastPrice: yahooResult.data!.currentPrice }),
        undefined,
      )
    }

    return {
      data: yahooResult.data,
      fetchedAt: now,
      source: 'api',
      currentPrice: yahooResult.data!.currentPrice,
    }
  }

  console.warn(`Yahoo Finance failed for ${symbol}:`, yahooResult.error)

  // Fallback: Screener.in (HTML scraping)
  try {
    const screenerResult = await getFundamentalsFromScreener(symbol)
    if (screenerResult.data) {
      await withErrorHandling(
        () => db.fundamental.put(toDbRow(symbol, screenerResult.data!, now)),
        undefined,
      )

      if (screenerResult.currentPrice != null && screenerResult.currentPrice > 0) {
        await withErrorHandling(
          () =>
            db.stock.where('symbol').equals(symbol).modify({ lastPrice: screenerResult.currentPrice ?? undefined }),
          undefined,
        )
      }

      return {
        data: screenerResult.data,
        fetchedAt: now,
        source: 'scraper',
        currentPrice: screenerResult.currentPrice,
      }
    }
    console.warn(`Screener.in returned no data for ${symbol}:`, screenerResult.error)
  } catch (err) {
    console.warn(`Screener.in failed for ${symbol}:`, err)
  }

  // All sources failed — return stale cache if available
  if (cached) {
    return {
      data: fromDbRow(cached),
      fetchedAt: cached.fetchedAt ?? null,
      source: 'cache',
      error: `Yahoo & Screener both failed. Using stale cache. Yahoo error: ${yahooResult.error ?? 'unknown'}`,
    }
  }

  return {
    data: null,
    fetchedAt: null,
    source: 'api',
    error: `Failed to fetch fundamentals for ${symbol}. Yahoo & Screener both failed.`,
  }
}
