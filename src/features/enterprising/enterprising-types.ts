import type { FundamentalData } from '../../services/screener-service'

export interface EnterprisingGateDefinition {
  id: string
  label: string
  description: string
  evaluate: (data: Partial<FundamentalData>) => boolean
}

export interface EnterprisingGateResult {
  id: string
  label: string
  description: string
  passed: boolean
  actualValue: number | string
  format: 'currency' | 'percentage' | 'number' | 'cr' | 'boolean' | 'years'
}

export interface EnterprisingResult {
  symbol: string
  name: string
  gatesPassed: number
  gatesTotal: number
  isEnterprisingCompliant: boolean
  enterprisingScore: number
  gateResults: EnterprisingGateResult[]
}

export const ENTERPRISING_THRESHOLD = 5

export interface EnterprisingPageRow {
  symbol: string
  name: string
  sector: string
  marketCap?: number
  lastPrice?: number
  peRatio?: number
  pbRatio?: number
  gatesPassed: number
  gatesTotal: number
  isEnterprisingCompliant: boolean
  enterprisingScore: number
  gateResults: EnterprisingGateResult[]
}
