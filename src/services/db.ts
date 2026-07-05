import Dexie, { type EntityTable, type Table } from 'dexie'

export interface StockRow {
  symbol: string
  name: string
  sector: string
  marketCap?: number
  lastPrice?: number
  change?: number
  changePercent?: number
  dayHigh?: number
  dayLow?: number
  volume?: number
  fetchedAt?: string
}

export interface PriceHistoryRow {
  id?: number
  symbol: string
  date: string
  close: number
  volume?: number
}

export interface FundamentalRow {
  symbol: string
  marketCap?: number
  peRatio?: number
  pbRatio?: number
  roe?: number
  roce?: number
  debtToEquity?: number
  operatingMargin?: number
  netProfitMargin?: number
  eps?: number
  dividendYield?: number
  payoutRatio?: number
  bookValue?: number
  promoterHolding?: number
  freeCashFlow?: number
  revenueCagr3Y?: number
  netIncomeCagr3Y?: number
  pledgedShares?: number
  governanceQuality?: number
  revenue?: number
  netProfit?: number
  interestCoverageRatio?: number
  currentRatio?: number
  netCurrentAssets?: number
  longTermDebt?: number
  dividendYears?: number
  dividendConsistent?: boolean
  eps3yAvg?: number
  pe3yAvg?: number
  peTimesPb?: number
  earningsStable?: boolean
  earningsStable5Y?: boolean
  netIncomeCagr5Y?: number
  netIncomeCagr10Y?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  grahamNumber?: number
  priceDecline52W?: number
  priceToIntrinsicValue?: number
  bargainZone?: 'deep' | 'good' | 'mild' | 'none'
  fetchedAt?: string
}

export interface CorporateActionRow {
  id?: number
  symbol: string
  type: string
  exDate: string
  description: string
  value?: number
}

export interface PortfolioRow {
  id?: number
  symbol: string
  quantity: number
  avgBuyPrice: number
  purchaseDate: string
  goalId?: string
  role?: 'core_hold' | 'growth_play' | 'dividend_income' | 'tactical'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface GoalRow {
  id?: string
  name: string
  type: 'emergency' | 'medium_term' | 'long_term' | 'custom'
  targetAmount: number
  targetDate: string
  currentAmount: number
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
  preferredSectors: string[]
  status: 'active' | 'closed' | 'paused'
  createdAt: string
  updatedAt: string
}

export interface SipRow {
  id?: number
  goalId: string
  monthlyAmount: number
  expectedReturn: number
  durationYears: number
  startDate: string
  status: 'active' | 'paused' | 'completed'
}

export interface ReviewRow {
  id?: string
  date: string
  status: 'draft' | 'completed'
  driftResults?: Record<string, { current: number; target: number; drift: number; status: string }>
  exposureResults?: Record<string, { sector: string; current: number; cap: number; status: string }>
  roleFitResults?: Record<string, { role: string; verdict: string; notes: string }>
  benchmarkResults?: Record<string, { stockReturn: number; benchmarkReturn: number; gap: number }>
  notes?: string
  nextReviewDate?: string
  createdAt: string
  updatedAt: string
}

export interface TxRow {
  id?: number
  symbol: string
  date: string
  type: 'buy' | 'sell' | 'sip'
  quantity: number
  price: number
  brokerage?: number
  notes?: string
  goalId?: string
  createdAt: string
}

export interface JournalEntryRow {
  id?: string
  symbol?: string
  title: string
  body: string
  role?: string
  exitTriggers?: string
  nextReviewDate?: string
  tags: string[]
  goalId?: string
  reviewId?: string
  createdAt: string
  updatedAt: string
}

export interface WatchlistRow {
  id?: number
  symbol: string
  addedAt: string
  notes?: string
  priceAtAdd?: number
  peAtAdd?: number
}

export interface UserPreferenceRow {
  key: string
  value: any
  updatedAt: string
}

export interface ScoreSnapshotRow {
  id?: number
  symbol: string
  compositeScore: number
  parameterScores: Record<string, number>
  weightsUsed: Record<string, any>
  createdAt: string
}

export interface BondCacheRow {
  isin: string
  metadata: import('../types/bonds').BondMetadata | null
  priceData: import('../types/bonds').BondPriceData | null
  fetchedAt: string
  source: 'fred' | 'nse' | 'rbi' | 'yahoo' | 'user'
  _parsed?: any
}

export interface BondPortfolioRow {
  id?: number
  isin: string
  name: string
  quantity: number
  avgBuyPrice: number
  purchaseDate: string
  maturityDate: string
  couponRate: number | null
  creditRating: string | null
  type: string
  faceValue?: number
  notes?: string
  goalId?: string
  createdAt: string
  updatedAt: string
}

export interface BondTransactionRow {
  id?: number
  isin: string
  date: string
  type: 'buy' | 'sell' | 'maturity'
  quantity: number
  price: number
  brokerage?: number
  notes?: string
  createdAt: string
}

class AppDatabase extends Dexie {
  stock!: EntityTable<StockRow, 'symbol'>
  priceHistory!: EntityTable<PriceHistoryRow, 'id'>
  fundamental!: EntityTable<FundamentalRow, 'symbol'>
  corporateAction!: EntityTable<CorporateActionRow, 'id'>
  portfolio!: EntityTable<PortfolioRow, 'id'>
  goal!: EntityTable<GoalRow, 'id'>
  sip!: EntityTable<SipRow, 'id'>
  review!: EntityTable<ReviewRow, 'id'>
  tx!: EntityTable<TxRow, 'id'>
  journalEntry!: EntityTable<JournalEntryRow, 'id'>
  watchlist!: EntityTable<WatchlistRow, 'id'>
  userPreference!: EntityTable<UserPreferenceRow, 'key'>
  scoreSnapshot!: EntityTable<ScoreSnapshotRow, 'id'>
  bondCache!: EntityTable<BondCacheRow, 'isin'>
  bondPortfolio!: EntityTable<BondPortfolioRow, 'id'>
  bondTransaction!: EntityTable<BondTransactionRow, 'id'>

  constructor() {
    super('stocks-advisor')
    this.version(2).stores({
      stock: 'symbol, name, sector',
      priceHistory: '++id, symbol, date',
      fundamental: 'symbol',
      corporateAction: '++id, symbol',
      portfolio: '++id, symbol',
      goal: 'id',
      sip: '++id, goalId',
      tx: '++id, symbol, goalId',
      review: 'id',
      journalEntry: 'id, symbol, goalId, reviewId, createdAt',
      watchlist: '++id, symbol',
      userPreference: 'key',
      scoreSnapshot: '++id, symbol, createdAt',
    })
    this.version(3).stores({
      stock: 'symbol, name, sector',
      priceHistory: '++id, symbol, date',
      fundamental: 'symbol',
      corporateAction: '++id, symbol',
      portfolio: '++id, symbol',
      goal: 'id',
      sip: '++id, goalId',
      tx: '++id, symbol, goalId',
      review: 'id, createdAt',
      journalEntry: 'id, symbol, goalId, reviewId, createdAt',
      watchlist: '++id, symbol',
      userPreference: 'key',
      scoreSnapshot: '++id, symbol, createdAt',
      bondCache: 'isin, source',
      bondPortfolio: '++id, isin, type',
      bondTransaction: '++id, isin',
    })
    this.version(4).stores({
      stock: 'symbol, name, sector',
      priceHistory: '++id, symbol, date',
      fundamental: 'symbol',
      corporateAction: '++id, symbol',
      portfolio: '++id, symbol',
      goal: 'id',
      sip: '++id, goalId',
      tx: '++id, symbol, goalId',
      review: 'id, createdAt',
      journalEntry: 'id, symbol, goalId, reviewId, createdAt',
      watchlist: '++id, symbol',
      userPreference: 'key',
      scoreSnapshot: '++id, symbol, createdAt',
      bondCache: 'isin, source',
      bondPortfolio: '++id, isin, type',
      bondTransaction: '++id, isin',
    })
  }
}

export const db = new AppDatabase()

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    console.error('Dexie operation failed:', error)
    return fallback
  }
}

export async function clearAllData(): Promise<void> {
  const allTables = db.tables as unknown as Table[]
  await db.transaction('rw', allTables as unknown as [Table, ...Table[]], async () => {
    for (const table of allTables) {
      await table.clear()
    }
  })
}

export async function exportAllData(): Promise<Record<string, any[]>> {
  const result: Record<string, any[]> = {}
  for (const table of db.tables) {
    result[table.name] = await table.toArray()
  }
  return result
}
