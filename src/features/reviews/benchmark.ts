export interface BenchmarkInput {
  symbol: string
  stockReturn: number
  benchmarkReturn: number
}

export interface BenchmarkResult {
  symbol: string
  stockReturn: number
  benchmarkReturn: number
  gap: number
  gapPercent: number
  verdict: 'outperforming' | 'underperforming' | 'in_line'
}

export function compareToBenchmark(input: BenchmarkInput): BenchmarkResult {
  const gap = input.stockReturn - input.benchmarkReturn
  const gapPercent = input.benchmarkReturn !== 0
    ? (gap / Math.abs(input.benchmarkReturn)) * 100
    : 0

  let verdict: BenchmarkResult['verdict']
  if (gap > 2) {
    verdict = 'outperforming'
  } else if (gap < -2) {
    verdict = 'underperforming'
  } else {
    verdict = 'in_line'
  }

  return {
    symbol: input.symbol,
    stockReturn: input.stockReturn,
    benchmarkReturn: input.benchmarkReturn,
    gap,
    gapPercent,
    verdict,
  }
}

export function compareToBenchmarks(inputs: BenchmarkInput[]): BenchmarkResult[] {
  return inputs.map(compareToBenchmark)
}

export function getVerdictColorClass(verdict: BenchmarkResult['verdict']): string {
  switch (verdict) {
    case 'outperforming': return 'text-[var(--score-green)]'
    case 'underperforming': return 'text-[var(--score-red)]'
    case 'in_line': return 'text-[var(--score-amber)]'
  }
}

export const NIFTY_50_RETURN_1Y = 12.5
export const NIFTY_50_RETURN_3Y = 14.2
export const NIFTY_50_RETURN_5Y = 15.8
