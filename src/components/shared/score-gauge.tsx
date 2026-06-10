interface ScoreGaugeProps {
  score: number
}

function getScoreTier(score: number): { colorClass: string; label: string } {
  if (score >= 70) return { colorClass: 'text-score-green', label: 'Strong' }
  if (score >= 50) return { colorClass: 'text-score-amber', label: 'Average' }
  return { colorClass: 'text-score-red', label: 'Weak' }
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score))
  const { colorClass, label } = getScoreTier(clamped)

  return (
    <div className="flex items-center gap-3" role="meter" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label={`Score: ${clamped}, ${label}`}>
      <span className={`text-2xl font-bold tabular-nums ${colorClass}`}>
        {clamped}
      </span>
      <span className={`text-xs font-semibold uppercase tracking-wide ${colorClass}`}>
        {label}
      </span>
    </div>
  )
}
