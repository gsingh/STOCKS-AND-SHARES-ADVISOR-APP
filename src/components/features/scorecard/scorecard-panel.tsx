import { ScoreGauge, TermInfo } from '../../shared'
import { PARAMETER_META } from '../../../features/scorecard/parameters'
import { formatNumber, formatPercent, formatCurrency } from '../../../lib/format'
import type { ScoringResult } from '../../../features/scorecard/types'

interface ScorecardPanelProps {
  result: ScoringResult
}

function formatParamValue(key: string, value: number | null): string {
  if (value === null) return '—'
  const meta = PARAMETER_META[key]
  if (!meta) return formatNumber(value)
  switch (meta.unit) {
    case '%':
      return formatPercent(value)
    case 'INR Cr':
      return formatCurrency(value)
    case 'INR':
      return formatCurrency(value)
    default:
      return formatNumber(value)
  }
}

function getTierColors(tier: string): string {
  switch (tier) {
    case 'strong':
      return 'bg-[var(--score-green-bg)] text-[var(--score-green)]'
    case 'average':
      return 'bg-[var(--score-amber-bg)] text-[var(--score-amber)]'
    case 'below_average':
      return 'bg-[var(--score-orange-bg)] text-[var(--score-orange)]'
    case 'weak':
      return 'bg-[var(--score-red-bg)] text-[var(--score-red)]'
    default:
      return 'bg-[var(--muted)] text-[var(--muted-foreground)]'
  }
}

export function ScorecardPanel({ result }: ScorecardPanelProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Scorecard</h2>
        <ScoreGauge score={result.compositeScore} />
      </div>

      <div className="space-y-6">
        {result.categoryScores.map((cat) => {
          return (
            <div key={cat.key}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  {cat.name}
                </h3>
                <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
                  {formatNumber(cat.score)} / 20 (weight: {Math.round(cat.weight * 100)}%)
                </span>
              </div>

              <div className="space-y-2">
                {cat.parameters.map((param) => {
                  const meta = PARAMETER_META[param.key]
                  return (
                    <div key={param.key} className="rounded-md bg-[var(--muted)] p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-[var(--foreground)]">
                            {meta?.name ?? param.name}
                          </span>
                          {meta && (
                            <TermInfo
                              term={meta.name}
                              definition={meta.description}
                              example={
                                meta.unit === '%'
                                  ? `A value of 15% would score ${Math.round(meta.scorer(15))}/20`
                                  : undefined
                              }
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
                            {formatParamValue(param.key, param.value)}
                          </span>
                          <span className="text-sm font-semibold tabular-nums text-[var(--foreground)]">
                            {formatNumber(param.score)}/20
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${getTierColors(param.tier)}`}
                          >
                            {param.tierLabel}
                          </span>
                        </div>
                      </div>
                      <div
                        className="h-1.5 rounded-full bg-[var(--border)]"
                        role="progressbar"
                        aria-valuenow={Math.round((param.score / 20) * 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${meta?.name ?? param.name} contribution`}
                      >
                        <div
                          className="h-full rounded-full bg-[var(--accent)] transition-all"
                          style={{ width: `${(param.score / 20) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-1 text-right text-xs text-[var(--muted-foreground)]">
                Contribution: {formatNumber(cat.contribution)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
