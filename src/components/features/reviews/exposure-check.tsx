import { useMemo } from 'react'
import { PieChart } from 'lucide-react'
import { formatPercent } from '../../../lib/format'

interface ExposureItem {
  sector: string
  current: number
  cap: number
}

interface ExposureCheckProps {
  exposures: ExposureItem[]
  onResults: (results: Record<string, { sector: string; current: number; cap: number; status: string }>) => void
}

function getExposureStatus(current: number, cap: number): { status: string; color: string; bg: string; label: string } {
  if (current > cap) {
    return { status: 'exceeded', color: 'text-[var(--score-red)]', bg: 'bg-[var(--score-red-bg)]', label: 'Exceeded' }
  }
  if (current >= cap * 0.9) {
    return { status: 'at_limit', color: 'text-[var(--score-amber)]', bg: 'bg-[var(--score-amber-bg)]', label: 'At Limit' }
  }
  return { status: 'within', color: 'text-[var(--score-green)]', bg: 'bg-[var(--score-green-bg)]', label: 'Within' }
}

export function ExposureCheck({ exposures, onResults }: ExposureCheckProps) {
  const results = useMemo(() => {
    const resultMap: Record<string, { sector: string; current: number; cap: number; status: string }> = {}
    for (const e of exposures) {
      const { status } = getExposureStatus(e.current, e.cap)
      resultMap[e.sector] = { sector: e.sector, current: e.current, cap: e.cap, status }
    }
    onResults(resultMap)
    return exposures
  }, [exposures, onResults])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PieChart size={20} className="text-[var(--primary)]" />
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Category Exposure Check</h3>
      </div>

      <p className="text-sm text-[var(--muted-foreground)]">
        Reviews sector exposure against recommended concentration limits.
      </p>

      {results.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">No portfolio data to analyze.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--muted)]">
                <th className="px-4 py-2.5 text-left font-medium text-[var(--muted-foreground)]">Sector</th>
                <th className="px-4 py-2.5 text-right font-medium text-[var(--muted-foreground)]">Current %</th>
                <th className="px-4 py-2.5 text-right font-medium text-[var(--muted-foreground)]">Cap %</th>
                <th className="px-4 py-2.5 text-right font-medium text-[var(--muted-foreground)]">Utilization</th>
                <th className="px-4 py-2.5 text-right font-medium text-[var(--muted-foreground)]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {results.map((e) => {
                const { status, color, bg, label } = getExposureStatus(e.current, e.cap)
                const utilization = e.cap > 0 ? (e.current / e.cap) * 100 : 0
                return (
                  <tr key={e.sector} className={`${bg} transition-colors`}>
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{e.sector}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--foreground)]">
                      {formatPercent(e.current)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--foreground)]">
                      {formatPercent(e.cap)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--foreground)]">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-[var(--muted)]">
                          <div
                            className={`h-full rounded-full ${
                              status === 'exceeded'
                                ? 'bg-[var(--score-red)]'
                                : status === 'at_limit'
                                ? 'bg-[var(--score-amber)]'
                                : 'bg-[var(--score-green)]'
                            }`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-[var(--muted-foreground)]">
                          {utilization.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right ${color}`}>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color} ${bg}`}>
                        {label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
