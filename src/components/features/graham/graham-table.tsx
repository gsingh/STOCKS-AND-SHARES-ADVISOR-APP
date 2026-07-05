import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../../lib/format'
import { GateChecklist } from '../buffett/gate-checklist'
import type { GateResult } from '../../../features/buffett'
import type { GrahamPageRow } from '../../../features/graham'

const PAGE_SIZE = 50

type SortKey = keyof GrahamPageRow
type SortDir = 'asc' | 'desc'

interface GrahamTableProps {
  rows: GrahamPageRow[]
  page: number
  onPageChange: (page: number) => void
}

function getGrahamGateBadge(gatesPassed: number, total: number) {
  const ratio = gatesPassed / total
  const cls = ratio >= 0.85
    ? 'bg-[var(--score-green-bg)] text-[var(--score-green)]'
    : ratio >= 0.71
    ? 'bg-[var(--score-amber-bg)] text-[var(--score-amber)]'
    : 'bg-[var(--score-red-bg)] text-[var(--score-red)]'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {gatesPassed}/{total}
    </span>
  )
}

const SORTABLE_COLUMNS: { key: SortKey; label: string; align?: string }[] = [
  { key: 'symbol', label: 'Ticker' },
  { key: 'name', label: 'Name' },
  { key: 'sector', label: 'Sector' },
  { key: 'lastPrice', label: 'Price', align: 'text-right' },
  { key: 'marketCap', label: 'Mkt Cap', align: 'text-right' },
  { key: 'peRatio', label: 'P/E', align: 'text-right' },
  { key: 'pbRatio', label: 'P/B', align: 'text-right' },
  { key: 'gatesPassed', label: 'Gates', align: 'text-right' },
  { key: 'grahamScore', label: 'G-Score', align: 'text-right' },
]

export function GrahamTable({ rows, page, onPageChange }: GrahamTableProps) {
  const navigate = useNavigate()
  const [sortKey, setSortKey] = useState<SortKey>('gatesPassed')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'gatesPassed' || key === 'grahamScore' ? 'desc' : 'asc')
    }
  }, [sortKey])

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal === undefined || aVal === null) return 1
      if (bVal === undefined || bVal === null) return -1
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })
  }, [rows, sortKey, sortDir])

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return sorted.slice(start, start + PAGE_SIZE)
  }, [sorted, page])

  const totalPages = Math.ceil(rows.length / PAGE_SIZE) || 1

  function SortIcon({ columnKey }: { columnKey: SortKey }) {
    if (sortKey !== columnKey) {
      return <ArrowUpDown size={14} className="text-[var(--muted-foreground)]" aria-hidden="true" />
    }
    return sortDir === 'asc' ? (
      <ArrowUp size={14} aria-hidden="true" />
    ) : (
      <ArrowDown size={14} aria-hidden="true" />
    )
  }

  function getAriaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    if (sortKey !== key) return 'none'
    return sortDir === 'asc' ? 'ascending' : 'descending'
  }

  const headerClass =
    'cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--foreground)]'

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-[var(--border)]" role="region" aria-label="Graham-compliant stocks">
        <table className="w-full" role="grid">
          <thead className="bg-[var(--muted)]">
            <tr>
              <th className="w-8 px-2 py-3" aria-label="Expand row" />
              {SORTABLE_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`${headerClass} ${col.align ?? ''}`}
                  onClick={() => toggleSort(col.key)}
                  aria-sort={getAriaSort(col.key)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleSort(col.key)
                    }
                  }}
                >
                  <div className={`flex items-center gap-1 ${col.align ? 'justify-end' : ''}`}>
                    <SortIcon columnKey={col.key} />
                    {col.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {paginated.map((row) => (
              <>
                <tr
                  key={row.symbol}
                  className="cursor-pointer transition-colors hover:bg-[var(--muted)]"
                  tabIndex={0}
                  role="row"
                  onClick={() => navigate({ to: `/stocks/${row.symbol}` })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate({ to: `/stocks/${row.symbol}` })
                    }
                  }}
                >
                  <td className="px-2 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpanded(expanded === row.symbol ? null : row.symbol)
                      }}
                      className="rounded p-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      aria-label={`${expanded === row.symbol ? 'Hide' : 'Show'} Graham criteria for ${row.symbol}`}
                    >
                      {expanded === row.symbol ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                    {row.symbol}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--foreground)]">{row.name}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{row.sector}</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-[var(--foreground)]">
                    {row.lastPrice !== undefined ? formatCurrency(row.lastPrice) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-[var(--muted-foreground)]">
                    {row.marketCap !== undefined ? formatCurrency(row.marketCap) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-[var(--muted-foreground)]">
                    {row.peRatio !== undefined ? formatNumber(row.peRatio) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-[var(--muted-foreground)]">
                    {row.pbRatio !== undefined ? formatNumber(row.pbRatio) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {getGrahamGateBadge(row.gatesPassed, row.gatesTotal)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center rounded-full bg-[var(--score-green-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--score-green)]">
                      {row.grahamScore.toFixed(0)}
                    </span>
                  </td>
                </tr>
                {expanded === row.symbol && (
                  <tr key={`${row.symbol}-expanded`}>
                    <td />
                    <td colSpan={9} className="px-4 py-3 bg-[var(--muted)]/50">
                      <GateChecklist gateResults={row.gateResults as unknown as GateResult[]} />
                    </td>
                  </tr>
                )}
              </>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-sm text-[var(--muted-foreground)]">
                  No Graham-compliant stocks found. Try refreshing data for more stocks.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between" role="navigation" aria-label="Pagination">
          <span className="text-sm text-[var(--muted-foreground)]">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] disabled:opacity-40"
              aria-label="Previous page"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const startPage = Math.max(1, Math.min(page - 2, totalPages - 4))
              const p = startPage + i
              if (p > totalPages) return null
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`rounded-md px-3 py-1.5 text-sm ${
                    p === page
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                  }`}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] disabled:opacity-40"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
