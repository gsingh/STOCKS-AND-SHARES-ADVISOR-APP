export interface ScoringInput {
  peRatio?: number
  pbRatio?: number
  peg?: number
  dividendYield?: number
  roe?: number
  roce?: number
  operatingMargin?: number
  netProfitMargin?: number
  debtToEquity?: number
  freeCashFlow?: number
  bookValue?: number
  revenueGrowth?: number
  epsGrowth?: number
  promoterHolding?: number
  pledgedShares?: number
  governanceQuality?: number
  marketCap?: number
}

export interface ParameterScore {
  name: string
  key: string
  value: number | null
  score: number
  maxScore: number
  weight: number
  contribution: number
  tier: 'strong' | 'average' | 'below_average' | 'weak'
  tierLabel: string
}

export interface CategoryScore {
  name: string
  key: string
  score: number
  maxScore: number
  weight: number
  contribution: number
  parameters: ParameterScore[]
}

export interface ScoringResult {
  compositeScore: number
  compositeTier: 'strong' | 'average' | 'weak'
  compositeLabel: string
  categoryScores: CategoryScore[]
  parameterScores: ParameterScore[]
  totalMaxScore: number
  weightsUsed: Record<string, number>
}

export interface WeightConfig {
  categories: Record<string, number>
  parameters: Record<string, number>
}
