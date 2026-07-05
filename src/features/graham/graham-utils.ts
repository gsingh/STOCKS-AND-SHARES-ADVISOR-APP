import type { FundamentalData } from '../../services/screener-service'
import { computeFinancialCAGR } from '../calculators/cagr'

export function safeNum(v: number | undefined | null): number | null {
  if (v === undefined || v === null || !Number.isFinite(v)) return null
  return v
}

export function calcPe3yAvg(data: Partial<FundamentalData>): number | null {
  const price = safeNum(data.currentPrice)
  const eps3y = safeNum(data.eps3yAvg)
  if (!price || !eps3y || eps3y <= 0) return null
  return Math.round((price / eps3y) * 100) / 100
}

export function calcPeTimesPb(data: Partial<FundamentalData>): number | null {
  const pe = safeNum(data.pe3yAvg ?? data.peRatio)
  const pb = safeNum(data.pbRatio)
  if (!pe || !pb) return null
  return Math.round(pe * pb * 100) / 100
}

export function calcEarningsGrowth10Y(data: Partial<FundamentalData>): number | null {
  return safeNum(data.netIncomeCagr10Y)
}

export function checkEarningsStability(data: Partial<FundamentalData>): boolean {
  return data.earningsStable === true
}

export function getGateValue(data: Partial<FundamentalData>, gateId: string): number | string | null {
  switch (gateId) {
    case 'adequateSize': return safeNum(data.marketCap)
    case 'financialStrength': return safeNum(data.currentRatio)
    case 'earningsStability': return data.earningsStable ?? false
    case 'dividendRecord': return safeNum(data.dividendYears)
    case 'earningsGrowth': return safeNum(data.netIncomeCagr10Y)
    case 'moderatePe': return safeNum(data.pe3yAvg ?? data.peRatio)
    case 'moderatePb': return safeNum(data.pbRatio)
    default: return null
  }
}
