import { ScoreGauge } from '../../shared'
import type { CompareStockEntry } from '../../../features/compare/compare-types'

interface ScoringSummaryProps {
  entries: CompareStockEntry[]
}

export function ScoringSummary({ entries }: ScoringSummaryProps) {
  if (entries.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {entries.map((e) => (
        <div
          key={e.symbol}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)] truncate">{e.name}</p>
              <p className="text-xs font-mono text-[var(--muted-foreground)]">{e.symbol}</p>
            </div>
            {e.isLoading && (
              <span className="h-3 w-3 animate-pulse rounded-full bg-amber-400" title="Loading..." />
            )}
            {e.error && !e.isLoading && (
              <span
                className="text-[10px] text-red-500 font-medium"
                title={e.error}
              >
                Error
              </span>
            )}
          </div>

          {e.score ? (
            <ScoreGauge score={e.score.compositeScore} />
          ) : e.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <span className="animate-pulse">Fetching data...</span>
            </div>
          ) : (
            <div className="text-xs text-[var(--muted-foreground)]">
              {e.error || 'No data available'}
            </div>
          )}

          {e.interplayWarnings.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              {e.interplayWarnings.length} warning{e.interplayWarnings.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
