import { RotateCcw } from 'lucide-react'

export interface StockFiltersState {
  marketCap: string
  sector: string
  peMin: number
  peMax: number
  roeMin: number
  roeMax: number
  roceMin: number
  roceMax: number
  deMin: number
  deMax: number
  salesGrowthMin: number
  salesGrowthMax: number
  profitGrowthMin: number
  profitGrowthMax: number
  scoreMin: number
  scoreMax: number
  showBuffettOnly: boolean
  showModifiedBuffettOnly: boolean
  showJhunjhunwalaOnly: boolean
  showJhunjhunwalaModifiedOnly: boolean
  showAll: boolean
}

export const DEFAULT_FILTERS: StockFiltersState = {
  marketCap: '',
  sector: '',
  peMin: 0,
  peMax: 100,
  roeMin: 0,
  roeMax: 60,
  roceMin: 0,
  roceMax: 60,
  deMin: 0,
  deMax: 5,
  salesGrowthMin: -50,
  salesGrowthMax: 200,
  profitGrowthMin: -50,
  profitGrowthMax: 200,
  scoreMin: 0,
  scoreMax: 100,
  showBuffettOnly: false,
  showModifiedBuffettOnly: false,
  showJhunjhunwalaOnly: false,
  showJhunjhunwalaModifiedOnly: false,
  showAll: true,
}

interface StockFiltersProps {
  filters: StockFiltersState
  sectors: string[]
  onChange: (filters: StockFiltersState) => void
  onReset: () => void
}

export function StockFilters({ filters, sectors, onChange, onReset }: StockFiltersProps) {
  const set = (key: keyof StockFiltersState, value: string | number | boolean) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4" role="search" aria-label="Stock filters">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Filters</h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <input
              type="checkbox"
              checked={filters.showAll}
              onChange={(e) => set('showAll', e.target.checked)}
              className="h-3.5 w-3.5 rounded border-[var(--input)] text-[var(--primary)]"
            />
            Show All
          </label>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <RotateCcw size={14} />
            Reset All Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
            Market Cap
          </label>
          <select
            value={filters.marketCap}
            onChange={(e) => set('marketCap', e.target.value)}
            className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)]"
            aria-label="Market cap filter"
          >
            <option value="">All</option>
            <option value="large">Large Cap</option>
            <option value="mid">Mid Cap</option>
            <option value="small">Small Cap</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
            Sector
          </label>
          <select
            value={filters.sector}
            onChange={(e) => set('sector', e.target.value)}
            className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)]"
            aria-label="Sector filter"
          >
            <option value="">All Sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
            P/E Range: {filters.peMin}–{filters.peMax}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={filters.peMin}
              onChange={(e) => set('peMin', Number(e.target.value))}
              disabled={filters.showAll}
              className={`w-full ${filters.showAll ? 'opacity-40' : ''}`}
              aria-label="Minimum P/E"
            />
            <input
              type="range"
              min={0}
              max={100}
              value={filters.peMax}
              onChange={(e) => set('peMax', Number(e.target.value))}
              disabled={filters.showAll}
              className={`w-full ${filters.showAll ? 'opacity-40' : ''}`}
              aria-label="Maximum P/E"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
            ROE Range: {filters.roeMin}%–{filters.roeMax}%
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={60}
              value={filters.roeMin}
              onChange={(e) => set('roeMin', Number(e.target.value))}
              disabled={filters.showAll}
              className={`w-full ${filters.showAll ? 'opacity-40' : ''}`}
              aria-label="Minimum ROE"
            />
            <input
              type="range"
              min={0}
              max={60}
              value={filters.roeMax}
              onChange={(e) => set('roeMax', Number(e.target.value))}
              disabled={filters.showAll}
              className={`w-full ${filters.showAll ? 'opacity-40' : ''}`}
              aria-label="Maximum ROE"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
            ROCE Range: {filters.roceMin}%–{filters.roceMax}%
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={60}
              value={filters.roceMin}
              onChange={(e) => set('roceMin', Number(e.target.value))}
              disabled={filters.showAll}
              className={`w-full ${filters.showAll ? 'opacity-40' : ''}`}
              aria-label="Minimum ROCE"
            />
            <input
              type="range"
              min={0}
              max={60}
              value={filters.roceMax}
              onChange={(e) => set('roceMax', Number(e.target.value))}
              disabled={filters.showAll}
              className={`w-full ${filters.showAll ? 'opacity-40' : ''}`}
              aria-label="Maximum ROCE"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
            D/E Range: {filters.deMin}–{filters.deMax}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={filters.deMin}
              onChange={(e) => set('deMin', Number(e.target.value))}
              disabled={filters.showAll}
              className={`w-full ${filters.showAll ? 'opacity-40' : ''}`}
              aria-label="Minimum D/E"
            />
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={filters.deMax}
              onChange={(e) => set('deMax', Number(e.target.value))}
              disabled={filters.showAll}
              className={`w-full ${filters.showAll ? 'opacity-40' : ''}`}
              aria-label="Maximum D/E"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
            Sales Growth 3Y: {filters.salesGrowthMin}%–{filters.salesGrowthMax}%
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={-50}
              max={200}
              value={filters.salesGrowthMin}
              onChange={(e) => set('salesGrowthMin', Number(e.target.value))}
              disabled={filters.showAll}
              className={`w-full ${filters.showAll ? 'opacity-40' : ''}`}
              aria-label="Minimum sales growth"
            />
            <input
              type="range"
              min={-50}
              max={200}
              value={filters.salesGrowthMax}
              onChange={(e) => set('salesGrowthMax', Number(e.target.value))}
              disabled={filters.showAll}
              className={`w-full ${filters.showAll ? 'opacity-40' : ''}`}
              aria-label="Maximum sales growth"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
            Profit Growth 3Y: {filters.profitGrowthMin}%–{filters.profitGrowthMax}%
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={-50}
              max={200}
              value={filters.profitGrowthMin}
              onChange={(e) => set('profitGrowthMin', Number(e.target.value))}
              disabled={filters.showAll}
              className={`w-full ${filters.showAll ? 'opacity-40' : ''}`}
              aria-label="Minimum profit growth"
            />
            <input
              type="range"
              min={-50}
              max={200}
              value={filters.profitGrowthMax}
              onChange={(e) => set('profitGrowthMax', Number(e.target.value))}
              disabled={filters.showAll}
              className={`w-full ${filters.showAll ? 'opacity-40' : ''}`}
              aria-label="Maximum profit growth"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
            Score Range: {filters.scoreMin}–{filters.scoreMax}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={filters.scoreMin}
              onChange={(e) => set('scoreMin', Number(e.target.value))}
              disabled={filters.showAll}
              className={`w-full ${filters.showAll ? 'opacity-40' : ''}`}
              aria-label="Minimum score"
            />
            <input
              type="range"
              min={0}
              max={100}
              value={filters.scoreMax}
              onChange={(e) => set('scoreMax', Number(e.target.value))}
              disabled={filters.showAll}
              className={`w-full ${filters.showAll ? 'opacity-40' : ''}`}
              aria-label="Maximum score"
            />
          </div>
        </div>

        <div className={`flex items-end ${filters.showAll ? 'opacity-40' : ''}`}>
          <label className={`flex items-center gap-2 ${filters.showAll ? '' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={filters.showBuffettOnly}
              onChange={(e) => set('showBuffettOnly', e.target.checked)}
              disabled={filters.showAll}
              className="h-4 w-4 rounded border-[var(--input)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm font-medium text-[var(--foreground)]">
              Buffett Stocks Only
            </span>
          </label>
        </div>

        <div className={`flex items-end ${filters.showAll ? 'opacity-40' : ''}`}>
          <label className={`flex items-center gap-2 ${filters.showAll ? '' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={filters.showModifiedBuffettOnly}
              onChange={(e) => set('showModifiedBuffettOnly', e.target.checked)}
              disabled={filters.showAll}
              className="h-4 w-4 rounded border-[var(--input)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm font-medium text-[var(--foreground)]">
              Buffett Modified Only
            </span>
          </label>
        </div>

        <div className={`flex items-end ${filters.showAll ? 'opacity-40' : ''}`}>
          <label className={`flex items-center gap-2 ${filters.showAll ? '' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={filters.showJhunjhunwalaOnly}
              onChange={(e) => set('showJhunjhunwalaOnly', e.target.checked)}
              disabled={filters.showAll}
              className="h-4 w-4 rounded border-[var(--input)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm font-medium text-[var(--foreground)]">
              Jhunjhunwala Stocks Only
            </span>
          </label>
        </div>

        <div className={`flex items-end ${filters.showAll ? 'opacity-40' : ''}`}>
          <label className={`flex items-center gap-2 ${filters.showAll ? '' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={filters.showJhunjhunwalaModifiedOnly}
              onChange={(e) => set('showJhunjhunwalaModifiedOnly', e.target.checked)}
              disabled={filters.showAll}
              className="h-4 w-4 rounded border-[var(--input)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm font-medium text-[var(--foreground)]">
              Jhunjhunwala Modified Only
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}
