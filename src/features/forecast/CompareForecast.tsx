import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, Loader2, AlertTriangle } from 'lucide-react'
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
import { getForecastsBatch } from '../../services/forecast-service'
import { fetchPriceHistory } from '../../services/price-history-service'
import { FORECAST_HORIZONS, type ForecastHorizon } from './types'

interface CompareForecastProps {
  symbols: string[]
}

interface ChartDataRow {
  index: number
  [key: string]: number | string | null
}

function hslForIndex(i: number): string {
  const hues = [210, 340, 45, 160]
  return `hsl(${hues[i % hues.length]}, 70%, 55%)`
}

export function CompareForecast({ symbols }: CompareForecastProps) {
  const [horizon, setHorizon] = useState<ForecastHorizon>(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<ChartDataRow[]>([])
  const [forecastLines, setForecastLines] = useState<
    { symbol: string; color: string; dataKey: string }[]
  >([])

  const load = useCallback(async () => {
    if (symbols.length < 2) return

    setLoading(true)
    setError(null)

    try {
      const allHistory: { symbol: string; points: PricePoint[] }[] = []
      for (const symbol of symbols) {
        const points = await fetchPriceHistory(symbol, '1Y')
        allHistory.push({ symbol, points })
      }

      if (allHistory.some((h) => h.points.length < 4)) {
        setError('Insufficient historical data for one or more stocks.')
        setLoading(false)
        return
      }

      const seriesList = allHistory.map((h) => h.points.map((p) => p.close))
      const results = await getForecastsBatch(symbols, seriesList, horizon)

      const maxHistoryLen = Math.max(...allHistory.map((h) => h.points.length))
      const maxForecastLen = horizon

      const lines: { symbol: string; color: string; dataKey: string }[] = []
      const merged: ChartDataRow[] = []

      for (let i = 0; i < maxHistoryLen + maxForecastLen; i++) {
        const row: ChartDataRow = { index: i }
        for (let j = 0; j < symbols.length; j++) {
          const hist = allHistory[j]
          const color = hslForIndex(j)

          if (i < hist.points.length) {
            const key = `${symbols[j]}_actual`
            row[key] = hist.points[i].close
            if (i === 0) lines.push({ symbol: symbols[j], color, dataKey: key })
          }

          const env = results[symbols[j]]
          if (env?.data && i >= hist.points.length) {
            const forecastIdx = i - hist.points.length
            if (forecastIdx < env.data.point.length) {
              const fKey = `${symbols[j]}_forecast`
              row[fKey] = env.data.point[forecastIdx]
              if (i === hist.points.length) {
                lines.push({ symbol: `${symbols[j]} (forecast)`, color, dataKey: fKey })
              }
            }
          }
        }
        merged.push(row)
      }

      setForecastLines(lines)
      setChartData(merged)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Forecast failed')
    } finally {
      setLoading(false)
    }
  }, [symbols, horizon])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            Forecast Comparison
          </h3>
        </div>
        <div className="flex gap-1 rounded-lg bg-[var(--muted)] p-1">
          {FORECAST_HORIZONS.map((h) => (
            <button
              key={h.value}
              onClick={() => setHorizon(h.value)}
              disabled={loading}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                horizon === h.value
                  ? 'bg-[var(--card)] text-blue-600 shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex h-[350px] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-[var(--muted-foreground)]">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm">Generating forecasts...</span>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="flex h-[350px] flex-col items-center justify-center gap-2 text-[var(--muted-foreground)]">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <p className="text-sm text-amber-600">{error}</p>
          <button
            onClick={load}
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis dataKey="index" tick={{ fontSize: 11 }} />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(2)
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              iconType="line"
            />
            {forecastLines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                strokeWidth={line.dataKey.includes('forecast') ? 2 : 1.5}
                strokeDasharray={line.dataKey.includes('forecast') ? '6 3' : undefined}
                dot={false}
                name={line.symbol}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}

      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        Model-generated projections are not investment advice.
      </p>
    </div>
  )
}
