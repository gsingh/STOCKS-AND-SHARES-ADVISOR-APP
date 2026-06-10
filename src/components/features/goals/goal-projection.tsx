import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { formatCurrency } from '../../../lib/format'
import { projectGoal, SIP_SCENARIOS } from '../../../features/goals/goal-calculations'

interface GoalProjectionProps {
  currentAmount: number
  monthlySip: number
  targetAmount: number
  years: number
}

const SCENARIO_COLORS = ['var(--chart-color-1, #2E8B57)', 'var(--chart-color-2, #2563EB)', 'var(--chart-color-3, #D97706)']

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--popover)] p-3 text-xs shadow-lg">
      <div className="mb-1 font-medium text-[var(--popover-foreground)]">{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-[var(--muted-foreground)]">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.name}: {formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function GoalProjection({ currentAmount, monthlySip, targetAmount, years }: GoalProjectionProps) {
  const scenarios = useMemo(() => {
    return SIP_SCENARIOS.map((s) => ({
      ...s,
      projections: projectGoal(currentAmount, monthlySip, s.return, years),
    }))
  }, [currentAmount, monthlySip, years])

  if (years <= 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]">
        Enter goal details to see projections.
      </div>
    )
  }

  const chartData = scenarios[0].projections.map((p, i) => ({
    year: p.yearLabel,
    [scenarios[0].label]: p.totalValue,
    [scenarios[1].label]: scenarios[1].projections[i]?.totalValue ?? 0,
    [scenarios[2].label]: scenarios[2].projections[i]?.totalValue ?? 0,
    target: targetAmount,
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {scenarios.map((s) => {
          const last = s.projections[s.projections.length - 1]
          const onTrack = last.totalValue >= targetAmount
          return (
            <div
              key={s.label}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="mb-1 text-sm font-semibold text-[var(--card-foreground)]">
                {s.label} ({s.return}%)
              </div>
              <div className="text-lg font-bold tabular-nums text-[var(--card-foreground)]">
                {formatCurrency(last.totalValue)}
              </div>
              <div className={`mt-1 text-xs font-medium ${onTrack ? 'text-[var(--score-green)]' : 'text-[var(--score-red)]'}`}>
                {onTrack ? 'On track to meet target' : 'Below target by ' + formatCurrency(targetAmount - last.totalValue)}
              </div>
              <div className="mt-2 space-y-0.5 text-xs text-[var(--muted-foreground)]">
                <div>Invested: {formatCurrency(last.investedAmount)}</div>
                <div>Returns: {formatCurrency(last.expectedReturns)}</div>
              </div>
            </div>
          )
        })}
      </div>

      {chartData.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--card-foreground)]">Year-by-Year Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {SIP_SCENARIOS.map((s, i) => (
                <Bar key={s.label} dataKey={s.label} fill={SCENARIO_COLORS[i]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Year</th>
              {SIP_SCENARIOS.map((s) => (
                <th key={s.label} className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  {s.label} ({s.return}%)
                </th>
              ))}
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Target</th>
            </tr>
          </thead>
          <tbody>
            {scenarios[0].projections.map((p) => (
              <tr key={p.year} className="border-b border-[var(--border)]">
                <td className="px-4 py-2 font-medium text-[var(--foreground)]">{p.yearLabel}</td>
                {scenarios.map((s) => (
                  <td key={s.label} className="px-4 py-2 text-right tabular-nums text-[var(--foreground)]">
                    {formatCurrency(s.projections[p.year - 1]?.totalValue ?? 0)}
                  </td>
                ))}
                <td className="px-4 py-2 text-right tabular-nums text-[var(--foreground)]">
                  {formatCurrency(targetAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
