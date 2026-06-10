import { db } from '../../services/db'
import { getQuotes } from '../../services/quote-service'

export interface PortfolioHolding {
  symbol: string
  name: string
  quantity: number
  avgBuyPrice: number
  currentPrice: number
  dayChange: number
  dayChangePercent: number
  totalValue: number
  totalCost: number
  return_: number
  returnPercent: number
  score: number
  allocation: number
}

export interface PortfolioSummary {
  totalValue: number
  totalInvested: number
  totalReturn: number
  totalReturnPercent: number
  dayChange: number
  dayChangePercent: number
  holdings: PortfolioHolding[]
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const allHoldings = await db.portfolio.toArray()

  if (allHoldings.length === 0) {
    return {
      totalValue: 0,
      totalInvested: 0,
      totalReturn: 0,
      totalReturnPercent: 0,
      dayChange: 0,
      dayChangePercent: 0,
      holdings: [],
    }
  }

  const symbols = [...new Set(allHoldings.map((h) => h.symbol))]
  const stockList = await Promise.all(symbols.map((s) => db.stock.get(s)))
  const stockMap = new Map(stockList.filter(Boolean).map((s) => [s!.symbol, s!]))

  const quoteResults = await getQuotes(symbols)

  const holdings: PortfolioHolding[] = allHoldings.map((h) => {
    const quote = quoteResults[h.symbol]?.data
    const currentPrice = quote?.lastPrice ?? h.avgBuyPrice
    const dayChange = quote?.change ?? 0
    const dayChangePercent = quote?.changePercent ?? 0
    const totalValue = h.quantity * currentPrice
    const totalCost = h.quantity * h.avgBuyPrice
    const return_ = totalValue - totalCost
    const returnPercent = h.avgBuyPrice > 0 ? ((currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100 : 0
    const stock = stockMap.get(h.symbol)

    return {
      symbol: h.symbol,
      name: stock?.name || h.symbol,
      quantity: h.quantity,
      avgBuyPrice: h.avgBuyPrice,
      currentPrice: Math.round(currentPrice * 100) / 100,
      dayChange: Math.round(dayChange * 100) / 100,
      dayChangePercent: Math.round(dayChangePercent * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      return_: Math.round(return_ * 100) / 100,
      returnPercent: Math.round(returnPercent * 100) / 100,
      score: 0,
      allocation: 0,
    }
  })

  const totalValue = holdings.reduce((s, h) => s + h.totalValue, 0)
  const totalInvested = holdings.reduce((s, h) => s + h.totalCost, 0)

  for (const h of holdings) {
    h.allocation = totalValue > 0 ? Math.round((h.totalValue / totalValue) * 10000) / 100 : 0
  }

  const totalReturn = totalValue - totalInvested
  const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0
  const dayChange = holdings.reduce((s, h) => s + (h.dayChange * h.quantity), 0)
  const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    totalInvested: Math.round(totalInvested * 100) / 100,
    totalReturn: Math.round(totalReturn * 100) / 100,
    totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
    dayChange: Math.round(dayChange * 100) / 100,
    dayChangePercent: Math.round(dayChangePercent * 100) / 100,
    holdings,
  }
}
