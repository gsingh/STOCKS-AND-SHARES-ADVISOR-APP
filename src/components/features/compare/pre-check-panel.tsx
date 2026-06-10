import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { runPreChecks } from '../../../features/compare/pre-check'
import type { CompareStockEntry } from '../../../features/compare/compare-types'

interface PreCheckPanelProps {
  entries: CompareStockEntry[]
}

export function PreCheckPanel({ entries }: PreCheckPanelProps) {
  if (entries.length < 2) return null

  const checks = runPreChecks(entries)
  const allPass = checks.every((c) => c.pass)
  const failed = checks.filter((c) => !c.pass)

  if (allPass) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {checks.length} pre-checks passed — comparing similar stocks
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
          {failed.length} pre-check{failed.length > 1 ? 's' : ''} failed
        </span>
      </div>
      <div className="space-y-1.5">
        {checks.map((check) => (
          <div key={check.label} className="flex items-start gap-2">
            {check.pass ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
            ) : (
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            )}
            <div className="text-xs">
              <span className="font-medium text-[var(--foreground)]">{check.label}</span>
              <p className="text-[var(--muted-foreground)]">{check.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
