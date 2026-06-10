import { useState, useEffect, useCallback } from 'react'
import { useParams } from '@tanstack/react-router'
import { RefreshCw, TrendingUp, Building2, Globe, Plus } from 'lucide-react'
import { getStockData } from '../services/stock-service'
import { db, withErrorHandling } from '../services/db'
import { calculateScore, getDefaultWeights, normalizeWeights } from '../features/scorecard/scoring-engine'
import { getInterplayWarnings, getSectorConcentrationWarnings } from '../features/scorecard/interplay'
import { LoadingState } from '../components/shared/loading-state'
import { ErrorState } from '../components/shared/error-state'
import { FreshnessBadge } from '../components/shared/freshness-badge'
import { ScorecardPanel, ParameterInterplay, WeightCustomizer, ScoreHistoryChart, PriceChart } from '../components/features/scorecard'
import { formatCurrency, formatNumber, formatPercent } from '../lib/format'
import type { StockData } from '../services/stock-service'
import type { FundamentalData } from '../services/fundamentals-service'
import type { ScoringInput, ScoringResult, WeightConfig } from '../features/scorecard/types'
import type { PriceHistoryRow, ScoreSnapshotRow } from '../services/db'
import { AddHoldingDialog } from '../components/features/portfolio/add-holding-dialog'

function toScoringInput(data: FundamentalData): ScoringInput {
  return {
    peRatio: data.peRatio,
    pbRatio: data.pbRatio,
    dividendYield: data.dividendYield,
    roe: data.roe,
    roce: data.roce,
    operatingMargin: data.operatingMargin,
    netProfitMargin: data.netProfitMargin,
    debtToEquity: data.debtToEquity,
    freeCashFlow: data.freeCashFlow,
    bookValue: data.bookValue,
    revenueGrowth: data.revenueGrowth,
    epsGrowth: data.epsGrowth,
    promoterHolding: data.promoterHolding,
    pledgedShares: data.pledgedShares,
    governanceQuality: data.governanceQuality,
    marketCap: data.marketCap,
  }
}

function getMarketCapTier(marketCap?: number): string {
  if (marketCap === undefined) return '—'
  if (marketCap >= 20000) return 'Large Cap'
  if (marketCap >= 5000) return 'Mid Cap'
  return 'Small Cap'
}

export function StockDetailPage() {
  const { symbol } = useParams({ from: '/stocks/$symbol' })
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRow[]>([])
  const [scoreSnapshots, setScoreSnapshots] = useState<ScoreSnapshotRow[]>([])
  const [weights, setWeights] = useState<WeightConfig>(getDefaultWeights())
  const [scoreResult, setScoreResult] = useState<ScoringResult | null>(null)
  const [dataSource, setDataSource] = useState<string>('—')
  const [showAddDialog, setShowAddDialog] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const envelope = await getStockData(symbol)
      if (envelope.error) {
        setError(envelope.error)
      }
      if (envelope.data) {
        setStockData(envelope.data)
        setDataSource(
          envelope.source === 'scraper'
            ? 'Screener.in'
            : envelope.source === 'api'
              ? 'Yahoo Finance'
              : 'Cache',
        )
        if (envelope.data.fundamental) {
          const input = toScoringInput(envelope.data.fundamental)
          const result = calculateScore(input, { categories: weights.categories })
          setScoreResult(result)

          const snapshot: ScoreSnapshotRow = {
            symbol,
            compositeScore: Math.round(result.compositeScore),
            parameterScores: Object.fromEntries(
              result.parameterScores.map((p) => [p.key, p.score]),
            ),
            weightsUsed: weights,
            createdAt: new Date().toISOString(),
          }
          await withErrorHandling(() => db.scoreSnapshot.add(snapshot), undefined)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stock data')
    } finally {
      setLoading(false)
    }
  }, [symbol, weights])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [stockEnv, history, snapshots] = await Promise.all([
          getStockData(symbol),
          withErrorHandling(
            () =>
              db.priceHistory
                .where('symbol')
                .equals(symbol)
                .toArray(),
            [] as PriceHistoryRow[],
          ),
          withErrorHandling(
            () =>
              db.scoreSnapshot
                .where('symbol')
                .equals(symbol)
                .toArray(),
            [] as ScoreSnapshotRow[],
          ),
        ])

        setPriceHistory(history)
        setScoreSnapshots(snapshots)

        const storedWeights = await withErrorHandling(
          () => db.userPreference.get('scorecard-weights'),
          undefined,
        )
        if (storedWeights?.value) {
          const parsed = storedWeights.value as WeightConfig
          parsed.categories = normalizeWeights(parsed.categories as Record<string, number>)
          setWeights(parsed)
        }

        if (stockEnv.error) {
          setError(stockEnv.error)
        }
        if (stockEnv.data) {
          setStockData(stockEnv.data)
          setDataSource(
            stockEnv.source === 'scraper'
              ? 'Screener.in'
              : stockEnv.source === 'api'
                ? 'Yahoo Finance'
                : 'Cache',
          )
          if (stockEnv.data.fundamental) {
            const input = toScoringInput(stockEnv.data.fundamental)
            const result = calculateScore(input, { categories: storedWeights?.value?.categories ?? undefined })
            setScoreResult(result)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stock data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [symbol])

  const handleWeightsChange = useCallback((newWeights: WeightConfig) => {
    setWeights(newWeights)
    if (stockData?.fundamental) {
      const input = toScoringInput(stockData.fundamental)
      const result = calculateScore(input, { categories: newWeights.categories })
      setScoreResult(result)
    }
  }, [stockData])

  const [refreshing, setRefreshing] = useState(false)
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }, [refresh])

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState rows={5} />
      </div>
    )
  }

  if (error && !stockData) {
    return (
      <div className="p-6">
        <ErrorState message={error} onRetry={handleRefresh} />
      </div>
    )
  }

  if (!stockData) {
    return (
      <div className="p-6">
        <ErrorState message="No data available for this symbol." onRetry={handleRefresh} />
      </div>
    )
  }

  const fundamental = stockData.fundamental
  const quote = stockData.quote
  const interplayWarnings = fundamental
    ? getInterplayWarnings(toScoringInput(fundamental))
    : []

  const sectorConcentration = getSectorConcentrationWarnings(
    stockData.quote ? 'Unknown' : '',
    [],
  )

  const allWarnings = [...interplayWarnings, ...sectorConcentration]

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{symbol}</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {stockData.quote ? `Last traded at ${formatCurrency(quote?.lastPrice ?? 0)}` : 'Price unavailable'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {quote?.fetchedAt && (
              <FreshnessBadge fetchedAt={quote.fetchedAt} ttl={15 * 60 * 1000} />
            )}
            <span className="text-xs text-[var(--muted-foreground)]">
              {getMarketCapTier(fundamental?.marketCap)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddDialog(true)}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            <Plus size={16} />
            Add to Portfolio
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {scoreResult && <ScorecardPanel result={scoreResult} />}
          {allWarnings.length > 0 && <ParameterInterplay warnings={allWarnings} />}
          <WeightCustomizer weights={weights} onWeightsChange={handleWeightsChange} />
          <ScoreHistoryChart snapshots={scoreSnapshots} />
          <PriceChart data={priceHistory} />
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Fundamentals</h2>
            {fundamental ? (
              <div className="space-y-3">
                <FundamentalRow label="Market Cap" value={formatCurrency(fundamental.marketCap)} />
                <FundamentalRow label="P/E Ratio" value={formatNumber(fundamental.peRatio)} />
                <FundamentalRow label="P/B Ratio" value={formatNumber(fundamental.pbRatio)} />
                <FundamentalRow label="ROE" value={formatPercent(fundamental.roe)} />
                <FundamentalRow label="ROCE" value={formatPercent(fundamental.roce)} />
                <FundamentalRow label="Operating Margin" value={formatPercent(fundamental.operatingMargin)} />
                <FundamentalRow label="Net Profit Margin" value={formatPercent(fundamental.netProfitMargin)} />
                <FundamentalRow label="Debt to Equity" value={formatNumber(fundamental.debtToEquity)} />
                <FundamentalRow label="EPS" value={formatCurrency(fundamental.eps)} />
                <FundamentalRow label="Dividend Yield" value={formatPercent(fundamental.dividendYield)} />
                <FundamentalRow label="Book Value" value={formatCurrency(fundamental.bookValue)} />
                <FundamentalRow label="Promoter Holding" value={formatPercent(fundamental.promoterHolding)} />
                <FundamentalRow label="Free Cash Flow" value={formatCurrency(fundamental.freeCashFlow)} />
                {fundamental.revenueGrowth != null && (
                  <FundamentalRow label="Revenue Growth" value={formatPercent(fundamental.revenueGrowth)} />
                )}
                {fundamental.epsGrowth != null && (
                  <FundamentalRow label="EPS Growth" value={formatPercent(fundamental.epsGrowth)} />
                )}
                {fundamental.pledgedShares != null && (
                  <FundamentalRow label="Pledged Shares" value={formatPercent(fundamental.pledgedShares)} />
                )}
                {fundamental.governanceQuality != null && (
                  <FundamentalRow label="Governance" value={formatNumber(fundamental.governanceQuality)} />
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">Fundamental data unavailable.</p>
            )}
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Quick Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <QuickStat icon={TrendingUp} label="Day High" value={quote?.dayHigh ? formatCurrency(quote.dayHigh) : '—'} />
              <QuickStat icon={TrendingUp} label="Day Low" value={quote?.dayLow ? formatCurrency(quote.dayLow) : '—'} />
              <QuickStat icon={Building2} label="Volume" value={quote?.volume ? formatNumber(quote.volume) : '—'} />
              <QuickStat icon={Globe} label="Source" value={dataSource} />
            </div>
          </div>
        </div>
      </div>

      <AddHoldingDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSaved={refresh}
        symbol={symbol}
      />
    </div>
  )
}

function FundamentalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      <span className="text-sm tabular-nums text-[var(--foreground)]">{value}</span>
    </div>
  )
}

function QuickStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ size: number; className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-md bg-[var(--muted)] p-3">
      <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
        <Icon size={14} aria-hidden="true" />
        <span>{label}</span>
      </div>
      <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--foreground)]">{value}</p>
    </div>
  )
}
