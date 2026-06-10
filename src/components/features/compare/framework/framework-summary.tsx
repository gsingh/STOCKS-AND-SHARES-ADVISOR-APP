import { ArrowLeft, CheckCircle, Clock, FileDown, Printer } from 'lucide-react'
import { formatDate } from '../../../../lib/format'
import { generateMarkdown } from '../../../../features/compare/framework-data'
import type { FrameworkState } from '../../../../features/compare/framework-types'

interface FrameworkSummaryProps {
  state: FrameworkState
  onJumpToStep: (stepId: number) => void
  onBack: () => void
}

function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function FrameworkSummary({ state, onJumpToStep, onBack }: FrameworkSummaryProps) {
  const completedCount = state.steps.filter((s) => s.completed).length
  const totalSteps = state.steps.length

  const handleExportMarkdown = () => {
    const md = generateMarkdown(state)
    downloadMarkdown(md, `framework-analysis-${formatDate(new Date()).replace(/\s+/g, '-')}.md`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft size={16} />
          Back to steps
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMarkdown}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <FileDown size={14} />
            Export as Markdown
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <CheckCircle size={18} className="text-[var(--score-green)]" />
          <span className="font-medium text-[var(--foreground)]">{completedCount}/{totalSteps} steps complete</span>
          {state.startedAt && (
            <span className="ml-auto flex items-center gap-1">
              <Clock size={14} />
              Started {formatDate(state.startedAt)}
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {state.steps.map((step) => {
            const filledCount = step.fields.filter((f) => f.value !== null && f.value !== '').length
            const totalFields = step.fields.length
            return (
              <button
                key={step.id}
                onClick={() => onJumpToStep(step.id)}
                className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:border-[var(--primary)]/50 ${
                  step.completed
                    ? 'border-[var(--score-green)]/30 bg-[var(--score-green-bg)]'
                    : 'border-[var(--border)] bg-[var(--background)]'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.completed
                      ? 'bg-[var(--score-green)] text-white'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                  }`}
                >
                  {step.id}
                </span>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">{step.title}</h4>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {filledCount}/{totalFields} fields filled
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-4 print:block">
        <h2 className="text-lg font-bold text-[var(--foreground)]">Full Report</h2>
        {state.steps.map((step) => (
          <div key={step.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="mb-2 text-base font-semibold text-[var(--foreground)]">
              Step {step.id}: {step.title}
            </h3>
            {!step.completed && (
              <p className="mb-2 text-xs italic text-[var(--muted-foreground)]">Incomplete</p>
            )}
            <div className="space-y-1.5">
              {step.fields
                .filter((f) => f.value !== null && f.value !== '')
                .map((field) => (
                  <div key={field.key} className="text-sm">
                    <span className="font-medium text-[var(--muted-foreground)]">{field.label}: </span>
                    <span className="text-[var(--foreground)]">
                      {field.autoPopulated && (
                        <span className="text-xs italic text-[var(--muted-foreground)]">(from scorecard) </span>
                      )}
                      {String(field.value)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          .print\\:block { display: block !important; }
          nav, header, .no-print { display: none !important; }
          body { font-size: 12pt; }
        }
      `}</style>
    </div>
  )
}
