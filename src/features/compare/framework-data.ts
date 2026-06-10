import { FRAMEWORK_STEPS, FRAMEWORK_FIELDS } from './framework-types'
import type { FrameworkState, FrameworkStepData, FrameworkField } from './framework-types'
import type { ScoringInput } from '../scorecard/types'

const STORAGE_KEY = 'framework-state'

function createInitialSteps(): FrameworkStepData[] {
  return FRAMEWORK_STEPS.map((step) => ({
    id: step.id,
    title: step.title,
    guidance: step.guidance,
    completed: false,
    autoPopulated: false,
    fields: (FRAMEWORK_FIELDS[step.id] ?? []).map((f) => ({
      key: f.key,
      label: f.label,
      type: f.type,
      value: null,
      autoPopulated: false,
    })),
  }))
}

export function createInitialState(): FrameworkState {
  return {
    currentStep: 1,
    steps: createInitialSteps(),
    startedAt: null,
    completedAt: null,
  }
}

export function loadState(): FrameworkState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw) as FrameworkState
    const steps = FRAMEWORK_STEPS.map((step) => {
      const existing = parsed.steps.find((s) => s.id === step.id)
      if (existing) return existing
      const fields = (FRAMEWORK_FIELDS[step.id] ?? []).map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        value: null,
        autoPopulated: false,
      }))
      return { id: step.id, title: step.title, guidance: step.guidance, completed: false, autoPopulated: false, fields }
    })
    return { currentStep: parsed.currentStep ?? 1, steps, startedAt: parsed.startedAt ?? null, completedAt: parsed.completedAt ?? null }
  } catch {
    return createInitialState()
  }
}

export function saveState(state: FrameworkState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage unavailable — silently skip
  }
}

export function populateFromScorecard(
  state: FrameworkState,
  data: ScoringInput,
): FrameworkState {
  const updatedSteps = state.steps.map((step) => {
    if (step.id < 3 || step.id > 6) return step

    const fieldMap: Record<string, { key: string; scorecardKey: keyof ScoringInput }> = {
      operatingMargin: { key: 'operatingMargin', scorecardKey: 'operatingMargin' },
      netMargin: { key: 'netMargin', scorecardKey: 'netProfitMargin' },
      roe: { key: 'roe', scorecardKey: 'roe' },
      roce: { key: 'roce', scorecardKey: 'roce' },
      peRatio: { key: 'peRatio', scorecardKey: 'peRatio' },
      pbRatio: { key: 'pbRatio', scorecardKey: 'pbRatio' },
      pegRatio: { key: 'pegRatio', scorecardKey: 'peg' },
      dividendYield: { key: 'dividendYield', scorecardKey: 'dividendYield' },
      debtToEquity: { key: 'debtToEquity', scorecardKey: 'debtToEquity' },
      freeCashFlow: { key: 'freeCashFlow', scorecardKey: 'freeCashFlow' },
      promoterHolding: { key: 'promoterHolding', scorecardKey: 'promoterHolding' },
      pledgedShares: { key: 'pledgedShares', scorecardKey: 'pledgedShares' },
    }

    const updatedFields: FrameworkField[] = step.fields.map((field) => {
      const mapping = fieldMap[field.key]
      if (!mapping) return field
      if (field.value !== null && field.autoPopulated) return field

      const scorecardValue = data[mapping.scorecardKey]
      if (scorecardValue === undefined || scorecardValue === null) return field

      return {
        ...field,
        value: field.type === 'number' ? scorecardValue : String(scorecardValue),
        autoPopulated: true,
      }
    })

    return { ...step, fields: updatedFields, autoPopulated: true }
  })

  return { ...state, steps: updatedSteps }
}

export function generateMarkdown(state: FrameworkState, symbol?: string): string {
  const lines: string[] = []
  lines.push(`# 8-Step Framework Analysis${symbol ? `: ${symbol}` : ''}`)
  lines.push(`\n_Generated on ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}_\n`)
  lines.push('---\n')

  for (const step of state.steps) {
    lines.push(`## Step ${step.id}: ${step.title}`)
    if (step.completed) {
      lines.push('_Completed_\n')
    } else {
      lines.push('_Incomplete_\n')
    }
    for (const field of step.fields) {
      if (field.value !== null && field.value !== '') {
        const prefix = field.autoPopulated ? '(from scorecard) ' : ''
        lines.push(`- **${field.label}**: ${prefix}${field.value}`)
      }
    }
    lines.push('')
  }

  return lines.join('\n')
}
