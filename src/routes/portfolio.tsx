import { useState, useEffect, useCallback } from 'react'
import { Plus, ArrowRightLeft, Layers } from 'lucide-react'
import { db } from '../services/db'
import { getQuotes } from '../services/quote-service'
import { LoadingState } from '../components/shared/loading-state'
import { ErrorState } from '../components/shared/error-state'
import {
  calculatePortfolioSummary,
  calculateAllocationBySector,
  calculateAllocationByMarketCap,
  calculateAllocationByStyle,
  type PortfolioSummary,
  type AllocationItem,
} from '../features/portfolio/portfolio-calculations'
import { PortfolioSummaryBar } from '../components/features/portfolio/portfolio-summary'
import { HoldingsTable } from '../components/features/portfolio/holdings-table'
import { AllocationCharts } from '../components/features/portfolio/allocation-charts'
import { AddHoldingDialog } from '../components/features/portfolio/add-holding-dialog'
import { TransactionDialog } from '../components/features/portfolio/transaction-dialog'
import { SectorOverlapDialog } from '../components/features/portfolio/sector-overlap-dialog'

interface EnrichedHolding {
  id: number
  symbol: string
  name: string
  sector: string
  quantity: number
  avgBuyPrice: number
  currentPrice: number | null
  investedValue: number
  currentValue: number
  pnl: number | null
  pnlPercent: number | null
  weightPercent: number
  compositeScore?: number
  role?: string
  goalId?: string
  fetchedAt: string | null
}

type SortKey = 'symbol' | 'quantity' | 'avgBuyPrice' | 'currentPrice' | 'investedValue' | 'currentValue' | 'pnl' | 'pnlPercent' | 'weightPercent'

export default function PortfolioPage() {
  const [enriched, setEnriched] = useState<EnrichedHolding[]>([])
  const [summary, setSummary] = useState<PortfolioSummary>({
    totalInvested: 0, totalCurrentValue: 0, totalPnL: 0, totalPnLPercent: 0,
  })
  const [sectorData, setSectorData] = useState<AllocationItem[]>([])
  const [marketCapData, setMarketCapData] = useState<AllocationItem[]>([])
  const [styleData, setStyleData] = useState<AllocationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('symbol')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showTxDialog, setShowTxDialog] = useState(false)
  const [showOverlapDialog, setShowOverlapDialog] = useState(false)
  const [filter, setFilter] = useState<{ type: string; name: string } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const allHoldings = await db.portfolio.toArray()

      if (allHoldings.length === 0) {
        setEnriched([])
        setSummary({ totalInvested: 0, totalCurrentValue: 0, totalPnL: 0, totalPnLPercent: 0 })
        setSectorData([])
        setMarketCapData([])
        setStyleData([])
        setLoading(false)
        return
      }

      const symbols = [...new Set(allHoldings.map((h) => h.symbol))]
      const stockList = await Promise.all(symbols.map((s) => db.stock.get(s)))
      const stockMap = new Map(stockList.filter(Boolean).map((s) => [s!.symbol, s!]))

      const quoteResults = await getQuotes(symbols)
      const priceMap: Record<string, number | null> = {}
      const fetchedAtMap: Record<string, string | null> = {}
      for (const [sym, result] of Object.entries(quoteResults)) {
        priceMap[sym] = result.data?.lastPrice ?? null
        fetchedAtMap[sym] = result.fetchedAt
      }

      const pricesForCalc: Record<string, number | null> = {}
      for (const h of allHoldings) {
        pricesForCalc[h.symbol] = priceMap[h.symbol] ?? null
      }

      const calcSummary = calculatePortfolioSummary(allHoldings, pricesForCalc)
      setSummary(calcSummary)

      const sectorAlloc = calculateAllocationBySector(
        allHoldings,
        Object.fromEntries(symbols.map((s) => [s, stockMap.get(s)?.sector])),
        pricesForCalc,
      )
      setSectorData(sectorAlloc)

      const marketCapAlloc = calculateAllocationByMarketCap(
        allHoldings,
        Object.fromEntries(symbols.map((s) => [s, stockMap.get(s)?.marketCap])),
        pricesForCalc,
      )
      setMarketCapData(marketCapAlloc)

      const styleAlloc = calculateAllocationByStyle(allHoldings, pricesForCalc)
      setStyleData(styleAlloc)

      const enrichedList: EnrichedHolding[] = allHoldings.map((h) => {
        const currentPrice = priceMap[h.symbol] ?? null
        const pnl = currentPrice !== null ? (currentPrice - h.avgBuyPrice) * h.quantity : null
        const pnlPercent = currentPrice !== null && h.avgBuyPrice > 0
          ? ((currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100
          : null
        const currentValue = currentPrice !== null ? currentPrice * h.quantity : h.avgBuyPrice * h.quantity
        const totalValue = Object.values(priceMap).reduce<number>(
          (sum, p, i) => sum + (p !== null ? p : allHoldings[i]?.avgBuyPrice ?? 0) * (allHoldings[i]?.quantity ?? 0),
          0,
        )
        const weightPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : 0

        return {
          id: h.id!,
          symbol: h.symbol,
          name: stockMap.get(h.symbol)?.name ?? h.symbol,
          sector: stockMap.get(h.symbol)?.sector ?? 'Unknown',
          quantity: h.quantity,
          avgBuyPrice: h.avgBuyPrice,
          currentPrice,
          investedValue: h.quantity * h.avgBuyPrice,
          currentValue,
          pnl,
          pnlPercent,
          weightPercent,
          compositeScore: undefined,
          role: h.role,
          goalId: h.goalId,
          fetchedAt: fetchedAtMap[h.symbol] ?? null,
        }
      })
      setEnriched(enrichedList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDir('asc')
      return key
    })
  }, [])

  const handleRowClick = useCallback((symbol: string) => {
    window.location.href = `/stocks/${symbol}`
  }, [])

  const handleFilterChange = useCallback((newFilter: { type: string; name: string } | null) => {
    setFilter(newFilter)
  }, [])

  const filteredEnriched = filter
    ? enriched.filter((h) => {
        if (filter.type === 'sector') return h.sector === filter.name
        if (filter.type === 'marketCap') return true // market cap filter handled at chart level
        if (filter.type === 'style') {
          const roleLabel = h.role
            ? h.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            : 'Uncategorized'
          return roleLabel === filter.name
        }
        return true
      })
    : enriched

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={loadData} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Portfolio</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTxDialog(true)}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            <ArrowRightLeft size={16} />
            Record Transaction
          </button>
          <button
            onClick={() => setShowOverlapDialog(true)}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            <Layers size={16} />
            Overlap
          </button>
          <button
            onClick={() => setShowAddDialog(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
          >
            <Plus size={16} />
            Add Holding
          </button>
        </div>
      </div>

      <PortfolioSummaryBar summary={summary} />

      {enriched.length > 0 && (
        <AllocationCharts
          sectorData={sectorData}
          marketCapData={marketCapData}
          styleData={styleData}
          onFilterChange={handleFilterChange}
        />
      )}

      {filteredEnriched.length > 0 ? (
        <HoldingsTable
          holdings={filteredEnriched}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onRowClick={handleRowClick}
        />
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            {enriched.length > 0
              ? 'No holdings match the current filter.'
              : 'Your portfolio is empty. Add your first holding to get started.'}
          </p>
        </div>
      )}

      <AddHoldingDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSaved={loadData}
      />

      <TransactionDialog
        open={showTxDialog}
        onClose={() => setShowTxDialog(false)}
        onSaved={loadData}
      />

      <SectorOverlapDialog
        open={showOverlapDialog}
        onClose={() => setShowOverlapDialog(false)}
      />
    </div>
  )
}
