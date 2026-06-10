import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import { buildRawGroups } from '../../../features/compare/compare-data'
import { formatNumber } from '../../../lib/format'
import type { CompareStockEntry } from '../../../features/compare/compare-types'

interface ComparisonChartsProps {
  entries: CompareStockEntry[]
}

const CHART_COLORS = [
  'var(--chart-color-1)',
  'var(--chart-color-2)',
  'var(--chart-color-3)',
  'var(--chart-color-4)',
]

const SKIP_PARAMS = new Set(['marketCap'])

function buildRadarData(entries: CompareStockEntry[]) {
  const groups = buildRawGroups(entries)
  return groups
    .flatMap((g) => g.rows)
    .filter((row) => !SKIP_PARAMS.has(row.key))
    .map((row) => {
      const data: Record<string, string | number | null> = { parameter: row.label }
      entries.forEach((e, i) => {
        const v = row.rawValues[i]
        data[e.symbol] = v !== null ? Math.max(0, v) : 0
      })
      return data
    })
}

function buildBarData(entries: CompareStockEntry[]) {
  const groups = buildRawGroups(entries).filter(
    (g) => g.key !== 'size',
  )
  return groups.map((g) => {
    const data: Record<string, string | number | null> = { category: g.name }
    for (const entry of entries) {
      const catValues: number[] = []
      for (const row of g.rows) {
        if (SKIP_PARAMS.has(row.key)) continue
        const idx = entries.indexOf(entry)
        const v = row.rawValues[idx]
        if (v !== null) catValues.push(v)
      }
      data[entry.symbol] = catValues.length > 0
        ? Math.round((catValues.reduce((a, b) => a + b, 0) / catValues.length) * 100) / 100
        : 0
    }
    return data
  })
}

export function ComparisonCharts({ entries }: ComparisonChartsProps) {
  const radarData = buildRadarData(entries)
  const barData = buildBarData(entries)

  if (entries.length === 0) return null

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
          Parameter Comparison — Radar
        </h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="parameter"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 'auto']}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--popover-foreground)',
                }}
              />
              {entries.map((e, i) => (
                <Radar
                  key={e.symbol}
                  name={e.name}
                  dataKey={e.symbol}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  fillOpacity={0.15}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
          Category Comparison — Bar Chart
        </h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="category"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--popover-foreground)',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: 'var(--foreground)' }}
              />
              {entries.map((e, i) => (
                <Bar
                  key={e.symbol}
                  dataKey={e.symbol}
                  name={e.name}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <details className="group">
        <summary className="cursor-pointer text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          Chart Data Table (screen reader accessible)
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[400px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-2 py-1 text-left font-semibold text-[var(--muted-foreground)]">
                  Parameter
                </th>
                {entries.map((e) => (
                  <th
                    key={e.symbol}
                    className="px-2 py-1 text-left font-semibold text-[var(--muted-foreground)]"
                  >
                    {e.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {buildRawGroups(entries)
                .flatMap((g) => g.rows)
                .filter((row) => !SKIP_PARAMS.has(row.key))
                .map((row) => (
                  <tr key={row.key} className="border-b border-[var(--border)]">
                    <td className="px-2 py-1 text-[var(--foreground)]">{row.label}</td>
                    {row.rawValues.map((v, i) => (
                      <td key={i} className="px-2 py-1 font-mono tabular-nums text-[var(--foreground)]">
                        {v !== null ? formatNumber(v) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
