import { Fragment } from 'react'
import { buildScoredGroups, scoreColor } from '../../../features/compare/compare-data'
import type { CompareStockEntry } from '../../../features/compare/compare-types'

interface ComparisonTableProps {
  entries: CompareStockEntry[]
}

function getRowLabel(key: string): string {
  const labels: Record<string, string> = {
    peRatio: 'P/E Ratio',
    pbRatio: 'P/B Ratio',
    peg: 'PEG Ratio',
    dividendYield: 'Dividend Yield',
    roe: 'ROE',
    roce: 'ROCE',
    operatingMargin: 'Operating Margin',
    netProfitMargin: 'Net Profit Margin',
    debtToEquity: 'Debt-to-Equity',
    freeCashFlow: 'Free Cash Flow',
    bookValue: 'Book Value',
    revenueGrowth: 'Revenue Growth',
    epsGrowth: 'EPS Growth',
    promoterHolding: 'Promoter Holding',
    pledgedShares: 'Pledged Shares',
    governanceQuality: 'Governance Quality',
    marketCap: 'Market Cap',
  }
  return labels[key] ?? key
}

function CellSkeleton() {
  return (
    <div className="flex flex-col gap-1 animate-pulse">
      <div className="h-4 w-12 rounded bg-[var(--muted)]" />
      <div className="h-3 w-24 rounded bg-[var(--muted)]" />
    </div>
  )
}

export function ComparisonTable({ entries }: ComparisonTableProps) {
  const groups = buildScoredGroups(entries)

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center text-sm text-[var(--muted-foreground)]">
        No stocks selected for comparison.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-[var(--muted)]/50">
            <th className="sticky left-0 z-10 bg-[var(--muted)]/50 px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              Parameter
            </th>
            {entries.map((e, i) => (
              <th
                key={e.symbol}
                className={`px-3 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] ${i > 0 ? 'border-l border-[var(--border)]' : ''}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-[var(--muted-foreground)]">#{i + 1}</span>
                  <span className="truncate">{e.name}</span>
                  {e.isLoading && (
                    <span className="ml-1 h-2 w-2 animate-pulse rounded-full bg-amber-400" title="Refreshing data..." />
                  )}
                  {e.error && !e.isLoading && (
                    <span className="ml-1 h-2 w-2 rounded-full bg-red-400" title={e.error} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.key}>
              <tr className="border-b bg-[var(--muted)]/20">
                <td
                  colSpan={entries.length + 1}
                  className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]"
                >
                  {group.name}
                </td>
              </tr>
              {group.rows.map((row) => {
                const bestIdx = row.bestIndex
                return (
                  <tr key={row.key} className="border-b last:border-0 hover:bg-[var(--muted)]/10">
                    <td className="sticky left-0 z-10 bg-[var(--card)] px-3 py-2.5 text-sm font-medium text-[var(--foreground)]">
                      {getRowLabel(row.key)}
                    </td>
                    {entries.map((_, i) => {
                      const sc = row.scores[i]
                      const expl = row.explanations[i]
                      const isBest = bestIdx !== null && i === bestIdx
                      const hasScore = sc !== null
                      const isLoading = entries[i].isLoading
                      const hasError = !isLoading && entries[i].error && !hasScore

                      return (
                        <td
                          key={`${row.key}-${i}`}
                          className={`min-h-[52px] px-3 py-2.5 text-sm ${i > 0 ? 'border-l border-[var(--border)]' : ''} ${isBest ? 'bg-[var(--score-green-bg)] dark:bg-[var(--score-green-bg)]' : ''}`}
                        >
                          {isLoading ? (
                            <CellSkeleton />
                          ) : hasError ? (
                            <span className="text-xs text-[var(--muted-foreground)]">—</span>
                          ) : hasScore ? (
                            <div className="max-w-[220px]">
                              <div className={`font-mono text-sm tabular-nums ${scoreColor(sc)}`}>
                                {sc.toFixed(1)}
                                <span className="text-[var(--muted-foreground)] font-normal">/20</span>
                              </div>
                              <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]" title={expl ?? ''}>
                                {expl ?? ''}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--muted-foreground)]">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
