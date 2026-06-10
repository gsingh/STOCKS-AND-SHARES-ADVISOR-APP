import type { ScoringInput } from './types'

export interface InterplayWarning {
  severity: 'info' | 'caution' | 'alert'
  title: string
  explanation: string
}

export interface SectorOverlapInfo {
  sector: string
  currentWeight: number
  cap: number
}

export function getInterplayWarnings(input: ScoringInput): InterplayWarning[] {
  const warnings: InterplayWarning[] = []

  if (input.peRatio != null && input.epsGrowth != null) {
    if (input.peRatio > 25 && input.epsGrowth < 5) {
      warnings.push({
        severity: 'alert',
        title: 'Overvalued risk',
        explanation: `P/E of ${input.peRatio} is high relative to EPS growth of ${input.epsGrowth}%. The stock may be overvalued with insufficient growth to justify its valuation.`,
      })
    }
  }

  if (input.pledgedShares != null && input.promoterHolding != null) {
    if (input.pledgedShares > 25 && input.promoterHolding < 50) {
      warnings.push({
        severity: 'alert',
        title: 'Distress signal',
        explanation: `High pledged shares (${input.pledgedShares}%) combined with lower promoter holding (${input.promoterHolding}%) indicates potential distress.`,
      })
    }
  }

  if (input.roe != null && input.debtToEquity != null) {
    if (input.roe > 15 && input.debtToEquity > 2) {
      warnings.push({
        severity: 'caution',
        title: 'Leverage-driven ROE',
        explanation: `ROE of ${input.roe}% looks strong but is driven by high leverage (D/E: ${input.debtToEquity}). Returns may not be sustainable.`,
      })
    }
  }

  if (input.peRatio != null && input.operatingMargin != null) {
    if (input.peRatio > 25 && input.operatingMargin < 10) {
      warnings.push({
        severity: 'caution',
        title: 'Overpriced without profitability',
        explanation: `High P/E (${input.peRatio}) with low operating margin (${input.operatingMargin}%) suggests the stock is priced for profitability it has not yet demonstrated.`,
      })
    }
  }

  return warnings
}

export function getSectorConcentrationWarnings(
  stockSector: string,
  portfolioSectors: SectorOverlapInfo[],
): InterplayWarning[] {
  const warnings: InterplayWarning[] = []
  const match = portfolioSectors.find((s) => s.sector === stockSector)
  if (match && match.currentWeight > match.cap) {
    warnings.push({
      severity: 'info',
      title: 'Concentration risk',
      explanation: `Adding this stock would increase ${stockSector} allocation (currently ${Math.round(match.currentWeight)}%), which exceeds your target cap of ${match.cap}%.`,
    })
  }
  return warnings
}
