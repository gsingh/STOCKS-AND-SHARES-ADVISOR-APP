import type { DataEnvelope } from '../types/envelope'

const FORECAST_TTL = 24 * 60 * 60 * 1000
const LS_PREFIX = 'fcast_'

interface RawForecastItem {
  point?: number[]
  quantiles?: Record<string, number[]>
  horizon?: number
  model_version?: string
}

export interface ForecastData {
  point: number[]
  quantiles: Record<string, number[]>
  horizon: number
  modelVersion: string
  fetchedAt: string
  source: 'cache' | 'api'
}

function isStale(fetchedAt: string | undefined): boolean {
  if (!fetchedAt) return true
  return Date.now() - new Date(fetchedAt).getTime() > FORECAST_TTL
}

function cacheKey(symbol: string, horizon: number): string {
  return `${LS_PREFIX}${symbol}__h${horizon}`
}

function readFromCache(key: string): ForecastData | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (isStale(parsed.fetchedAt)) return null
    return parsed as ForecastData
  } catch {
    return null
  }
}

function writeToCache(key: string, data: ForecastData): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // localStorage full or unavailable — ignore
  }
}

function deleteFromCache(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

async function fetchFromAPI(
  series: number[],
  horizon: number,
): Promise<ForecastData> {
  const res = await fetch('/api/forecast/forecast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ series, horizon }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Forecast API returned ${res.status}: ${text}`)
  }

  const json = await res.json()
  const now = new Date().toISOString()

  return {
    point: json.point ?? [],
    quantiles: json.quantiles ?? {},
    horizon: json.horizon ?? horizon,
    modelVersion: json.model_version ?? 'unknown',
    fetchedAt: now,
    source: 'api',
  }
}

async function fetchBatchFromAPI(
  seriesList: number[][],
  horizon: number,
): Promise<ForecastData[]> {
  const res = await fetch('/api/forecast/forecast/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ series_list: seriesList, horizon }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Batch forecast API returned ${res.status}: ${text}`)
  }

  const json = await res.json()
  const now = new Date().toISOString()

  return (json.forecasts ?? []).map((f: RawForecastItem) => ({
    point: f.point ?? [],
    quantiles: f.quantiles ?? {},
    horizon: f.horizon ?? horizon,
    modelVersion: f.model_version ?? 'unknown',
    fetchedAt: now,
    source: 'api' as const,
  }))
}

export async function getForecast(
  symbol: string,
  series: number[],
  horizon: number = 30,
): Promise<DataEnvelope<ForecastData>> {
  const key = cacheKey(symbol, horizon)
  const cached = readFromCache(key)

  if (cached) {
    return {
      data: cached,
      fetchedAt: cached.fetchedAt ?? null,
      source: 'cache',
    }
  }

  try {
    const fresh = await fetchFromAPI(series, horizon)
    writeToCache(key, fresh)
    return {
      data: fresh,
      fetchedAt: fresh.fetchedAt,
      source: 'api',
    }
  } catch (err) {
    return {
      data: null,
      fetchedAt: null,
      source: 'api',
      error: err instanceof Error ? err.message : 'Failed to fetch forecast',
    }
  }
}

export async function getForecastsBatch(
  symbols: string[],
  seriesList: number[][],
  horizon: number = 30,
): Promise<Record<string, DataEnvelope<ForecastData>>> {
  const results: Record<string, DataEnvelope<ForecastData>> = {}

  if (symbols.length !== seriesList.length) {
    throw new Error('symbols and seriesList must have the same length')
  }

  if (symbols.length === 1) {
    const envelope = await getForecast(symbols[0], seriesList[0], horizon)
    results[symbols[0]] = envelope
    return results
  }

  try {
    const batchResults = await fetchBatchFromAPI(seriesList, horizon)

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i]
      const data = batchResults[i]
      results[symbol] = {
        data,
        fetchedAt: data.fetchedAt,
        source: 'api',
      }
      writeToCache(cacheKey(symbol, horizon), data)
    }

    return results
  } catch (err) {
    console.warn('Batch forecast failed, falling back to individual calls:', err)
    await Promise.all(
      symbols.map(async (symbol, i) => {
        results[symbol] = await getForecast(symbol, seriesList[i], horizon)
      }),
    )
    return results
  }
}

export function clearForecastCache(symbol: string): void {
  for (const h of [30, 90, 365]) {
    deleteFromCache(cacheKey(symbol, h))
  }
}
