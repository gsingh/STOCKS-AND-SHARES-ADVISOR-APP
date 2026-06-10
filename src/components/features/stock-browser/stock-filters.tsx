import { RotateCcw } from 'lucide-react'

export interface StockFiltersState {
  marketCap: string
  sector: string
  peMin: number
  peMax: number
  roeMin: number
  roeMax: number
  scoreMin: number
  scoreMax: number
  showBuffettOnly: boolean
  showModifiedBuffettOnly: boolean
}

export const DEFAULT_FILTERS: StockFiltersState = {
  marketCap: '',
  sector: '',
  peMin: 0,
  peMax: 100,
  roeMin: 0,
  roeMax: 60,
  scoreMin: 0,
  scoreMax: 100,
  showBuffettOnly: false,
  showModifiedBuffettOnly: false,
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
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <RotateCcw size={14} />
          Reset All Filters
        </button>
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
              className="w-full"
              aria-label="Minimum P/E"
            />
            <input
              type="range"
              min={0}
              max={100}
              value={filters.peMax}
              onChange={(e) => set('peMax', Number(e.target.value))}
              className="w-full"
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
              className="w-full"
              aria-label="Minimum ROE"
            />
            <input
              type="range"
              min={0}
              max={60}
              value={filters.roeMax}
              onChange={(e) => set('roeMax', Number(e.target.value))}
              className="w-full"
              aria-label="Maximum ROE"
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
              className="w-full"
              aria-label="Minimum score"
            />
            <input
              type="range"
              min={0}
              max={100}
              value={filters.scoreMax}
              onChange={(e) => set('scoreMax', Number(e.target.value))}
              className="w-full"
              aria-label="Maximum score"
            />
          </div>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showBuffettOnly}
              onChange={(e) => set('showBuffettOnly', e.target.checked)}
              className="h-4 w-4 rounded border-[var(--input)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm font-medium text-[var(--foreground)]">
              Buffett Stocks Only
            </span>
          </label>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showModifiedBuffettOnly}
              onChange={(e) => set('showModifiedBuffettOnly', e.target.checked)}
              className="h-4 w-4 rounded border-[var(--input)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm font-medium text-[var(--foreground)]">
              Buffett Modified Only
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}
