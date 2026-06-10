import { useState, useCallback } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import { FrameworkStep } from './framework-step'
import { FrameworkSummary } from './framework-summary'
import { loadState, saveState, populateFromScorecard } from '../../../../features/compare/framework-data'
import type { FrameworkState } from '../../../../features/compare/framework-types'
import type { ScoringInput } from '../../../../features/scorecard/types'

interface FrameworkWizardProps {
  scorecardData?: ScoringInput | null
}

export function FrameworkWizard({ scorecardData }: FrameworkWizardProps) {
  const [state, setState] = useState<FrameworkState>(() => loadState())
  const [showSummary, setShowSummary] = useState(false)

  const currentStep = state.steps.find((s) => s.id === state.currentStep)
  const completedCount = state.steps.filter((s) => s.completed).length
  const totalSteps = state.steps.length

  const updateState = useCallback((newState: FrameworkState) => {
    setState(newState)
    saveState(newState)
  }, [])

  const handleFieldChange = useCallback(
    (stepId: number, fieldKey: string, value: string | number | boolean) => {
      const newState: FrameworkState = {
        ...state,
        steps: state.steps.map((s) => {
          if (s.id !== stepId) return s
          return {
            ...s,
            fields: s.fields.map((f) =>
              f.key === fieldKey ? { ...f, value, autoPopulated: false } : f,
            ),
          }
        }),
      }
      updateState(newState)
    },
    [state, updateState],
  )

  const handleToggleComplete = useCallback(
    (stepId: number) => {
      const now = new Date().toISOString()
      const newState: FrameworkState = {
        ...state,
        startedAt: state.startedAt ?? now,
        steps: state.steps.map((s) => {
          if (s.id !== stepId) return s
          return { ...s, completed: !s.completed }
        }),
      }
      const allDone = newState.steps.every((s) => s.completed)
      if (allDone) {
        newState.completedAt = newState.completedAt ?? now
      }
      updateState(newState)
    },
    [state, updateState],
  )

  const goToStep = useCallback(
    (stepId: number) => {
      setShowSummary(false)
      setState((prev) => ({ ...prev, currentStep: stepId }))
    },
    [],
  )

  const handleSync = useCallback(() => {
    if (!scorecardData) return
    const newState = populateFromScorecard(state, scorecardData)
    updateState(newState)
  }, [state, scorecardData, updateState])

  const nextStep = () => {
    if (state.currentStep < totalSteps) {
      setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }))
    } else {
      setShowSummary(true)
    }
  }

  const prevStep = () => {
    if (state.currentStep > 1) {
      setState((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }))
    }
  }

  if (showSummary) {
    return (
      <FrameworkSummary
        state={state}
        onJumpToStep={goToStep}
        onBack={() => setShowSummary(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <CheckCircle size={16} className="text-[var(--score-green)]" />
          <span>
            {completedCount}/{totalSteps} complete
          </span>
        </div>
        {scorecardData && (
          <button
            onClick={handleSync}
            className="rounded-md border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Sync with scorecard
          </button>
        )}
      </div>

      <div className="flex gap-1">
        {state.steps.map((s) => (
          <button
            key={s.id}
            onClick={() => goToStep(s.id)}
            className={`flex-1 rounded-md px-2 py-1 text-center text-xs font-medium transition-colors ${
              s.id === state.currentStep
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : s.completed
                  ? 'bg-[var(--score-green-bg)] text-[var(--score-green)]'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
            }`}
          >
            {s.id}
          </button>
        ))}
      </div>

      {currentStep && (
        <FrameworkStep
          step={currentStep}
          onFieldChange={handleFieldChange}
          onToggleComplete={handleToggleComplete}
        />
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={state.currentStep === 1}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft size={16} />
          Previous
        </button>
        <button
          onClick={nextStep}
          className="inline-flex items-center gap-1.5 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
        >
          {state.currentStep === totalSteps ? 'View Summary' : 'Next'}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
