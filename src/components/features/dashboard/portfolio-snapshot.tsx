import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Plus, Wallet } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { ScoreGauge, LoadingState } from '../../shared'
import { getPortfolioSummary } from '../../../features/portfolio/portfolio-service'
import { formatCurrency, formatPercent } from '../../../lib/format'

export function PortfolioSnapshot() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getPortfolioSummary>> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPortfolioSummary()
      .then(setSummary)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState rows={2} />

  if (!summary || summary.holdings.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <Wallet size={40} className="mx-auto mb-3 text-[var(--muted-foreground)]" />
        <p className="mb-1 text-sm font-medium text-[var(--foreground)]">No holdings yet</p>
        <p className="mb-4 text-xs text-[var(--muted-foreground)]">
          Add your first transaction to start tracking your portfolio.
        </p>
        <button
          onClick={() => navigate({ to: '/stocks' })}
          className="inline-flex items-center gap-1.5 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          Browse Stocks
        </button>
      </div>
    )
  }

  const isDayPositive = summary.dayChange >= 0
  const isTotalPositive = summary.totalReturn >= 0

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Value"
          value={formatCurrency(summary.totalValue)}
        />
        <MetricCard
          label="Invested"
          value={formatCurrency(summary.totalInvested)}
        />
        <MetricCard
          label="Total Return"
          value={`${isTotalPositive ? '+' : ''}${formatCurrency(summary.totalReturn)}`}
          valueClassName={isTotalPositive ? 'text-[var(--score-green)]' : 'text-[var(--score-red)]'}
          sub={`${isTotalPositive ? '+' : ''}${formatPercent(Math.abs(summary.totalReturnPercent))}`}
        />
        <MetricCard
          label="Today"
          value={`${isDayPositive ? '+' : ''}${formatCurrency(summary.dayChange)}`}
          valueClassName={isDayPositive ? 'text-[var(--score-green)]' : 'text-[var(--score-red)]'}
          sub={`${isDayPositive ? '+' : ''}${formatPercent(Math.abs(summary.dayChangePercent))}`}
          icon={isDayPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        />
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Top Holdings</h3>
          <button
            onClick={() => navigate({ to: '/portfolio' })}
            className="text-xs font-medium text-[var(--primary)] hover:underline"
          >
            View All
          </button>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {summary.holdings.slice(0, 5).map((h) => (
            <div key={h.symbol} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--foreground)]">{h.name}</p>
                <p className="font-mono text-xs tabular-nums text-[var(--muted-foreground)]">
                  {h.quantity} shares @ {formatCurrency(h.avgBuyPrice)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ScoreGauge score={h.score} />
                <div className="text-right">
                  <p className="font-mono text-sm font-medium tabular-nums text-[var(--foreground)]">
                    {formatCurrency(h.totalValue)}
                  </p>
                  <p
                    className={`font-mono text-xs tabular-nums ${
                      h.return_ >= 0 ? 'text-[var(--score-green)]' : 'text-[var(--score-red)]'
                    }`}
                  >
                    {h.return_ >= 0 ? '+' : ''}{formatPercent(Math.abs(h.returnPercent))}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  valueClassName?: string
  sub?: string
  icon?: React.ReactNode
}

function MetricCard({ label, value, valueClassName = 'text-[var(--foreground)]', sub, icon }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="mb-1 text-xs font-medium text-[var(--muted-foreground)]">{label}</p>
      <p className={`font-mono text-lg font-bold tabular-nums ${valueClassName}`}>{value}</p>
      {sub && (
        <p className={`mt-0.5 flex items-center gap-0.5 font-mono text-xs tabular-nums ${valueClassName}`}>
          {icon}{sub}
        </p>
      )}
    </div>
  )
}
