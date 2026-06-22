import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { ForecastResult } from './types'

interface ForecastChartProps {
  historyDates: string[]
  historyValues: number[]
  forecast: ForecastResult
}

export function ForecastChart({
  historyDates,
  historyValues,
  forecast,
}: ForecastChartProps) {
  const lastHistoryDate = historyDates.length > 0 ? historyDates[historyDates.length - 1] : ''
  const lastHistoryValue =
    historyValues.length > 0 ? historyValues[historyValues.length - 1] : null

  const data: Array<Record<string, number | string>> = []

  historyDates.forEach((date, i) => {
    data.push({
      date,
      actual: historyValues[i],
      forecast: null as unknown as undefined,
      p10: null as unknown as undefined,
      p90: null as unknown as undefined,
    })
  })

  forecast.points.forEach((point) => {
    const band = forecast.quantileBands[point.day - 1]
    data.push({
      date: `F+${point.day}`,
      actual: null as unknown as undefined,
      forecast: point.value,
      p10: band?.p10 ?? null as unknown as undefined,
      p90: band?.p90 ?? null as unknown as undefined,
    })
  })

  return (
    <div className="w-full" style={{ minHeight: 300 }}>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            className="text-gray-500 dark:text-gray-400"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: 11 }}
            className="text-gray-500 dark:text-gray-400"
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(2)
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface, #fff)',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />

          {/* Confidence band */}
          <Area
            type="monotone"
            dataKey="p90"
            stroke="none"
            fill="#3b82f6"
            fillOpacity={0.08}
            name="P10-P90 band"
          />
          <Area
            type="monotone"
            dataKey="p10"
            stroke="none"
            fill="#3b82f6"
            fillOpacity={0.08}
          />

          {/* Actual history */}
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#6b7280"
            fill="#6b7280"
            fillOpacity={0.15}
            strokeWidth={1.5}
            name="Actual"
            dot={false}
          />

          {/* Point forecast */}
          <Area
            type="monotone"
            dataKey="forecast"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.1}
            strokeWidth={2}
            strokeDasharray="6 3"
            name="Forecast"
            dot={{ r: 2, fill: '#3b82f6' }}
          />

          {/* Divider line at forecast start */}
          {lastHistoryDate && (
            <ReferenceLine
              x={lastHistoryDate}
              stroke="#9ca3af"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {lastHistoryValue != null && forecast.points.length > 0 && (
        <div className="mt-2 flex justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
          <span>
            Last: <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{lastHistoryValue.toFixed(2)}</span>
          </span>
          <span>
            Forecast end:{' '}
            <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
              {forecast.points[forecast.points.length - 1].value.toFixed(2)}
            </span>
          </span>
          <span>
            Change:{' '}
            <span
              className={`font-mono font-semibold ${
                forecast.points[forecast.points.length - 1].value >= lastHistoryValue
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {(
                ((forecast.points[forecast.points.length - 1].value - lastHistoryValue) /
                  lastHistoryValue) *
                100
              ).toFixed(1)}
              %
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
