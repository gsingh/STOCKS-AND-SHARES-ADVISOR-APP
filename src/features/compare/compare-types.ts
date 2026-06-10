import type { ScoringInput, ScoringResult } from '../scorecard/types'
import type { InterplayWarning } from '../scorecard/interplay'

export interface CompareStockEntry {
  symbol: string
  name: string
  sector?: string
  marketCap?: number
  scoringInput: ScoringInput | null
  score: ScoringResult | null
  interplayWarnings: InterplayWarning[]
  isLoading: boolean
  error?: string
}

export interface ParameterRow {
  key: string
  label: string
  category: string
  unit?: string
  scores: (number | null)[]
  explanations: (string | null)[]
  rawValues: (number | null)[]
  bestIndex: number | null
}

export interface CategoryGroup {
  name: string
  key: string
  rows: ParameterRow[]
}
