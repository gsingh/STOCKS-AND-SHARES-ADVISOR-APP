import { useState, useEffect, useCallback } from 'react'
import { useForecastStore } from '../../stores/forecast-store'
import { getForecast } from '../../services/forecast-service'
import { fetchPriceHistory, type PricePoint } from '../../services/price-history-service'
import { ForecastChart } from './ForecastChart'
import { FORECAST_HORIZONS, type ForecastResult } from './types'
import { AlertTriangle, TrendingUp, Loader2 } from 'lucide-react'

interface ForecastPanelProps {
  symbol: string
}

export function ForecastPanel({ symbol }: ForecastPanelProps) {
  const {
    activeHorizon,
    setActiveHorizon,
    setLoading,
    setResult,
    setError,
    forecasts,
  } = useForecastStore()

  const [history, setHistory] = useState<PricePoint[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const entryKey = `${symbol}__h${activeHorizon}`
  const entry = forecasts[entryKey]

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const points = await fetchPriceHistory(symbol, '1Y')
      setHistory(points)
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [symbol])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const loadForecast = useCallback(async () => {
    if (history.length < 4) return

    setLoading(symbol, activeHorizon)
    try {
      const closes = history.map((p) => p.close)
      const envelope = await getForecast(symbol, closes, activeHorizon)

      if (!envelope.data) {
        setError(symbol, activeHorizon, envelope.error ?? 'Unknown error')
        return
      }

      const result: ForecastResult = {
        horizon: envelope.data.horizon,
        points: envelope.data.point.map((value, i) => ({
          day: i + 1,
          value,
        })),
        quantileBands: (envelope.data.quantiles.p10 ?? []).map(
          (p10: number, i: number) => ({
            p10,
            p50: envelope.data?.quantiles.p50?.[i] ?? 0,
            p90: envelope.data?.quantiles.p90?.[i] ?? 0,
          }),
        ),
        modelVersion: envelope.data.modelVersion,
        fetchedAt: envelope.data.fetchedAt,
      }

      setResult(symbol, activeHorizon, result)
    } catch (err) {
      setError(
        symbol,
        activeHorizon,
        err instanceof Error ? err.message : 'Forecast failed',
      )
    }
  }, [symbol, activeHorizon, history, setLoading, setResult, setError])

  useEffect(() => {
    if (historyLoading) return
    if (history.length < 4) return
    if (entry?.result) return
    if (entry?.loading) return
    loadForecast()
  }, [historyLoading, history.length, entry?.result, entry?.loading, loadForecast])

  const isLoading = entry?.loading || historyLoading
  const error = entry?.error
  const result = entry?.result

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Price Forecast
          </h3>
        </div>

        {/* Horizon selector */}
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          {FORECAST_HORIZONS.map((h) => (
            <button
              key={h.value}
              onClick={() => setActiveHorizon(h.value)}
              disabled={isLoading}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeHorizon === h.value
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex h-[350px] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm">
              {historyLoading ? 'Loading price history...' : 'Generating forecast...'}
            </span>
          </div>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="flex h-[350px] flex-col items-center justify-center gap-2 text-gray-400">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
          <button
            onClick={loadForecast}
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Not enough data */}
      {!isLoading && !error && !result && history.length < 4 && !historyLoading && (
        <div className="flex h-[350px] flex-col items-center justify-center gap-2 text-gray-400">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <p className="text-sm">Not enough historical data to generate a forecast.</p>
        </div>
      )}

      {/* Forecast chart */}
      {!isLoading && result && (
        <>
          <ForecastChart
            historyDates={history.map((p) => p.date)}
            historyValues={history.map((p) => p.close)}
            forecast={result}
          />

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
            <span>
              Model: {result.modelVersion} &middot; Generated{' '}
              {new Date(result.fetchedAt).toLocaleString()}
            </span>
            <button
              onClick={loadForecast}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Refresh
            </button>
          </div>

          {/* Disclaimer */}
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Model-generated projections are not investment advice. Forecasts are based
            on historical patterns and may not reflect future events.
          </p>
        </>
      )}
    </div>
  )
}
