import { useState, useEffect } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import { db, type StockRow } from '../../../services/db'
import { calculateSectorOverlap, type SectorOverlapResult } from '../../../features/portfolio/portfolio-calculations'

interface SectorOverlapDialogProps {
  open: boolean
  onClose: () => void
  candidateSymbol?: string
}

export function SectorOverlapDialog({ open, onClose, candidateSymbol }: SectorOverlapDialogProps) {
  const [symbol, setSymbol] = useState(candidateSymbol ?? '')
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<StockRow[]>([])
  const [result, setResult] = useState<SectorOverlapResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [noHoldings, setNoHoldings] = useState(false)

  useEffect(() => {
    if (open) {
      setSymbol(candidateSymbol ?? '')
      setSearchTerm('')
      setResult(null)
      setNoHoldings(false)
    }
  }, [open, candidateSymbol])

  const handleSearch = async (term: string) => {
    setSearchTerm(term)
    if (term.length < 1) {
      setResults([])
      return
    }
    const upper = term.toUpperCase()
    const bySymbol = await db.stock
      .filter((s) => s.symbol.includes(upper))
      .limit(10)
      .toArray()
    const byName = await db.stock
      .filter((s) => s.name.toUpperCase().includes(upper))
      .limit(10)
      .toArray()
    const merged = new Map<string, StockRow>()
    for (const s of [...bySymbol, ...byName]) {
      merged.set(s.symbol, s)
    }
    setResults(Array.from(merged.values()).slice(0, 10))
  }

  const handleSelect = async (stock: StockRow) => {
    setSymbol(stock.symbol)
    setSearchTerm(`${stock.symbol} - ${stock.name}`)
    setResults([])
    setLoading(true)
    setResult(null)
    setNoHoldings(false)

    try {
      const holdings = await db.portfolio.toArray()
      if (holdings.length === 0) {
        setNoHoldings(true)
        setLoading(false)
        return
      }

      const stockSectors: Record<string, string | undefined> = {}
      const allSymbols = [...new Set([...holdings.map((h) => h.symbol), stock.symbol])]
      const stockList = await Promise.all(allSymbols.map((s) => db.stock.get(s)))
      for (const s of stockList) {
        if (s) stockSectors[s.symbol] = s.sector
      }

      const prices: Record<string, number | null> = {}
      for (const h of holdings) {
        prices[h.symbol] = h.avgBuyPrice
      }
      if (stock.lastPrice) {
        prices[stock.symbol] = stock.lastPrice
      }

      const overlapResult = calculateSectorOverlap(
        holdings,
        stockSectors,
        prices,
        stock.symbol,
        1,
        stock.lastPrice || 0,
      )
      setResult(overlapResult)
    } catch (err) {
      console.error('Overlap analysis failed:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" aria-label="Sector Overlap Analysis" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--card-foreground)]">Sector Overlap Analysis</h2>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Stock</label>
            <input
              type="text"
              value={searchTerm || symbol}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search stock..."
              aria-label="Search stock"
              className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
            {results.length > 0 && (
              <ul className="mt-1 max-h-48 overflow-auto rounded-md border border-[var(--border)] bg-[var(--popover)] shadow-lg">
                {results.map((s) => (
                  <li
                    key={s.symbol}
                    onClick={() => handleSelect(s)}
                    className="cursor-pointer px-3 py-2 text-sm text-[var(--popover-foreground)] hover:bg-[var(--muted)]"
                  >
                    <span className="font-medium">{s.symbol}</span>
                    <span className="ml-2 text-[var(--muted-foreground)]">{s.name}</span>
                    <span className="ml-2 text-xs text-[var(--muted-foreground)]">({s.sector ?? 'N/A'})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Loader2 size={14} className="animate-spin" />
              Analyzing...
            </div>
          )}

          {noHoldings && (
            <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] p-3 text-sm text-[var(--muted-foreground)]">
              No holdings in portfolio to compare overlap against.
            </div>
          )}

          {result && result.sector !== 'Unknown' && (
            <div className={`rounded-md border p-4 ${result.exceedsCap ? 'border-[var(--destructive)]/30 bg-[var(--score-red-bg)]' : 'border-[var(--border)] bg-[var(--muted)]'}`}>
              {result.exceedsCap && (
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--destructive)]">
                  <AlertTriangle size={16} />
                  Exceeds sector cap
                </div>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Sector</span>
                  <span className="font-medium text-[var(--foreground)]">{result.sector}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Current Exposure</span>
                  <span className="tabular-nums text-[var(--foreground)]">{result.currentExposure.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Combined Exposure</span>
                  <span className="tabular-nums text-[var(--foreground)]">{result.newCombinedExposure.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Overlap</span>
                  <span className="tabular-nums text-[var(--foreground)]">{result.overlapPercent.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          {result && result.sector === 'Unknown' && (
            <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] p-3 text-sm text-[var(--muted-foreground)]">
              Sector information not available for this stock.
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
