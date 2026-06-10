import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Search, Loader2, AlertTriangle } from 'lucide-react'
import { db, type PortfolioRow, type GoalRow, type StockRow } from '../../../services/db'

import { calculateSectorOverlap } from '../../../features/portfolio/portfolio-calculations'
import { getQuote } from '../../../services/quote-service'

interface AddHoldingDialogProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  symbol?: string
}

export function AddHoldingDialog({ open, onClose, onSaved, symbol }: AddHoldingDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<StockRow[]>([])
  const [selectedStock, setSelectedStock] = useState<StockRow | null>(null)
  const [quantity, setQuantity] = useState('')
  const [avgBuyPrice, setAvgBuyPrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10))
  const [goalId, setGoalId] = useState('')
  const [role, setRole] = useState<PortfolioRow['role']>(undefined)
  const [notes, setNotes] = useState('')
  const [goals, setGoals] = useState<GoalRow[]>([])
  const [saving, setSaving] = useState(false)
  const [overlap, setOverlap] = useState<{
    sector: string
    currentExposure: number
    newCombinedExposure: number
    overlapPercent: number
    exceedsCap: boolean
  } | null>(null)
  const [overlapLoading, setOverlapLoading] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      db.goal.where('status').equals('active').toArray().then(setGoals)
      setSearchTerm('')
      setResults([])
      setSelectedStock(null)
      setQuantity('')
      setAvgBuyPrice('')
      setPurchaseDate(new Date().toISOString().slice(0, 10))
      setGoalId('')
      setRole(undefined)
      setNotes('')
      setOverlap(null)
      if (symbol) {
        db.stock.get(symbol).then((stock) => {
          if (stock) handleSelectStock(stock)
        })
      } else {
        setTimeout(() => searchRef.current?.focus(), 100)
      }
    }
  }, [open, symbol])

  const handleSearch = useCallback(async (term: string) => {
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
  }, [])

  const handleSelectStock = useCallback(async (stock: StockRow) => {
    setSelectedStock(stock)
    setSearchTerm(`${stock.symbol} - ${stock.name}`)
    const price = stock.lastPrice || (await getQuote(stock.symbol).then((r) => r.data?.lastPrice))
    if (price) setAvgBuyPrice(String(price))
    setResults([])
    setOverlapLoading(true)
    setOverlap(null)

    try {
      const holdings = await db.portfolio.toArray()
      if (holdings.length > 0) {
        const stockSectors: Record<string, string | undefined> = {}
        const stockList = await Promise.all(
          [...new Set(holdings.map((h) => h.symbol))].map((s) => db.stock.get(s)),
        )
        for (const s of stockList) {
          if (s) stockSectors[s.symbol] = s.sector
        }
        stockSectors[stock.symbol] = stock.sector

        const prices: Record<string, number | null> = {}
        for (const h of holdings) {
          prices[h.symbol] = h.avgBuyPrice
        }

        if (stock.lastPrice) {
          prices[stock.symbol] = stock.lastPrice
        }

        const result = calculateSectorOverlap(
          holdings,
          stockSectors,
          prices,
          stock.symbol,
          Number(quantity) || 0,
          stock.lastPrice || 0,
        )
        setOverlap(result)
      }
    } catch {
      // overlap analysis is non-critical
    } finally {
      setOverlapLoading(false)
    }
  }, [quantity])

  const handleSave = useCallback(async () => {
    if (!selectedStock || !quantity || !avgBuyPrice) return
    setSaving(true)
    try {
      const qty = Number(quantity)
      const price = Number(avgBuyPrice)
      const now = new Date().toISOString()

      const existing = await db.portfolio
        .filter((h) => h.symbol === selectedStock.symbol)
        .first()

      if (existing) {
        const totalQty = existing.quantity + qty
        const totalCost = existing.quantity * existing.avgBuyPrice + qty * price
        const newAvg = totalCost / totalQty
        await db.portfolio.update(existing.id!, {
          quantity: totalQty,
          avgBuyPrice: Math.round(newAvg * 100) / 100,
          updatedAt: now,
        })
      } else {
        await db.portfolio.add({
          symbol: selectedStock.symbol,
          quantity: qty,
          avgBuyPrice: price,
          purchaseDate,
          goalId: goalId || undefined,
          role,
          notes: notes || undefined,
          createdAt: now,
          updatedAt: now,
        })
      }

      onSaved()
      onClose()
    } catch (err) {
      console.error('Failed to save holding:', err)
    } finally {
      setSaving(false)
    }
  }, [selectedStock, quantity, avgBuyPrice, purchaseDate, goalId, role, notes, onSaved, onClose])

  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" aria-label="Add Holding" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--card-foreground)]">Add Holding</h2>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Stock</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by symbol or name..."
                className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
              {results.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-[var(--border)] bg-[var(--popover)] shadow-lg">
                  {results.map((s) => (
                    <li
                      key={s.symbol}
                      onClick={() => handleSelectStock(s)}
                      className="cursor-pointer px-3 py-2 text-sm text-[var(--popover-foreground)] hover:bg-[var(--muted)]"
                    >
                      <span className="font-medium">{s.symbol}</span>
                      <span className="ml-2 text-[var(--muted-foreground)]">{s.name}</span>
                      {s.sector && (
                        <span className="ml-2 text-xs text-[var(--muted-foreground)]">({s.sector})</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {overlapLoading && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Loader2 size={14} className="animate-spin" />
              Analyzing sector overlap...
            </div>
          )}

          {overlap && overlap.sector !== 'Unknown' && (
            <div className={`rounded-md border p-3 text-sm ${
              overlap.exceedsCap
                ? 'border-[var(--destructive)]/30 bg-[var(--score-red-bg)]'
                : 'border-[var(--border)] bg-[var(--muted)]'
            }`}>
              <div className="flex items-center gap-2 font-medium">
                {overlap.exceedsCap && <AlertTriangle size={14} className="text-[var(--destructive)]" />}
                Sector: {overlap.sector}
              </div>
              <div className="mt-1 space-y-0.5 text-[var(--muted-foreground)]">
                <div>Current exposure: {overlap.currentExposure.toFixed(1)}%</div>
                <div>Combined exposure: {overlap.newCombinedExposure.toFixed(1)}%</div>
                <div>Overlap: {overlap.overlapPercent.toFixed(1)}%</div>
                {overlap.exceedsCap && (
                  <div className="font-medium text-[var(--destructive)]">
                    Warning: Sector exposure exceeds 15% cap
                  </div>
                )}
              </div>
            </div>
          )}

          {overlap && overlap.sector === 'Unknown' && overlap.currentExposure === 0 && (
            <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] p-3 text-sm text-[var(--muted-foreground)]">
              No holdings in portfolio to compare overlap against.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Quantity</label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value.replace(/[.,].*$/, ''))}
                onKeyDown={(e) => {
                  if (e.key === '.' || e.key === ',') e.preventDefault()
                }}
                className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Avg Buy Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={avgBuyPrice}
                onChange={(e) => setAvgBuyPrice(e.target.value)}
                className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Purchase Date</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Goal (optional)</label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              >
                <option value="">No goal</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Role (optional)</label>
              <select
                value={role ?? ''}
                onChange={(e) => setRole((e.target.value || undefined) as PortfolioRow['role'])}
                className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              >
                <option value="">None</option>
                <option value="core_hold">Core Holding</option>
                <option value="growth_play">Growth Play</option>
                <option value="dividend_income">Dividend Income</option>
                <option value="tactical">Tactical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedStock || !quantity || !avgBuyPrice || saving}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Save Holding
          </button>
        </div>
      </div>
    </div>
  )
}
