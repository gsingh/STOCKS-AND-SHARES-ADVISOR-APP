import type { FundamentalData } from '../../services/fundamentals-service'

export interface GateDefinition {
  id: string
  label: string
  description: string
  evaluate: (data: Partial<FundamentalData>) => boolean
}

export interface GateResult {
  id: string
  label: string
  description: string
  passed: boolean
  actualValue: number | string
  format: 'currency' | 'percentage' | 'number' | 'cr'
}

export interface JhunjhunwalaResult {
  gatesPassed: number
  gatesTotal: number
  isJhunjhunwalaCompliant: boolean
  jhunjhunwalaScore: number
  gateResults: GateResult[]
}

export const JHUNJHUNWALA_THRESHOLD = 7
export const JHUNJHUNWALA_MODIFIED_THRESHOLD = 6

export interface JhunjhunwalaPageRow {
  symbol: string
  name: string
  sector: string
  marketCap?: number
  lastPrice?: number
  peRatio?: number
  roe?: number
  roce?: number
  revenueGrowth?: number
  epsGrowth?: number
  debtToEquity?: number
  score?: number
  gatesPassed: number
  gatesTotal: number
  isJhunjhunwalaCompliant: boolean
  jhunjhunwalaScore: number
  gateResults: GateResult[]
}
