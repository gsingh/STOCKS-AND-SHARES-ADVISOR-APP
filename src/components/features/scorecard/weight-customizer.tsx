import { useState, useEffect, useCallback } from 'react'
import { RotateCcw } from 'lucide-react'
import { CATEGORIES, PARAMETER_META } from '../../../features/scorecard/parameters'
import { getDefaultWeights, normalizeWeights } from '../../../features/scorecard/scoring-engine'
import { db, withErrorHandling } from '../../../services/db'
import type { WeightConfig } from '../../../features/scorecard/types'

interface WeightCustomizerProps {
  weights: WeightConfig
  onWeightsChange: (weights: WeightConfig) => void
}

const WEIGHT_PREF_KEY = 'scorecard-weights'

export function WeightCustomizer({ weights, onWeightsChange }: WeightCustomizerProps) {
  const [localCatWeights, setLocalCatWeights] = useState<Record<string, number>>(
    weights.categories,
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLocalCatWeights(weights.categories)
  }, [weights.categories])

  const persist = useCallback(
    async (w: WeightConfig) => {
      setSaving(true)
      await withErrorHandling(
        () =>
          db.userPreference.put({
            key: WEIGHT_PREF_KEY,
            value: w,
            updatedAt: new Date().toISOString(),
          }),
        undefined,
      )
      setSaving(false)
    },
    [],
  )

  const handleCatWeightChange = useCallback(
    (catId: string, newWeight: number) => {
      const updated = { ...localCatWeights, [catId]: newWeight }
      const normalized = normalizeWeights(updated as Record<string, number>)
      setLocalCatWeights(normalized as Record<string, number>)
      const newWeights: WeightConfig = {
        categories: normalized as Record<string, number>,
        parameters: weights.parameters,
      }
      onWeightsChange(newWeights)
      persist(newWeights)
    },
    [localCatWeights, weights.parameters, onWeightsChange, persist],
  )

  const handleReset = useCallback(async () => {
    const defaults = getDefaultWeights()
    setLocalCatWeights(defaults.categories)
    onWeightsChange(defaults)
    await persist(defaults)
  }, [onWeightsChange, persist])

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Weight Customization</h2>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <RotateCcw size={14} />
          Reset to Defaults
        </button>
      </div>

      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          return (
            <div key={cat.id}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--foreground)]">{cat.name}</span>
                <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
                  {(localCatWeights[cat.id] ?? cat.weight * 100) < 0.01
                    ? '0'
                    : (localCatWeights[cat.id] ?? cat.weight) * 100 < 0.1
                      ? '<0.1'
                      : `${((localCatWeights[cat.id] ?? cat.weight) * 100).toFixed(1)}`}
                  %
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round((localCatWeights[cat.id] ?? cat.weight) * 100)}
                  onChange={(e) =>
                    handleCatWeightChange(cat.id, Number(e.target.value) / 100)
                  }
                  className="flex-1"
                  aria-label={`${cat.name} weight`}
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round((localCatWeights[cat.id] ?? cat.weight) * 100)}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    if (!isNaN(val)) {
                      handleCatWeightChange(cat.id, val / 100)
                    }
                  }}
                  className="w-16 rounded-md border border-[var(--input)] bg-[var(--background)] px-2 py-1 text-right text-sm tabular-nums text-[var(--foreground)]"
                  aria-label={`${cat.name} weight percentage`}
                />
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {cat.parameterKeys.map((pk) => {
                  const meta = PARAMETER_META[pk]
                  return (
                    <span
                      key={pk}
                      className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]"
                    >
                      {meta?.name ?? pk}
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {saving && (
        <p className="mt-3 text-xs text-[var(--muted-foreground)]" aria-live="polite">
          Saving...
        </p>
      )}
    </div>
  )
}
