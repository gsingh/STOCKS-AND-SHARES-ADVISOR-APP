import { useState, useMemo } from 'react'
import { Plus, Trash2, Calculator, TrendingUp } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { calculateXirr } from '../features/xirr/xirr-calculator'
import type { CashFlow } from '../features/xirr/xirr-calculator'
import { formatCurrency } from '../lib/format'

interface Row {
  id: number
  date: string
  amount: string
}

let nextId = 2

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function XirrPage() {
  const [rows, setRows] = useState<Row[]>([
    { id: 1, date: toDateInputValue(new Date()), amount: '' },
  ])
  const [result, setResult] = useState<ReturnType<typeof calculateXirr> | null>(null)

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: nextId++, date: toDateInputValue(new Date()), amount: '' },
    ])
  }

  const removeRow = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
    setResult(null)
  }

  const updateRow = (id: number, field: 'date' | 'amount', value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
    setResult(null)
  }

  const cashFlowData = useMemo((): CashFlow[] => {
    return rows
      .map((r) => ({
        date: r.date,
        amount: parseFloat(r.amount),
      }))
      .filter((r) => !Number.isNaN(r.amount) && r.date)
  }, [rows])

  const handleCalculate = () => {
    const parsed = cashFlowData
    if (parsed.length < 2) return
    const res = calculateXirr(parsed)
    setResult(res)
  }

  const chartData = useMemo(() => {
    if (!result || result.error) return []
    return cashFlowData.map((cf, i) => ({
      name: `#${i + 1} (${cf.date})`,
      date: cf.date,
      amount: cf.amount,
    }))
  }, [cashFlowData, result])

  const formatPct = (v: number) => {
    return `${(v * 100).toFixed(2)}%`
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">XIRR Calculator</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Calculate annualized returns for irregular cash flows (SIP, lump sum with multiple
          investments)
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Cash Flow Transactions</h2>
          <button
            onClick={addRow}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent)]/90"
          >
            <Plus size={14} />
            Add Transaction
          </button>
        </div>

        <div className="mb-2 hidden grid-cols-[1fr_1fr_40px] gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] sm:grid">
          <span>Date</span>
          <span>Amount (+inflow / -outflow)</span>
          <span />
        </div>

        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1fr_1fr_40px] gap-2"
            >
              <input
                type="date"
                value={row.date}
                onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                className="rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)]"
              />
              <input
                type="text"
                inputMode="decimal"
                value={row.amount}
                onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                placeholder="e.g. -10000 or +50000"
                className="rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)]"
              />
              <button
                onClick={() => removeRow(row.id)}
                className="inline-flex items-center justify-center rounded-md p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]"
                aria-label="Remove transaction"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleCalculate}
          disabled={cashFlowData.length < 2}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Calculator size={16} />
          Calculate XIRR
        </button>
      </div>

      {result && (
        <div className="space-y-6">
          {result.error ? (
            <div className="rounded-lg border border-[var(--destructive)]/30 bg-[var(--score-red-bg)] p-4 text-sm text-[var(--score-red)]">
              {result.error}
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
                <div className="mb-4 flex items-center gap-3">
                  <TrendingUp size={24} className="text-[var(--accent)]" />
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">
                    XIRR Result
                  </h2>
                </div>

                <div className="mb-6 text-center">
                  <span className="text-sm text-[var(--muted-foreground)]">
                    Annualized Return
                  </span>
                  <div className="text-4xl font-bold text-[var(--accent)]">
                    {formatPct(result.rate)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-md bg-[var(--muted)] p-3 text-center">
                    <span className="text-xs text-[var(--muted-foreground)]">Total Invested</span>
                    <div className="text-lg font-semibold text-[var(--foreground)]">
                      {formatCurrency(result.totalInvested)}
                    </div>
                  </div>
                  <div className="rounded-md bg-[var(--muted)] p-3 text-center">
                    <span className="text-xs text-[var(--muted-foreground)]">Total Returned</span>
                    <div className="text-lg font-semibold text-[var(--foreground)]">
                      {formatCurrency(result.totalReturned)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
                  Investment Timeline
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--popover)',
                          border: '1px solid var(--border)',
                          borderRadius: '0.375rem',
                          color: 'var(--popover-foreground)',
                        }}
                        formatter={(value: number) => [formatCurrency(value), 'Amount']}
                      />
                      <Bar
                        dataKey="amount"
                        fill="var(--accent)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                      <th className="px-4 py-2 font-medium text-[var(--muted-foreground)]">#</th>
                      <th className="px-4 py-2 font-medium text-[var(--muted-foreground)]">Date</th>
                      <th className="px-4 py-2 font-medium text-[var(--muted-foreground)]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-[var(--border)] last:border-0"
                      >
                        <td className="px-4 py-2 text-[var(--muted-foreground)]">{i + 1}</td>
                        <td className="px-4 py-2 text-[var(--foreground)]">{row.date}</td>
                        <td
                          className={`px-4 py-2 tabular-nums ${
                            row.amount < 0
                              ? 'text-[var(--score-red)]'
                              : 'text-[var(--score-green)]'
                          }`}
                        >
                          {formatCurrency(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
