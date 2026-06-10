import { useState } from 'react'
import { useStockStore } from '../stores'
import { useCompareStocks } from '../features/compare/use-compare-stocks'
import { ComparisonTable } from '../components/features/compare/comparison-table'
import { ComparisonCharts } from '../components/features/compare/comparison-charts'
import { FrameworkWizard } from '../components/features/compare/framework/framework-wizard'
import { CompareTray } from '../components/features/compare/compare-tray'
import { PreCheckPanel } from '../components/features/compare/pre-check-panel'
import { ScoringSummary } from '../components/features/compare/scoring-summary'
import { InterplayPanel } from '../components/features/compare/interplay-panel'
import { PriceHistoryChart } from '../components/features/compare/price-history-chart'
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'

const TABS = ['table', 'charts', 'performance', 'framework'] as const
type Tab = (typeof TABS)[number]

const TAB_LABELS: Record<Tab, string> = {
  table: 'Comparison Table',
  charts: 'Charts',
  performance: 'Performance',
  framework: '8-Step Framework',
}

export default function ComparePage() {
  const compareList = useStockStore((s) => s.compareList)
  const [activeTab, setActiveTab] = useState<Tab>('table')
  const [warningsOpen, setWarningsOpen] = useState(false)

  const symbols = compareList.map((c) => c.symbol)
  const { entries, isLoading: isInitialLoad } = useCompareStocks(symbols)

  const allWarnings = entries.map((e) => ({
    fundName: e.name,
    warnings: e.interplayWarnings,
  }))

  const totalWarnings = allWarnings.reduce((s, w) => s + w.warnings.length, 0)
  const hasWarnings = totalWarnings > 0

  const showComparison = entries.length >= 2

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Compare Stocks</h1>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
            Compare up to 4 stocks side-by-side
          </p>
        </div>
        {entries.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
            {entries.length} stock{entries.length > 1 ? 's' : ''} selected
          </span>
        )}
      </div>

      {showComparison && <PreCheckPanel entries={entries} />}

      {showComparison && <ScoringSummary entries={entries} />}

      {!showComparison && !isInitialLoad && (
        <div className="rounded-lg border p-6 text-center text-sm text-[var(--muted-foreground)]">
          Add 2 or more stocks from the Stock Browser to compare them.
        </div>
      )}

      {showComparison && (
        <>
          <div className="flex gap-1 border-b border-[var(--border)]">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {activeTab === 'table' && <ComparisonTable entries={entries} />}
          {activeTab === 'charts' && <ComparisonCharts entries={entries} />}
          {activeTab === 'performance' && (
            <PriceHistoryChart
              stocks={entries.map((e) => ({ symbol: e.symbol, name: e.name }))}
            />
          )}
          {activeTab === 'framework' && <FrameworkWizard />}

          {hasWarnings && (
            <div className="rounded-lg border border-[var(--border)]">
              <button
                onClick={() => setWarningsOpen(!warningsOpen)}
                className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-[var(--foreground)]"
              >
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Interplay Warnings
                <span className="ml-auto flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  {totalWarnings} issue{totalWarnings > 1 ? 's' : ''} found
                  {warningsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </button>
              {warningsOpen && (
                <div className="border-t border-[var(--border)] px-4 py-3">
                  <InterplayPanel allWarnings={allWarnings} />
                </div>
              )}
            </div>
          )}
        </>
      )}

      <CompareTray />
    </div>
  )
}
