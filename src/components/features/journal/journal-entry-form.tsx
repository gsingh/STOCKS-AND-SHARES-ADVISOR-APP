import { useState, useCallback } from 'react'
import { Save, X } from 'lucide-react'
import { db, type PortfolioRow } from '../../../services/db'
import { useLiveQuery } from '../../../hooks/use-live-query'

interface JournalEntryFormData {
  symbol?: string
  title: string
  body: string
  role?: string
  exitTriggers?: string
  nextReviewDate?: string
  tags: string[]
  goalId?: string
  reviewId?: string
}

interface JournalEntryFormProps {
  initial?: JournalEntryFormData & { id?: string }
  onSave: (data: JournalEntryFormData) => Promise<void>
  onCancel: () => void
}

export function JournalEntryForm({ initial, onSave, onCancel }: JournalEntryFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [symbol, setSymbol] = useState(initial?.symbol ?? '')
  const [role, setRole] = useState(initial?.role ?? '')
  const [exitTriggers, setExitTriggers] = useState(initial?.exitTriggers ?? '')
  const [nextReviewDate, setNextReviewDate] = useState(initial?.nextReviewDate ?? '')
  const [tagsInput, setTagsInput] = useState(initial?.tags.join(', ') ?? '')
  const [saving, setSaving] = useState(false)
  const [symbolSearch, setSymbolSearch] = useState('')
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false)

  const portfolio = useLiveQuery<PortfolioRow[]>(
    () => db.portfolio.toArray(),
    [],
  )

  const availableSymbols = Array.from(
    new Set((portfolio ?? []).map((h) => h.symbol)),
  ).sort()

  const filteredSymbols = symbolSearch
    ? availableSymbols.filter((s) =>
        s.toLowerCase().includes(symbolSearch.toLowerCase()),
      )
    : availableSymbols

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!title.trim() || !body.trim()) return
      setSaving(true)
      try {
        const tags = tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
        await onSave({
          symbol: symbol || undefined,
          title: title.trim(),
          body: body.trim(),
          role: role || undefined,
          exitTriggers: exitTriggers.trim() || undefined,
          nextReviewDate: nextReviewDate || undefined,
          tags,
          goalId: initial?.goalId,
          reviewId: initial?.reviewId,
        })
      } finally {
        setSaving(false)
      }
    },
    [title, body, symbol, role, exitTriggers, nextReviewDate, tagsInput, initial, onSave],
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          {initial ? 'Edit Entry' : 'New Journal Entry'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          <X size={18} />
        </button>
      </div>

      <div>
        <label htmlFor="entry-title" className="block text-sm font-medium text-[var(--foreground)]">
          Title *
        </label>
        <input
          id="entry-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g., Bought HDFC Bank on dip"
          className="mt-1.5 w-full rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
      </div>

      <div>
        <label htmlFor="entry-body" className="block text-sm font-medium text-[var(--foreground)]">
          Body *
        </label>
        <textarea
          id="entry-body"
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          placeholder="Describe your investment thesis, rationale, or reflection..."
          className="mt-1.5 w-full rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <label htmlFor="entry-symbol" className="block text-sm font-medium text-[var(--foreground)]">
            Stock (optional)
          </label>
          <input
            id="entry-symbol"
            type="text"
            value={symbolSearch || symbol}
            onChange={(e) => {
              setSymbolSearch(e.target.value)
              setSymbol(e.target.value.toUpperCase())
              setShowSymbolDropdown(true)
            }}
            onFocus={() => setShowSymbolDropdown(true)}
            onBlur={() => setTimeout(() => setShowSymbolDropdown(false), 200)}
            placeholder="Search or type symbol"
            className="mt-1.5 w-full rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          />
          {showSymbolDropdown && filteredSymbols.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-[var(--border)] bg-[var(--popover)] shadow-lg">
              {filteredSymbols.map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={() => {
                    setSymbol(s)
                    setSymbolSearch(s)
                    setShowSymbolDropdown(false)
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--muted)] ${
                    s === symbol ? 'bg-[var(--muted)] font-medium' : ''
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="entry-role" className="block text-sm font-medium text-[var(--foreground)]">
            Role (optional)
          </label>
          <select
            id="entry-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          >
            <option value="">Select role</option>
            <option value="core_hold">Core Holding</option>
            <option value="growth_play">Growth Play</option>
            <option value="dividend_income">Dividend Income</option>
            <option value="tactical">Tactical</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="entry-exit-triggers" className="block text-sm font-medium text-[var(--foreground)]">
            Exit Triggers (optional)
          </label>
          <input
            id="entry-exit-triggers"
            type="text"
            value={exitTriggers}
            onChange={(e) => setExitTriggers(e.target.value)}
            placeholder="e.g., PE > 30, prom holds < 50%"
            className="mt-1.5 w-full rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          />
        </div>

        <div>
          <label htmlFor="entry-review-date" className="block text-sm font-medium text-[var(--foreground)]">
            Next Review Date (optional)
          </label>
          <input
            id="entry-review-date"
            type="date"
            value={nextReviewDate}
            onChange={(e) => setNextReviewDate(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          />
        </div>
      </div>

      <div>
        <label htmlFor="entry-tags" className="block text-sm font-medium text-[var(--foreground)]">
          Tags (comma-separated, optional)
        </label>
        <input
          id="entry-tags"
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="e.g., value, dividend, thesis"
          className="mt-1.5 w-full rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim() || !body.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Saving...' : initial ? 'Update Entry' : 'Save Entry'}
        </button>
      </div>
    </form>
  )
}
