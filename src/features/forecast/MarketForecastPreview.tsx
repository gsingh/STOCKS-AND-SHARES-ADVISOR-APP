import { useState, useEffect, useCallback, useRef } from 'react'
import { TrendingUp, Loader2, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { PricePoint } from '../../services/price-history-service'

interface ChartDataPoint {
  date: string
  actual: number | null
  forecast: number | null
}

interface MarketForecastPreviewProps {
  symbol?: string
  yahooSymbol?: string
  label?: string
}

async function fetchRawPriceHistory(yahooSymbol: string, range: string): Promise<PricePoint[]> {
  const url = `/api/yahoo/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=${range}`
  const res = await fetch(url)
  if (!res.ok) return []
  const json = await res.json()
  const result = json.chart?.result?.[0]
  if (!result) return []
  const timestamps: number[] = result.timestamp ?? []
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? []
  const points: PricePoint[] = []
  for (let i = 0; i < Math.min(timestamps.length, closes.length); i++) {
    if (closes[i] == null) continue
    const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0]
    points.push({ date, close: closes[i]! })
  }
  return points
}

export function MarketForecastPreview({
  yahooSymbol = '^NSEI',
  label = 'Nifty 50',
}: MarketForecastPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const cancelledRef = useRef(false)

  const load = useCallback(async () => {
    cancelledRef.current = false
    setLoading(true)
    setError(null)

    try {
      const history = await fetchRawPriceHistory(yahooSymbol, '6mo')
      if (cancelledRef.current) return

      if (history.length < 10) {
        setError('Not enough historical data for forecast')
        setLoading(false)
        return
      }

      const closes = history.map((p) => p.close)
      const res = await fetch('/api/forecast/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ series: closes, horizon: 30 }),
      })

      if (cancelledRef.current) return

      if (!res.ok) {
        setError(`Forecast service unavailable (${res.status})`)
        setLoading(false)
        return
      }

      const json = await res.json()
      if (cancelledRef.current) return

      const forecastPoints: number[] = json.point ?? []
      if (forecastPoints.length === 0) {
        setError('No forecast data returned')
        setLoading(false)
        return
      }

      const data: ChartDataPoint[] = []
      history.forEach((p) => {
        data.push({ date: p.date.slice(5), actual: p.close, forecast: null })
      })
      forecastPoints.forEach((v, i) => {
        data.push({ date: `F+${i + 1}`, actual: null, forecast: v })
      })

      setChartData(data)
    } catch (err) {
      if (!cancelledRef.current) setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      if (!cancelledRef.current) setLoading(false)
    }
  }, [yahooSymbol])

  useEffect(() => {
    load()
    return () => { cancelledRef.current = true }
  }, [load])

  if (loading) {
    return (
      <div className="flex h-[180px] items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading forecast data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[180px] flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <p className="text-xs text-gray-400">
          Ensure the forecast service is running with{' '}
          <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">npm run forecast</code>
        </p>
        <button
          onClick={load}
          className="mt-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (chartData.length === 0) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          30-Day {label} Forecast
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} hide />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9 }} hide />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              fontSize: 10,
            }}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#6b7280"
            strokeWidth={1.5}
            dot={false}
            name="Actual"
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            name="Forecast"
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-xs text-gray-400 dark:text-gray-500">
        TimesFM 2.5 model &middot; Not investment advice
      </p>
    </div>
  )
}
