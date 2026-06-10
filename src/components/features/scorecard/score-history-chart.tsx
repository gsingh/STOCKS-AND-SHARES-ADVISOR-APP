import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatDate } from '../../../lib/format'
import type { ScoreSnapshotRow } from '../../../services/db'

interface ScoreHistoryChartProps {
  snapshots: ScoreSnapshotRow[]
}

export function ScoreHistoryChart({ snapshots }: ScoreHistoryChartProps) {
  const chartData = useMemo(() => {
    return snapshots
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((s) => ({
        date: formatDate(s.createdAt),
        score: s.compositeScore,
      }))
  }, [snapshots])

  if (snapshots.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-2 text-lg font-semibold text-[var(--foreground)]">
          Score History
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          No score history available. Scores will be recorded each time you evaluate this stock.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
        Score History
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            stroke="var(--border)"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            stroke="var(--border)"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--popover-foreground)',
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--chart-color-1)"
            strokeWidth={2}
            dot={{ fill: 'var(--chart-color-1)', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs" aria-label="Score history data">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-2 py-1 text-left font-medium text-[var(--muted-foreground)]">Date</th>
              <th className="px-2 py-1 text-right font-medium text-[var(--muted-foreground)]">Score</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row, i) => (
              <tr key={i} className="border-b border-[var(--border)] last:border-0">
                <td className="px-2 py-1 text-[var(--foreground)]">{row.date}</td>
                <td className="px-2 py-1 text-right tabular-nums text-[var(--foreground)]">
                  {row.score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
