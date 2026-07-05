import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { ensureSeeded } from '../services/seed-service'
import { db } from '../services/db'
import { fetchFundamentalsBatch } from '../services/batch-fundamentals-service'
import { evaluateEnterprisingResult } from '../features/enterprising/enterprising-gates'
import { ENTERPRISING_THRESHOLD } from '../features/enterprising/enterprising-types'
import { withLenientDefaults } from '../services/yahoo-fundamentals-service'
import { LoadingState } from '../components/shared/loading-state'
import { Link } from '@tanstack/react-router'
import { EnterprisingTable } from '../components/features/enterprising/enterprising-table'
import { RefreshCw, BookOpen, Zap } from 'lucide-react'
import type { EnterprisingPageRow } from '../features/enterprising'

export function EnterprisingPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [rows, setRows] = useState<EnterprisingPageRow[]>([])
  const [totalEvaluated, setTotalEvaluated] = useState(0)
  const [dataAvailable, setDataAvailable] = useState(0)
  const [fetchProgress, setFetchProgress] = useState<{ done: number; total: number } | null>(null)
  const [page, setPage] = useState(1)
  const abortRef = useRef<AbortController | null>(null)

  const buildRow = useCallback((s: { symbol: string; name: string; sector: string; marketCap?: number; lastPrice?: number }, f: any) => {
    const result = evaluateEnterprisingResult(f ?? {})
    const hasData = f && Object.values(f).some((v) => v !== undefined && v !== null && v !== 0)

    return {
      symbol: s.symbol,
      name: s.name,
      sector: s.sector,
      marketCap: s.marketCap ?? f?.marketCap,
      lastPrice: s.lastPrice,
      peRatio: f?.peRatio,
      pbRatio: f?.pbRatio,
      gatesPassed: result.gatesPassed,
      gatesTotal: result.gatesTotal,
      isEnterprisingCompliant: result.isEnterprisingCompliant,
      enterprisingScore: result.enterprisingScore,
      gateResults: result.gateResults,
      _hasData: hasData,
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    await ensureSeeded()
    const stockRows = await db.stock.toArray()
    const fundRows = await db.fundamental.toArray()
    const fundMap = new Map(fundRows.map((f) => [f.symbol, f]))

    const all = stockRows
      .map((s) => {
        const f = fundMap.get(s.symbol)
        const lenient = f ? withLenientDefaults(f as unknown as Record<string, unknown>) : undefined
        return buildRow(s, lenient)
      })

    const withData = all.filter((r: any) => r._hasData).length
    const compliant = all.filter((r) => r.isEnterprisingCompliant).sort((a, b) => b.gatesPassed - a.gatesPassed || b.enterprisingScore - a.enterprisingScore)

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
            const row = buildRow(s, withLenientDefaults(result.data as Record<string, unknown>))
            const existingIdx = updated.findIndex((r) => r.symbol === symbol)
            if (existingIdx >= 0) {
              if (row.isEnterprisingCompliant) {
                updated[existingIdx] = row
              } else {
                updated.splice(existingIdx, 1)
              }
            } else if (row.isEnterprisingCompliant) {
              updated.push(row)
            }
          }
        }

        updated.sort((a, b) => b.gatesPassed - a.gatesPassed || b.enterprisingScore - a.enterprisingScore)
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
    loadData()

    return () => {
      abortRef.current?.abort()
    }
  }, [loadData])

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
        return buildRow(s, lenient)
      })

      const withData = all.filter((r: any) => r._hasData).length
      const compliant = all.filter((r) => r.isEnterprisingCompliant).sort((a, b) => b.gatesPassed - a.gatesPassed || b.enterprisingScore - a.enterprisingScore)

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

  const topStocks = useMemo(() => rows.filter((r) => r.gatesPassed >= 6), [rows])

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">Enterprising Investor — Chapter 15</h1>
        <LoadingState rows={4} />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Enterprising Investor
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Stocks that pass at least {ENTERPRISING_THRESHOLD} of 7 criteria from Benjamin Graham's <em>The Intelligent Investor</em> (Ch. 15), designed for investors willing to devote time and care to security selection.
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
            <div className="text-xs text-[var(--muted-foreground)]">Enterprising-Compliant</div>
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
            Top Enterprising Picks ({topStocks.length} stocks pass 6-7 gates)
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
            {dataAvailable} stocks have fundamental data, but none currently pass {ENTERPRISING_THRESHOLD} of 7 Enterprising Investor criteria.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {rows.length} Enterprising-compliant stocks found
          </div>
          <EnterprisingTable rows={rows} page={page} onPageChange={setPage} />
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              Graham's 7 Enterprising Criteria
            </h3>
            <ol className="space-y-3 text-xs text-[var(--muted-foreground)]">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">1</span>
                <span><strong className="text-[var(--foreground)]">Financial Condition</strong> — current ratio ≥ 1.5, D/E &lt; 2.0</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">2</span>
                <span><strong className="text-[var(--foreground)]">Earnings Stability</strong> — no losses in past 5 years</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">3</span>
                <span><strong className="text-[var(--foreground)]">Dividend Record</strong> — at least 5 years of dividends</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">4</span>
                <span><strong className="text-[var(--foreground)]">Earnings Growth</strong> — 20%+ increase over 5 years</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">5</span>
                <span><strong className="text-[var(--foreground)]">Moderate P/E</strong> — ≤ 20× 3-year average earnings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">6</span>
                <span><strong className="text-[var(--foreground)]">Moderate P/B</strong> — P/E×P/B ≤ 35</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">7</span>
                <span><strong className="text-[var(--foreground)]">Adequate Size</strong> — market cap ≥ ₹500 Cr</span>
              </li>
            </ol>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              Screening Criteria
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Current Ratio</span>
                <span className="font-medium text-[var(--foreground)]">≥ 1.5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">D/E Ratio</span>
                <span className="font-medium text-[var(--foreground)]">&lt; 2.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Earnings Stability</span>
                <span className="font-medium text-[var(--foreground)]">5 yrs no loss</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Dividend Record</span>
                <span className="font-medium text-[var(--foreground)]">5+ yrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Earnings Growth</span>
                <span className="font-medium text-[var(--foreground)]">≥ 20% (5yr) or ≥ 10% (10yr)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">P/E (3yr avg)</span>
                <span className="font-medium text-[var(--foreground)]">≤ 20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">P/E×P/B</span>
                <span className="font-medium text-[var(--foreground)]">≤ 35</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Min. Market Cap</span>
                <span className="font-medium text-[var(--foreground)]">₹500 Cr</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              Key Differences from Defensive (Ch. 14)
            </h3>
            <ul className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
              <li>• <strong className="text-[var(--foreground)]">Lower size threshold</strong> — ₹500 Cr vs ₹20,000 Cr</li>
              <li>• <strong className="text-[var(--foreground)]">Relaxed D/E</strong> — &lt; 2.0 vs &lt; 1.1</li>
              <li>• <strong className="text-[var(--foreground)]">Shorter dividend history</strong> — 5 yrs vs 20+ yrs</li>
              <li>• <strong className="text-[var(--foreground)]">Softer P/B constraint</strong> — P/E×P/B ≤ 35 vs ≤ 22.5</li>
              <li>• <strong className="text-[var(--foreground)]">Flexible pass rate</strong> — 5/7 vs 6/7</li>
              <li>• <strong className="text-[var(--foreground)]">Requires more research</strong> — enterprising investors must diligently verify</li>
            </ul>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              Enterprising Strategies
            </h3>
            <p className="mb-2 text-xs text-[var(--muted-foreground)]">
              Graham outlines several approaches for the enterprising investor in Chapter 15:
            </p>
            <ul className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
              <li>• <strong className="text-[var(--foreground)]">The General Portfolio</strong> — apply relaxed criteria to smaller, less prominent companies</li>
              <li>• <strong className="text-[var(--foreground)]">Bargain Issues</strong> — buy stocks below intrinsic value (see <Link to="/bargains" className="text-[var(--primary)] hover:underline">Bargains</Link> page)</li>
              <li>• <strong className="text-[var(--foreground)]">Special Situations</strong> — mergers, liquidations, and corporate actions</li>
              <li>• <strong className="text-[var(--foreground)]">Bear-Market Buying</strong> — acquire quality stocks during market downturns</li>
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
              <li>• <em>The Intelligent Investor</em> (Benjamin Graham, Ch. 15)</li>
              <li>• <em>Security Analysis</em> (Graham & Dodd)</li>
              <li>• <em>The Interpretation of Financial Statements</em> (Graham)</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
