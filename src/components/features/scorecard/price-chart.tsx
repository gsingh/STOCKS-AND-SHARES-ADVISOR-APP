import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatDate, formatCurrency } from '../../../lib/format'
import type { PriceHistoryRow } from '../../../services/db'

type Interval = '1W' | '1M' | '3M' | '1Y'

interface PriceChartProps {
  data: PriceHistoryRow[]
}

const INTERVALS: Interval[] = ['1W', '1M', '3M', '1Y']

function filterByInterval(data: PriceHistoryRow[], interval: Interval): PriceHistoryRow[] {
  const now = Date.now()
  const ms = {
    '1W': 7 * 24 * 60 * 60 * 1000,
    '1M': 30 * 24 * 60 * 60 * 1000,
    '3M': 90 * 24 * 60 * 60 * 1000,
    '1Y': 365 * 24 * 60 * 60 * 1000,
  }
  const cutoff = now - ms[interval]
  return data.filter((d) => new Date(d.date).getTime() >= cutoff)
}

export function PriceChart({ data }: PriceChartProps) {
  const [interval, setInterval] = useState<Interval>('1M')

  const chartData = useMemo(() => {
    const filtered = filterByInterval(data, interval)
    return filtered
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d) => ({
        date: formatDate(d.date),
        price: d.close,
      }))
  }, [data, interval])

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-2 text-lg font-semibold text-[var(--foreground)]">Price Chart</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          No price history available yet.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Price Chart</h2>
        <div className="flex gap-1" role="tablist" aria-label="Price chart intervals">
          {INTERVALS.map((iv) => (
            <button
              key={iv}
              role="tab"
              aria-selected={interval === iv}
              onClick={() => setInterval(iv)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                interval === iv
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)]'
              }`}
            >
              {iv}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            stroke="var(--border)"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            stroke="var(--border)"
            tickFormatter={(v: number) => formatCurrency(v)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--popover-foreground)',
            }}
            formatter={(value: number) => [formatCurrency(value), 'Price']}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="var(--chart-color-1)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 overflow-x-auto" aria-hidden="true">
        <table className="w-full text-xs" aria-label="Price chart data table">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-2 py-1 text-left font-medium text-[var(--muted-foreground)]">Date</th>
              <th className="px-2 py-1 text-right font-medium text-[var(--muted-foreground)]">Price</th>
            </tr>
          </thead>
          <tbody>
            {chartData.slice(-10).map((row, i) => (
              <tr key={i} className="border-b border-[var(--border)] last:border-0">
                <td className="px-2 py-1 text-[var(--foreground)]">{row.date}</td>
                <td className="px-2 py-1 text-right tabular-nums text-[var(--foreground)]">
                  {formatCurrency(row.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
