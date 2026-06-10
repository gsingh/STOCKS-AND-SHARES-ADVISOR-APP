import { useNavigate } from '@tanstack/react-router'
import { X, GitCompare, Trash2 } from 'lucide-react'
import { useStockStore } from '../../../stores'

export function CompareTray() {
  const navigate = useNavigate()
  const compareList = useStockStore((s) => s.compareList)
  const removeFromCompare = useStockStore((s) => s.removeFromCompare)
  const clearCompare = useStockStore((s) => s.clearCompare)

  if (compareList.length === 0) return null

  const canCompare = compareList.length >= 2
  const isMaxed = compareList.length >= 4

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--card)] shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {compareList.map((item) => (
            <span
              key={item.symbol}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--muted)] px-2.5 py-1 text-sm font-medium text-[var(--foreground)]"
            >
              {item.name}
              <button
                onClick={() => removeFromCompare(item.symbol)}
                className="ml-0.5 rounded text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                aria-label={`Remove ${item.name} from comparison`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
          {isMaxed && (
            <span className="text-xs text-[var(--muted-foreground)]" title="Maximum 4 stocks allowed">
              Max 4 stocks
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearCompare}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <Trash2 size={14} />
            Clear All
          </button>
          <button
            onClick={() => {
              if (canCompare) navigate({ to: '/compare' })
            }}
            disabled={!canCompare}
            title={!canCompare ? 'Select at least 2 stocks to compare' : undefined}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GitCompare size={16} />
            Compare
          </button>
        </div>
      </div>
    </div>
  )
}
