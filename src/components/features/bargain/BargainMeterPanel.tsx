import { Eye, EyeOff, TrendingDown, DollarSign, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useDashboardStore } from '../../../stores/dashboard-store'
import { db } from '../../../services/db'
import type { FundamentalData } from '../../../services/screener-service'
import { formatCurrency, formatPercent } from '../../../lib/format'

interface Props {
  symbol: string
  fundamental: FundamentalData
}

const ZONE_STYLE: Record<string, { icon: any; label: string; className: string }> = {
  deep: { icon: ShieldAlert, label: 'Deep Value', className: 'text-red-500 bg-red-500/10 border-red-500/30' },
  good: { icon: ShieldCheck, label: 'Good Bargain', className: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  mild: { icon: TrendingDown, label: 'Mild Dip', className: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' },
  none: { icon: ShieldCheck, label: 'Not a Bargain', className: 'text-[var(--muted-foreground)] bg-[var(--muted)] border-[var(--border)]' },
}

export function BargainMeterPanel({ symbol, fundamental }: Props) {
  const { watchlistOrder, addToWatchlist, removeFromWatchlist } = useDashboardStore()
  const isWatched = watchlistOrder.includes(symbol)

  const handleWatchToggle = async () => {
    if (isWatched) {
      removeFromWatchlist(symbol)
      await db.watchlist.where('symbol').equals(symbol).delete()
    } else {
      addToWatchlist(symbol)
      const stock = await db.stock.get(symbol)
      await db.watchlist.add({
        symbol,
        addedAt: new Date().toISOString(),
        priceAtAdd: stock?.lastPrice,
        peAtAdd: fundamental.peRatio,
      })
    }
  }

  const zone = fundamental.bargainZone ?? 'none'
  const zs = ZONE_STYLE[zone]
  const ZoneIcon = zs.icon

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Bargain Hunter</h2>
        <button
          onClick={handleWatchToggle}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            isWatched
              ? 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
              : 'border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10'
          }`}
        >
          {isWatched ? <EyeOff size={14} /> : <Eye size={14} />}
          {isWatched ? 'Watching' : 'Add to Watchlist'}
        </button>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">52-Week High</span>
          <span className="text-sm tabular-nums text-[var(--foreground)]">
            {fundamental.fiftyTwoWeekHigh ? formatCurrency(fundamental.fiftyTwoWeekHigh) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">52-Week Low</span>
          <span className="text-sm tabular-nums text-[var(--foreground)]">
            {fundamental.fiftyTwoWeekLow ? formatCurrency(fundamental.fiftyTwoWeekLow) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">Decline from 52W High</span>
          <span className={`text-sm tabular-nums font-medium ${(fundamental.priceDecline52W ?? 0) < 0 ? 'text-red-500' : 'text-green-500'}`}>
            {fundamental.priceDecline52W != null ? formatPercent(fundamental.priceDecline52W) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">Graham Number</span>
          <span className="text-sm tabular-nums text-[var(--foreground)]">
            {fundamental.grahamNumber ? formatCurrency(fundamental.grahamNumber) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">Price / Intrinsic Value</span>
          <span className={`text-sm tabular-nums font-medium ${(fundamental.priceToIntrinsicValue ?? 1) < 1 ? 'text-green-500' : 'text-red-500'}`}>
            {fundamental.priceToIntrinsicValue != null ? `× ${fundamental.priceToIntrinsicValue.toFixed(2)}` : '—'}
          </span>
        </div>
      </div>

      <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${zs.className}`}>
        <ZoneIcon size={16} />
        <span className="text-sm font-medium">{zs.label}</span>
      </div>
    </div>
  )
}
