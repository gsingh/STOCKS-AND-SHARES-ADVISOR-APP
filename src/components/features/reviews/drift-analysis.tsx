import { useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import { calculateDrifts, getDriftColorClass, getDriftBgClass, getDriftLabel, type DriftResult } from '../../../features/reviews/drift-calculator'
import { formatPercent } from '../../../lib/format'

interface DriftStockItem {
  symbol: string
  name: string
  currentAllocation: number
  targetAllocation: number
}

interface DriftAnalysisProps {
  stocks: DriftStockItem[]
  onResults: (results: Record<string, { current: number; target: number; drift: number; status: string }>) => void
}

export function DriftAnalysis({ stocks, onResults }: DriftAnalysisProps) {
  const results = useMemo(() => {
    const computed = calculateDrifts(
      stocks.map((s) => ({
        symbol: s.symbol,
        currentAllocation: s.currentAllocation,
        targetAllocation: s.targetAllocation,
      })),
    )
    const resultMap: Record<string, { current: number; target: number; drift: number; status: string }> = {}
    for (const r of computed) {
      resultMap[r.symbol] = { current: r.current, target: r.target, drift: r.driftPercent, status: r.status }
    }
    onResults(resultMap)
    return computed
  }, [stocks, onResults])

  const greenCount = results.filter((r) => r.status === 'green').length
  const amberCount = results.filter((r) => r.status === 'amber').length
  const redCount = results.filter((r) => r.status === 'red').length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp size={20} className="text-[var(--primary)]" />
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Drift Analysis</h3>
      </div>

      <p className="text-sm text-[var(--muted-foreground)]">
        Compares each holding's current allocation against its target allocation.
      </p>

      {results.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">No portfolio holdings to analyze.</p>
      ) : (
        <>
          <div className="flex gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--score-green)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--score-green)]" />
              {greenCount} within range
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--score-amber)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--score-amber)]" />
              {amberCount} drifting
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--score-red)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--score-red)]" />
              {redCount} significant drift
            </span>
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--muted)]">
                  <th className="px-4 py-2.5 text-left font-medium text-[var(--muted-foreground)]">Stock</th>
                  <th className="px-4 py-2.5 text-right font-medium text-[var(--muted-foreground)]">Current %</th>
                  <th className="px-4 py-2.5 text-right font-medium text-[var(--muted-foreground)]">Target %</th>
                  <th className="px-4 py-2.5 text-right font-medium text-[var(--muted-foreground)]">Drift %</th>
                  <th className="px-4 py-2.5 text-right font-medium text-[var(--muted-foreground)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {results.map((r) => (
                  <DriftRow key={r.symbol} result={r} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function DriftRow({ result }: { result: DriftResult }) {
  return (
    <tr className={`${getDriftBgClass(result.status)} transition-colors`}>
      <td className="px-4 py-3 font-medium text-[var(--foreground)]">{result.symbol}</td>
      <td className="px-4 py-3 text-right tabular-nums text-[var(--foreground)]">
        {formatPercent(result.current)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-[var(--foreground)]">
        {formatPercent(result.target)}
      </td>
      <td className={`px-4 py-3 text-right tabular-nums ${getDriftColorClass(result.status)}`}>
        {result.driftPercent >= 0 ? '+' : ''}{formatPercent(result.driftPercent)}
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getDriftColorClass(result.status)} ${getDriftBgClass(result.status)}`}>
          {getDriftLabel(result.status)}
        </span>
      </td>
    </tr>
  )
}
