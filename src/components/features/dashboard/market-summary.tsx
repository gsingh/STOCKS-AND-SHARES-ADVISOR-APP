import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { FreshnessBadge, LoadingState, ErrorState } from '../../shared'
import { getMarketData } from '../../../features/dashboard/market-data'
import type { MarketData } from '../../../features/dashboard/market-data'
import { formatCurrency, formatPercent } from '../../../lib/format'

const DATA_TTL = 5 * 60 * 1000

export function MarketSummary() {
  const [data, setData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getMarketData()
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load market data')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) return <LoadingState rows={2} />
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />
  if (!data) return <ErrorState message="No market data available" />

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <IndexCard
          name={data.nifty.name}
          value={data.nifty.value}
          change={data.nifty.change}
          changePercent={data.nifty.changePercent}
          fetchedAt={data.nifty.fetchedAt}
        />
        <IndexCard
          name={data.sensex.name}
          value={data.sensex.value}
          change={data.sensex.change}
          changePercent={data.sensex.changePercent}
          fetchedAt={data.sensex.fetchedAt}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StockList
          title="Top Gainers"
          stocks={data.topGainers}
          isGainer
        />
        <StockList
          title="Top Losers"
          stocks={data.topLosers}
          isGainer={false}
        />
      </div>
    </div>
  )
}

interface IndexCardProps {
  name: string
  value: number
  change: number
  changePercent: number
  fetchedAt: string
}

function IndexCard({ name, value, change, changePercent, fetchedAt }: IndexCardProps) {
  const isPositive = change >= 0
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{name}</h3>
        <FreshnessBadge fetchedAt={fetchedAt} ttl={DATA_TTL} />
      </div>
      <p className="font-mono text-2xl font-bold tabular-nums text-[var(--foreground)]">
        {formatCurrency(value).replace('₹', '')}
      </p>
      <div className={`mt-1 flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-[var(--score-green)]' : 'text-[var(--score-red)]'}`}>
        {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        <span className="font-mono tabular-nums">
          {isPositive ? '+' : ''}{formatCurrency(Math.abs(change)).replace('₹', '')} ({isPositive ? '+' : ''}{formatPercent(Math.abs(changePercent))})
        </span>
      </div>
    </div>
  )
}

interface StockListProps {
  title: string
  stocks: { symbol: string; name: string; price: number; change: number; changePercent: number }[]
  isGainer: boolean
}

function StockList({ title, stocks, isGainer }: StockListProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      <div className="space-y-2">
        {stocks.length === 0 && (
          <p className="text-sm text-[var(--muted-foreground)]">No data available</p>
        )}
        {stocks.map((s) => (
          <div key={s.symbol} className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--foreground)]">{s.name}</p>
              <p className="font-mono text-xs tabular-nums text-[var(--muted-foreground)]">
                {formatCurrency(s.price).replace('₹', '')}
              </p>
            </div>
            <span
              className={`flex items-center gap-0.5 font-mono text-xs font-medium tabular-nums ${
                isGainer ? 'text-[var(--score-green)]' : 'text-[var(--score-red)]'
              }`}
            >
              {isGainer ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {isGainer ? '+' : ''}{formatPercent(Math.abs(s.changePercent))}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
