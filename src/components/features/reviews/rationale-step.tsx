import { FileText } from 'lucide-react'

interface RationaleStepProps {
  notes: string
  onNotesChange: (notes: string) => void
  nextReviewDate: string
  onNextReviewDateChange: (date: string) => void
}

export function RationaleStep({
  notes,
  onNotesChange,
  nextReviewDate,
  onNextReviewDateChange,
}: RationaleStepProps) {
  const defaultNextDate = (() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 3)
    return d.toISOString().split('T')[0]
  })()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText size={20} className="text-[var(--primary)]" />
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Review Rationale</h3>
      </div>

      <p className="text-sm text-[var(--muted-foreground)]">
        Add notes and set the next review date to complete your portfolio review.
      </p>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="review-notes"
            className="block text-sm font-medium text-[var(--foreground)]"
          >
            Notes & Rationale
          </label>
          <textarea
            id="review-notes"
            rows={5}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Summarize your findings, decisions, and any actions to take..."
            className="mt-1.5 w-full rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          />
        </div>

        <div>
          <label
            htmlFor="next-review-date"
            className="block text-sm font-medium text-[var(--foreground)]"
          >
            Next Review Date
          </label>
          <input
            id="next-review-date"
            type="date"
            value={nextReviewDate || defaultNextDate}
            onChange={(e) => onNextReviewDateChange(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Recommended: review every 3 months.
          </p>
        </div>
      </div>
    </div>
  )
}
