import { useState, useEffect, useCallback } from 'react'
import { Plus, Calculator } from 'lucide-react'
import { db, type GoalRow } from '../services/db'
import { LoadingState } from '../components/shared/loading-state'
import { ErrorState } from '../components/shared/error-state'
import { GoalCard } from '../components/features/goals/goal-card'
import { GoalFormDialog } from '../components/features/goals/goal-form-dialog'
import { SipCalculator } from '../components/features/goals/sip-calculator'

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showSipCalc, setShowSipCalc] = useState(false)
  const [editGoal, setEditGoal] = useState<GoalRow | null>(null)

  const loadGoals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const allGoals = await db.goal.toArray()
      allGoals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setGoals(allGoals)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  if (loading) return <LoadingState rows={3} />
  if (error) return <ErrorState message={error} onRetry={loadGoals} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Investment Goals</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSipCalc((p) => !p)}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            <Calculator size={16} />
            SIP Calculator
          </button>
          <button
            onClick={() => { setEditGoal(null); setShowForm(true) }}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
          >
            <Plus size={16} />
            Create Goal
          </button>
        </div>
      </div>

      {showSipCalc && <SipCalculator />}

      {goals.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            No goals yet. Create your first investment goal to start tracking progress.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      <GoalFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={loadGoals}
        editGoal={editGoal}
      />
    </div>
  )
}
