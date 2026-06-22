export interface ForecastPoint {
  day: number
  value: number
}

export interface ForecastQuantileBand {
  p10: number
  p50: number
  p90: number
}

export interface ForecastResult {
  horizon: number
  points: ForecastPoint[]
  quantileBands: ForecastQuantileBand[]
  modelVersion: string
  fetchedAt: string
}

export type ForecastHorizon = 30 | 90 | 365

export const FORECAST_HORIZONS: { value: ForecastHorizon; label: string }[] = [
  { value: 30, label: '1 Month' },
  { value: 90, label: '3 Months' },
  { value: 365, label: '1 Year' },
]
