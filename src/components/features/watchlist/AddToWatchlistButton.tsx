import { Eye, EyeOff } from 'lucide-react'
import { useDashboardStore } from '../../../stores/dashboard-store'
import { db } from '../../../services/db'

interface Props {
  symbol: string
  size?: 'sm' | 'md'
}

export function AddToWatchlistButton({ symbol, size = 'sm' }: Props) {
  const { watchlistOrder, addToWatchlist, removeFromWatchlist } = useDashboardStore()
  const isWatched = watchlistOrder.includes(symbol)

  const handleToggle = async () => {
    if (isWatched) {
      removeFromWatchlist(symbol)
      await db.watchlist.where('symbol').equals(symbol).delete()
    } else {
      addToWatchlist(symbol)
      const [stock, fund] = await Promise.all([
        db.stock.get(symbol),
        db.fundamental.get(symbol),
      ])
      await db.watchlist.add({
        symbol,
        addedAt: new Date().toISOString(),
        priceAtAdd: stock?.lastPrice,
        peAtAdd: fund?.peRatio,
      })
    }
  }

  const sizeClasses = size === 'sm'
    ? 'px-2.5 py-1 text-xs'
    : 'px-3 py-1.5 text-sm'

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium transition-colors ${sizeClasses} ${
        isWatched
          ? 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
          : 'border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10'
      }`}
    >
      {isWatched ? <EyeOff size={14} /> : <Eye size={14} />}
      {isWatched ? 'Watching' : 'Watch'}
    </button>
  )
}
