import type { DataEnvelope } from '../types/envelope'
import type { FundamentalData } from './screener-service'
import { parseYahooQuoteSummaryResult, fillFundamentalData } from './yahoo-fundamentals-service'
import { getFundamentals } from './fundamentals-service'
import { db, withErrorHandling } from './db'
import { toYahooSymbol } from './yahoo-symbol'

const BATCH_CHUNK_SIZE = 100
const MODULES = 'summaryDetail,defaultKeyStatistics,financialData,incomeStatementHistory,earningsHistory,balanceSheetHistory,dividendHistory'

async function fetchChunkViaBatch(
  symbols: string[],
): Promise<Record<string, DataEnvelope<FundamentalData>>> {
  const yahooSymbols = symbols.map(toYahooSymbol).join(',')
  const url = `/api/yahoo/batch-fundamentals?symbols=${encodeURIComponent(yahooSymbols)}&modules=${encodeURIComponent(MODULES)}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Batch endpoint returned ${res.status}`)
  }

  const rawResults: Record<string, { symbol: string; data: any; error: string | null }> = await res.json()
  const results: Record<string, DataEnvelope<FundamentalData>> = {}

  for (const symbol of symbols) {
    const raw = rawResults[symbol]
    if (!raw || raw.error) {
      results[symbol] = {
        data: null,
        fetchedAt: null,
        source: 'api',
        error: raw?.error || 'No data returned from batch endpoint',
      }
      continue
    }

    if (!raw.data?.quoteSummary?.result?.[0]) {
      results[symbol] = {
        data: null,
        fetchedAt: null,
        source: 'api',
        error: 'Invalid response structure from Yahoo',
      }
      continue
    }

    const result = raw.data.quoteSummary.result[0]
    const partial = parseYahooQuoteSummaryResult(result)

    const presentCount = Object.values(partial).filter(
      (v) => v !== undefined && v !== null && Number.isFinite(v),
    ).length

    if (presentCount < 2) {
      results[symbol] = {
        data: null,
        fetchedAt: new Date().toISOString(),
        source: 'api',
        error: `Only ${presentCount} fields present; insufficient`,
      }
      continue
    }

    const data = fillFundamentalData(partial)
    const fetchedAt = new Date().toISOString()

    await withErrorHandling(() => db.fundamental.put({
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
    }))

    results[symbol] = { data, fetchedAt, source: 'api' }
  }

  return results
}

export async function fetchFundamentalsBatch(
  symbols: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<Record<string, DataEnvelope<FundamentalData>>> {
  if (symbols.length === 0) return {}

  const results: Record<string, DataEnvelope<FundamentalData>> = {}
  let processed = 0
  const total = symbols.length

  for (let i = 0; i < symbols.length; i += BATCH_CHUNK_SIZE) {
    const chunk = symbols.slice(i, i + BATCH_CHUNK_SIZE)

    try {
      const chunkResults = await fetchChunkViaBatch(chunk)
      Object.assign(results, chunkResults)
      processed += chunk.length
    } catch (err) {
      console.warn(`Batch fetch failed for chunk starting at ${i}, falling back to individual fetching:`, err)
      for (const symbol of chunk) {
        try {
          const result = await getFundamentals(symbol)
          results[symbol] = result
        } catch (innerErr) {
          results[symbol] = {
            data: null,
            fetchedAt: null,
            source: 'api',
            error: innerErr instanceof Error ? innerErr.message : 'Failed',
          }
        }
        processed++
        onProgress?.(processed, total)
      }
      continue
    }

    onProgress?.(processed, total)
  }

  return results
}
