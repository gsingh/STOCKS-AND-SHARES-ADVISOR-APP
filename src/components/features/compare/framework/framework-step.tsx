import type { FrameworkStepData } from '../../../../features/compare/framework-types'

interface FrameworkStepProps {
  step: FrameworkStepData
  onFieldChange: (stepId: number, fieldKey: string, value: string | number | boolean) => void
  onToggleComplete: (stepId: number) => void
}

export function FrameworkStep({ step, onFieldChange, onToggleComplete }: FrameworkStepProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            Step {step.id}: {step.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
            {step.guidance}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <input
            type="checkbox"
            checked={step.completed}
            onChange={() => onToggleComplete(step.id)}
            className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)]"
          />
          Complete
        </label>
      </div>

      <div className="space-y-4">
        {step.fields.map((field) => (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              {field.label}
              {field.autoPopulated && (
                <span className="ml-2 text-xs italic text-[var(--muted-foreground)]">
                  (from scorecard)
                </span>
              )}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={(field.value as string) ?? ''}
                onChange={(e) => onFieldChange(step.id, field.key, e.target.value)}
                className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                rows={3}
              />
            ) : field.type === 'boolean' ? (
              <input
                type="checkbox"
                checked={(field.value as boolean) ?? false}
                onChange={(e) => onFieldChange(step.id, field.key, e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)]"
              />
            ) : (
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                value={(field.value as string | number) ?? ''}
                onChange={(e) =>
                  onFieldChange(
                    step.id,
                    field.key,
                    field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value,
                  )
                }
                className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
