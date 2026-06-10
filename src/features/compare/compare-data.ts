import { CATEGORIES, PARAMETER_META } from '../scorecard/parameters'
import type { CompareStockEntry, ParameterRow, CategoryGroup } from './compare-types'

const LOWER_IS_BETTER = new Set([
  'peRatio',
  'pbRatio',
  'peg',
  'debtToEquity',
  'pledgedShares',
])

export function buildScoredGroups(
  entries: CompareStockEntry[],
): CategoryGroup[] {
  return CATEGORIES.map((cat) => {
    const rows: ParameterRow[] = cat.parameterKeys.map((key) => {
      const meta = PARAMETER_META[key]
      const label = meta?.name ?? key

      const scores = entries.map((e) => {
        const factor = e.score?.parameterScores.find((p) => p.key === key)
        return factor?.score ?? null
      })

      const explanations = entries.map((e) => {
        const factor = e.score?.parameterScores.find((p) => p.key === key)
        if (!factor || factor.value === null || factor.value === undefined) {
          return e.scoringInput ? 'Data insufficient' : 'No data'
        }
        const valueText = meta?.unit === '%'
          ? `${factor.value.toFixed(1)}%`
          : meta?.unit
            ? `${factor.value.toFixed(1)} ${meta.unit}`
            : `${factor.value.toFixed(2)}`
        return `${valueText}`
      })

      const rawValues = entries.map((e) => {
        if (!e.scoringInput) return null
        const val = (e.scoringInput as Record<string, number | undefined>)[key]
        return val ?? null
      })

      const numericScores = scores.filter((s): s is number => s !== null)
      let bestIndex: number | null = null

      if (numericScores.length > 1) {
        const uniqueScores = [...new Set(numericScores.map((s) => Number(s.toFixed(2))))]
        if (uniqueScores.length > 1) {
          if (LOWER_IS_BETTER.has(key)) {
            const minScore = Math.min(...numericScores)
            bestIndex = scores.findIndex(
              (s) => s !== null && Number(s.toFixed(2)) === Number(minScore.toFixed(2)),
            )
          } else {
            const maxScore = Math.max(...numericScores)
            bestIndex = scores.findIndex(
              (s) => s !== null && Number(s.toFixed(2)) === Number(maxScore.toFixed(2)),
            )
          }
        }
      }

      return {
        key,
        label,
        category: cat.id,
        unit: meta?.unit,
        scores,
        explanations,
        rawValues,
        bestIndex: bestIndex !== null && bestIndex >= 0 ? bestIndex : null,
      }
    })

    return { name: cat.name, key: cat.id, rows }
  })
}

export function buildRawGroups(
  entries: CompareStockEntry[],
): CategoryGroup[] {
  return buildScoredGroups(entries)
}

export function scoreColor(score: number): string {
  if (score >= 15) return 'text-[var(--score-green)] font-bold'
  if (score >= 10) return 'text-[var(--score-amber)]'
  if (score >= 5) return 'text-[var(--score-orange)]'
  return 'text-[var(--score-red)]'
}

export function scoreBg(score: number): string {
  if (score >= 15) return 'bg-[var(--score-green-bg)]'
  if (score >= 10) return 'bg-[var(--score-amber-bg)]'
  if (score >= 5) return 'bg-[var(--score-orange-bg)]'
  return 'bg-[var(--score-red-bg)]'
}
