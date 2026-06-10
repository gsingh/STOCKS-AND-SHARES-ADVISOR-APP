import { useState, useCallback } from 'react'
import { db } from '../../../services/db'
import { LoadingState } from '../../shared/loading-state'
import { ErrorState } from '../../shared/error-state'
import { RiskQuestionnaire } from './risk-questionnaire'
import type { RiskProfileResult } from '../../../features/risk-profile/risk-calculator'

export function RiskProfilePage() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  const handleComplete = useCallback(async (result: RiskProfileResult) => {
    setSaving(true)
    setError(null)
    try {
      await db.userPreference.put({
        key: 'riskProfile',
        value: result,
        updatedAt: new Date().toISOString(),
      })
      setCompleted(true)
    } catch {
      setError('Failed to save risk profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [])

  if (error) return <ErrorState message={error} onRetry={() => setError(null)} />
  if (saving) return <LoadingState rows={3} />
  if (completed) return <RiskCompletedState />

  return <RiskQuestionnaire onComplete={handleComplete} />
}

function RiskCompletedState() {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="rounded-lg border border-[var(--score-green-bg)] bg-[var(--score-green-bg)] p-6">
        <p className="text-lg font-semibold text-[var(--score-green)]">
          Risk profile saved successfully!
        </p>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          You can now use the app with your personalized risk profile.
        </p>
        <a
          href="/"
          className="mt-4 inline-block rounded-lg bg-[var(--primary)] px-6 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}
