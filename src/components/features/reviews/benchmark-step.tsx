import { useMemo } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  compareToBenchmarks,
  getVerdictColorClass,
  type BenchmarkResult,
} from '../../../features/reviews/benchmark'
import { formatPercent } from '../../../lib/format'

interface BenchmarkStockItem {
  symbol: string
  name: string
  stockReturn: number
  benchmarkReturn: number
}

interface BenchmarkStepProps {
  stocks: BenchmarkStockItem[]
  onResults: (results: Record<string, { stockReturn: number; benchmarkReturn: number; gap: number }>) => void
}

function getVerdictIcon(verdict: BenchmarkResult['verdict']) {
  switch (verdict) {
    case 'outperforming': return <TrendingUp size={18} className="text-[var(--score-green)]" />
    case 'underperforming': return <TrendingDown size={18} className="text-[var(--score-red)]" />
    case 'in_line': return <Minus size={18} className="text-[var(--score-amber)]" />
  }
}

function getVerdictLabel(verdict: BenchmarkResult['verdict']): string {
  switch (verdict) {
    case 'outperforming': return 'Outperforming'
    case 'underperforming': return 'Underperforming'
    case 'in_line': return 'In Line'
  }
}

export function BenchmarkStep({ stocks, onResults }: BenchmarkStepProps) {
  const results = useMemo(() => {
    const computed = compareToBenchmarks(
      stocks.map((s) => ({
        symbol: s.symbol,
        stockReturn: s.stockReturn,
        benchmarkReturn: s.benchmarkReturn,
      })),
    )
    const resultMap: Record<string, { stockReturn: number; benchmarkReturn: number; gap: number }> = {}
    for (const r of computed) {
      resultMap[r.symbol] = { stockReturn: r.stockReturn, benchmarkReturn: r.benchmarkReturn, gap: r.gap }
    }
    onResults(resultMap)
    return computed
  }, [stocks, onResults])

  const outperforming = results.filter((r) => r.verdict === 'outperforming').length
  const underperforming = results.filter((r) => r.verdict === 'underperforming').length
  const inLine = results.filter((r) => r.verdict === 'in_line').length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 size={20} className="text-[var(--primary)]" />
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Benchmark Comparison</h3>
      </div>

      <p className="text-sm text-[var(--muted-foreground)]">
        Compares each stock's return against its sector benchmark.
      </p>

      {results.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">No portfolio holdings to compare.</p>
      ) : (
        <>
          <div className="flex gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--score-green)]">
              <TrendingUp size={14} />
              {outperforming} outperforming
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--score-amber)]">
              <Minus size={14} />
              {inLine} in line
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--score-red)]">
              <TrendingDown size={14} />
              {underperforming} underperforming
            </span>
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--muted)]">
                  <th className="px-4 py-2.5 text-left font-medium text-[var(--muted-foreground)]">Stock</th>
                  <th className="px-4 py-2.5 text-right font-medium text-[var(--muted-foreground)]">Stock Return</th>
                  <th className="px-4 py-2.5 text-right font-medium text-[var(--muted-foreground)]">Benchmark</th>
                  <th className="px-4 py-2.5 text-right font-medium text-[var(--muted-foreground)]">Gap</th>
                  <th className="px-4 py-2.5 text-right font-medium text-[var(--muted-foreground)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {results.map((r) => (
                  <tr key={r.symbol} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{r.symbol}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--foreground)]">
                      {formatPercent(r.stockReturn)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--muted-foreground)]">
                      {formatPercent(r.benchmarkReturn)}
                    </td>
                    <td className={`px-4 py-3 text-right tabular-nums ${getVerdictColorClass(r.verdict)}`}>
                      {r.gap >= 0 ? '+' : ''}{formatPercent(r.gap)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getVerdictColorClass(r.verdict)}`}>
                        {getVerdictIcon(r.verdict)}
                        {getVerdictLabel(r.verdict)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
