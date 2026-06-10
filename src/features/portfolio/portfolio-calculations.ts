import type { PortfolioRow } from '../../services/db'

export interface PnLResult {
  absolute: number
  percent: number
}

export function calculatePnL(
  avgBuyPrice: number,
  quantity: number,
  currentPrice: number | null,
): PnLResult {
  if (currentPrice === null || currentPrice === 0) {
    return { absolute: 0, percent: 0 }
  }
  const invested = avgBuyPrice * quantity
  const currentValue = currentPrice * quantity
  const absolute = currentValue - invested
  const percent = avgBuyPrice > 0 ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 : 0
  return { absolute, percent }
}

export interface PortfolioSummary {
  totalInvested: number
  totalCurrentValue: number
  totalPnL: number
  totalPnLPercent: number
}

export function calculatePortfolioSummary(
  holdings: Array<Pick<PortfolioRow, 'symbol' | 'quantity' | 'avgBuyPrice'>>,
  prices: Record<string, number | null>,
): PortfolioSummary {
  let totalInvested = 0
  let totalCurrentValue = 0

  for (const h of holdings) {
    const invested = h.quantity * h.avgBuyPrice
    const current = h.quantity * (prices[h.symbol] ?? h.avgBuyPrice)
    totalInvested += invested
    totalCurrentValue += current
  }

  const totalPnL = totalCurrentValue - totalInvested
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

  return { totalInvested, totalCurrentValue, totalPnL, totalPnLPercent }
}

export interface AllocationItem {
  name: string
  value: number
  percentage: number
}

export function calculateAllocationBySector(
  holdings: Array<Pick<PortfolioRow, 'symbol' | 'quantity' | 'avgBuyPrice'>>,
  stockSectors: Record<string, string | undefined>,
  prices: Record<string, number | null>,
): AllocationItem[] {
  const sectors: Record<string, number> = {}

  for (const h of holdings) {
    const sector = stockSectors[h.symbol] ?? 'Unknown'
    const currentPrice = prices[h.symbol] ?? h.avgBuyPrice
    const value = h.quantity * currentPrice
    sectors[sector] = (sectors[sector] ?? 0) + value
  }

  const total = Object.values(sectors).reduce((s, v) => s + v, 0)

  return Object.entries(sectors)
    .map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
}

type CapCategory = 'Large Cap' | 'Mid Cap' | 'Small Cap' | 'Unknown'

function categorizeMarketCap(marketCap?: number): CapCategory {
  if (marketCap === undefined || marketCap === null) return 'Unknown'
  if (marketCap >= 20000) return 'Large Cap'
  if (marketCap >= 5000) return 'Mid Cap'
  return 'Small Cap'
}

export function calculateAllocationByMarketCap(
  holdings: Array<Pick<PortfolioRow, 'symbol' | 'quantity' | 'avgBuyPrice'>>,
  marketCaps: Record<string, number | undefined>,
  prices: Record<string, number | null>,
): AllocationItem[] {
  const categories: Record<string, number> = {}

  for (const h of holdings) {
    const cat = categorizeMarketCap(marketCaps[h.symbol])
    const currentPrice = prices[h.symbol] ?? h.avgBuyPrice
    const value = h.quantity * currentPrice
    categories[cat] = (categories[cat] ?? 0) + value
  }

  const total = Object.values(categories).reduce((s, v) => s + v, 0)

  return Object.entries(categories)
    .map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
}

const STYLE_ORDER = ['Core Holding', 'Growth Play', 'Dividend Income', 'Tactical', 'Uncategorized']

export function calculateAllocationByStyle(
  holdings: Array<Pick<PortfolioRow, 'symbol' | 'quantity' | 'avgBuyPrice' | 'role'>>,
  prices: Record<string, number | null>,
): AllocationItem[] {
  const styles: Record<string, number> = {}

  for (const h of holdings) {
    const style = h.role
      ? h.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Uncategorized'
    const currentPrice = prices[h.symbol] ?? h.avgBuyPrice
    const value = h.quantity * currentPrice
    styles[style] = (styles[style] ?? 0) + value
  }

  const total = Object.values(styles).reduce((s, v) => s + v, 0)

  return STYLE_ORDER.filter((s) => styles[s] !== undefined)
    .map((name) => ({
      name,
      value: styles[name],
      percentage: total > 0 ? (styles[name] / total) * 100 : 0,
    }))
}

export interface SectorOverlapResult {
  sector: string
  currentExposure: number
  newCombinedExposure: number
  overlapPercent: number
  exceedsCap: boolean
}

export function calculateSectorOverlap(
  holdings: Array<Pick<PortfolioRow, 'symbol' | 'quantity' | 'avgBuyPrice'>>,
  stockSectors: Record<string, string | undefined>,
  prices: Record<string, number | null>,
  candidateSymbol: string,
  candidateQuantity: number,
  candidatePrice: number,
): SectorOverlapResult {
  const sector = stockSectors[candidateSymbol]
  if (!sector) {
    return {
      sector: 'Unknown',
      currentExposure: 0,
      newCombinedExposure: 0,
      overlapPercent: 0,
      exceedsCap: false,
    }
  }

  let totalValue = 0
  let currentSectorValue = 0
  const candidateValue = candidateQuantity * candidatePrice

  for (const h of holdings) {
    if (h.symbol === candidateSymbol) continue
    const currentPrice = prices[h.symbol] ?? h.avgBuyPrice
    const value = h.quantity * currentPrice
    totalValue += value
    if (stockSectors[h.symbol] === sector) {
      currentSectorValue += value
    }
  }

  const newSectorValue = currentSectorValue + candidateValue
  const newTotalValue = totalValue + candidateValue

  const currentExposure = totalValue > 0 ? (currentSectorValue / totalValue) * 100 : 0
  const newCombinedExposure = newTotalValue > 0 ? (newSectorValue / newTotalValue) * 100 : 0
  const overlapPercent = newSectorValue > 0 ? (candidateValue / newSectorValue) * 100 : 0
  const exceedsCap = newCombinedExposure > 15

  return { sector, currentExposure, newCombinedExposure, overlapPercent, exceedsCap }
}
