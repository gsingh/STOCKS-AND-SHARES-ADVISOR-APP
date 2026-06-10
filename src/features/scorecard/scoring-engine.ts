import { CATEGORIES, PARAMETER_META } from './parameters'
import type {
  ScoringInput,
  WeightConfig,
  ScoringResult,
  CategoryScore,
  ParameterScore,
} from './types'

export function getDefaultWeights(): WeightConfig {
  return {
    categories: Object.fromEntries(CATEGORIES.map((c) => [c.id, c.weight])),
    parameters: {},
  }
}

export function normalizeWeights(
  weights: Record<string, number>,
): Record<string, number> {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0)
  if (total === 0) {
    const keys = Object.keys(weights)
    const equal = 1 / keys.length
    return Object.fromEntries(keys.map((k) => [k, Number.isFinite(equal) ? equal : 0]))
  }
  return Object.fromEntries(
    Object.entries(weights).map(([k, v]) => [k, v / total]),
  )
}

export function getTier(
  score: number,
  maxScore: number,
): { tier: string; label: string } {
  if (maxScore <= 20) {
    if (score >= 15) return { tier: 'strong', label: 'Strong' }
    if (score >= 10) return { tier: 'average', label: 'Average' }
    if (score >= 5) return { tier: 'below_average', label: 'Below Average' }
    return { tier: 'weak', label: 'Weak' }
  }
  if (score >= 70) return { tier: 'strong', label: 'Strong' }
  if (score >= 50) return { tier: 'average', label: 'Average' }
  return { tier: 'weak', label: 'Weak' }
}

function getInputValue(
  input: ScoringInput,
  key: string,
): number | null {
  const value = (input as Record<string, unknown>)[key]
  if (value === null || value === undefined) return null
  if (typeof value !== 'number') return null
  if (!Number.isFinite(value)) return null
  return value
}

export function calculateScore(
  input: ScoringInput,
  weights?: Partial<WeightConfig>,
): ScoringResult {
  const defaultWeights = getDefaultWeights()
  const rawCategoryWeights = {
    ...defaultWeights.categories,
    ...(weights?.categories ?? {}),
  }
  const categoryWeights = normalizeWeights(rawCategoryWeights)

  const allParameterScores: ParameterScore[] = []
  const categoryScores: CategoryScore[] = []

  for (const cat of CATEGORIES) {
    const catWeight = categoryWeights[cat.id] ?? cat.weight
    const paramKeys = cat.parameterKeys

    const scored: {
      key: string
      name: string
      score: number | null
      rawValue: number | null
    }[] = paramKeys.map((key) => {
      const meta = PARAMETER_META[key]
      const rawValue = getInputValue(input, key)
      let score: number | null = null
      if (rawValue !== null) {
        score = meta.scorer(rawValue)
      }
      return { key, name: meta.name, score, rawValue }
    })

    const present = scored.filter((s) => s.score !== null)
    const presentCount = present.length
    const allMissing = presentCount === 0

    const paramWeight = allMissing ? 0 : 1 / presentCount

    const paramScores: ParameterScore[] = scored.map((s) => {
      const finalScore = s.score ?? 0
      const weight = s.score !== null ? paramWeight : 0
      const contribution = finalScore * weight
      const tierInfo = getTier(finalScore, 20)
      return {
        name: s.name,
        key: s.key,
        value: s.rawValue,
        score: Math.round(finalScore * 100) / 100,
        maxScore: 20,
        weight: Math.round(weight * 1000) / 1000,
        contribution: Math.round(contribution * 100) / 100,
        tier: tierInfo.tier as ParameterScore['tier'],
        tierLabel: tierInfo.label,
      }
    })

    const categoryScore = paramScores.reduce(
      (sum, p) => sum + p.contribution,
      0,
    )

    const catScoreObj: CategoryScore = {
      name: cat.name,
      key: cat.id,
      score: Math.round(categoryScore * 100) / 100,
      maxScore: 20,
      weight: Math.round(catWeight * 1000) / 1000,
      contribution: 0,
      parameters: paramScores,
    }

    categoryScores.push(catScoreObj)
    allParameterScores.push(...paramScores)
  }

  for (const cs of categoryScores) {
    cs.contribution = Math.round(cs.score * cs.weight * 5 * 100) / 100
  }

  const compositeScore = categoryScores.reduce(
    (sum, cs) => sum + cs.contribution,
    0,
  )

  const compositeTierInfo = getTier(compositeScore, 100)

  const weightsUsed: Record<string, number> = {}
  for (const cat of CATEGORIES) {
    weightsUsed[`category.${cat.id}`] =
      categoryWeights[cat.id] ?? cat.weight
  }
  for (const ps of allParameterScores) {
    weightsUsed[ps.key] = ps.weight
  }

  return {
    compositeScore: Math.round(compositeScore * 100) / 100,
    compositeTier: compositeTierInfo.tier as ScoringResult['compositeTier'],
    compositeLabel: compositeTierInfo.label,
    categoryScores,
    parameterScores: allParameterScores,
    totalMaxScore: 100,
    weightsUsed,
  }
}
