import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, ArrowRight, Save } from 'lucide-react'
import { db, type PortfolioRow, type FundamentalRow, type StockRow } from '../../../services/db'
import { LoadingState } from '../../shared/loading-state'
import { ErrorState } from '../../shared/error-state'
import { DriftAnalysis } from './drift-analysis'
import { ExposureCheck } from './exposure-check'
import { RoleFitStep } from './role-fit-step'
import { BenchmarkStep } from './benchmark-step'
import { RationaleStep } from './rationale-step'

interface Step {
  id: string
  label: string
}

const STEPS: Step[] = [
  { id: 'drift', label: 'Drift Analysis' },
  { id: 'exposure', label: 'Exposure Check' },
  { id: 'role_fit', label: 'Role-Fit' },
  { id: 'benchmark', label: 'Benchmark' },
  { id: 'rationale', label: 'Rationale' },
]

interface DriftStockData {
  symbol: string
  name: string
  currentAllocation: number
  targetAllocation: number
}

interface ExposureData {
  sector: string
  current: number
  cap: number
}

interface RoleFitStockData {
  symbol: string
  name: string
  sector: string | null
  role: 'core_hold' | 'growth_play' | 'dividend_income' | 'tactical'
  dividendYield: number | null
  epsGrowth: number | null
  peRatio: number | null
  marketCap: number | null
  revenueGrowth: number | null
}

interface BenchmarkStockData {
  symbol: string
  name: string
  stockReturn: number
  benchmarkReturn: number
}

interface ReviewWizardProps {
  onSave: (data: any) => Promise<void>
  onCancel: () => void
}

export function ReviewWizard({ onSave, onCancel }: ReviewWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [portfolio, setPortfolio] = useState<PortfolioRow[]>([])
  const [stocks, setStocks] = useState<StockRow[]>([])
  const [fundamentals, setFundamentals] = useState<FundamentalRow[]>([])

  const [driftResults, setDriftResults] = useState<any>(null)
  const [exposureResults, setExposureResults] = useState<any>(null)
  const [roleFitResults, setRoleFitResults] = useState<any>(null)
  const [benchmarkResults, setBenchmarkResults] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [nextReviewDate, setNextReviewDate] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [portfolioData, stockData, fundamentalData] = await Promise.all([
        db.portfolio.toArray(),
        db.stock.toArray(),
        db.fundamental.toArray(),
      ])
      setPortfolio(portfolioData)
      setStocks(stockData)
      setFundamentals(fundamentalData)
    } catch {
      setError('Failed to load portfolio data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const now = new Date().toISOString()
      await onSave({
        date: now,
        status: 'completed',
        driftResults: driftResults ?? undefined,
        exposureResults: exposureResults ?? undefined,
        roleFitResults: roleFitResults ?? undefined,
        benchmarkResults: benchmarkResults ?? undefined,
        notes: notes || undefined,
        nextReviewDate: nextReviewDate || undefined,
      })
    } finally {
      setSaving(false)
    }
  }, [onSave, driftResults, exposureResults, roleFitResults, benchmarkResults, notes, nextReviewDate])

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1)
    }
  }, [currentStep])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }, [currentStep])

  if (loading) return <LoadingState rows={5} />
  if (error) return <ErrorState message={error} onRetry={loadData} />

  const portfolioValue = portfolio.reduce(
    (sum, h) => sum + h.quantity * (stocks.find((s) => s.symbol === h.symbol)?.lastPrice ?? h.avgBuyPrice),
    0,
  )

  const driftStocks: DriftStockData[] = portfolio.map((h) => {
    const currentPrice = stocks.find((s) => s.symbol === h.symbol)?.lastPrice ?? h.avgBuyPrice
    const currentValue = h.quantity * currentPrice
    return {
      symbol: h.symbol,
      name: stocks.find((s) => s.symbol === h.symbol)?.name ?? h.symbol,
      currentAllocation: portfolioValue > 0 ? (currentValue / portfolioValue) * 100 : 0,
      targetAllocation: portfolio.length > 0 ? 100 / portfolio.length : 0,
    }
  })

  const sectorExposures: ExposureData[] = (() => {
    const sectorMap = new Map<string, number>()
    for (const h of portfolio) {
      const stock = stocks.find((s) => s.symbol === h.symbol)
      const sector = stock?.sector ?? 'Other'
      const currentPrice = stock?.lastPrice ?? h.avgBuyPrice
      const currentValue = h.quantity * currentPrice
      sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + currentValue)
    }
    return Array.from(sectorMap.entries()).map(([sector, value]) => ({
      sector,
      current: portfolioValue > 0 ? (value / portfolioValue) * 100 : 0,
      cap: getSectorCap(sector),
    }))
  })()

  const roleFitStocks: RoleFitStockData[] = portfolio
    .filter((h) => h.role)
    .map((h) => {
      const fund = fundamentals.find((f) => f.symbol === h.symbol)
      const stock = stocks.find((s) => s.symbol === h.symbol)
      return {
        symbol: h.symbol,
        name: stock?.name ?? h.symbol,
        sector: stock?.sector ?? null,
        role: h.role!,
        dividendYield: fund?.dividendYield ?? null,
        epsGrowth: fund?.epsGrowth ?? null,
        peRatio: fund?.peRatio ?? null,
        marketCap: fund?.marketCap ?? stock?.marketCap ?? null,
        revenueGrowth: fund?.revenueGrowth ?? null,
      }
    })

  const benchmarkStocks: BenchmarkStockData[] = portfolio.map((h) => {
    const stock = stocks.find((s) => s.symbol === h.symbol)
    const fund = fundamentals.find((f) => f.symbol === h.symbol)
    const currentPrice = stock?.lastPrice ?? h.avgBuyPrice
    const stockReturn = h.avgBuyPrice > 0 ? ((currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100 : 0
    const sectorBenchmark = getSectorBenchmark(stock?.sector)
    const benchmarkReturn = fund?.epsGrowth ?? sectorBenchmark
    return {
      symbol: h.symbol,
      name: stock?.name ?? h.symbol,
      stockReturn,
      benchmarkReturn,
    }
  })

  const isFirst = currentStep === 0
  const isLast = currentStep === STEPS.length - 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">New Portfolio Review</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].label}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          Cancel
        </button>
      </div>

      <div className="flex gap-2">
        {STEPS.map((step, i) => (
          <div
            key={step.id}
            className={`flex-1 rounded-full h-2 transition-colors ${
              i <= currentStep ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
            }`}
          />
        ))}
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        {currentStep === 0 && (
          <DriftAnalysis
            stocks={driftStocks}
            onResults={setDriftResults}
          />
        )}
        {currentStep === 1 && (
          <ExposureCheck
            exposures={sectorExposures}
            onResults={setExposureResults}
          />
        )}
        {currentStep === 2 && (
          <RoleFitStep
            stocks={roleFitStocks}
            onResults={setRoleFitResults}
          />
        )}
        {currentStep === 3 && (
          <BenchmarkStep
            stocks={benchmarkStocks}
            onResults={setBenchmarkResults}
          />
        )}
        {currentStep === 4 && (
          <RationaleStep
            notes={notes}
            onNotesChange={setNotes}
            nextReviewDate={nextReviewDate}
            onNextReviewDateChange={setNextReviewDate}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={isFirst ? onCancel : handlePrev}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
        >
          <ArrowLeft size={16} />
          {isFirst ? 'Cancel' : 'Previous'}
        </button>

        {isLast ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Review'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90"
          >
            Next
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

function getSectorCap(sector: string): number {
  const caps: Record<string, number> = {
    'Banking': 25,
    'Financial Services': 25,
    'Information Technology': 25,
    'Pharmaceuticals': 20,
    'Automobile': 20,
    'FMCG': 20,
    'Oil & Gas': 20,
    'Telecommunications': 20,
    'Power': 20,
    'Metals & Mining': 20,
    'Construction': 20,
    'Real Estate': 15,
    'Textiles': 15,
    'Media': 15,
  }
  return caps[sector] ?? 15
}

function getSectorBenchmark(sector: string | undefined): number {
  const benchmarks: Record<string, number> = {
    'Banking': 13,
    'Financial Services': 14,
    'Information Technology': 18,
    'Pharmaceuticals': 16,
    'Automobile': 12,
    'FMCG': 14,
    'Oil & Gas': 11,
    'Telecommunications': 10,
    'Power': 12,
    'Metals & Mining': 15,
    'Construction': 16,
    'Real Estate': 14,
  }
  return benchmarks[sector ?? ''] ?? 12
}
