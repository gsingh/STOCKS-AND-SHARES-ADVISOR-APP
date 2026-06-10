import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import type { InterplayWarning } from '../../../features/scorecard/interplay'

interface ParameterInterplayProps {
  warnings: InterplayWarning[]
}

const severityConfig = {
  alert: {
    icon: AlertTriangle,
    bgClass: 'bg-[var(--score-red-bg)]',
    textClass: 'text-[var(--score-red)]',
    iconClass: 'text-[var(--score-red)]',
  },
  caution: {
    icon: AlertCircle,
    bgClass: 'bg-[var(--score-amber-bg)]',
    textClass: 'text-[var(--score-amber)]',
    iconClass: 'text-[var(--score-amber)]',
  },
  info: {
    icon: Info,
    bgClass: 'bg-[var(--muted)]',
    textClass: 'text-[var(--muted-foreground)]',
    iconClass: 'text-[var(--muted-foreground)]',
  },
}

export function ParameterInterplay({ warnings }: ParameterInterplayProps) {
  if (warnings.length === 0) return null

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
        Parameter Interplay
      </h2>
      <div className="space-y-3">
        {warnings.map((warning, idx) => {
          const cfg = severityConfig[warning.severity]
          const Icon = cfg.icon
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 rounded-md p-4 ${cfg.bgClass}`}
              role="alert"
            >
              <Icon size={20} className={`mt-0.5 shrink-0 ${cfg.iconClass}`} aria-hidden="true" />
              <div>
                <h3 className={`text-sm font-semibold ${cfg.textClass}`}>{warning.title}</h3>
                <p className="mt-1 text-sm text-[var(--foreground)]">{warning.explanation}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
