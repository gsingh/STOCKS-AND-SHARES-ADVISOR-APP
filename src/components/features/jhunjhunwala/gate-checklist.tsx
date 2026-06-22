import { Check, X } from 'lucide-react'
import type { GateResult } from '../../../features/jhunjhunwala'

interface GateChecklistProps {
  gateResults: GateResult[]
}

export function GateChecklist({ gateResults }: GateChecklistProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">
        Jhunjhunwala Criteria: {gateResults.filter((g) => g.passed).length}/{gateResults.length}
      </h3>
      <div className="space-y-1.5">
        {gateResults.map((g) => (
          <div
            key={g.id}
            className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs ${
              g.passed
                ? 'border-[var(--score-green)]/30 bg-[var(--score-green-bg)]'
                : 'border-[var(--border)]'
            }`}
          >
            {g.passed ? (
              <Check size={14} className="shrink-0 text-[var(--score-green)]" />
            ) : (
              <X size={14} className="shrink-0 text-[var(--muted-foreground)]" />
            )}
            <span className={g.passed ? 'text-[var(--score-green)]' : 'text-[var(--muted-foreground)]'}>
              {g.label}
            </span>
            <span className="ml-auto text-[var(--muted-foreground)] tabular-nums">
              {g.actualValue}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
