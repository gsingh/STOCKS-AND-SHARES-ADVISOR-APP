import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { db, type GoalRow, type PortfolioRow, type TxRow } from '../services/db'
import { formatCurrency, formatDate } from '../lib/format'
import { LoadingState } from '../components/shared/loading-state'
import { ErrorState } from '../components/shared/error-state'
import { GoalProjection } from '../components/features/goals/goal-projection'
import { calculateGoalProgress, calculateDaysRemaining } from '../features/goals/goal-calculations'

const TYPE_LABELS: Record<string, string> = {
  emergency: 'Emergency Fund',
  medium_term: 'Medium-Term',
  long_term: 'Long-Term',
  custom: 'Custom',
}

export default function GoalDetailPage() {
  const goalId = window.location.pathname.match(/\/goals\/([^/]+)/)?.[1]
  const [goal, setGoal] = useState<GoalRow | null>(null)
  const [linkedHoldings, setLinkedHoldings] = useState<PortfolioRow[]>([])
  const [linkedTransactions, setLinkedTransactions] = useState<TxRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!goalId) {
      setError('No goal ID specified')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const goalData = await db.goal.get(goalId)
      if (!goalData) {
        setError('Goal not found')
        setLoading(false)
        return
      }
      setGoal(goalData)

      const holdings = await db.portfolio
        .filter((h) => h.goalId === goalId)
        .toArray()
      setLinkedHoldings(holdings)

      const transactions = await db.tx
        .where('goalId')
        .equals(goalId)
        .toArray()
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setLinkedTransactions(transactions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goal')
    } finally {
      setLoading(false)
    }
  }, [goalId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleUnlinkHolding = useCallback(async (holdingId: number) => {
    await db.portfolio.update(holdingId, { goalId: undefined, updatedAt: new Date().toISOString() })
    loadData()
  }, [loadData])

  const handleUnlinkTransaction = useCallback(async (txId: number) => {
    await db.tx.update(txId, { goalId: undefined })
    loadData()
  }, [loadData])

  if (loading) return <LoadingState rows={3} />
  if (error) return <ErrorState message={error} onRetry={loadData} />
  if (!goal) return <ErrorState message="Goal not found" onRetry={loadData} />

  const progress = calculateGoalProgress(goal.currentAmount, goal.targetAmount)
  const daysLeft = calculateDaysRemaining(goal.targetDate)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/goals" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{goal.name}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{TYPE_LABELS[goal.type] ?? goal.type}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
          goal.status === 'active' ? 'bg-[var(--score-green-bg)] text-[var(--score-green)]' :
          goal.status === 'paused' ? 'bg-[var(--score-amber-bg)] text-[var(--score-amber)]' :
          'bg-[var(--score-red-bg)] text-[var(--score-red)]'
        }`}>
          {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Target</div>
          <div className="mt-1 text-lg font-bold tabular-nums text-[var(--card-foreground)]">
            {formatCurrency(goal.targetAmount)}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Current</div>
          <div className="mt-1 text-lg font-bold tabular-nums text-[var(--card-foreground)]">
            {formatCurrency(goal.currentAmount)}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Target Date</div>
          <div className="mt-1 text-lg font-bold tabular-nums text-[var(--card-foreground)]">
            {formatDate(goal.targetDate)}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Days Remaining</div>
          <div className="mt-1 text-lg font-bold tabular-nums text-[var(--card-foreground)]">
            {daysLeft > 0 ? daysLeft : 'Overdue'}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--card-foreground)]">Progress</span>
          <span className="text-sm font-medium tabular-nums text-[var(--card-foreground)]">{progress.toFixed(1)}%</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-[var(--muted)]">
          <div
            className="rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-1 text-sm font-semibold text-[var(--card-foreground)]">Risk Profile</h2>
        <p className="text-sm capitalize text-[var(--muted-foreground)]">{goal.riskProfile}</p>
        {goal.preferredSectors.length > 0 && (
          <>
            <h3 className="mt-3 mb-1 text-sm font-semibold text-[var(--card-foreground)]">Preferred Sectors</h3>
            <div className="flex flex-wrap gap-2">
              {goal.preferredSectors.map((s) => (
                <span key={s} className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                  {s}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-3 text-sm font-semibold text-[var(--card-foreground)]">Projection Calculator</h2>
        <GoalProjection
          currentAmount={goal.currentAmount}
          monthlySip={0}
          targetAmount={goal.targetAmount}
          years={Math.max(1, Math.ceil(daysLeft / 365))}
        />
      </div>

      {linkedHoldings.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--card-foreground)]">
            Linked Holdings ({linkedHoldings.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Symbol</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Avg Buy</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Invested</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {linkedHoldings.map((h) => (
                  <tr key={h.id} className="border-b border-[var(--border)]">
                    <td className="px-4 py-2 font-medium text-[var(--foreground)]">{h.symbol}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-[var(--foreground)]">{h.quantity}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-[var(--foreground)]">{formatCurrency(h.avgBuyPrice)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-[var(--foreground)]">{formatCurrency(h.quantity * h.avgBuyPrice)}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => h.id && handleUnlinkHolding(h.id)}
                        className="text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                        title="Unlink"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {linkedTransactions.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--card-foreground)]">
            Linked Transactions ({linkedTransactions.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Symbol</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Price</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Total</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {linkedTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-[var(--border)]">
                    <td className="px-4 py-2 text-[var(--foreground)]">{formatDate(tx.date)}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        tx.type === 'buy' ? 'bg-[var(--score-green-bg)] text-[var(--score-green)]' :
                        tx.type === 'sell' ? 'bg-[var(--score-red-bg)] text-[var(--score-red)]' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-medium text-[var(--foreground)]">{tx.symbol}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-[var(--foreground)]">{tx.quantity}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-[var(--foreground)]">{formatCurrency(tx.price)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-[var(--foreground)]">{formatCurrency(tx.quantity * tx.price)}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => tx.id && handleUnlinkTransaction(tx.id)}
                        className="text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                        title="Unlink"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
