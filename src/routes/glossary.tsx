import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronRight, BookOpen } from 'lucide-react'
import { GLOSSARY_TERMS } from '../features/glossary/terms'
import type { GlossaryTerm } from '../features/glossary/terms'

const CATEGORIES = Array.from(new Set(GLOSSARY_TERMS.map((t) => t.category))).sort()

function TermCard({ term }: { term: GlossaryTerm }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="rounded-lg border border-[var(--border)] bg-[var(--card)] transition-colors hover:border-[var(--ring)]/50"
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        <span className="shrink-0 text-[var(--muted-foreground)]">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-[var(--foreground)]">
            {term.name}
          </span>
          <span className="ml-2 inline-block rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
            {term.category}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] px-4 py-3">
          <p className="mb-3 text-sm leading-relaxed text-[var(--foreground)]">
            {term.definition}
          </p>

          {term.example && (
            <div className="mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Example
              </span>
              <p className="mt-0.5 text-sm text-[var(--foreground)]">
                {term.example}
              </p>
            </div>
          )}

          {term.whyMatters && (
            <div className="mb-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Why it matters
              </span>
              <p className="mt-0.5 text-sm text-[var(--foreground)]">
                {term.whyMatters}
              </p>
            </div>
          )}

          {term.relatedTerms.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-[var(--muted-foreground)]">Related:</span>
              {term.relatedTerms.map((rel) => (
                <span
                  key={rel}
                  className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]"
                >
                  {rel}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function GlossaryPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return GLOSSARY_TERMS.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q) && !t.definition.toLowerCase().includes(q))
        return false
      if (categoryFilter && t.category !== categoryFilter) return false
      return true
    })
  }, [search, categoryFilter])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Financial Glossary</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {GLOSSARY_TERMS.length} financial terms explained
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search terms..."
            className="w-full rounded-lg border border-[var(--input)] bg-[var(--background)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)]"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <BookOpen size={40} className="text-[var(--muted-foreground)]" />
          <p className="text-sm font-medium text-[var(--muted-foreground)]">
            No terms match your search.
          </p>
          <button
            onClick={() => {
              setSearch('')
              setCategoryFilter('')
            }}
            className="text-sm text-[var(--accent)] underline underline-offset-2 hover:text-[var(--accent)]/80"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((term) => (
            <TermCard key={term.name} term={term} />
          ))}
        </div>
      )}
    </div>
  )
}
