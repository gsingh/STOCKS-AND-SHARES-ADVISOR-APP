export interface YearProjection {
  year: number
  yearLabel: string
  investedAmount: number
  expectedReturns: number
  totalValue: number
}

export function projectGoal(
  currentAmount: number,
  monthlySip: number,
  expectedReturn: number,
  years: number,
): YearProjection[] {
  const annualRate = expectedReturn / 100
  const monthlyRate = annualRate / 12
  const projections: YearProjection[] = []

  let totalInvested = currentAmount
  let totalValue = currentAmount

  for (let year = 1; year <= years; year++) {
    let yearEndValue = totalValue
    const yearlySip = monthlySip * 12
    totalInvested += yearlySip

    for (let m = 0; m < 12; m++) {
      yearEndValue = (yearEndValue + monthlySip) * (1 + monthlyRate)
    }

    totalValue = yearEndValue
    const returns = totalValue - totalInvested

    projections.push({
      year,
      yearLabel: `Year ${year}`,
      investedAmount: Math.round(totalInvested * 100) / 100,
      expectedReturns: Math.round(returns * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
    })
  }

  return projections
}

export interface SipResult {
  totalInvested: number
  expectedReturns: number
  maturityAmount: number
  yearByYear: YearProjection[]
}

export function calculateSIP(
  monthlyAmount: number,
  expectedReturn: number,
  durationYears: number,
): SipResult {
  if (durationYears <= 0) {
    return {
      totalInvested: 0,
      expectedReturns: 0,
      maturityAmount: 0,
      yearByYear: [],
    }
  }
  const projections = projectGoal(0, monthlyAmount, expectedReturn, durationYears)
  const last = projections[projections.length - 1]

  return {
    totalInvested: last.investedAmount,
    expectedReturns: last.expectedReturns,
    maturityAmount: last.totalValue,
    yearByYear: projections,
  }
}

export function calculateGoalProgress(current: number, target: number): number {
  if (target <= 0) return 0
  return Math.max(0, Math.min(100, (current / target) * 100))
}

export function calculateDaysRemaining(targetDate: string): number {
  const now = new Date()
  const target = new Date(targetDate)
  if (isNaN(target.getTime())) return 0
  const diff = target.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export const SIP_SCENARIOS = [
  { label: 'Conservative', return: 8 },
  { label: 'Moderate', return: 12 },
  { label: 'Aggressive', return: 15 },
] as const
