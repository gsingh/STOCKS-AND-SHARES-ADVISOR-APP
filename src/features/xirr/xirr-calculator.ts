export interface CashFlow {
  date: string
  amount: number
}

export interface XirrResult {
  rate: number
  totalInvested: number
  totalReturned: number
  error?: string
}

export function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.round((date2.getTime() - date1.getTime()) / msPerDay)
}

export function calculateXirr(cashFlows: CashFlow[]): XirrResult {
  if (cashFlows.length < 2) {
    return { rate: 0, totalInvested: 0, totalReturned: 0, error: 'At least 2 transactions required' }
  }

  const sorted = [...cashFlows].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  const startDate = new Date(sorted[0].date)
  const datedFlows = sorted.map((cf) => ({
    amount: cf.amount,
    days: daysBetween(startDate, new Date(cf.date)),
  }))

  const totalInvested = -datedFlows.filter((f) => f.amount < 0).reduce((s, f) => s + f.amount, 0)
  const totalReturned = datedFlows.filter((f) => f.amount > 0).reduce((s, f) => s + f.amount, 0)

  const hasNegative = datedFlows.some((f) => f.amount < 0)
  const hasPositive = datedFlows.some((f) => f.amount > 0)

  if (!hasNegative || !hasPositive) {
    return {
      rate: 0,
      totalInvested,
      totalReturned,
      error: 'Need both investments (negative) and returns (positive)',
    }
  }

  const guess = 0.1
  let rate = guess

  for (let i = 0; i < 1000; i++) {
    let f = 0
    let fPrime = 0

    for (const flow of datedFlows) {
      const exp = flow.days / 365
      const denom = Math.pow(1 + rate, exp)
      f += flow.amount / denom
      fPrime += (-exp * flow.amount) / (denom * (1 + rate))
    }

    if (Math.abs(fPrime) < 1e-12) break

    const newRate = rate - f / fPrime

    if (Math.abs(newRate - rate) < 1e-8) {
      const annualized = Math.abs(newRate) < 1e-10 ? 0 : newRate
      return { rate: annualized, totalInvested, totalReturned }
    }

    if (newRate <= -1) {
      return {
        rate: 0,
        totalInvested,
        totalReturned,
        error: 'Could not converge. Try adjusting cash flows.',
      }
    }

    rate = newRate
  }

  return {
    rate: 0,
    totalInvested,
    totalReturned,
    error: 'Could not converge. Try adjusting cash flows.',
  }
}
