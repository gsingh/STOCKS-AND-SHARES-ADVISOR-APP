import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../../lib/format'
import { calculateSIP } from '../../../features/goals/goal-calculations'

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

export function SipCalculator() {
  const [monthlyAmount, setMonthlyAmount] = useState('10000')
  const [expectedReturn, setExpectedReturn] = useState('12')
  const [durationYears, setDurationYears] = useState('10')

  const result = useMemo(() => {
    const monthly = Number(monthlyAmount)
    const ret = Number(expectedReturn)
    const years = Number(durationYears)
    if (!monthly || !ret || !years) return null
    return calculateSIP(monthly, ret, years)
  }, [monthlyAmount, expectedReturn, durationYears])

  const chartData = useMemo(() => {
    if (!result) return []
    return result.yearByYear.map((y) => ({
      year: y.yearLabel,
      Invested: y.investedAmount,
      Returns: y.expectedReturns,
    }))
  }, [result])

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="mb-4 text-lg font-semibold text-[var(--card-foreground)]">SIP Calculator</h2>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Monthly Investment (₹)</label>
          <input
            type="number"
            min="0"
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(e.target.value)}
            className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Expected Return (% p.a.)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={expectedReturn}
            onChange={(e) => setExpectedReturn(e.target.value)}
            className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Duration (Years)</label>
          <input
            type="number"
            min="1"
            value={durationYears}
            onChange={(e) => setDurationYears(e.target.value)}
            className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          />
        </div>
      </div>

      {result && (
        <>
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-[var(--muted)] p-3 text-center">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                Total Invested
              </div>
              <div className="mt-1 text-lg font-bold tabular-nums text-[var(--foreground)]">
                {formatCurrency(result.totalInvested)}
              </div>
            </div>
            <div className="rounded-lg bg-[var(--muted)] p-3 text-center">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                Expected Returns
              </div>
              <div className="mt-1 text-lg font-bold tabular-nums text-[var(--score-green)]">
                {formatCurrency(result.expectedReturns)}
              </div>
            </div>
            <div className="rounded-lg bg-[var(--muted)] p-3 text-center">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                Maturity Amount
              </div>
              <div className="mt-1 text-lg font-bold tabular-nums text-[var(--foreground)]">
                {formatCurrency(result.maturityAmount)}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-[var(--card-foreground)]">Year-by-Year Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Invested" fill="var(--chart-color-2, #2563EB)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Returns" fill="var(--chart-color-1, #2E8B57)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Year</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Invested</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Returns</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {result.yearByYear.map((y) => (
                  <tr key={y.year} className="border-b border-[var(--border)]">
                    <td className="px-4 py-2 font-medium text-[var(--foreground)]">{y.yearLabel}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-[var(--foreground)]">{formatCurrency(y.investedAmount)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-[var(--score-green)]">{formatCurrency(y.expectedReturns)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-[var(--foreground)]">{formatCurrency(y.totalValue)}</td>
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
