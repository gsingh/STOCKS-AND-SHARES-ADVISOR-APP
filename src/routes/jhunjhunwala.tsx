import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { ensureSeeded } from '../services/seed-service'
import { db } from '../services/db'
import { fetchFundamentalsBatch } from '../services/batch-fundamentals-service'
import { evaluateJhunjhunwalaResult, evaluateJhunjhunwalaModifiedResult } from '../features/jhunjhunwala/jhunjhunwala-gates'
import { JHUNJHUNWALA_THRESHOLD, JHUNJHUNWALA_MODIFIED_THRESHOLD } from '../features/jhunjhunwala/types'
import { LoadingState } from '../components/shared/loading-state'
import { JhunjhunwalaTable } from '../components/features/jhunjhunwala'
import { RefreshCw } from 'lucide-react'
import type { JhunjhunwalaPageRow } from '../features/jhunjhunwala'

const REFRESH_CHUNK_SIZE = 200

type JhunjhunwalaMode = 'original' | 'modified'

const MODE_META: Record<JhunjhunwalaMode, { label: string; pageTitle: string; threshold: number; gates: number }> = {
  original: { label: 'Original', pageTitle: 'Jhunjhunwala Stocks', threshold: JHUNJHUNWALA_THRESHOLD, gates: 7 },
  modified: { label: 'Modified', pageTitle: 'Jhunjhunwala Modified Stocks', threshold: JHUNJHUNWALA_MODIFIED_THRESHOLD, gates: 7 },
}

export function JhunjhunwalaPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [rows, setRows] = useState<JhunjhunwalaPageRow[]>([])
  const [totalEvaluated, setTotalEvaluated] = useState(0)
  const [dataAvailable, setDataAvailable] = useState(0)
  const [fetchProgress, setFetchProgress] = useState<{ done: number; total: number } | null>(null)
  const [page, setPage] = useState(1)
  const [mode, setMode] = useState<JhunjhunwalaMode>('original')
  const abortRef = useRef<AbortController | null>(null)

  const meta = MODE_META[mode]

  const buildRow = useCallback((s: { symbol: string; name: string; sector: string; marketCap?: number; lastPrice?: number }, f: any, currentMode: JhunjhunwalaMode) => {
    const evaluate = currentMode === 'modified' ? evaluateJhunjhunwalaModifiedResult : evaluateJhunjhunwalaResult
    const jhunjhunwala = evaluate(f ?? {})
    const hasData = f && Object.values(f).some((v) => v !== undefined && v !== null && v !== 0)

    return {
      symbol: s.symbol,
      name: s.name,
      sector: s.sector,
      marketCap: s.marketCap ?? f?.marketCap,
      lastPrice: s.lastPrice,
      peRatio: f?.peRatio,
      roe: f?.roe,
      roce: f?.roce,
      revenueGrowth: f?.revenueGrowth,
      epsGrowth: f?.epsGrowth,
      debtToEquity: f?.debtToEquity,
      score: undefined,
      gatesPassed: jhunjhunwala.gatesPassed,
      gatesTotal: jhunjhunwala.gatesTotal,
      isJhunjhunwalaCompliant: jhunjhunwala.isJhunjhunwalaCompliant,
      jhunjhunwalaScore: jhunjhunwala.jhunjhunwalaScore,
      gateResults: jhunjhunwala.gateResults,
      _hasData: hasData,
    }
  }, [])

  const loadData = useCallback(async (currentMode: JhunjhunwalaMode) => {
    setLoading(true)
    await ensureSeeded()
    const stockRows = await db.stock.toArray()
    const fundRows = await db.fundamental.toArray()
    const fundMap = new Map(fundRows.map((f) => [f.symbol, f]))

    const all = stockRows
      .map((s) => {
        const f = fundMap.get(s.symbol)
        return buildRow(s, f ?? undefined, currentMode)
      })

    const withData = all.filter((r: any) => r._hasData).length
    const compliant = all.filter((r) => r.isJhunjhunwalaCompliant).sort((a, b) => b.gatesPassed - a.gatesPassed || b.jhunjhunwalaScore - a.jhunjhunwalaScore)

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
        const aMc = a.marketCap ?? 0
        const bMc = b.marketCap ?? 0
        return bMc - aMc
      })

    if (missing.length === 0) return

    const controller = new AbortController()
    abortRef.current = controller

    const topSymbols = missing.slice(0, REFRESH_CHUNK_SIZE).map((s) => s.symbol)

    setFetchProgress({ done: 0, total: topSymbols.length })

    try {
      const results = await fetchFundamentalsBatch(topSymbols, (done, total) => {
        if (!controller.signal.aborted) {
          setFetchProgress({ done, total })
        }
      })

      if (controller.signal.aborted) return

      setRows((prev) => {
        const updated = [...prev]
        for (const symbol of topSymbols) {
          const result = results[symbol]
          if (result?.data) {
            const s = stockRows.find((sr) => sr.symbol === symbol)
            if (!s) continue
            const row = buildRow(s, result.data, currentMode)
            const existingIdx = updated.findIndex((r) => r.symbol === symbol)
            if (existingIdx >= 0) {
              if (row.isJhunjhunwalaCompliant) {
                updated[existingIdx] = row
              } else {
                updated.splice(existingIdx, 1)
              }
            } else if (row.isJhunjhunwalaCompliant) {
              updated.push(row)
            }
          }
        }

        updated.sort((a, b) => b.gatesPassed - a.gatesPassed || b.jhunjhunwalaScore - a.jhunjhunwalaScore)
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

    const stockRows = await db.stock.toArray()

    const sorted = [...stockRows].sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
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
        return buildRow(s, f ?? undefined, mode)
      })

      const withData = all.filter((r: any) => r._hasData).length
      const compliant = all.filter((r) => r.isJhunjhunwalaCompliant).sort((a, b) => b.gatesPassed - a.gatesPassed || b.jhunjhunwalaScore - a.jhunjhunwalaScore)

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

  const handleModeSwitch = (newMode: JhunjhunwalaMode) => {
    setMode(newMode)
    setPage(1)
  }

  const topStocks = useMemo(() => rows.filter((r) => r.gatesPassed >= 7), [rows])

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
            Stocks that pass at least {meta.threshold} of {meta.gates} criteria from Rakesh Jhunjhunwala's investment philosophy{mode === 'modified' ? ' (adapted for broader market coverage)' : ''}.
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
            <div className="text-xs text-[var(--muted-foreground)]">Jhunjhunwala-Compliant</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--score-amber)]">{topStocks.length}</div>
            <div className="text-xs text-[var(--muted-foreground)]">Top Picks (7/7)</div>
          </div>
        </div>
      </div>

      {topStocks.length > 0 && (
        <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-2 text-sm font-semibold text-[var(--foreground)]">
            Top {mode === 'modified' ? 'Modified ' : ''}Jhunjhunwala Picks ({topStocks.length} stocks pass all 7 gates)
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
            {dataAvailable} stocks have fundamental data, but none currently pass all {meta.threshold} of {meta.gates} Jhunjhunwala{mode === 'modified' ? ' Modified' : ''} criteria.
            {mode === 'original' ? " Jhunjhunwala's criteria are strict — try Modified mode for relaxed thresholds." : ' Try switching to Original mode for stricter criteria.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {rows.length} Jhunjhunwala-compliant stocks found
          </div>
          <JhunjhunwalaTable rows={rows} page={page} onPageChange={setPage} />
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              Jhunjhunwala's 6-Criteria Framework
            </h3>
            <ol className="space-y-3 text-xs text-[var(--muted-foreground)]">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">1</span>
                <span><strong className="text-[var(--foreground)]">High ROE & ROCE</strong> — returns above 15% signal efficient capital allocation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">2</span>
                <span><strong className="text-[var(--foreground)]">Low Debt</strong> — debt-to-equity below 0.5 means earnings from equity, not borrowed money</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">3</span>
                <span><strong className="text-[var(--foreground)]">Consistent Growth</strong> — sales and profit growing above 12% over 3 years</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">4</span>
                <span><strong className="text-[var(--foreground)]">Reasonable Valuation</strong> — P/E below 25, margin of safety</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">5</span>
                <span><strong className="text-[var(--foreground)]">Adequate Size</strong> — market cap above ₹500 Cr for liquidity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">6</span>
                <span><strong className="text-[var(--foreground)]">Long-Term Conviction</strong> — hold through cycles, let compounding work</span>
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
                    <span className="text-[var(--muted-foreground)]">ROE</span>
                    <span className="font-medium text-[var(--foreground)]">≥ 15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">ROCE</span>
                    <span className="font-medium text-[var(--foreground)]">≥ 15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">D/E</span>
                    <span className="font-medium text-[var(--foreground)]">&lt; 0.5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Sales Growth 3Y</span>
                    <span className="font-medium text-[var(--foreground)]">≥ 12%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Profit Growth 3Y</span>
                    <span className="font-medium text-[var(--foreground)]">≥ 12%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">P/E</span>
                    <span className="font-medium text-[var(--foreground)]">&lt; 25</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Market Cap</span>
                    <span className="font-medium text-[var(--foreground)]">&gt; ₹500 Cr</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">ROE</span>
                    <span className="font-medium text-[var(--foreground)]">≥ 12%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">ROCE</span>
                    <span className="font-medium text-[var(--foreground)]">≥ 12%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">D/E</span>
                    <span className="font-medium text-[var(--foreground)]">&lt; 1.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Sales Growth 3Y</span>
                    <span className="font-medium text-[var(--foreground)]">≥ 10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Profit Growth 3Y</span>
                    <span className="font-medium text-[var(--foreground)]">≥ 10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">P/E</span>
                    <span className="font-medium text-[var(--foreground)]">&lt; 30</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Market Cap</span>
                    <span className="font-medium text-[var(--foreground)]">&gt; ₹250 Cr</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              Scoring Adjustments
            </h3>
            <p className="mb-3 text-xs text-[var(--muted-foreground)]">
              The Jhunjhunwala Score re-weights categories to match his priorities:
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Quality (ROE, ROCE, margins)</span>
                <span className="font-medium text-[var(--foreground)]">35%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Growth (Revenue, EPS)</span>
                <span className="font-medium text-[var(--foreground)]">25%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Valuation (P/E, P/B)</span>
                <span className="font-medium text-[var(--foreground)]">20%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Financial Health (D/E, FCF)</span>
                <span className="font-medium text-[var(--foreground)]">15%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Size</span>
                <span className="font-medium text-[var(--foreground)]">5%</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              Sources
            </h3>
            <ul className="space-y-1.5 text-[11px] text-[var(--muted-foreground)]">
              <li>• Rakesh Jhunjhunwala's public interviews</li>
              <li>• Rare Enterprises investment philosophy</li>
              <li>• <em>The Big Bull</em> — documentary & biographies</li>
              <li>• Investor conference talks & media appearances</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
