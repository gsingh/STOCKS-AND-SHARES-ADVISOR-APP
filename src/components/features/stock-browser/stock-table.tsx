import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowUpDown, ArrowUp, ArrowDown, Plus, Briefcase } from 'lucide-react'
import { useStockStore } from '../../../stores/stock-store'
import { formatCurrency, formatNumber } from '../../../lib/format'
import { AddHoldingDialog } from '../portfolio/add-holding-dialog'

export interface StockBrowserRow {
  symbol: string
  name: string
  sector: string
  marketCap?: number
  lastPrice?: number
  peRatio?: number
  roe?: number
  score?: number
  buffettCompliant?: boolean
  buffettGates?: number
  buffettModifiedCompliant?: boolean
  buffettModifiedGates?: number
}

const PAGE_SIZE = 50

type SortKey = keyof StockBrowserRow
type SortDir = 'asc' | 'desc'

interface StockTableProps {
  rows: StockBrowserRow[]
  page: number
  onPageChange: (page: number) => void
  total: number
}

function getScoreBadge(score?: number) {
  if (score === undefined || score === null) return null
  if (score >= 70) {
    return (
      <span className="inline-flex items-center rounded-full bg-[var(--score-green-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--score-green)]">
        {score}
      </span>
    )
  }
  if (score >= 50) {
    return (
      <span className="inline-flex items-center rounded-full bg-[var(--score-amber-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--score-amber)]">
        {score}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--score-red-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--score-red)]">
      {score}
    </span>
  )
}

function getBuffettBadge(compliant?: boolean) {
  if (!compliant) return null
  return (
    <span
      className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-400"
      title="Passes Warren Buffett's investment criteria"
    >
      WB
    </span>
  )
}

function getModifiedBuffettBadge(compliant?: boolean) {
  if (!compliant) return null
  return (
    <span
      className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-400"
      title="Passes Warren Buffett Modified criteria (adapted for Indian markets)"
    >
      WB-M
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
  { key: 'roe', label: 'ROE', align: 'text-right' },
  { key: 'score', label: 'Score', align: 'text-right' },
  { key: 'buffettGates', label: 'Buffett', align: 'text-right' },
  { key: 'buffettModifiedGates', label: 'WB-Mod', align: 'text-right' },
]

export function StockTable({ rows, page, onPageChange, total }: StockTableProps) {
  const navigate = useNavigate()
  const addToCompare = useStockStore((s) => s.addToCompare)
  const isInCompare = useStockStore((s) => s.isInCompare)
  const [sortKey, setSortKey] = useState<SortKey>('symbol')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [addSymbol, setAddSymbol] = useState<string | null>(null)

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDir('asc')
      return key
    })
  }, [])

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

  const totalPages = Math.ceil(total / PAGE_SIZE)

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
      <div
        className="overflow-x-auto rounded-lg border border-[var(--border)]"
        role="region"
        aria-label="Stock listings table"
      >
        <table className="w-full" role="grid">
          <thead className="bg-[var(--muted)]">
            <tr>
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
              <th
                className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]"
                aria-label="Add to compare"
              >
                <span className="sr-only">Compare</span>
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]"
                aria-label="Add to portfolio"
              >
                <span className="sr-only">Portfolio</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {paginated.map((row) => (
              <tr
                key={row.symbol}
                className="cursor-pointer transition-colors hover:bg-[var(--muted)] focus:bg-[var(--muted)] focus:outline-none"
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
                  {row.roe !== undefined ? `${formatNumber(row.roe)}%` : '—'}
                </td>
                <td className="px-4 py-3 text-right">{getScoreBadge(row.score)}</td>
                <td className="px-4 py-3 text-right">{getBuffettBadge(row.buffettCompliant)}</td>
                <td className="px-4 py-3 text-right">{getModifiedBuffettBadge(row.buffettModifiedCompliant)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isInCompare(row.symbol)) {
                        addToCompare({ symbol: row.symbol, name: row.name })
                      }
                    }}
                    disabled={isInCompare(row.symbol)}
                    className={`inline-flex items-center justify-center rounded p-1 ${
                      isInCompare(row.symbol)
                        ? 'text-[var(--muted-foreground)] opacity-40'
                        : 'text-[var(--accent)] hover:bg-[var(--accent)]/10'
                    }`}
                    aria-label={
                      isInCompare(row.symbol)
                        ? `${row.symbol} already added to compare`
                        : `Add ${row.symbol} to compare`
                    }
                    title={isInCompare(row.symbol) ? 'Already in compare list' : 'Add to compare'}
                  >
                    <Plus size={16} />
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setAddSymbol(row.symbol)
                    }}
                    className="inline-flex items-center justify-center rounded p-1 text-[var(--accent)] hover:bg-[var(--accent)]/10"
                    aria-label={`Add ${row.symbol} to portfolio`}
                    title="Add to portfolio"
                  >
                    <Briefcase size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td
                  colSpan={12}
                  className="px-4 py-12 text-center text-sm text-[var(--muted-foreground)]"
                >
                  No stocks match your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div
          className="mt-4 flex items-center justify-between"
          role="navigation"
          aria-label="Pagination"
        >
          <span className="text-sm text-[var(--muted-foreground)]">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of{' '}
            {total}
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

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {total} stocks found
      </div>

      <AddHoldingDialog
        open={addSymbol !== null}
        onClose={() => setAddSymbol(null)}
        onSaved={() => setAddSymbol(null)}
        symbol={addSymbol ?? undefined}
      />
    </div>
  )
}
