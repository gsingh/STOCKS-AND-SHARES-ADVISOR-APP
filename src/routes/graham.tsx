import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { ensureSeeded } from '../services/seed-service'
import { db } from '../services/db'
import { fetchFundamentalsBatch } from '../services/batch-fundamentals-service'
import { evaluateGrahamResult, evaluateModifiedGrahamResult } from '../features/graham/graham-gates'
import { GRAHAM_THRESHOLD, MODIFIED_GRAHAM_THRESHOLD } from '../features/graham/graham-types'
import { withLenientDefaults } from '../services/yahoo-fundamentals-service'
import { LoadingState } from '../components/shared/loading-state'
import { GrahamTable } from '../components/features/graham/graham-table'
import { RefreshCw, BookOpen } from 'lucide-react'
import type { GrahamPageRow } from '../features/graham'

type GrahamMode = 'original' | 'modified'

const MODE_META: Record<GrahamMode, { label: string; pageTitle: string; threshold: number; gates: number }> = {
  original: { label: 'Original', pageTitle: 'Benjamin Graham Stocks', threshold: GRAHAM_THRESHOLD, gates: 7 },
  modified: { label: 'Modified', pageTitle: 'Graham — Indian Markets', threshold: MODIFIED_GRAHAM_THRESHOLD, gates: 7 },
}

export function GrahamPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [rows, setRows] = useState<GrahamPageRow[]>([])
  const [totalEvaluated, setTotalEvaluated] = useState(0)
  const [dataAvailable, setDataAvailable] = useState(0)
  const [fetchProgress, setFetchProgress] = useState<{ done: number; total: number } | null>(null)
  const [page, setPage] = useState(1)
  const [mode, setMode] = useState<GrahamMode>('original')
  const abortRef = useRef<AbortController | null>(null)

  const meta = MODE_META[mode]

  const buildRow = useCallback((s: { symbol: string; name: string; sector: string; marketCap?: number; lastPrice?: number }, f: any, currentMode: GrahamMode) => {
    const evaluate = currentMode === 'modified' ? evaluateModifiedGrahamResult : evaluateGrahamResult
    const graham = evaluate(f ?? {})
    const hasData = f && Object.values(f).some((v) => v !== undefined && v !== null && v !== 0)

    return {
      symbol: s.symbol,
      name: s.name,
      sector: s.sector,
      marketCap: s.marketCap ?? f?.marketCap,
      lastPrice: s.lastPrice,
      peRatio: f?.peRatio,
      pbRatio: f?.pbRatio,
      gatesPassed: graham.gatesPassed,
      gatesTotal: graham.gatesTotal,
      isGrahamCompliant: graham.isGrahamCompliant,
      grahamScore: graham.grahamScore,
      gateResults: graham.gateResults,
      _hasData: hasData,
    }
  }, [])

  const loadData = useCallback(async (currentMode: GrahamMode) => {
    setLoading(true)
    await ensureSeeded()
    const stockRows = await db.stock.toArray()
    const fundRows = await db.fundamental.toArray()
    const fundMap = new Map(fundRows.map((f) => [f.symbol, f]))

    const all = stockRows
      .map((s) => {
        const f = fundMap.get(s.symbol)
        const lenient = f ? withLenientDefaults(f as unknown as Record<string, unknown>) : undefined
        return buildRow(s, lenient, currentMode)
      })

    const withData = all.filter((r: any) => r._hasData).length
    const compliant = all.filter((r) => r.isGrahamCompliant).sort((a, b) => b.gatesPassed - a.gatesPassed || b.grahamScore - a.grahamScore)

    setRows(compliant)
    setTotalEvaluated(all.length)
    setDataAvailable(withData)
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

    if (missing.length === 0) return

    const controller = new AbortController()
    abortRef.current = controller

    const symbols = missing.map((s) => s.symbol)

    setFetchProgress({ done: 0, total: symbols.length })

    try {
      const results = await fetchFundamentalsBatch(symbols, (done, total) => {
        if (!controller.signal.aborted) {
          setFetchProgress({ done, total })
        }
      })

      if (controller.signal.aborted) return

      setRows((prev) => {
        const updated = [...prev]
        for (const symbol of symbols) {
          const result = results[symbol]
          if (result?.data) {
            const s = stockRows.find((sr) => sr.symbol === symbol)
            if (!s) continue
            const row = buildRow(s, withLenientDefaults(result.data as Record<string, unknown>), currentMode)
            const existingIdx = updated.findIndex((r) => r.symbol === symbol)
            if (existingIdx >= 0) {
              if (row.isGrahamCompliant) {
                updated[existingIdx] = row
              } else {
                updated.splice(existingIdx, 1)
              }
            } else if (row.isGrahamCompliant) {
              updated.push(row)
            }
          }
        }

        updated.sort((a, b) => b.gatesPassed - a.gatesPassed || b.grahamScore - a.grahamScore)
        return updated
      })

      setDataAvailable((prev) => {
        const newlyAvailable = Object.values(results).filter((r) => r.data).length
        return prev + newlyAvailable
      })
    } catch (err) {
      console.warn('Background fetch failed:', err)
    } finally {
      if (!controller.signal.aborted) {
        setFetchProgress(null)
      }
    }
  }, [buildRow])

  useEffect(() => {
    loadData(mode)

    return () => {
      abortRef.current?.abort()
    }
  }, [mode, loadData])

  const handleRefresh = async () => {
    abortRef.current?.abort()
    setRefreshing(true)
    setFetchProgress(null)

    const [stockRows, fundRows] = await Promise.all([db.stock.toArray(), db.fundamental.toArray()])
    const fundMapForSort = new Map(fundRows.map((f) => [f.symbol, f]))
    const sorted = [...stockRows].sort((a, b) => {
      const aMc = fundMapForSort.get(a.symbol)?.marketCap ?? a.marketCap ?? 0
      const bMc = fundMapForSort.get(b.symbol)?.marketCap ?? b.marketCap ?? 0
      return bMc - aMc
    })
    const symbols = sorted.map((s) => s.symbol)

    const controller = new AbortController()
    abortRef.current = controller

    setFetchProgress({ done: 0, total: symbols.length })

    try {
      const results = await fetchFundamentalsBatch(symbols, (done, total) => {
        if (!controller.signal.aborted) {
          setFetchProgress({ done, total })
        }
      })

      if (controller.signal.aborted) return

      const all = stockRows.map((s) => {
        const result = results[s.symbol]
        const f = result?.data
        const lenient = f ? withLenientDefaults(f as Record<string, unknown>) : undefined
        return buildRow(s, lenient, mode)
      })

      const withData = all.filter((r: any) => r._hasData).length
      const compliant = all.filter((r) => r.isGrahamCompliant).sort((a, b) => b.gatesPassed - a.gatesPassed || b.grahamScore - a.grahamScore)

      setRows(compliant)
      setDataAvailable(withData)
      setTotalEvaluated(all.length)
    } catch (err) {
      console.warn('Refresh failed:', err)
    } finally {
      if (!controller.signal.aborted) {
        setFetchProgress(null)
      }
      setRefreshing(false)
    }
  }

  const handleModeSwitch = (newMode: GrahamMode) => {
    setMode(newMode)
    setPage(1)
  }

  const topStocks = useMemo(() => rows.filter((r) => r.gatesPassed >= 6), [rows])

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">{meta.pageTitle}</h1>
        <LoadingState rows={4} />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-2 inline-flex rounded-lg border border-[var(--border)] bg-[var(--muted)] p-0.5">
            <button
              onClick={() => handleModeSwitch('original')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                mode === 'original'
                  ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => handleModeSwitch('modified')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                mode === 'modified'
                  ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Modified
            </button>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {meta.pageTitle}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Stocks that pass at least {meta.threshold} of {meta.gates} criteria from Benjamin Graham's <em>The Intelligent Investor</em>{mode === 'modified' ? ' (adapted for Indian markets)' : ''}.
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
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--muted-foreground)]">
              Fetching fundamentals {fetchProgress.done}/{fetchProgress.total}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {fetchProgress.total > 0 ? Math.round((fetchProgress.done / fetchProgress.total) * 100) : 0}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[var(--muted)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
              style={{ width: `${fetchProgress.total > 0 ? (fetchProgress.done / fetchProgress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-[var(--foreground)]">{totalEvaluated}</div>
            <div className="text-xs text-[var(--muted-foreground)]">Total Stocks</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--foreground)]">{dataAvailable}</div>
            <div className="text-xs text-[var(--muted-foreground)]">With Data</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--score-green)]">{rows.length}</div>
            <div className="text-xs text-[var(--muted-foreground)]">Graham-Compliant</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--score-amber)]">{topStocks.length}</div>
            <div className="text-xs text-[var(--muted-foreground)]">Top Picks (6-7)</div>
          </div>
        </div>
      </div>

      {topStocks.length > 0 && (
        <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-2 text-sm font-semibold text-[var(--foreground)]">
            Top {mode === 'modified' ? 'Modified ' : ''}Graham Picks ({topStocks.length} stocks pass 6-7 gates)
          </h2>
          <div className="flex flex-wrap gap-2">
            {topStocks.map((s) => (
              <span
                key={s.symbol}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--score-green-bg)] px-2.5 py-1 text-xs font-medium text-[var(--score-green)]"
              >
                {s.symbol} <span className="opacity-70">({s.gatesPassed}/7)</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {dataAvailable === 0 && rows.length === 0 && (
        <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            No fundamental data available yet. Click <strong>Refresh All Data</strong> to fetch fundamentals from Yahoo Finance.
          </p>
        </div>
      )}

      {dataAvailable > 0 && rows.length === 0 && (
        <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            {dataAvailable} stocks have fundamental data, but none currently pass all {meta.threshold} of {meta.gates} Graham
            {mode === 'modified' ? ' Modified' : ''} criteria.
            {mode === 'original' ? " The Indian market tends to have higher valuations and fewer 20-year dividend records than Graham's thresholds." : ' Try switching to Original mode for stricter criteria.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {rows.length} Graham-compliant stocks found
          </div>
          <GrahamTable rows={rows} page={page} onPageChange={setPage} />
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              Graham's 7 Defensive Criteria
            </h3>
            <ol className="space-y-3 text-xs text-[var(--muted-foreground)]">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">1</span>
                <span><strong className="text-[var(--foreground)]">Adequate Size</strong> — large, prominent company</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">2</span>
                <span><strong className="text-[var(--foreground)]">Strong Financial Condition</strong> — current ratio ≥ 2:1, debt manageable</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">3</span>
                <span><strong className="text-[var(--foreground)]">Earnings Stability</strong> — no losses in past 10 years</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">4</span>
                <span><strong className="text-[var(--foreground)]">Dividend Record</strong> — uninterrupted dividends 20+ years</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">5</span>
                <span><strong className="text-[var(--foreground)]">Earnings Growth</strong> — 33%+ increase over 10 years</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">6</span>
                <span><strong className="text-[var(--foreground)]">Moderate P/E</strong> — ≤ 15× 3-year average earnings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">7</span>
                <span><strong className="text-[var(--foreground)]">Moderate P/B</strong> — P/B ≤ 1.5 or P/E×P/B ≤ 22.5</span>
              </li>
            </ol>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              {mode === 'modified' ? 'Modified ' : ''}Screening Criteria
            </h3>
            <div className="space-y-1.5 text-xs">
              {mode === 'original' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Min. Market Cap</span>
                    <span className="font-medium text-[var(--foreground)]">₹20,000 Cr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Current Ratio</span>
                    <span className="font-medium text-[var(--foreground)]">≥ 2.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">D/E Ratio</span>
                    <span className="font-medium text-[var(--foreground)]">&lt; 1.1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Earnings Stability</span>
                    <span className="font-medium text-[var(--foreground)]">10 yrs no loss</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Dividend Record</span>
                    <span className="font-medium text-[var(--foreground)]">20+ yrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Earnings Growth</span>
                    <span className="font-medium text-[var(--foreground)]">≥ 33% (10yr)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">P/E (3yr avg)</span>
                    <span className="font-medium text-[var(--foreground)]">≤ 15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">P/B or P/E×P/B</span>
                    <span className="font-medium text-[var(--foreground)]">≤ 1.5 or ≤ 22.5</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Min. Market Cap</span>
                    <span className="font-medium text-[var(--foreground)]">₹2,000 Cr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Current Ratio</span>
                    <span className="font-medium text-[var(--foreground)]">≥ 1.5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">D/E Ratio</span>
                    <span className="font-medium text-[var(--foreground)]">&lt; 1.5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Earnings Stability</span>
                    <span className="font-medium text-[var(--foreground)]">5 yrs no loss</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Dividend Record</span>
                    <span className="font-medium text-[var(--foreground)]">10+ yrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Earnings Growth</span>
                    <span className="font-medium text-[var(--foreground)]">≥ 20% (5yr)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">P/E (3yr avg)</span>
                    <span className="font-medium text-[var(--foreground)]">≤ 20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">P/B or P/E×P/B</span>
                    <span className="font-medium text-[var(--foreground)]">≤ 2.0 or ≤ 30</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              Key Differences from Buffett
            </h3>
            <ul className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
              <li>• Graham focuses on <strong className="text-[var(--foreground)]">balance sheet strength</strong> (current ratio, D/E)</li>
              <li>• Graham uses <strong className="text-[var(--foreground)]">3-year average earnings</strong> for P/E, not trailing P/E</li>
              <li>• Graham requires <strong className="text-[var(--foreground)]">dividend history</strong> (20+ years uninterrupted)</li>
              <li>• Graham emphasizes <strong className="text-[var(--foreground)]">P/B ratio</strong> and P/E×P/B ≤ 22.5</li>
              <li>• Graham's threshold <strong className="text-[var(--foreground)]">6/7 pass</strong> vs Buffett's 7/9</li>
            </ul>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              Data Sources
            </h3>
            <ul className="space-y-1.5 text-[11px] text-[var(--muted-foreground)]">
              <li>• Balance sheet data via Yahoo <em>balanceSheetHistory</em></li>
              <li>• Dividend history via Yahoo <em>dividendHistory</em></li>
              <li>• Income history via Yahoo <em>incomeStatementHistory</em></li>
              <li>• Current Ratio fallback via Screener.in</li>
              <li>• P/E ratios: trailing (Yahoo) + 3yr avg (computed)</li>
            </ul>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              References
            </h3>
            <ul className="space-y-1.5 text-[11px] text-[var(--muted-foreground)]">
              <li>• <em>The Intelligent Investor</em> (Benjamin Graham, Ch. 14)</li>
              <li>• <em>Security Analysis</em> (Graham & Dodd)</li>
              <li>• <em>The Interpretation of Financial Statements</em> (Graham)</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
