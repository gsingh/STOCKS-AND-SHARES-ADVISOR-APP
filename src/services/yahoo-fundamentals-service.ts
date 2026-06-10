/**
 * Yahoo Finance Fundamentals Service
 *
 * Uses the /api/yahoo/v10 proxy (server/index.js) which handles the Yahoo crumb
 * requirement automatically. The backend fetches cookies, extracts the crumb,
 * and attaches it to every quoteSummary request.
 */

import type { DataEnvelope } from '../types/envelope'
import type { FundamentalData } from './screener-service'

const CORE_FIELDS: (keyof FundamentalData)[] = [
  'peRatio',
  'pbRatio',
  'roe',
  'debtToEquity',
  'operatingMargin',
  'netProfitMargin',
  'eps',
  'bookValue',
]

function countPresentFields(data: Partial<FundamentalData>): number {
  return CORE_FIELDS.filter((k) => {
    const v = data[k]
    return v !== undefined && v !== null && Number.isFinite(v) && v !== 0
  }).length
}

function deriveRoce(
  roe: number | undefined,
  debtToEquity: number | undefined,
): number | undefined {
  if (roe === undefined || debtToEquity === undefined) return undefined
  if (!Number.isFinite(roe) || !Number.isFinite(debtToEquity)) return undefined
  const denominator = 1 + debtToEquity
  if (denominator === 0) return undefined
  return roe / denominator
}

function parseRaw(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  return Number.isFinite(num) ? num : undefined
}

export function parseYahooQuoteSummaryResult(
  result: any,
): Partial<FundamentalData> {
  const sd = result.summaryDetail ?? {}
  const dks = result.defaultKeyStatistics ?? {}
  const fd = result.financialData ?? {}

  const partial: Partial<FundamentalData> = {
    marketCap: parseRaw(sd.marketCap?.raw ?? sd.marketCap),
    peRatio: parseRaw(sd.trailingPE?.raw ?? sd.trailingPE),
    pbRatio: parseRaw(dks.priceToBook?.raw ?? dks.priceToBook),
    roe: parseRaw(fd.returnOnEquity?.raw ?? fd.returnOnEquity),
    debtToEquity: parseRaw(fd.debtToEquity?.raw ?? fd.debtToEquity),
    operatingMargin: parseRaw(fd.operatingMargins?.raw ?? fd.operatingMargins),
    netProfitMargin: parseRaw(fd.profitMargins?.raw ?? fd.profitMargins),
    eps: parseRaw(dks.trailingEps?.raw ?? dks.trailingEps),
    dividendYield: parseRaw(sd.dividendYield?.raw ?? sd.dividendYield),
    bookValue: parseRaw(dks.bookValue?.raw ?? dks.bookValue),
    promoterHolding: parseRaw(dks.heldPercentInsiders?.raw ?? dks.heldPercentInsiders),
    freeCashFlow: parseRaw(fd.freeCashflow?.raw ?? fd.freeCashflow),
    revenueGrowth: parseRaw(fd.revenueGrowth?.raw ?? fd.revenueGrowth),
    epsGrowth: parseRaw(fd.earningsGrowth?.raw ?? fd.earningsGrowth),
    currentPrice: parseRaw(
      fd.currentPrice?.raw ?? fd.currentPrice ?? sd.regularMarketPrice?.raw ?? sd.regularMarketPrice,
    ),
  }

  const derivedRoce = deriveRoce(partial.roe, partial.debtToEquity)
  if (derivedRoce !== undefined) {
    partial.roce = derivedRoce
  }

  return partial
}

export function fillFundamentalData(partial: Partial<FundamentalData>): FundamentalData {
  return {
    marketCap: partial.marketCap ?? 0,
    peRatio: partial.peRatio ?? 0,
    pbRatio: partial.pbRatio ?? 0,
    roe: partial.roe ?? 0,
    roce: partial.roce ?? 0,
    debtToEquity: partial.debtToEquity ?? 0,
    operatingMargin: partial.operatingMargin ?? 0,
    netProfitMargin: partial.netProfitMargin ?? 0,
    eps: partial.eps ?? 0,
    dividendYield: partial.dividendYield ?? 0,
    bookValue: partial.bookValue ?? 0,
    promoterHolding: partial.promoterHolding ?? 0,
    freeCashFlow: partial.freeCashFlow ?? 0,
    currentPrice: partial.currentPrice,
    revenueGrowth: partial.revenueGrowth,
    epsGrowth: partial.epsGrowth,
    pledgedShares: partial.pledgedShares,
    governanceQuality: partial.governanceQuality,
  }
}

const EXCHANGE_SUFFIXES = ['.NS', '.BO']

async function tryFetchYahooSymbol(
  yahooSymbol: string,
  modules: string,
): Promise<{ data: FundamentalData | null; error?: string }> {
  const url = `/api/yahoo/v10/finance/quoteSummary/${yahooSymbol}?modules=${modules}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Yahoo returned ${res.status} for ${yahooSymbol}`)
  }
  const json = await res.json()
  const result = json.quoteSummary?.result?.[0]
  if (!result) {
    throw new Error(`Quote not found for ${yahooSymbol}`)
  }

  const partial = parseYahooQuoteSummaryResult(result)
  const presentCount = countPresentFields(partial)
  if (presentCount < 5) {
    return { data: null, error: `Yahoo returned only ${presentCount} core fields for ${yahooSymbol}; insufficient for scoring` }
  }

  return { data: fillFundamentalData(partial) }
}

export async function fetchFundamentalsFromYahoo(
  symbol: string,
): Promise<DataEnvelope<FundamentalData>> {
  const modules = 'summaryDetail,defaultKeyStatistics,financialData'

  const errors: string[] = []

  for (const suffix of EXCHANGE_SUFFIXES) {
    try {
      const result = await tryFetchYahooSymbol(`${symbol}${suffix}`, modules)
      if (result.data) {
        return {
          data: result.data,
          fetchedAt: new Date().toISOString(),
          source: 'api',
        }
      }
      if (result.error) errors.push(result.error)
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err))
    }
  }

  return {
    data: null,
    fetchedAt: null,
    source: 'api',
    error: errors.join('; '),
  }
}
