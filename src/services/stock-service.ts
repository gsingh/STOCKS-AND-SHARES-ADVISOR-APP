import { getQuote, type QuoteData } from './quote-service'
import { getFundamentals, type FundamentalData } from './fundamentals-service'
import { calculateScore } from '../features/scorecard/scoring-engine'
import type { ScoringInput, ScoringResult } from '../features/scorecard/types'
import type { DataEnvelope } from '../types/envelope'

export interface StockData {
  quote: QuoteData | null
  fundamental: FundamentalData | null
  score: ScoringResult | null
}

function toScoringInput(fundamental: FundamentalData): ScoringInput {
  return {
    peRatio: fundamental.peRatio,
    pbRatio: fundamental.pbRatio,
    dividendYield: fundamental.dividendYield,
    roe: fundamental.roe,
    roce: fundamental.roce,
    operatingMargin: fundamental.operatingMargin,
    netProfitMargin: fundamental.netProfitMargin,
    debtToEquity: fundamental.debtToEquity,
    freeCashFlow: fundamental.freeCashFlow,
    bookValue: fundamental.bookValue,
    revenueGrowth: fundamental.revenueGrowth,
    epsGrowth: fundamental.epsGrowth,
    promoterHolding: fundamental.promoterHolding,
    pledgedShares: fundamental.pledgedShares,
    governanceQuality: fundamental.governanceQuality,
    marketCap: fundamental.marketCap,
  }
}

export async function getStockData(symbol: string): Promise<DataEnvelope<StockData>> {
  const [quoteResult, fundamentalResult] = await Promise.all([
    getQuote(symbol),
    getFundamentals(symbol),
  ])

  const quoteData = quoteResult.data
  const fundamentalData = fundamentalResult.data

  const hasQuote = quoteData !== null
  const hasFundamental = fundamentalData !== null

  if (!hasQuote && !hasFundamental) {
    return {
      data: null,
      fetchedAt: null,
      source: 'api',
      error: quoteResult.error ?? fundamentalResult.error ?? 'Failed to fetch data',
    }
  }

  let score: ScoringResult | null = null
  if (hasFundamental) {
    score = calculateScore(toScoringInput(fundamentalData!))
  }

  const fetchedAt = quoteResult.fetchedAt ?? fundamentalResult.fetchedAt

  return {
    data: {
      quote: quoteData,
      fundamental: fundamentalData,
      score,
    },
    fetchedAt,
    source: quoteResult.source === 'api' ? 'api' : fundamentalResult.source === 'scraper' ? 'scraper' : 'cache',
  }
}

export async function getStockDataBatch(
  symbols: string[],
): Promise<Record<string, DataEnvelope<StockData>>> {
  const entries = await Promise.all(
    symbols.map(async (symbol) => [symbol, await getStockData(symbol)] as const),
  )
  return Object.fromEntries(entries)
}
