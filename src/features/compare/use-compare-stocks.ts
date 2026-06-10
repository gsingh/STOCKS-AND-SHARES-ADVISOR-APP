import { useState, useEffect, useMemo } from 'react'
import { db } from '../../services/db'
import { getStockData } from '../../services/stock-service'
import { getInterplayWarnings } from '../scorecard/interplay'
import { calculateScore } from '../scorecard/scoring-engine'
import type { CompareStockEntry } from './compare-types'
import type { ScoringInput, ScoringResult } from '../scorecard/types'
import type { FundamentalData } from '../../services/screener-service'

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

function fromDbRow(row: {
  peRatio?: number; pbRatio?: number; roe?: number; roce?: number;
  debtToEquity?: number; operatingMargin?: number; netProfitMargin?: number;
  dividendYield?: number; bookValue?: number; promoterHolding?: number;
  freeCashFlow?: number; revenueGrowth?: number; epsGrowth?: number;
  pledgedShares?: number; governanceQuality?: number; marketCap?: number;
}): FundamentalData {
  return {
    peRatio: row.peRatio ?? 0,
    pbRatio: row.pbRatio ?? 0,
    roe: row.roe ?? 0,
    roce: row.roce ?? 0,
    debtToEquity: row.debtToEquity ?? 0,
    operatingMargin: row.operatingMargin ?? 0,
    netProfitMargin: row.netProfitMargin ?? 0,
    eps: 0,
    dividendYield: row.dividendYield ?? 0,
    bookValue: row.bookValue ?? 0,
    promoterHolding: row.promoterHolding ?? 0,
    freeCashFlow: row.freeCashFlow ?? 0,
    revenueGrowth: row.revenueGrowth,
    epsGrowth: row.epsGrowth,
    pledgedShares: row.pledgedShares,
    governanceQuality: row.governanceQuality,
    marketCap: row.marketCap ?? 0,
  }
}

function buildEntry(
  symbol: string,
  name: string,
  sector: string | undefined,
  marketCap: number | undefined,
  fundamental: FundamentalData | null,
  score: ScoringResult | null,
  isLoading: boolean,
  error?: string,
): CompareStockEntry {
  const scoringInput = fundamental ? toScoringInput(fundamental) : null
  const interplayWarnings = scoringInput ? getInterplayWarnings(scoringInput) : []
  return {
    symbol,
    name: name || symbol,
    sector,
    marketCap,
    scoringInput,
    score,
    interplayWarnings,
    isLoading,
    error,
  }
}

export function useCompareStocks(symbols: string[]) {
  const [entries, setEntries] = useState<CompareStockEntry[]>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const symbolsKey = useMemo(() => symbols.join(','), [symbols])

  useEffect(() => {
    if (symbols.length === 0) {
      setEntries([])
      setIsInitialLoad(false)
      return
    }

    let cancelled = false

    async function load() {
      setIsInitialLoad(true)

      const [stockRows, fundamentalCache] = await Promise.all([
        db.stock.where('symbol').anyOf(symbols).toArray(),
        db.fundamental.where('symbol').anyOf(symbols).toArray(),
      ])

      if (cancelled) return

      const stockMap = new Map(stockRows.map((s) => [s.symbol, s]))
      const cacheMap = new Map(fundamentalCache.map((f) => [f.symbol, f]))

      const cachedEntries: CompareStockEntry[] = symbols.map((symbol) => {
        const row = stockMap.get(symbol)
        const cached = cacheMap.get(symbol)
        const fundamental = cached ? fromDbRow(cached) : null
        const score = fundamental ? calculateScore(toScoringInput(fundamental)) : null
        return buildEntry(
          symbol,
          row?.name ?? symbol,
          row?.sector,
          row?.marketCap,
          fundamental,
          score,
          !fundamental,
        )
      })

      setEntries(cachedEntries)
      setIsInitialLoad(false)

      symbols.forEach(async (symbol) => {
        try {
          const result = await getStockData(symbol)
          if (cancelled) return

          const fundamental = result.data?.fundamental ?? null
          const score = result.data?.score ?? null
          const error = result.error ?? (!fundamental ? 'No fundamental data' : undefined)

          setEntries((prev) =>
            prev.map((e) =>
              e.symbol === symbol
                ? {
                    ...e,
                    scoringInput: fundamental ? toScoringInput(fundamental) : null,
                    score,
                    interplayWarnings: fundamental
                      ? getInterplayWarnings(toScoringInput(fundamental))
                      : [],
                    isLoading: false,
                    error,
                  }
                : e,
            ),
          )
        } catch {
          if (cancelled) return
          setEntries((prev) =>
            prev.map((e) =>
              e.symbol === symbol
                ? { ...e, isLoading: false, error: 'Fetch failed' }
                : e,
            ),
          )
        }
      })
    }

    load()

    return () => {
      cancelled = true
    }
  }, [symbolsKey, symbols])

  const hasLoadedAll = entries.length > 0 && entries.every((e) => !e.isLoading)

  return { entries, isLoading: isInitialLoad, hasLoadedAll }
}
