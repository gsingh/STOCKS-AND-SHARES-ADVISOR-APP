import { toYahooSymbol } from './yahoo-symbol'

export interface PricePoint {
  date: string
  close: number
}

const V8_RANGES: Record<string, string> = {
  '1M': '1mo',
  '6M': '6mo',
  '1Y': '1y',
  '5Y': '5y',
}

export function getYahooRange(period: string): string {
  return V8_RANGES[period] ?? '1y'
}

async function fetchPriceHistoryRaw(
  yahooSymbol: string,
  range: string,
): Promise<PricePoint[]> {
  const url = `/api/yahoo/v8/finance/chart/${yahooSymbol}?interval=1d&range=${range}`

  const res = await fetch(url)
  if (!res.ok) return []

  const json = await res.json()
  const result = json.chart?.result?.[0]
  if (!result) return []

  const timestamps: number[] = result.timestamp ?? []
  const closes: (number | null)[] =
    result.indicators?.quote?.[0]?.close ?? []

  const points: PricePoint[] = []
  for (let i = 0; i < Math.min(timestamps.length, closes.length); i++) {
    if (closes[i] == null) continue
    const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0]
    points.push({ date, close: closes[i]! })
  }

  return points
}

export async function fetchPriceHistory(
  symbol: string,
  period: string = '1Y',
): Promise<PricePoint[]> {
  const range = getYahooRange(period)

  return await fetchPriceHistoryRaw(toYahooSymbol(symbol), range)
}
