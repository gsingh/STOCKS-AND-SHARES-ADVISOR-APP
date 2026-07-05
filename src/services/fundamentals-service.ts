import { db, withErrorHandling, type FundamentalRow } from './db'
import { fetchFundamentalsFromYahoo } from './yahoo-fundamentals-service'
import { getFundamentals as getFundamentalsFromScreener } from './screener-service'
import type { FundamentalData } from './screener-service'
import type { DataEnvelope } from '../types/envelope'

export type { FundamentalData }

const FUNDAMENTAL_TTL = 24 * 60 * 60 * 1000
const FAILURE_CACHE_KEY = 'fundamental_fetch_failures'

function isRecentFailure(symbol: string): boolean {
  try {
    const raw = localStorage.getItem(FAILURE_CACHE_KEY)
    if (!raw) return false
    const cache: Record<string, number> = JSON.parse(raw)
    const ts = cache[symbol]
    if (!ts) return false
    return Date.now() - ts < FUNDAMENTAL_TTL
  } catch {
    return false
  }
}

function markFailure(symbol: string): void {
  try {
    const raw = localStorage.getItem(FAILURE_CACHE_KEY)
    const cache: Record<string, number> = raw ? JSON.parse(raw) : {}
    cache[symbol] = Date.now()
    localStorage.setItem(FAILURE_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage may be full or unavailable
  }
}

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
    payoutRatio: data.payoutRatio,
    bookValue: data.bookValue,
    promoterHolding: data.promoterHolding,
    freeCashFlow: data.freeCashFlow,
    revenueCagr3Y: data.revenueCagr3Y,
    netIncomeCagr3Y: data.netIncomeCagr3Y,
    pledgedShares: data.pledgedShares,
    governanceQuality: data.governanceQuality,
    currentRatio: data.currentRatio,
    netCurrentAssets: data.netCurrentAssets,
    longTermDebt: data.longTermDebt,
    dividendYears: data.dividendYears,
    dividendConsistent: data.dividendConsistent,
    eps3yAvg: data.eps3yAvg,
    pe3yAvg: data.pe3yAvg,
    peTimesPb: data.peTimesPb,
    earningsStable: data.earningsStable,
    earningsStable5Y: data.earningsStable5Y,
    netIncomeCagr5Y: data.netIncomeCagr5Y,
    netIncomeCagr10Y: data.netIncomeCagr10Y,
    fiftyTwoWeekHigh: data.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: data.fiftyTwoWeekLow,
    grahamNumber: data.grahamNumber,
    priceDecline52W: data.priceDecline52W,
    priceToIntrinsicValue: data.priceToIntrinsicValue,
    bargainZone: data.bargainZone,
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
    payoutRatio: row.payoutRatio ?? 0,
    bookValue: row.bookValue ?? 0,
    promoterHolding: row.promoterHolding ?? 0,
    freeCashFlow: row.freeCashFlow ?? 0,
    revenueCagr3Y: row.revenueCagr3Y,
    netIncomeCagr3Y: row.netIncomeCagr3Y,
    pledgedShares: row.pledgedShares,
    governanceQuality: row.governanceQuality,
    currentRatio: row.currentRatio,
    netCurrentAssets: row.netCurrentAssets,
    longTermDebt: row.longTermDebt,
    dividendYears: row.dividendYears,
    dividendConsistent: row.dividendConsistent,
    eps3yAvg: row.eps3yAvg,
    pe3yAvg: row.pe3yAvg,
    peTimesPb: row.peTimesPb,
    earningsStable: row.earningsStable,
    earningsStable5Y: row.earningsStable5Y,
    netIncomeCagr5Y: row.netIncomeCagr5Y,
    netIncomeCagr10Y: row.netIncomeCagr10Y,
    fiftyTwoWeekHigh: row.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: row.fiftyTwoWeekLow,
    grahamNumber: row.grahamNumber,
    priceDecline52W: row.priceDecline52W,
    priceToIntrinsicValue: row.priceToIntrinsicValue,
    bargainZone: row.bargainZone,
  }
}

export async function getFundamentals(
  symbol: string,
): Promise<DataEnvelope<FundamentalData>> {
  if (isRecentFailure(symbol)) {
    return {
      data: null,
      fetchedAt: null,
      source: 'api',
      error: 'Skipped — prior fetch attempt failed within 24h',
    }
  }

  const cached = await withErrorHandling(() => db.fundamental.get(symbol), undefined)

  if (cached && !isStale(cached.fetchedAt)) {
    return {
      data: fromDbRow(cached),
      fetchedAt: cached.fetchedAt ?? null,
      source: 'cache',
    }
  }

  const now = new Date().toISOString()

  // Primary: Yahoo Finance (via crumb proxy) with 1 retry
  let yahooResult = await fetchFundamentalsFromYahoo(symbol)
  if (!yahooResult.data) {
    await new Promise((r) => setTimeout(r, 1000))
    yahooResult = await fetchFundamentalsFromYahoo(symbol)
  }

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

  console.warn(`Yahoo Finance failed for ${symbol} after retry:`, yahooResult.error)

  // Fallback: Screener.in (HTML scraping) — only attempt if slug exists
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

  // All sources failed
  markFailure(symbol)

  // Return stale cache if available
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
