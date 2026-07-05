import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearch, useNavigate } from '@tanstack/react-router'
import { RefreshCw, Database } from 'lucide-react'
import type { StocksSearchParams } from '../router'
import { ensureSeeded } from '../services/seed-service'
import { getStockData } from '../services/stock-service'
import { db } from '../services/db'
import { calculateScore } from '../features/scorecard/scoring-engine'
import { evaluateBuffettSimple, evaluateModifiedBuffettSimple } from '../features/buffett/buffett-gates'
import { evaluateJhunjhunwalaSimple, evaluateJhunjhunwalaModifiedSimple } from '../features/jhunjhunwala/jhunjhunwala-gates'
import { evaluateEnterprisingSimple } from '../features/enterprising/enterprising-gates'
import { useDebounce } from '../hooks/useDebounce'
import { LoadingState } from '../components/shared/loading-state'
import { StockSearch, StockFilters, StockTable, DEFAULT_FILTERS } from '../components/features/stock-browser'
import type { StockFiltersState } from '../components/features/stock-browser'
import type { StockBrowserRow } from '../components/features/stock-browser/stock-table'
import type { FundamentalData } from '../services/fundamentals-service'
import { getMarketCapTier } from '../lib/market-cap'

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
      payoutRatio: f.payoutRatio,
      roe: f.roe,
      roce: f.roce,
      operatingMargin: f.operatingMargin,
      netProfitMargin: f.netProfitMargin,
      debtToEquity: f.debtToEquity,
      freeCashFlow: f.freeCashFlow,
      bookValue: f.bookValue,
      revenueCagr3Y: f.revenueCagr3Y,
      netIncomeCagr3Y: f.netIncomeCagr3Y,
      promoterHolding: f.promoterHolding,
      pledgedShares: f.pledgedShares,
      governanceQuality: f.governanceQuality,
      marketCap: f.marketCap,
    })
    score = Math.round(result.compositeScore)
  }
  const buffett = evaluateBuffettSimple(f ?? {})
  const buffettModified = evaluateModifiedBuffettSimple(f ?? {})
  const jhunjhunwala = evaluateJhunjhunwalaSimple(f ?? {})
  const jhunjhunwalaModified = evaluateJhunjhunwalaModifiedSimple(f ?? {})
  const enterprising = evaluateEnterprisingSimple(f ?? {})
  return {
    symbol: s.symbol,
    name: s.name,
    sector: s.sector,
    marketCap: s.marketCap ?? f?.marketCap,
    lastPrice: currentPrice ?? s.lastPrice,
    peRatio: f?.peRatio,
    dividendYield: f?.dividendYield,
    payoutRatio: f?.payoutRatio,
    roe: f?.roe,
    roce: f?.roce,
    debtToEquity: f?.debtToEquity,
    revenueCagr3Y: f?.revenueCagr3Y,
    netIncomeCagr3Y: f?.netIncomeCagr3Y,
    score,
    buffettCompliant: buffett.isBuffettCompliant,
    buffettGates: buffett.gatesPassed,
    buffettModifiedCompliant: buffettModified.isBuffettCompliant,
    buffettModifiedGates: buffettModified.gatesPassed,
    jhunjhunwalaCompliant: jhunjhunwala.isJhunjhunwalaCompliant,
    jhunjhunwalaGates: jhunjhunwala.gatesPassed,
    jhunjhunwalaModifiedCompliant: jhunjhunwalaModified.isJhunjhunwalaCompliant,
    jhunjhunwalaModifiedGates: jhunjhunwalaModified.gatesPassed,
    enterprisingCompliant: enterprising.isEnterprisingCompliant,
    enterprisingGates: enterprising.gatesPassed,
  }
}

function readForecastChangePct(symbol: string, horizon: number): number | null {
  try {
    const raw = localStorage.getItem(`fcast_${symbol}__h${horizon}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed.fetchedAt) return null
    if (Date.now() - new Date(parsed.fetchedAt).getTime() > 24 * 60 * 60 * 1000) return null
    const point = parsed.point
    if (!Array.isArray(point) || point.length < 2) return null
    const first = point[0]
    const last = point[point.length - 1]
    return ((last - first) / Math.abs(first || 1)) * 100
  } catch {
    return null
  }
}

export function StockBrowserPage() {
  const routeSearch = useSearch({ from: '/stocks' })
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<StockBrowserRow[]>([])
  const [search, setSearch] = useState(routeSearch.q)
  const [filters, setFilters] = useState<StockFiltersState>({
    ...DEFAULT_FILTERS,
    marketCap: routeSearch.marketCap,
    sector: routeSearch.sector,
    peMin: routeSearch.peMin,
    peMax: routeSearch.peMax,
    roeMin: routeSearch.roeMin,
    roeMax: routeSearch.roeMax,
    roceMin: routeSearch.roceMin,
    roceMax: routeSearch.roceMax,
    deMin: routeSearch.deMin,
    deMax: routeSearch.deMax,
    dividendYieldMin: routeSearch.dividendYieldMin,
    dividendYieldMax: routeSearch.dividendYieldMax,
    revenueCagrMin: routeSearch.revenueCagrMin,
    revenueCagrMax: routeSearch.revenueCagrMax,
    profitCagrMin: routeSearch.profitCagrMin,
    profitCagrMax: routeSearch.profitCagrMax,
    scoreMin: routeSearch.scoreMin,
    scoreMax: routeSearch.scoreMax,
    showAll: routeSearch.showAll,
    showBuffettOnly: routeSearch.showBuffettOnly,
    showModifiedBuffettOnly: routeSearch.showModifiedBuffettOnly,
    showJhunjhunwalaOnly: routeSearch.showJhunjhunwalaOnly,
    showJhunjhunwalaModifiedOnly: routeSearch.showJhunjhunwalaModifiedOnly,
    showEnterprisingOnly: routeSearch.showEnterprisingOnly,
  })
  const [page, setPage] = useState(routeSearch.page)

  const [refreshing, setRefreshing] = useState(false)
  const [refreshProgress, setRefreshProgress] = useState({ done: 0, total: 0 })
  const [refreshErrors, setRefreshErrors] = useState(0)
  const [refreshFailures, setRefreshFailures] = useState<{symbol: string; error: string}[]>([])
  const [showFailures, setShowFailures] = useState(false)
  const [currentSymbol, setCurrentSymbol] = useState<string>('')
  const [elapsed, setElapsed] = useState(0)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [staleCount, setStaleCount] = useState(0)

  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const debouncedSearch = useDebounce(search, 300)
  const debouncedFilters = useDebounce(filters, 150)

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    setElapsed(0)
    stopTimer()
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
  }, [stopTimer])

  const refreshMissingData = useCallback(async (concurrency: number, signal?: AbortSignal, onProgress?: (done: number, total: number, current: string, errors: number) => void) => {
    const stockRows = await db.stock.toArray()
    const fundRows = await db.fundamental.toArray()
    const fundMap = new Map(fundRows.map((f) => [f.symbol, f]))

    const staleCutoff = Date.now() - 24 * 60 * 60 * 1000
    const FAILURE_CACHE_KEY = 'fundamental_fetch_failures'
    const failureCache: Record<string, number> = JSON.parse(localStorage.getItem(FAILURE_CACHE_KEY) || '{}')
    const missing = stockRows.filter((s) => {
      const f = fundMap.get(s.symbol)
      if (!f || !f.fetchedAt || new Date(f.fetchedAt).getTime() < staleCutoff) {
        const failedAt = failureCache[s.symbol]
        if (failedAt && Date.now() - failedAt < 24 * 60 * 60 * 1000) return false
        return true
      }
      return false
    })

    if (missing.length === 0) return 0

    const targets = missing.slice(0, missing.length)
    let index = 0
    let done = 0
    let errors = 0
    const total = targets.length
    const failures: {symbol: string; error: string}[] = []
    onProgress?.(0, total, '', 0)

    const fetchNext = async () => {
      while (index < targets.length) {
        if (signal?.aborted) break
        const symbol = targets[index++].symbol
        setCurrentSymbol(symbol)
        onProgress?.(done, total, symbol, errors)
        try {
          const result = await getStockData(symbol)
          console.log(`[refresh] ${symbol}: hasData=${!!result.data} source=${result.source} error=${result.error} fund=${result.data?.fundamental ? `pe=${result.data.fundamental.peRatio} revCAGR=${result.data.fundamental.revenueCagr3Y} niCAGR=${result.data.fundamental.netIncomeCagr3Y}` : 'null'}`)
          if (result.data) {
            setRows((prev) => {
              const updated = prev.map((r) =>
                r.symbol === symbol
                  ? buildBrowserRow(
                      r,
                      result.data!.fundamental ?? r,
                      result.data!.quote?.lastPrice,
                    )
                  : r,
              )
              const newRow = updated.find((r) => r.symbol === symbol)
              console.log(`[refresh] setRows ${symbol}: prevLen=${prev.length} newLen=${updated.length} cagr=${newRow?.revenueCagr3Y}/${newRow?.netIncomeCagr3Y}`)
              return updated
            })
          } else {
            errors++
            setRefreshErrors(errors)
            failures.push({ symbol, error: result.error || 'Unknown error' })
            console.warn(`Failed to load ${symbol}:`, result.error)
          }
        } catch (err) {
          errors++
          setRefreshErrors(errors)
          failures.push({ symbol, error: err instanceof Error ? err.message : String(err) })
          console.error(`Exception fetching ${symbol}:`, err)
        }
        done++
        onProgress?.(done, total, symbol, errors)
      }
    }

    const workers = Array.from({ length: concurrency }, () => fetchNext())
    await Promise.all(workers)
    setRefreshFailures(failures)
    console.log(`[refresh] done. Missing count: ${missing.length}, targets: ${targets.length}`)
    return missing.length
  }, [])

  const handleRefresh = useCallback(async () => {
    const abort = new AbortController()
    abortRef.current = abort
    setRefreshing(true)
    setRefreshProgress({ done: 0, total: 0 })
    setRefreshErrors(0)
    setRefreshFailures([])
    setCurrentSymbol('')
    startTimer()

    await refreshMissingData(3, abort.signal, (done, total) => setRefreshProgress({ done, total }))
    stopTimer()

    const fundRows = await db.fundamental.toArray()
    const fundMap = new Map(fundRows.map((f) => [f.symbol, f]))
    const staleCutoff = Date.now() - 24 * 60 * 60 * 1000
    const stockRows = await db.stock.toArray()
    const FAILURE_CACHE_KEY = 'fundamental_fetch_failures'
    const failureCache: Record<string, number> = JSON.parse(localStorage.getItem(FAILURE_CACHE_KEY) || '{}')
    const missing = stockRows.filter((s) => {
      const f = fundMap.get(s.symbol)
      if (!f || !f.fetchedAt || new Date(f.fetchedAt).getTime() < staleCutoff) {
        const failedAt = failureCache[s.symbol]
        if (failedAt && Date.now() - failedAt < 24 * 60 * 60 * 1000) return false
        return true
      }
      return false
    })
    setStaleCount(missing.length)
    setLastRefreshed(new Date())
    setCurrentSymbol('')
    setRefreshing(false)
    abortRef.current = null
  }, [refreshMissingData, startTimer, stopTimer])

  const handleCancelRefresh = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const initialRender = useRef(true)

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false
      return
    }
    navigate({
      to: '/stocks',
      search: {
        q: debouncedSearch,
        page,
        marketCap: debouncedFilters.marketCap,
        sector: debouncedFilters.sector,
        peMin: debouncedFilters.peMin,
        peMax: debouncedFilters.peMax,
        roeMin: debouncedFilters.roeMin,
        roeMax: debouncedFilters.roeMax,
        roceMin: debouncedFilters.roceMin,
        roceMax: debouncedFilters.roceMax,
        deMin: debouncedFilters.deMin,
        deMax: debouncedFilters.deMax,
        dividendYieldMin: debouncedFilters.dividendYieldMin,
        dividendYieldMax: debouncedFilters.dividendYieldMax,
        revenueCagrMin: debouncedFilters.revenueCagrMin,
        revenueCagrMax: debouncedFilters.revenueCagrMax,
        profitCagrMin: debouncedFilters.profitCagrMin,
        profitCagrMax: debouncedFilters.profitCagrMax,
        scoreMin: debouncedFilters.scoreMin,
        scoreMax: debouncedFilters.scoreMax,
        showAll: debouncedFilters.showAll,
        showBuffettOnly: debouncedFilters.showBuffettOnly,
        showModifiedBuffettOnly: debouncedFilters.showModifiedBuffettOnly,
        showJhunjhunwalaOnly: debouncedFilters.showJhunjhunwalaOnly,
        showJhunjhunwalaModifiedOnly: debouncedFilters.showJhunjhunwalaModifiedOnly,
        showEnterprisingOnly: debouncedFilters.showEnterprisingOnly,
      },
      replace: true,
    })
  }, [debouncedSearch, page, debouncedFilters])

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
      const FAILURE_CACHE_KEY = 'fundamental_fetch_failures'
      const failureCache: Record<string, number> = JSON.parse(localStorage.getItem(FAILURE_CACHE_KEY) || '{}')
      const wasRecentFailure = (symbol: string) => {
        const failedAt = failureCache[symbol]
        return failedAt && Date.now() - failedAt < 24 * 60 * 60 * 1000
      }
      const missing = stockRows.filter((s) => {
        const f = fundMap.get(s.symbol)
        if (!f || !f.fetchedAt || new Date(f.fetchedAt).getTime() < staleCutoff) {
          if (wasRecentFailure(s.symbol)) return false
          return true
        }
        return false
      })

      setStaleCount(missing.length)

      if (missing.length > 0) {
        await refreshMissingData(5)
        const fundRows2 = await db.fundamental.toArray()
        const fundMap2 = new Map(fundRows2.map((f) => [f.symbol, f]))
        const remaining = stockRows.filter((s) => {
          const f = fundMap2.get(s.symbol)
          if (!f || !f.fetchedAt || new Date(f.fetchedAt).getTime() < staleCutoff) {
            if (wasRecentFailure(s.symbol)) return false
            return true
          }
          return false
        })
        setStaleCount(remaining.length)
      }
    }
    load()
  }, [refreshMissingData])

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

    if (debouncedFilters.marketCap) {
      result = result.filter((r) => {
        if (r.marketCap === undefined) return false
        const tier = getMarketCapTier(r.marketCap)
        return tier === debouncedFilters.marketCap
      })
    }

    if (debouncedFilters.sector) {
      result = result.filter((r) => r.sector === debouncedFilters.sector)
    }

    if (debouncedFilters.showAll) return result

    result = result.filter((r) => {
      if (r.peRatio === undefined) return true
      return r.peRatio >= debouncedFilters.peMin && r.peRatio <= debouncedFilters.peMax
    })

    result = result.filter((r) => {
      if (r.roe === undefined) return true
      return r.roe >= debouncedFilters.roeMin && r.roe <= debouncedFilters.roeMax
    })

    result = result.filter((r) => {
      if (r.roce === undefined) return true
      return r.roce >= debouncedFilters.roceMin && r.roce <= debouncedFilters.roceMax
    })

    result = result.filter((r) => {
      if (r.debtToEquity === undefined) return true
      return r.debtToEquity >= debouncedFilters.deMin && r.debtToEquity <= debouncedFilters.deMax
    })

    result = result.filter((r) => {
      if (r.dividendYield === undefined) return true
      return r.dividendYield >= debouncedFilters.dividendYieldMin && r.dividendYield <= debouncedFilters.dividendYieldMax
    })

    result = result.filter((r) => {
      if (r.revenueCagr3Y === undefined) return true
      return r.revenueCagr3Y >= debouncedFilters.revenueCagrMin && r.revenueCagr3Y <= debouncedFilters.revenueCagrMax
    })

    result = result.filter((r) => {
      if (r.netIncomeCagr3Y === undefined) return true
      return r.netIncomeCagr3Y >= debouncedFilters.profitCagrMin && r.netIncomeCagr3Y <= debouncedFilters.profitCagrMax
    })

    result = result.filter((r) => {
      if (r.score === undefined) return true
      return r.score >= debouncedFilters.scoreMin && r.score <= debouncedFilters.scoreMax
    })

    if (debouncedFilters.showBuffettOnly) {
      result = result.filter((r) => r.buffettCompliant === true)
    }

    if (debouncedFilters.showModifiedBuffettOnly) {
      result = result.filter((r) => r.buffettModifiedCompliant === true)
    }

    if (debouncedFilters.showJhunjhunwalaOnly) {
      result = result.filter((r) => r.jhunjhunwalaCompliant === true)
    }

    if (debouncedFilters.showJhunjhunwalaModifiedOnly) {
      result = result.filter((r) => r.jhunjhunwalaModifiedCompliant === true)
    }

    if (debouncedFilters.showEnterprisingOnly) {
      result = result.filter((r) => r.enterprisingCompliant === true)
    }

    if (routeSearch.sort === 'forecast_desc') {
      const horizon = routeSearch.forecastHorizon || 90
      result = result.filter((r) => {
        const pct = readForecastChangePct(r.symbol, horizon)
        return pct != null && pct > 0
      })
    }

    return result
  }, [rows, debouncedSearch, debouncedFilters])

  const sorted = useMemo(() => {
    if (routeSearch.sort !== 'forecast_desc') return filtered
    const horizon = routeSearch.forecastHorizon || 90
    return [...filtered].sort((a, b) => {
      const pctA = readForecastChangePct(a.symbol, horizon) ?? -Infinity
      const pctB = readForecastChangePct(b.symbol, horizon) ?? -Infinity
      return pctB - pctA
    })
  }, [filtered, routeSearch.sort, routeSearch.forecastHorizon])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, debouncedFilters])

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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Stock Browser</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {refreshing ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-900/20">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
              <RefreshCw size={16} className="animate-spin" />
              Refreshing stock data
            </div>
            <button
              onClick={handleCancelRefresh}
              className="text-xs text-amber-600 underline hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
            >
              Cancel
            </button>
          </div>

          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-amber-200 dark:bg-amber-800/40">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-300"
              style={{ width: `${refreshProgress.total > 0 ? (refreshProgress.done / refreshProgress.total) * 100 : 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
            <span>
              {refreshProgress.done}/{refreshProgress.total} ({refreshProgress.total > 0 ? Math.round((refreshProgress.done / refreshProgress.total) * 100) : 0}%)
            </span>
            <span>
              {Math.floor(elapsed / 60)}m {elapsed % 60}s
            </span>
          </div>

          <div className="mt-1.5 flex items-center justify-between text-xs text-amber-600 dark:text-amber-500">
            <span className="truncate max-w-[60%]">
              {currentSymbol ? `Fetching: ${currentSymbol}` : 'Starting...'}
            </span>
            {refreshErrors > 0 && (
              <span className="text-red-500 dark:text-red-400">
                {refreshErrors} error{refreshErrors !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {refreshFailures.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowFailures(!showFailures)}
                className="text-xs text-red-600 underline hover:text-red-800"
              >
                {refreshFailures.length} failure{refreshFailures.length !== 1 ? 's' : ''} — {showFailures ? 'hide' : 'view details'}
              </button>
              {showFailures && (
                <div className="mt-1 max-h-28 overflow-y-auto rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
                  {refreshFailures.map((f) => (
                    <div key={f.symbol} className="truncate">
                      <span className="font-medium">{f.symbol}:</span> {f.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : staleCount > 0 ? (
        <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center gap-3">
            <Database size={20} className="shrink-0 text-[var(--muted-foreground)]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--foreground)]">
                {staleCount} stock{staleCount !== 1 ? 's' : ''} need{staleCount === 1 ? 's' : ''} data refresh
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                {lastRefreshed
                  ? `Last refreshed: ${lastRefreshed.toLocaleTimeString()}`
                  : 'Click Refresh Data to fetch latest from Yahoo Finance'}
              </p>
              {refreshFailures.length > 0 && (
                <p className="mt-1 text-xs text-red-500">
                  {refreshFailures.length} fetch failure{refreshFailures.length !== 1 ? 's' : ''} last time
                </p>
              )}
            </div>
            <button
              onClick={handleRefresh}
              className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
            >
              Refresh Now
            </button>
          </div>
        </div>
      ) : null}

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
        {sorted.length} stock{sorted.length !== 1 ? 's' : ''} found
        {debouncedSearch ? ` for "${debouncedSearch}"` : ''}
      </div>

      <StockTable
        rows={sorted}
        page={page}
        onPageChange={setPage}
        total={sorted.length}
        skipSort={routeSearch.sort === 'forecast_desc'}
      />

      {sorted.length === 0 && !loading && (
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
