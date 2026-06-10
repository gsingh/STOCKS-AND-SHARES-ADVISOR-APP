import { formatCurrency } from '../../../lib/format'
import type { PortfolioSummary } from '../../../features/portfolio/portfolio-calculations'

interface PortfolioSummaryProps {
  summary: PortfolioSummary
}

export function PortfolioSummaryBar({ summary }: PortfolioSummaryProps) {
  const pnlClass = summary.totalPnL >= 0 ? 'text-[var(--score-green)]' : 'text-[var(--score-red)]'

  return (
    <div className="grid grid-cols-3 gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          Total Invested
        </div>
        <div className="mt-1 text-lg font-bold tabular-nums text-[var(--card-foreground)]">
          {formatCurrency(summary.totalInvested)}
        </div>
      </div>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          Current Value
        </div>
        <div className="mt-1 text-lg font-bold tabular-nums text-[var(--card-foreground)]">
          {formatCurrency(summary.totalCurrentValue)}
        </div>
      </div>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          Total P&L
        </div>
        <div className={`mt-1 text-lg font-bold tabular-nums ${pnlClass}`}>
          {summary.totalPnL >= 0 ? '+' : ''}{formatCurrency(summary.totalPnL)}
          <span className="ml-1 text-sm font-medium">
            ({summary.totalPnLPercent >= 0 ? '+' : ''}{summary.totalPnLPercent.toFixed(2)}%)
          </span>
        </div>
      </div>
    </div>
  )
}
