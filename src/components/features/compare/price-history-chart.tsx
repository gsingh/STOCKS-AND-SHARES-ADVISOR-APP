import { useState, useEffect, useMemo, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { fetchPriceHistory, type PricePoint } from '../../../services/price-history-service'

const PERIODS = ['1M', '6M', '1Y', '5Y'] as const
type Period = (typeof PERIODS)[number]

const CHART_COLORS = [
  'var(--chart-color-1)',
  'var(--chart-color-2)',
  'var(--chart-color-3)',
  'var(--chart-color-4)',
]

interface StockPriceData {
  symbol: string
  name: string
  points: PricePoint[] | null
  isLoading: boolean
}

interface PriceHistoryChartProps {
  stocks: { symbol: string; name: string }[]
}

function normalizePoints(allStocks: StockPriceData[]): Record<string, string | number>[] {
  const valid = allStocks.filter((s) => s.points && s.points.length > 1)
  if (valid.length === 0) return []

  const maxLength = Math.max(...valid.map((s) => s.points!.length))
  const result: Record<string, string | number>[] = []

  for (let i = 0; i < maxLength; i++) {
    const row: Record<string, string | number> = { index: i }
    let hasDate = false
    for (const stock of valid) {
      if (stock.points && i < stock.points.length) {
        const base = stock.points[0].close
        const pct = ((stock.points[i].close - base) / base) * 100
        row[stock.symbol] = Math.round(pct * 100) / 100
        if (!hasDate) {
          const dateTs = stock.points[i].date
          if (i === 0 || i === maxLength - 1 || i % Math.max(1, Math.floor(maxLength / 6)) === 0) {
            row.date = dateTs
            hasDate = true
          }
        }
      }
    }
    result.push(row)
  }

  return result
}

export function PriceHistoryChart({ stocks }: PriceHistoryChartProps) {
  const [period, setPeriod] = useState<Period>('1Y')
  const [priceData, setPriceData] = useState<StockPriceData[]>([])
  const prevStocksKey = useRef('')

  const stocksKey = useMemo(() => stocks.map((s) => s.symbol).join(','), [stocks])

  useEffect(() => {
    if (stocks.length === 0) {
      setPriceData([])
      prevStocksKey.current = ''
      return
    }

    const isNewStocks = stocksKey !== prevStocksKey.current
    prevStocksKey.current = stocksKey

    let cancelled = false

    if (isNewStocks) {
      const initial: StockPriceData[] = stocks.map((s) => ({
        symbol: s.symbol,
        name: s.name,
        points: null,
        isLoading: true,
      }))
      setPriceData(initial)
    } else {
      setPriceData((prev) =>
        prev.map((d) => ({ ...d, isLoading: true })),
      )
    }

    stocks.forEach(async (stock) => {
      try {
        const points = await fetchPriceHistory(stock.symbol, period)
        if (!cancelled) {
          setPriceData((prev) =>
            prev.map((d) =>
              d.symbol === stock.symbol
                ? { ...d, points, isLoading: false }
                : d,
            ),
          )
        }
      } catch {
        if (!cancelled) {
          setPriceData((prev) =>
            prev.map((d) =>
              d.symbol === stock.symbol
                ? { ...d, isLoading: false }
                : d,
            ),
          )
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [stocksKey, period, stocks])

  const chartData = useMemo(() => normalizePoints(priceData), [priceData])

  const isLoading = priceData.some((d) => d.isLoading)
  const hasData = chartData.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          Price Performance — % Change from Start
        </h3>
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[400px] rounded-lg border">
        {!hasData && isLoading && (
          <div className="flex h-full min-h-[400px] items-center justify-center text-sm text-[var(--muted-foreground)]">
            Fetching price history...
          </div>
        )}

        {!hasData && !isLoading && (
          <div className="flex h-full min-h-[400px] items-center justify-center text-sm text-[var(--muted-foreground)]">
            No price history available for the selected period.
          </div>
        )}

        {hasData && (
          <div className="p-4">
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                    tickFormatter={(v) => {
                      if (v && typeof v === 'string' && v.length >= 10) {
                        const d = new Date(v)
                        return `${d.getDate()}/${d.getMonth() + 1}`
                      }
                      return ''
                    }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                    tickFormatter={(v) => `${v}%`}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Change']}
                    labelFormatter={(label) =>
                      typeof label === 'string' && label.length >= 10
                        ? new Date(label).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : label
                    }
                    contentStyle={{
                      background: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--popover-foreground)',
                      fontSize: '12px',
                    }}
                  />
                  {priceData
                    .filter((d) => d.points && d.points.length > 1)
                    .map((stock, i) => (
                      <Line
                        key={stock.symbol}
                        type="monotone"
                        dataKey={stock.symbol}
                        name={stock.name}
                        stroke={CHART_COLORS[i % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        connectNulls
                      />
                    ))}
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{
                      fontSize: 11,
                      color: 'var(--foreground)',
                      paddingTop: '8px',
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {isLoading && (
              <div className="mt-2 text-center text-xs text-[var(--muted-foreground)] animate-pulse">
                Updating data...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
