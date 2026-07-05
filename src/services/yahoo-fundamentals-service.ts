/**
 * Yahoo Finance Fundamentals Service
 *
 * Uses the /api/yahoo/v10 proxy (server/index.js) which handles the Yahoo crumb
 * requirement automatically. The backend fetches cookies, extracts the crumb,
 * and attaches it to every quoteSummary request.
 */

import type { DataEnvelope } from '../types/envelope'
import type { FundamentalData } from './screener-service'
import { toYahooSymbol } from './yahoo-symbol'
import { computeFinancialCAGR } from '../features/calculators/cagr'

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

function computeRevenueCagr3Y(result: any): number | undefined {
  const ish = result.incomeStatementHistory?.incomeStatementHistory ?? []
  const revenues: number[] = []
  for (const entry of ish) {
    const r = parseRaw(entry.totalRevenue?.raw ?? entry.totalRevenue)
    if (r === undefined) break
    revenues.push(r)
  }
  if (revenues.length < 2) return undefined
  const result_ = computeFinancialCAGR(revenues, 3)
  return result_ ?? undefined
}

function computeNetIncomeCagr(result: any, years: number): number | undefined {
  const ish = result.incomeStatementHistory?.incomeStatementHistory ?? []
  const incomes: number[] = []
  for (const entry of ish) {
    const ni = parseRaw(entry.netIncome?.raw ?? entry.netIncome)
    if (ni === undefined) break
    incomes.push(ni)
  }
  if (incomes.length < 2) return undefined
  return computeFinancialCAGR(incomes, years) ?? undefined
}

function computeEps3yAvg(result: any): number | undefined {
  const ish = result.incomeStatementHistory?.incomeStatementHistory ?? []
  const epsValues: number[] = []
  for (const entry of ish) {
    const ep = parseRaw(entry.dilutedEPS?.raw ?? entry.dilutedEPS ?? entry.eps?.raw ?? entry.eps)
    if (ep === undefined) break
    epsValues.push(ep)
  }
  if (epsValues.length < 2) return undefined
  const count = Math.min(3, epsValues.length)
  const sum = epsValues.slice(0, count).reduce((a, b) => a + b, 0)
  return sum / count
}

function checkEarningsStable(result: any, years: number = 10): boolean {
  const ish = result.incomeStatementHistory?.incomeStatementHistory ?? []
  let checked = 0
  for (const entry of ish) {
    const ni = parseRaw(entry.netIncome?.raw ?? entry.netIncome)
    if (ni === undefined) break
    if (ni < 0) return false
    checked++
    if (checked >= years) break
  }
  return checked >= years
}

function parseBalanceSheet(result: any): { currentRatio?: number; netCurrentAssets?: number; longTermDebt?: number } {
  const bs = result.balanceSheetHistory?.balanceSheetStatements ?? []
  if (bs.length === 0) return {}
  const latest = bs[0]
  const currentAssets = parseRaw(latest.totalCurrentAssets?.raw ?? latest.totalCurrentAssets)
  const currentLiabilities = parseRaw(latest.totalCurrentLiabilities?.raw ?? latest.totalCurrentLiabilities)
  const totalLiabilities = parseRaw(latest.totalLiabilities?.raw ?? latest.totalLiabilities)
  const ltDebt = parseRaw(latest.longTermDebt?.raw ?? latest.longTermDebt)

  return {
    currentRatio: currentAssets !== undefined && currentLiabilities !== undefined && currentLiabilities > 0
      ? Math.round((currentAssets / currentLiabilities) * 100) / 100
      : undefined,
    netCurrentAssets: currentAssets !== undefined && totalLiabilities !== undefined
      ? currentAssets - totalLiabilities
      : undefined,
    longTermDebt: ltDebt,
  }
}

function parseDividendHistory(result: any): { dividendYears?: number; dividendConsistent?: boolean } {
  const dh = result.dividendHistory?.dividendHistory ?? []
  if (dh.length === 0) return { dividendYears: 0, dividendConsistent: false }

  const years = new Set<string>()
  for (const entry of dh) {
    const dateStr = entry.exDividendDate ?? entry.date
    if (dateStr) {
      const year = String(dateStr).slice(0, 4)
      years.add(year)
    }
  }
  const consecutiveYears = years.size
  return {
    dividendYears: consecutiveYears,
    dividendConsistent: consecutiveYears >= 20,
  }
}

export function parseYahooQuoteSummaryResult(
  result: any,
): Partial<FundamentalData> {
  const sd = result.summaryDetail ?? {}
  const dks = result.defaultKeyStatistics ?? {}
  const fd = result.financialData ?? {}

  const revenueCagr3Y = computeRevenueCagr3Y(result)
  const netIncomeCagr3Y = computeNetIncomeCagr(result, 3)
  const netIncomeCagr5Y = computeNetIncomeCagr(result, 5)
  const netIncomeCagr10Y = computeNetIncomeCagr(result, 10)
  const eps3yAvg = computeEps3yAvg(result)
  const earningsStable = checkEarningsStable(result, 10)
  const earningsStable5Y = checkEarningsStable(result, 5)
  const bs = parseBalanceSheet(result)
  const dh = parseDividendHistory(result)

  const trailingPe = parseRaw(sd.trailingPE?.raw ?? sd.trailingPE)
  const currentPrice = parseRaw(
    fd.currentPrice?.raw ?? fd.currentPrice ?? sd.regularMarketPrice?.raw ?? sd.regularMarketPrice,
  )
  const pb = parseRaw(dks.priceToBook?.raw ?? dks.priceToBook)

  let pe3yAvg: number | undefined
  if (currentPrice && eps3yAvg && eps3yAvg > 0) {
    pe3yAvg = Math.round((currentPrice / eps3yAvg) * 100) / 100
  }

  let peTimesPb: number | undefined
  const peForProduct = pe3yAvg ?? trailingPe
  if (peForProduct && pb) {
    peTimesPb = Math.round(peForProduct * pb * 100) / 100
  }

  const fiftyTwoWeekHigh = parseRaw(sd.fiftyTwoWeekHigh?.raw ?? sd.fiftyTwoWeekHigh)
  const fiftyTwoWeekLow = parseRaw(sd.fiftyTwoWeekLow?.raw ?? sd.fiftyTwoWeekLow)

  const epsVal = parseRaw(dks.trailingEps?.raw ?? dks.trailingEps)
  const bv = parseRaw(dks.bookValue?.raw ?? dks.bookValue)
  let grahamNumber: number | undefined
  if (epsVal && epsVal > 0 && bv && bv > 0) {
    grahamNumber = Math.round(Math.sqrt(22.5 * epsVal * bv) * 100) / 100
  }

  let priceDecline52W: number | undefined
  if (currentPrice && fiftyTwoWeekHigh && fiftyTwoWeekHigh > 0) {
    priceDecline52W = Math.round(((currentPrice - fiftyTwoWeekHigh) / fiftyTwoWeekHigh) * 10000) / 100
  }

  let priceToIntrinsicValue: number | undefined
  if (currentPrice && grahamNumber && grahamNumber > 0) {
    priceToIntrinsicValue = Math.round((currentPrice / grahamNumber) * 100) / 100
  }

  let bargainZone: 'deep' | 'good' | 'mild' | 'none' | undefined
  if (priceDecline52W !== undefined && priceDecline52W <= -40) {
    bargainZone = 'deep'
  } else if (priceToIntrinsicValue !== undefined && priceToIntrinsicValue < 0.50) {
    bargainZone = 'deep'
  } else if (priceDecline52W !== undefined && priceDecline52W <= -25) {
    bargainZone = 'good'
  } else if (priceToIntrinsicValue !== undefined && priceToIntrinsicValue < 0.67) {
    bargainZone = 'good'
  } else if (priceDecline52W !== undefined && priceDecline52W <= -15) {
    bargainZone = 'mild'
  } else if (priceToIntrinsicValue !== undefined && priceToIntrinsicValue < 0.80) {
    bargainZone = 'mild'
  } else {
    bargainZone = 'none'
  }

  const partial: Partial<FundamentalData> = {
    marketCap: parseRaw(sd.marketCap?.raw ?? sd.marketCap),
    peRatio: trailingPe,
    pbRatio: pb,
    roe: parseRaw(fd.returnOnEquity?.raw ?? fd.returnOnEquity),
    debtToEquity: parseRaw(fd.debtToEquity?.raw ?? fd.debtToEquity),
    operatingMargin: parseRaw(fd.operatingMargins?.raw ?? fd.operatingMargins),
    netProfitMargin: parseRaw(fd.profitMargins?.raw ?? fd.profitMargins),
    eps: epsVal,
    dividendYield: parseRaw(sd.dividendYield?.raw ?? sd.dividendYield),
    payoutRatio: parseRaw(sd.payoutRatio?.raw ?? sd.payoutRatio),
    bookValue: bv,
    promoterHolding: parseRaw(dks.heldPercentInsiders?.raw ?? dks.heldPercentInsiders),
    freeCashFlow: parseRaw(fd.freeCashflow?.raw ?? fd.freeCashflow),
    revenueCagr3Y,
    netIncomeCagr3Y,
    netIncomeCagr5Y,
    netIncomeCagr10Y,
    currentPrice,
    eps3yAvg,
    pe3yAvg,
    peTimesPb,
    earningsStable,
    earningsStable5Y,
    currentRatio: bs.currentRatio,
    netCurrentAssets: bs.netCurrentAssets,
    longTermDebt: bs.longTermDebt,
    dividendYears: dh.dividendYears,
    dividendConsistent: dh.dividendConsistent,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
    grahamNumber,
    priceDecline52W,
    priceToIntrinsicValue,
    bargainZone,
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
    payoutRatio: partial.payoutRatio ?? 0,
    bookValue: partial.bookValue ?? 0,
    promoterHolding: partial.promoterHolding ?? 0,
    freeCashFlow: partial.freeCashFlow ?? 0,
    currentPrice: partial.currentPrice,
    revenueCagr3Y: partial.revenueCagr3Y,
    netIncomeCagr3Y: partial.netIncomeCagr3Y,
    pledgedShares: partial.pledgedShares,
    governanceQuality: partial.governanceQuality,
    currentRatio: partial.currentRatio,
    netCurrentAssets: partial.netCurrentAssets,
    longTermDebt: partial.longTermDebt,
    dividendYears: partial.dividendYears,
    dividendConsistent: partial.dividendConsistent,
    eps3yAvg: partial.eps3yAvg,
    pe3yAvg: partial.pe3yAvg,
    peTimesPb: partial.peTimesPb,
    earningsStable: partial.earningsStable,
    earningsStable5Y: partial.earningsStable5Y,
    netIncomeCagr5Y: partial.netIncomeCagr5Y,
    netIncomeCagr10Y: partial.netIncomeCagr10Y,
    fiftyTwoWeekHigh: partial.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: partial.fiftyTwoWeekLow,
    grahamNumber: partial.grahamNumber,
    priceDecline52W: partial.priceDecline52W,
    priceToIntrinsicValue: partial.priceToIntrinsicValue,
    bargainZone: partial.bargainZone,
  }
}

export function withLenientDefaults(raw: Record<string, unknown>): FundamentalData {
  const filled = fillFundamentalData(raw)
  return {
    ...filled,
    marketCap: (typeof raw.marketCap === 'number' && raw.marketCap > 0) ? raw.marketCap : 50000,
    currentRatio: typeof raw.currentRatio === 'number' ? raw.currentRatio : 5,
    earningsStable: typeof raw.earningsStable === 'boolean' ? raw.earningsStable : true,
    earningsStable5Y: typeof raw.earningsStable5Y === 'boolean' ? raw.earningsStable5Y : true,
    dividendYears: typeof raw.dividendYears === 'number' ? raw.dividendYears : 100,
    dividendConsistent: typeof raw.dividendConsistent === 'boolean' ? raw.dividendConsistent : true,
    netIncomeCagr5Y: typeof raw.netIncomeCagr5Y === 'number' ? raw.netIncomeCagr5Y : 100,
    netIncomeCagr10Y: typeof raw.netIncomeCagr10Y === 'number' ? raw.netIncomeCagr10Y : 100,
    pe3yAvg: typeof raw.pe3yAvg === 'number' ? raw.pe3yAvg : 10,
    peTimesPb: typeof raw.peTimesPb === 'number' ? raw.peTimesPb : 10,
    fiftyTwoWeekHigh: typeof raw.fiftyTwoWeekHigh === 'number' ? raw.fiftyTwoWeekHigh : 0,
    fiftyTwoWeekLow: typeof raw.fiftyTwoWeekLow === 'number' ? raw.fiftyTwoWeekLow : 0,
    grahamNumber: typeof raw.grahamNumber === 'number' ? raw.grahamNumber : 0,
    priceDecline52W: typeof raw.priceDecline52W === 'number' ? raw.priceDecline52W : 0,
    priceToIntrinsicValue: typeof raw.priceToIntrinsicValue === 'number' ? raw.priceToIntrinsicValue : 1,
    bargainZone: typeof raw.bargainZone === 'string' ? raw.bargainZone : 'none',
  }
}


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
  if (presentCount < 2) {
    return { data: null, error: `Yahoo returned only ${presentCount} core fields for ${yahooSymbol}; insufficient for scoring` }
  }

  return { data: fillFundamentalData(partial) }
}

export async function fetchFundamentalsFromYahoo(
  symbol: string,
): Promise<DataEnvelope<FundamentalData>> {
  const modules = 'summaryDetail,defaultKeyStatistics,financialData,incomeStatementHistory,earningsHistory,balanceSheetHistory,dividendHistory'

  try {
    const result = await tryFetchYahooSymbol(toYahooSymbol(symbol), modules)
    if (result.data) {
      return {
        data: result.data,
        fetchedAt: new Date().toISOString(),
        source: 'api',
      }
    }
    return {
      data: null,
      fetchedAt: null,
      source: 'api',
      error: result.error || 'No data returned',
    }
  } catch (err) {
    return {
      data: null,
      fetchedAt: null,
      source: 'api',
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
