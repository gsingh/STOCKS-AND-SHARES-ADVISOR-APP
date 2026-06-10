import { AlertTriangle, Info, AlertCircle } from 'lucide-react'
import type { InterplayWarning } from '../../../features/scorecard/interplay'

const severityConfig = {
  info: { icon: Info, className: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400' },
  caution: { icon: AlertTriangle, className: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400' },
  alert: { icon: AlertCircle, className: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400' },
}

export function InterplayWarningItem({ warning, fundName }: { warning: InterplayWarning; fundName?: string }) {
  const cfg = severityConfig[warning.severity]
  const Icon = cfg.icon
  return (
    <div className={`flex items-start gap-2 rounded-md border p-2 text-xs ${cfg.className}`}>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div>
        {fundName && <span className="font-medium">{fundName}: </span>}
        <span className="font-medium">{warning.title}</span>
        <p className="mt-0.5">{warning.explanation}</p>
      </div>
    </div>
  )
}

interface InterplayPanelProps {
  allWarnings: { fundName: string; warnings: InterplayWarning[] }[]
}

export function InterplayPanel({ allWarnings }: InterplayPanelProps) {
  const total = allWarnings.reduce((s, fw) => s + fw.warnings.length, 0)
  if (total === 0) return null

  const visible = allWarnings.flatMap((fw) =>
    fw.warnings.map((w) => ({ ...w, fundName: fw.fundName })),
  )

  return (
    <div className="space-y-2">
      {visible.map((w) => {
        const cfg = severityConfig[w.severity]
        const Icon = cfg.icon
        return (
          <div
            key={`${w.fundName}-${w.title}`}
            className={`flex items-start gap-2 rounded-md border p-2 text-xs ${cfg.className}`}
          >
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <span className="font-medium">{w.fundName}: </span>
              <span className="font-medium">{w.title}</span>
              <p className="mt-0.5">{w.explanation}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
