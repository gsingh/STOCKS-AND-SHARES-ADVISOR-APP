export interface DriftInput {
  symbol: string
  currentAllocation: number
  targetAllocation: number
}

export interface DriftResult {
  symbol: string
  current: number
  target: number
  drift: number
  driftPercent: number
  status: 'green' | 'amber' | 'red'
}

export function calculateDrift(current: number, target: number): number {
  if (target === 0) return current > 0 ? 100 : 0
  return ((current - target) / target) * 100
}

export function getDriftStatus(driftPercent: number): 'green' | 'amber' | 'red' {
  const abs = Math.abs(driftPercent)
  if (abs < 5) return 'green'
  if (abs <= 15) return 'amber'
  return 'red'
}

export function calculateDrifts(inputs: DriftInput[]): DriftResult[] {
  return inputs.map(({ symbol, currentAllocation, targetAllocation }) => {
    const drift = currentAllocation - targetAllocation
    const driftPercent = calculateDrift(currentAllocation, targetAllocation)
    const status = getDriftStatus(driftPercent)
    return { symbol, current: currentAllocation, target: targetAllocation, drift, driftPercent, status }
  })
}

export function getDriftColorClass(status: 'green' | 'amber' | 'red'): string {
  switch (status) {
    case 'green': return 'text-[var(--score-green)]'
    case 'amber': return 'text-[var(--score-amber)]'
    case 'red': return 'text-[var(--score-red)]'
  }
}

export function getDriftBgClass(status: 'green' | 'amber' | 'red'): string {
  switch (status) {
    case 'green': return 'bg-[var(--score-green-bg)]'
    case 'amber': return 'bg-[var(--score-amber-bg)]'
    case 'red': return 'bg-[var(--score-red-bg)]'
  }
}

export function getDriftLabel(status: 'green' | 'amber' | 'red'): string {
  switch (status) {
    case 'green': return 'Within Range'
    case 'amber': return 'Slight Drift'
    case 'red': return 'Significant Drift'
  }
}
