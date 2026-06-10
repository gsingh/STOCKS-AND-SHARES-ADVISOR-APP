import type { CompareStockEntry } from './compare-types'

export interface PreCheckResult {
  label: string
  pass: boolean
  message: string
}

export function runPreChecks(entries: CompareStockEntry[]): PreCheckResult[] {
  const checks: PreCheckResult[] = []

  const sectors = [...new Set(entries.map((e) => e.sector).filter(Boolean))]
  const differentSector = sectors.length > 1
  checks.push({
    label: 'Same Sector',
    pass: !differentSector,
    message: differentSector
      ? `Stocks span multiple sectors: ${sectors.join(', ')}. Comparing across sectors may be misleading.`
      : `All stocks are in "${sectors[0] ?? 'Unknown'}" sector`,
  })

  const marketCaps = entries
    .map((e) => e.marketCap ?? e.scoringInput?.marketCap)
    .filter((m): m is number => m != null && m > 0)

  if (marketCaps.length >= 2) {
    const tiers = marketCaps.map((mc) => {
      if (mc > 50000) return 'Large Cap'
      if (mc > 5000) return 'Mid Cap'
      return 'Small Cap'
    })
    const uniqueTiers = [...new Set(tiers)]
    const differentTier = uniqueTiers.length > 1
    checks.push({
      label: 'Same Market Cap Tier',
      pass: !differentTier,
      message: differentTier
        ? `Stocks span different market cap tiers: ${uniqueTiers.join(', ')}. Size affects risk and return characteristics.`
        : `All stocks are "${uniqueTiers[0]}"`,
    })
  }

  const missingData = entries.filter((e) => !e.scoringInput)
  const allHaveData = missingData.length === 0
  checks.push({
    label: 'Sufficient Data',
    pass: allHaveData,
    message: allHaveData
      ? 'All stocks have fundamental data available for scoring'
      : `${missingData.map((m) => m.symbol).join(', ')} ${missingData.length > 1 ? 'have' : 'has'} insufficient data for meaningful comparison`,
  })

  const hasScores = entries.filter((e) => e.score)
  checks.push({
    label: 'Scorecard Available',
    pass: hasScores.length >= 2,
    message: hasScores.length >= 2
      ? `${hasScores.length} of ${entries.length} stocks have scorecard data`
      : `At least 2 scorable stocks are required for comparison (${hasScores.length} available)`,
  })

  return checks
}
