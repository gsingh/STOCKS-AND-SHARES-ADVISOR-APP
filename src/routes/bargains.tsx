import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import type { BargainsSearchParams } from '../router'
import { ensureSeeded } from '../services/seed-service'
import { db } from '../services/db'
import { fetchFundamentalsBatch } from '../services/batch-fundamentals-service'
import { evaluateModifiedGrahamResult } from '../features/graham/graham-gates'
import { evaluateEnterprisingSimple } from '../features/enterprising/enterprising-gates'
import { withLenientDefaults } from '../services/yahoo-fundamentals-service'
import { LoadingState } from '../components/shared/loading-state'
import { AddToWatchlistButton } from '../components/features/watchlist/AddToWatchlistButton'
import { RefreshCw, ExternalLink, TrendingDown, ShieldAlert, ShieldCheck, Search, Zap, BookOpen } from 'lucide-react'
import { useDebounce } from '../hooks/useDebounce'
import { formatCurrency, formatPercent } from '../lib/format'
import { getMarketCapTier } from '../lib/market-cap'

interface BargainRow {
  symbol: string
  name: string
  sector: string
  lastPrice?: number
  peRatio?: number
  marketCap?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  grahamNumber?: number
  priceDecline52W?: number
  priceToIntrinsicValue?: number
  bargainZone?: string
  isGrahamCompliant: boolean
  isEnterprisingCompliant: boolean
}

function computeBargainScore(row: BargainRow): number {
  const decline = row.priceDecline52W ?? 0
  const piv = row.priceToIntrinsicValue ?? 1
  const zoneScore = row.bargainZone === 'deep' ? 100 : row.bargainZone === 'good' ? 60 : row.bargainZone === 'mild' ? 30 : 0
  const declineScore = Math.abs(decline) * 1.5
  const ivScore = (1 - piv) * 100
  return Math.round(zoneScore + declineScore + ivScore)
}

const ZONES = ['deep', 'good', 'mild']
const ZONE_ORDER: Record<string, number> = { deep: 0, good: 1, mild: 2, none: 3 }
const CAP_TIERS = ['large', 'mid', 'small'] as const

export function BargainsPage() {
  const routeSearch = useSearch({ from: '/bargains' })
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [rows, setRows] = useState<BargainRow[]>([])
  const [fetchProgress, setFetchProgress] = useState<{ done: number; total: number } | null>(null)
  const [filterZone, setFilterZone] = useState<string>(routeSearch.zone)
  const [capFilter, setCapFilter] = useState<string>(routeSearch.cap)
  const [sortBy, setSortBy] = useState<string>(routeSearch.sortBy)
  const [page, setPage] = useState(routeSearch.page)
  const [search, setSearch] = useState(routeSearch.q)
  const [sectorFilter, setSectorFilter] = useState(routeSearch.sector)
  const [filterStrategy, setFilterStrategy] = useState(routeSearch.strategy ?? 'all')
  const debouncedSearch = useDebounce(search, 300)
  const abortRef = useRef<AbortController | null>(null)
  const PER_PAGE = 50

  const loadData = useCallback(async () => {
    setLoading(true)
    await ensureSeeded()
    const stockRows = await db.stock.toArray()
    const fundRows = await db.fundamental.toArray()
    const fundMap = new Map(fundRows.map((f) => [f.symbol, f]))

    const all: BargainRow[] = stockRows.map((s) => {
      const raw = fundMap.get(s.symbol)
      const f = raw ? withLenientDefaults(raw as Record<string, unknown>) : null
      const graham = f ? evaluateModifiedGrahamResult(f) : { isGrahamCompliant: false }
      const enterprising = f ? evaluateEnterprisingSimple(f) : { isEnterprisingCompliant: false }
      return {
        symbol: s.symbol,
        name: s.name,
        sector: s.sector,
        lastPrice: s.lastPrice ?? f?.currentPrice,
        peRatio: f?.peRatio,
        marketCap: s.marketCap ?? f?.marketCap,
        fiftyTwoWeekHigh: f?.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: f?.fiftyTwoWeekLow,
        grahamNumber: f?.grahamNumber,
        priceDecline52W: f?.priceDecline52W,
        priceToIntrinsicValue: f?.priceToIntrinsicValue,
        bargainZone: f?.bargainZone,
        isGrahamCompliant: graham.isGrahamCompliant,
        isEnterprisingCompliant: enterprising.isEnterprisingCompliant,
      }
    })

    const withBargainData = all.filter((r) => r.priceDecline52W != null && r.bargainZone !== undefined)
    setRows(withBargainData)
    setLoading(false)

    const staleCutoff = Date.now() - 24 * 60 * 60 * 1000
    const missing = stockRows
      .filter((s) => {
        const f = fundMap.get(s.symbol)
        return !f || !f.fetchedAt || new Date(f.fetchedAt).getTime() < staleCutoff
      })
      .sort((a, b) => {
        const aMc = fundMap.get(a.symbol)?.marketCap ?? a.marketCap ?? 0
        const bMc = fundMap.get(b.symbol)?.marketCap ?? b.marketCap ?? 0
        return bMc - aMc
      })
      .map((s) => s.symbol)

    if (missing.length === 0) return

    const controller = new AbortController()
    abortRef.current = controller
    setFetchProgress({ done: 0, total: missing.length })

    try {
      const results = await fetchFundamentalsBatch(missing, (done, total) => {
        if (!controller.signal.aborted) setFetchProgress({ done, total })
      })
      if (controller.signal.aborted) return

      setRows((prev) => {
        const updated = [...prev]
        for (const symbol of missing) {
          const result = results[symbol]
          if (result?.data) {
            const s = stockRows.find((sr) => sr.symbol === symbol)
            if (!s) continue
            const graham = evaluateModifiedGrahamResult(withLenientDefaults(result.data as Record<string, unknown>))
            const enterprising = evaluateEnterprisingSimple(withLenientDefaults(result.data as Record<string, unknown>))
            const row: BargainRow = {
              symbol: s.symbol,
              name: s.name,
              sector: s.sector,
              lastPrice: result.data.currentPrice,
              peRatio: result.data.peRatio,
              marketCap: result.data.marketCap,
              fiftyTwoWeekHigh: result.data.fiftyTwoWeekHigh,
              fiftyTwoWeekLow: result.data.fiftyTwoWeekLow,
              grahamNumber: result.data.grahamNumber,
              priceDecline52W: result.data.priceDecline52W,
              priceToIntrinsicValue: result.data.priceToIntrinsicValue,
              bargainZone: result.data.bargainZone,
              isGrahamCompliant: graham.isGrahamCompliant,
              isEnterprisingCompliant: enterprising.isEnterprisingCompliant,
            }
            const existingIdx = updated.findIndex((r) => r.symbol === symbol)
            if (existingIdx >= 0) {
              updated[existingIdx] = row
            } else if (row.priceDecline52W != null && row.bargainZone !== undefined) {
              updated.push(row)
            }
          }
        }
        return updated
      })
    } catch (err) {
      console.warn('Background fetch failed:', err)
    } finally {
      if (!controller.signal.aborted) setFetchProgress(null)
    }
  }, [])

  useEffect(() => {
    loadData()
    return () => abortRef.current?.abort()
  }, [loadData])

  useEffect(() => {
    navigate({
      to: '/bargains',
      search: { q: debouncedSearch, sector: sectorFilter, zone: filterZone, cap: capFilter, strategy: filterStrategy, sortBy, page },
      replace: true,
    })
  }, [debouncedSearch, sectorFilter, filterZone, capFilter, filterStrategy, sortBy, page, navigate])

  const handleRefresh = async () => {
    abortRef.current?.abort()
    setRefreshing(true)
    setFetchProgress(null)
    const [stockRows, fundRows] = await Promise.all([db.stock.toArray(), db.fundamental.toArray()])
    const fundMapForSort = new Map(fundRows.map((f) => [f.symbol, f]))
    const symbols = stockRows
      .sort((a, b) => {
        const aMc = fundMapForSort.get(a.symbol)?.marketCap ?? a.marketCap ?? 0
        const bMc = fundMapForSort.get(b.symbol)?.marketCap ?? b.marketCap ?? 0
        return bMc - aMc
      })
      .map((s) => s.symbol)

    const controller = new AbortController()
    abortRef.current = controller
    setFetchProgress({ done: 0, total: symbols.length })

    try {
      const results = await fetchFundamentalsBatch(symbols, (done, total) => {
        if (!controller.signal.aborted) setFetchProgress({ done, total })
      })
      if (controller.signal.aborted) return

      const all: BargainRow[] = stockRows.map((s) => {
        const result = results[s.symbol]
        const f = result?.data
        const fLenient = f ? withLenientDefaults(f as Record<string, unknown>) : null
        const graham = fLenient ? evaluateModifiedGrahamResult(fLenient) : { isGrahamCompliant: false }
        const enterprising = fLenient ? evaluateEnterprisingSimple(fLenient) : { isEnterprisingCompliant: false }
        return {
          symbol: s.symbol,
          name: s.name,
          sector: s.sector,
          lastPrice: s.lastPrice ?? f?.currentPrice,
          peRatio: f?.peRatio,
          marketCap: s.marketCap ?? f?.marketCap,
          fiftyTwoWeekHigh: f?.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: f?.fiftyTwoWeekLow,
          grahamNumber: f?.grahamNumber,
          priceDecline52W: f?.priceDecline52W,
          priceToIntrinsicValue: f?.priceToIntrinsicValue,
          bargainZone: f?.bargainZone,
          isGrahamCompliant: graham.isGrahamCompliant,
          isEnterprisingCompliant: enterprising.isEnterprisingCompliant,
        }
      })

      setRows(all.filter((r) => r.priceDecline52W != null))
    } catch (err) {
      console.warn('Refresh failed:', err)
    } finally {
      if (!controller.signal.aborted) setFetchProgress(null)
      setRefreshing(false)
    }
  }

  const sortedRows = useMemo(() => {
    let filtered = rows
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      filtered = filtered.filter(
        (r) => r.symbol.toLowerCase().includes(q) || r.name.toLowerCase().includes(q),
      )
    }
    if (sectorFilter) {
      filtered = filtered.filter((r) => r.sector === sectorFilter)
    }
    if (filterZone !== 'all') {
      filtered = filtered.filter((r) => r.bargainZone === filterZone)
    }
    if (capFilter !== 'all') {
      filtered = filtered.filter((r) => getMarketCapTier(r.marketCap) === capFilter)
    }
    if (filterStrategy === 'defensive') {
      filtered = filtered.filter((r) => r.isGrahamCompliant)
    } else if (filterStrategy === 'enterprising') {
      filtered = filtered.filter((r) => r.isEnterprisingCompliant)
    }
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'zone') {
        const za = ZONE_ORDER[a.bargainZone ?? 'none'] ?? 99
        const zb = ZONE_ORDER[b.bargainZone ?? 'none'] ?? 99
        if (za !== zb) return za - zb
        return (b.priceDecline52W ?? 0) - (a.priceDecline52W ?? 0)
      }
      if (sortBy === 'decline') {
        return (a.priceDecline52W ?? 0) - (b.priceDecline52W ?? 0)
      }
      return computeBargainScore(b) - computeBargainScore(a)
    })
    return sorted
  }, [rows, filterZone, capFilter, filterStrategy, sortBy, debouncedSearch, sectorFilter])

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PER_PAGE
    return sortedRows.slice(start, start + PER_PAGE)
  }, [sortedRows, page])

  const totalPages = Math.ceil(sortedRows.length / PER_PAGE)

  const zoneStats = useMemo(() => {
    return {
      deep: rows.filter((r) => r.bargainZone === 'deep').length,
      good: rows.filter((r) => r.bargainZone === 'good').length,
      mild: rows.filter((r) => r.bargainZone === 'mild').length,
    }
  }, [rows])

  const sectors = useMemo(() => {
    const unique = new Set(rows.map((r) => r.sector).filter(Boolean))
    return Array.from(unique).sort()
  }, [rows])

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">Bargain Hunter</h1>
        <LoadingState rows={4} />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Bargain Hunter</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Stocks sorted by how far they've fallen from their 52-week high and how cheap they are relative to intrinsic value.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh All Data'}
        </button>
      </div>

      {fetchProgress && (
        <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-[var(--muted-foreground)]">Fetching fundamentals {fetchProgress.done}/{fetchProgress.total}</span>
            <span className="text-xs text-[var(--muted-foreground)]">{fetchProgress.total > 0 ? Math.round((fetchProgress.done / fetchProgress.total) * 100) : 0}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
            <div className="h-full rounded-full bg-[var(--primary)] transition-all duration-300" style={{ width: `${fetchProgress.total > 0 ? (fetchProgress.done / fetchProgress.total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--foreground)]">{rows.length}</div>
          <div className="text-xs text-[var(--muted-foreground)]">With Price Data</div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{zoneStats.deep}</div>
          <div className="text-xs text-[var(--muted-foreground)]">Deep Value</div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <div className="text-2xl font-bold text-amber-500">{zoneStats.good}</div>
          <div className="text-xs text-[var(--muted-foreground)]">Good Bargain</div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <div className="text-2xl font-bold text-yellow-500">{zoneStats.mild}</div>
          <div className="text-xs text-[var(--muted-foreground)]">Mild Dip</div>
        </div>
      </div>

      <details className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
        <summary className="cursor-pointer text-xs font-medium text-[var(--foreground)]">
          <BookOpen size={14} className="mr-1 inline" />
          About This Page — Chapter 15
        </summary>
        <div className="mt-2 space-y-1 text-xs text-[var(--muted-foreground)]">
          <p>
            This page implements Graham's bargain approach from Chapter 15 of <em>The Intelligent Investor</em>.
            Use the <strong>Enterprising</strong> filter above to see only stocks that pass at least 5 of 7
            enterprising criteria.
          </p>
          <p>
            For the full enterprising screen, visit the{' '}
            <Link to="/enterprising" className="text-[var(--primary)] hover:underline">Enterprising Investor</Link> page.
          </p>
        </div>
      </details>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search symbol or name..."
            className="w-52 rounded-md border border-[var(--input)] bg-[var(--background)] py-1.5 pl-8 pr-3 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            aria-label="Search bargains"
          />
        </div>
        <select
          value={sectorFilter}
          onChange={(e) => { setSectorFilter(e.target.value); setPage(1) }}
          className="rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-1.5 text-xs text-[var(--foreground)]"
          aria-label="Sector filter"
        >
          <option value="">All Sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--muted)] p-0.5">
          {['all', 'deep', 'good', 'mild'].map((z) => (
            <button
              key={z}
              onClick={() => { setFilterZone(z); setPage(1) }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterZone === z
                  ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {z === 'all' ? 'All' : z.charAt(0).toUpperCase() + z.slice(1)}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--muted)] p-0.5">
          {(['all', 'large', 'mid', 'small'] as const).map((c) => (
            <button
              key={c}
              onClick={() => { setCapFilter(c); setPage(1) }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                capFilter === c
                  ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {c === 'all' ? 'All Caps' : c.charAt(0).toUpperCase() + c.slice(1) + ' Cap'}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--muted)] p-0.5">
          {(['all', 'defensive', 'enterprising'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStrategy(s); setPage(1) }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterStrategy === s
                  ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs text-[var(--foreground)]"
        >
          <option value="bargainScore">Bargain Score</option>
          <option value="decline">% Decline</option>
          <option value="zone">Zone</option>
        </select>
        <span className="text-xs text-[var(--muted-foreground)]">
          {sortedRows.length} stocks
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Symbol</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)]">Name</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">P/E</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">52W High</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">Decline</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">Graham No.</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">P/IV</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[var(--muted-foreground)]">Zone</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[var(--muted-foreground)]">Graham</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[var(--muted-foreground)]">EN</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]">Score</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)]"></th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => {
              const score = computeBargainScore(row)
              return (
                <tr key={row.symbol} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/50">
                  <td className="px-4 py-3">
                    <Link
                      to="/stocks/$symbol"
                      params={{ symbol: row.symbol }}
                      className="inline-flex items-center gap-1.5 font-medium text-[var(--foreground)] hover:text-[var(--primary)]"
                    >
                      {row.symbol}
                      <ExternalLink size={12} className="opacity-50" />
                    </Link>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-[var(--muted-foreground)]">{row.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--foreground)]">
                    {row.lastPrice ? formatCurrency(row.lastPrice) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--foreground)]">
                    {row.peRatio != null ? row.peRatio.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--muted-foreground)]">
                    {row.fiftyTwoWeekHigh ? formatCurrency(row.fiftyTwoWeekHigh) : '—'}
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums font-medium ${(row.priceDecline52W ?? 0) < 0 ? 'text-red-500' : ''}`}>
                    {row.priceDecline52W != null ? formatPercent(row.priceDecline52W) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--foreground)]">
                    {row.grahamNumber ? formatCurrency(row.grahamNumber) : '—'}
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums font-medium ${(row.priceToIntrinsicValue ?? 1) < 1 ? 'text-green-500' : ''}`}>
                    {row.priceToIntrinsicValue != null ? `× ${row.priceToIntrinsicValue.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ZoneBadge zone={row.bargainZone} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.isGrahamCompliant ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-500">
                        <ShieldCheck size={12} /> Pass
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--muted-foreground)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.isEnterprisingCompliant ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-500">
                        <Zap size={12} /> EN
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--muted-foreground)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--foreground)]">
                    {score}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AddToWatchlistButton symbol={row.symbol} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-[var(--border)] px-3 py-1 text-xs text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-[var(--muted-foreground)]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-[var(--border)] px-3 py-1 text-xs text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function ZoneBadge({ zone }: { zone?: string }) {
  if (!zone || zone === 'none') return <span className="text-xs text-[var(--muted-foreground)]">—</span>
  const styles: Record<string, string> = {
    deep: 'bg-red-500/10 text-red-500 border-red-500/30',
    good: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    mild: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  }
  const labels: Record<string, string> = { deep: 'Deep', good: 'Good', mild: 'Mild' }
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[zone] ?? ''}`}>
      {labels[zone] ?? zone}
    </span>
  )
}
