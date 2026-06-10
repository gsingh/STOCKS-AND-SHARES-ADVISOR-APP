import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../../lib/format'
import { FreshnessBadge } from '../../shared/freshness-badge'
import { ScoreGauge } from '../../shared/score-gauge'

interface EnrichedHolding {
  id: number
  symbol: string
  name: string
  sector: string
  quantity: number
  avgBuyPrice: number
  currentPrice: number | null
  investedValue: number
  currentValue: number
  pnl: number | null
  pnlPercent: number | null
  weightPercent: number
  compositeScore?: number
  role?: string
  goalId?: string
  fetchedAt: string | null
}

type SortKey = 'symbol' | 'quantity' | 'avgBuyPrice' | 'currentPrice' | 'investedValue' | 'currentValue' | 'pnl' | 'pnlPercent' | 'weightPercent'

interface HoldingsTableProps {
  holdings: EnrichedHolding[]
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onSort: (key: SortKey) => void
  onRowClick: (symbol: string) => void
}

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: 'symbol', label: 'Stock' },
  { key: 'quantity', label: 'Qty', className: 'text-right' },
  { key: 'avgBuyPrice', label: 'Avg Buy', className: 'text-right' },
  { key: 'currentPrice', label: 'Current', className: 'text-right' },
  { key: 'investedValue', label: 'Invested', className: 'text-right' },
  { key: 'currentValue', label: 'Current Value', className: 'text-right' },
  { key: 'pnl', label: 'P&L', className: 'text-right' },
  { key: 'pnlPercent', label: 'P&L %', className: 'text-right' },
  { key: 'weightPercent', label: 'Weight', className: 'text-right' },
]

function SortIcon({ columnKey, sortKey, sortDir }: { columnKey: SortKey; sortKey: SortKey; sortDir: 'asc' | 'desc' }) {
  if (columnKey !== sortKey) return <ArrowUpDown size={14} className="text-[var(--muted-foreground)]" />
  return sortDir === 'asc' ? (
    <ArrowUp size={14} className="text-[var(--foreground)]" />
  ) : (
    <ArrowDown size={14} className="text-[var(--foreground)]" />
  )
}

const ROLE_STYLES: Record<string, string> = {
  core_hold: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  growth_play: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  dividend_income: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  tactical: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

function RoleBadge({ role }: { role?: string }) {
  if (!role) return null
  const style = ROLE_STYLES[role] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  const label = role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}

export function HoldingsTable({ holdings, sortKey, sortDir, onSort, onRowClick }: HoldingsTableProps) {
  const sorted = [...holdings].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1
    if (typeof aVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal)
    }
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
  })

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                tabIndex={0}
                role="columnheader"
                aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                className={`cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] ${col.className ?? ''}`}
                onClick={() => onSort(col.key)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSort(col.key) }}
              >
                <div className="inline-flex items-center gap-1">
                  {col.label}
                  <SortIcon columnKey={col.key} sortKey={sortKey} sortDir={sortDir} />
                </div>
              </th>
            ))}
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Score
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Role
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((h) => {
            const pnlClass = h.pnl !== null && h.pnl >= 0 ? 'text-[var(--score-green)]' : 'text-[var(--score-red)]'
            return (
              <tr
                key={h.id}
                tabIndex={0}
                role="row"
                onClick={() => onRowClick(h.symbol)}
                onKeyDown={(e) => { if (e.key === 'Enter') onRowClick(h.symbol) }}
                className="cursor-pointer border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-[var(--foreground)]">{h.symbol}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{h.name}</div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--foreground)]">
                  {formatNumber(h.quantity)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--foreground)]">
                  {formatCurrency(h.avgBuyPrice)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="tabular-nums text-[var(--foreground)]">
                    {h.currentPrice !== null ? formatCurrency(h.currentPrice) : '—'}
                  </div>
                  <div className="mt-0.5 flex justify-end">
                    <FreshnessBadge fetchedAt={h.fetchedAt} ttl={15 * 60 * 1000} />
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--foreground)]">
                  {formatCurrency(h.investedValue)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--foreground)]">
                  {formatCurrency(h.currentValue)}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums font-medium ${pnlClass}`}>
                  {h.pnl !== null ? `${h.pnl >= 0 ? '+' : ''}${formatCurrency(h.pnl)}` : '—'}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums font-medium ${pnlClass}`}>
                  {h.pnlPercent !== null ? `${h.pnlPercent >= 0 ? '+' : ''}${h.pnlPercent.toFixed(2)}%` : '—'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--foreground)]">
                  {h.weightPercent.toFixed(1)}%
                </td>
                <td className="px-4 py-3">
                  {h.compositeScore !== undefined && <ScoreGauge score={h.compositeScore} />}
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={h.role} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
