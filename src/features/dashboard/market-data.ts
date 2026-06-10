import { db } from '../../services/db'
import { getQuotes } from '../../services/quote-service'

export interface IndexData {
  name: string
  value: number
  change: number
  changePercent: number
  fetchedAt: string
}

export interface StockChange {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

export interface MarketData {
  nifty: IndexData
  sensex: IndexData
  fetchedAt: string
  topGainers: StockChange[]
  topLosers: StockChange[]
}

async function fetchIndex(symbol: string, name: string): Promise<IndexData> {
  const encoded = symbol.replace('^', '%5E')
  const res = await fetch(`/api/yahoo/v8/finance/chart/${encoded}?interval=1d&range=1d`)
  if (!res.ok) throw new Error(`${name} returned ${res.status}`)
  const json = await res.json()
  const meta = json.chart?.result?.[0]?.meta
  if (!meta) throw new Error(`Invalid ${name} response`)

  const lastPrice = meta.regularMarketPrice ?? 0
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? 0
  const change = prevClose ? lastPrice - prevClose : 0
  const changePercent = prevClose ? (change / prevClose) * 100 : 0

  return {
    name,
    value: lastPrice,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    fetchedAt: new Date().toISOString(),
  }
}

export async function getMarketData(): Promise<MarketData> {
  const now = new Date().toISOString()

  const [niftyResult, sensexResult, stocks] = await Promise.all([
    fetchIndex('^NSEI', 'Nifty 50').catch(() => null),
    fetchIndex('^BSESN', 'Sensex').catch(() => null),
    db.stock.limit(100).toArray(),
  ])

  const fallbackNifty = { name: 'Nifty 50', value: 0, change: 0, changePercent: 0, fetchedAt: now }
  const fallbackSensex = { name: 'Sensex', value: 0, change: 0, changePercent: 0, fetchedAt: now }

  const marketSymbols = stocks.map((s) => s.symbol)
  const quotesData = await getQuotes(marketSymbols)

  const changes: StockChange[] = []
  for (const stock of stocks) {
    const q = quotesData[stock.symbol]?.data
    if (q && q.lastPrice > 0) {
      changes.push({
        symbol: stock.symbol,
        name: stock.name || stock.symbol,
        price: q.lastPrice,
        change: q.change,
        changePercent: q.changePercent,
      })
    }
  }

  changes.sort((a, b) => b.changePercent - a.changePercent)

  return {
    nifty: niftyResult ?? fallbackNifty,
    sensex: sensexResult ?? fallbackSensex,
    fetchedAt: now,
    topGainers: changes.filter((s) => s.changePercent >= 0).slice(0, 5),
    topLosers: changes.filter((s) => s.changePercent < 0).reverse().slice(0, 5),
  }
}
