import { useState, useEffect, useCallback, useMemo } from 'react'
import { BookOpen, Plus, Search, X } from 'lucide-react'
import { db, type JournalEntryRow } from '../../../services/db'
import { formatDate, formatDateTime } from '../../../lib/format'
import { LoadingState } from '../../shared/loading-state'
import { ErrorState } from '../../shared/error-state'
import { JournalEntryForm } from './journal-entry-form'

type ViewMode = 'list' | 'create' | 'edit'

export function JournalPage() {
  const [mode, setMode] = useState<ViewMode>('list')
  const [entries, setEntries] = useState<JournalEntryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [symbolFilter, setSymbolFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadEntries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const all = await db.journalEntry.orderBy('createdAt').reverse().toArray()
      setEntries(all)
    } catch {
      setError('Failed to load journal entries')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const handleSave = useCallback(async (data: Omit<JournalEntryRow, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    await db.journalEntry.add({ ...data, createdAt: now, updatedAt: now } as JournalEntryRow)
    await loadEntries()
    setMode('list')
  }, [loadEntries])

  const handleUpdate = useCallback(async (id: string, data: Omit<JournalEntryRow, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    await db.journalEntry.update(id, { ...data, updatedAt: now })
    await loadEntries()
    setMode('list')
    setEditingId(null)
  }, [loadEntries])

  const handleDelete = useCallback(async (id: string) => {
    await db.journalEntry.delete(id)
    await loadEntries()
  }, [loadEntries])

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!e.title.toLowerCase().includes(q) && !e.body.toLowerCase().includes(q)) return false
      }
      if (symbolFilter && e.symbol !== symbolFilter) return false
      if (roleFilter && e.role !== roleFilter) return false
      if (tagFilter && !(e.tags ?? []).some((t) => t.toLowerCase().includes(tagFilter.toLowerCase()))) return false
      if (startDate && e.createdAt < startDate) return false
      if (endDate && e.createdAt > endDate + 'T23:59:59.999Z') return false
      return true
    })
  }, [entries, searchQuery, symbolFilter, roleFilter, tagFilter, startDate, endDate])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const e of entries) {
      for (const t of e.tags ?? []) tags.add(t)
    }
    return Array.from(tags).sort()
  }, [entries])

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={loadEntries} />

  if (mode === 'create') {
    return <JournalEntryForm onSave={handleSave} onCancel={() => setMode('list')} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Investment Journal</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Record and track your investment thesis, decisions, and reflections
          </p>
        </div>
        <button
          onClick={() => setMode('create')}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90"
        >
          <Plus size={18} />
          New Entry
        </button>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title or body..."
            className="w-full rounded-lg border border-[var(--input)] bg-[var(--background)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          />
        </div>
        <input
          type="text"
          value={symbolFilter}
          onChange={(e) => setSymbolFilter(e.target.value.toUpperCase())}
          placeholder="Symbol"
          className="w-28 rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        >
          <option value="">All Roles</option>
          <option value="core_hold">Core Holding</option>
          <option value="growth_play">Growth Play</option>
          <option value="dividend_income">Dividend Income</option>
          <option value="tactical">Tactical</option>
        </select>
        {allTags.length > 0 && (
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          >
            <option value="">All Tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
      </div>

      <p className="text-xs text-[var(--muted-foreground)]">
        {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
        {filtered.length !== entries.length && ` (filtered from ${entries.length})`}
      </p>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-[var(--border)] p-12 text-center">
          <BookOpen size={48} className="text-[var(--muted-foreground)]" />
          <div>
            <p className="text-lg font-medium text-[var(--foreground)]">
              No journal entries yet
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Record your first investment thesis, trade rationale, or market reflection.
            </p>
          </div>
          <button
            onClick={() => setMode('create')}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90"
          >
            <Plus size={18} />
            Write First Entry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[var(--border)] p-10 text-center">
          <Search size={32} className="text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">
            No entries match your filters.{' '}
            <button
              onClick={() => { setSearchQuery(''); setSymbolFilter(''); setRoleFilter(''); setTagFilter(''); setStartDate(''); setEndDate('') }}
              className="text-[var(--primary)] underline"
            >
              Clear filters
            </button>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const isExpanded = expandedId === entry.id
            const isEditing = editingId === entry.id
            return (
              <div
                key={entry.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] transition-colors hover:bg-[var(--muted)]/50"
              >
                {isEditing ? (
                  <JournalEntryForm
                    initial={entry}
                    onSave={(data) => handleUpdate(entry.id!, data)}
                    onCancel={() => { setMode('list'); setEditingId(null) }}
                  />
                ) : (
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <BookOpen size={18} className="mt-0.5 text-[var(--muted-foreground)]" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[var(--foreground)]">
                              {entry.title}
                            </p>
                            {entry.symbol && (
                              <span className="inline-flex items-center rounded bg-[var(--muted)] px-1.5 py-0.5 text-xs font-medium text-[var(--primary)]">
                                {entry.symbol}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {formatDateTime(entry.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.role && (
                          <span className="inline-flex items-center rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
                            {entry.role.replace(/_/g, ' ')}
                          </span>
                        )}
                        <button
                          onClick={() => { setEditingId(entry.id!); setMode('edit') }}
                          className="text-xs text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id!)}
                          className="text-xs text-[var(--muted-foreground)] transition-colors hover:text-[var(--score-red)]"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p
                        className={`text-sm text-[var(--muted-foreground)] ${
                          isExpanded ? '' : 'line-clamp-2'
                        }`}
                      >
                        {entry.body}
                      </p>
                      {entry.body.length > 150 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : entry.id!)}
                          className="mt-1 text-xs text-[var(--primary)] transition-colors hover:underline"
                        >
                          {isExpanded ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>

                    {((entry.tags ?? []).length > 0 || entry.exitTriggers || entry.nextReviewDate) && (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {(entry.tags ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {(entry.tags ?? []).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-full border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {entry.exitTriggers && (
                          <span className="text-xs text-[var(--score-amber)]">
                            Exit: {entry.exitTriggers}
                          </span>
                        )}
                        {entry.nextReviewDate && (
                          <span className="text-xs text-[var(--muted-foreground)]">
                            Next review: {formatDate(entry.nextReviewDate)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
