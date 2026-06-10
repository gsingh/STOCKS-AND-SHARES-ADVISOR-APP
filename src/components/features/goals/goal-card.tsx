import { useNavigate } from '@tanstack/react-router'
import type { GoalRow } from '../../../services/db'
import { formatCurrency } from '../../../lib/format'
import { calculateGoalProgress, calculateDaysRemaining } from '../../../features/goals/goal-calculations'

interface GoalCardProps {
  goal: GoalRow
}

const TYPE_LABELS: Record<string, string> = {
  emergency: 'Emergency Fund',
  medium_term: 'Medium-Term',
  long_term: 'Long-Term',
  custom: 'Custom',
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-[var(--score-green-bg)] text-[var(--score-green)]',
  paused: 'bg-[var(--score-amber-bg)] text-[var(--score-amber)]',
  closed: 'bg-[var(--score-red-bg)] text-[var(--score-red)]',
}

export function GoalCard({ goal }: GoalCardProps) {
  const navigate = useNavigate()
  const progress = calculateGoalProgress(goal.currentAmount, goal.targetAmount)
  const daysLeft = calculateDaysRemaining(goal.targetDate)

  return (
    <div
      onClick={() => navigate({ to: '/goals/$goalId', params: { goalId: goal.id! } })}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate({ to: '/goals/$goalId', params: { goalId: goal.id! } }) }}
      className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-[var(--card-foreground)]">{goal.name}</h3>
          <p className="text-xs text-[var(--muted-foreground)]">{TYPE_LABELS[goal.type] ?? goal.type}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[goal.status] ?? ''}`}>
          {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
        </span>
      </div>

      <div className="mb-2">
        <div className="flex h-2 overflow-hidden rounded-full bg-[var(--muted)]">
          <div
            className="rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--muted-foreground)]">Target</span>
          <span className="font-medium tabular-nums text-[var(--card-foreground)]">
            {formatCurrency(goal.targetAmount)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted-foreground)]">Current</span>
          <span className="font-medium tabular-nums text-[var(--card-foreground)]">
            {formatCurrency(goal.currentAmount)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted-foreground)]">Progress</span>
          <span className="font-medium tabular-nums text-[var(--card-foreground)]">
            {progress.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted-foreground)]">Days Left</span>
          <span className="font-medium tabular-nums text-[var(--card-foreground)]">
            {daysLeft > 0 ? daysLeft : 'Overdue'}
          </span>
        </div>
      </div>
    </div>
  )
}
