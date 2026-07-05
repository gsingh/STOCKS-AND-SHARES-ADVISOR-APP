import type { FundamentalData } from '../../services/screener-service'

export interface GrahamGateDefinition {
  id: string
  label: string
  description: string
  evaluate: (data: Partial<FundamentalData>) => boolean
}

export interface GrahamGateResult {
  id: string
  label: string
  description: string
  passed: boolean
  actualValue: number | string
  format: 'currency' | 'percentage' | 'number' | 'cr' | 'boolean' | 'years'
}

export interface GrahamResult {
  symbol: string
  name: string
  gatesPassed: number
  gatesTotal: number
  isGrahamCompliant: boolean
  grahamScore: number
  gateResults: GrahamGateResult[]
}

export const GRAHAM_THRESHOLD = 6
export const MODIFIED_GRAHAM_THRESHOLD = 5

export interface GrahamPageRow {
  symbol: string
  name: string
  sector: string
  marketCap?: number
  lastPrice?: number
  peRatio?: number
  pbRatio?: number
  gatesPassed: number
  gatesTotal: number
  isGrahamCompliant: boolean
  grahamScore: number
  gateResults: GrahamGateResult[]
}
