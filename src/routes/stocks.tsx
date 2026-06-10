import { useState, useEffect, useMemo } from 'react'
import { ensureSeeded } from '../services/seed-service'
import { getStockData } from '../services/stock-service'
import { db } from '../services/db'
import { calculateScore } from '../features/scorecard/scoring-engine'
import { evaluateBuffettSimple, evaluateModifiedBuffettSimple } from '../features/buffett/buffett-gates'
import { useDebounce } from '../hooks/useDebounce'
import { LoadingState } from '../components/shared/loading-state'
import { StockSearch, StockFilters, StockTable, DEFAULT_FILTERS } from '../components/features/stock-browser'
import type { StockFiltersState } from '../components/features/stock-browser'
import type { StockBrowserRow } from '../components/features/stock-browser/stock-table'
import type { FundamentalData } from '../services/fundamentals-service'

function buildBrowserRow(
  s: { symbol: string; name: string; sector: string; marketCap?: number; lastPrice?: number },
  f: Partial<FundamentalData> | undefined,
  currentPrice?: number,
): StockBrowserRow {
  let score: number | undefined
  if (f) {
    const result = calculateScore({
      peRatio: f.peRatio,
      pbRatio: f.pbRatio,
      dividendYield: f.dividendYield,
      roe: f.roe,
      roce: f.roce,
      operatingMargin: f.operatingMargin,
      netProfitMargin: f.netProfitMargin,
      debtToEquity: f.debtToEquity,
      freeCashFlow: f.freeCashFlow,
      bookValue: f.bookValue,
      revenueGrowth: f.revenueGrowth,
      epsGrowth: f.epsGrowth,
      promoterHolding: f.promoterHolding,
      pledgedShares: f.pledgedShares,
      governanceQuality: f.governanceQuality,
      marketCap: f.marketCap,
    })
    score = Math.round(result.compositeScore)
  }
  const buffett = evaluateBuffettSimple(f ?? {})
  const buffettModified = evaluateModifiedBuffettSimple(f ?? {})
  return {
    symbol: s.symbol,
    name: s.name,
    sector: s.sector,
    marketCap: s.marketCap ?? f?.marketCap,
    lastPrice: currentPrice ?? s.lastPrice,
    peRatio: f?.peRatio,
    roe: f?.roe,
    score,
    buffettCompliant: buffett.isBuffettCompliant,
    buffettGates: buffett.gatesPassed,
    buffettModifiedCompliant: buffettModified.isBuffettCompliant,
    buffettModifiedGates: buffettModified.gatesPassed,
  }
}

export function StockBrowserPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<StockBrowserRow[]>([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<StockFiltersState>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await ensureSeeded()
      const stockRows = await db.stock.toArray()
      const fundRows = await db.fundamental.toArray()
      const fundMap = new Map(fundRows.map((f) => [f.symbol, f]))

      const browserRows: StockBrowserRow[] = stockRows.map((s) => {
        const f = fundMap.get(s.symbol)
        return buildBrowserRow(s, f ? { ...f } : undefined)
      })

      setRows(browserRows)
      setLoading(false)

      const staleCutoff = Date.now() - 24 * 60 * 60 * 1000
      const missing = stockRows.filter((s) => {
        const f = fundMap.get(s.symbol)
        return !f || !f.fetchedAt || new Date(f.fetchedAt).getTime() < staleCutoff
      })

      if (missing.length === 0) return

      let index = 0
      const CONCURRENCY = 3

      const fetchNext = async () => {
        while (index < missing.length) {
          const symbol = missing[index++].symbol
          try {
            const result = await getStockData(symbol)
            if (result.data) {
              setRows((prev) =>
                prev.map((r) =>
                  r.symbol === symbol
                    ? buildBrowserRow(
                        r,
                        result.data!.fundamental ?? undefined,
                        result.data!.quote?.lastPrice,
                      )
                    : r,
                ),
              )
            } else if (result.error) {
              console.warn(`Failed to load ${symbol}:`, result.error)
            }
          } catch (err) {
            console.error(`Exception fetching ${symbol}:`, err)
          }
        }
      }

      for (let i = 0; i < CONCURRENCY; i++) {
        fetchNext()
      }
    }
    load()
  }, [])

  const sectors = useMemo(() => {
    const unique = new Set(rows.map((r) => r.sector).filter(Boolean))
    return Array.from(unique).sort()
  }, [rows])

  const filtered = useMemo(() => {
    let result = rows

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        (r) =>
          r.symbol.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q),
      )
    }

    if (filters.marketCap) {
      result = result.filter((r) => {
        if (r.marketCap === undefined) return true
        if (filters.marketCap === 'large') return r.marketCap >= 20000
        if (filters.marketCap === 'mid')
          return r.marketCap >= 5000 && r.marketCap < 20000
        if (filters.marketCap === 'small') return r.marketCap < 5000
        return true
      })
    }

    if (filters.sector) {
      result = result.filter((r) => r.sector === filters.sector)
    }

    result = result.filter((r) => {
      if (r.peRatio === undefined) return true
      return r.peRatio >= filters.peMin && r.peRatio <= filters.peMax
    })

    result = result.filter((r) => {
      if (r.roe === undefined) return true
      return r.roe >= filters.roeMin && r.roe <= filters.roeMax
    })

    result = result.filter((r) => {
      if (r.score === undefined) return true
      return r.score >= filters.scoreMin && r.score <= filters.scoreMax
    })

    if (filters.showBuffettOnly) {
      result = result.filter((r) => r.buffettCompliant === true)
    }

    if (filters.showModifiedBuffettOnly) {
      result = result.filter((r) => r.buffettModifiedCompliant === true)
    }

    return result
  }, [rows, debouncedSearch, filters])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters])

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">Stock Browser</h1>
        <LoadingState rows={4} />
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">Stock Browser</h1>

      <div className="mb-4">
        <StockSearch value={search} onChange={setSearch} />
      </div>

      <div className="mb-4">
        <StockFilters
          filters={filters}
          sectors={sectors}
          onChange={(f) => setFilters(f)}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />
      </div>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {filtered.length} stock{filtered.length !== 1 ? 's' : ''} found
        {debouncedSearch ? ` for "${debouncedSearch}"` : ''}
      </div>

      <StockTable
        rows={filtered}
        page={page}
        onPageChange={setPage}
        total={filtered.length}
      />

      {filtered.length === 0 && !loading && (
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            {debouncedSearch
              ? `No stocks match '${debouncedSearch}'. Try a different name or symbol.`
              : 'No stocks match the selected criteria.'}
          </p>
        </div>
      )}
    </div>
  )
}
