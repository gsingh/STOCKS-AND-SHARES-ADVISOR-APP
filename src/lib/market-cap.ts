export type CapTier = 'large' | 'mid' | 'small'

export const CAP_THRESHOLDS = {
  large: 915000000000,
  mid:   307000000000,
} as const

export function getMarketCapTier(marketCap?: number): CapTier | undefined {
  if (marketCap === undefined) return undefined
  if (marketCap >= CAP_THRESHOLDS.large) return 'large'
  if (marketCap >= CAP_THRESHOLDS.mid) return 'mid'
  return 'small'
}

export function getMarketCapLabel(marketCap?: number): string {
  const tier = getMarketCapTier(marketCap)
  if (tier === 'large') return 'Large Cap'
  if (tier === 'mid') return 'Mid Cap'
  if (tier === 'small') return 'Small Cap'
  return '—'
}
