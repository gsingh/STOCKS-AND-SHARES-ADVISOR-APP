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

export interface BuffettResult {
  symbol: string
  name: string
  gatesPassed: number
  gatesTotal: number
  isBuffettCompliant: boolean
  buffettScore: number
  gateResults: GateResult[]
}

export const BUFFETT_THRESHOLD = 7
export const MODIFIED_BUFFETT_THRESHOLD = 6

export interface BuffettPageRow {
  symbol: string
  name: string
  sector: string
  marketCap?: number
  lastPrice?: number
  peRatio?: number
  roe?: number
  score?: number
  gatesPassed: number
  gatesTotal: number
  isBuffettCompliant: boolean
  buffettScore: number
  gateResults: GateResult[]
}
