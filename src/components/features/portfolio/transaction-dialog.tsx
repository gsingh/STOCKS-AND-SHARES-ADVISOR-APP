import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Search, Loader2 } from 'lucide-react'
import { db, type GoalRow, type StockRow } from '../../../services/db'

interface TransactionDialogProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function TransactionDialog({ open, onClose, onSaved }: TransactionDialogProps) {
  const [type, setType] = useState<'buy' | 'sell' | 'sip'>('buy')
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<StockRow[]>([])
  const [selectedStock, setSelectedStock] = useState<StockRow | null>(null)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [brokerage, setBrokerage] = useState('')
  const [goalId, setGoalId] = useState('')
  const [notes, setNotes] = useState('')
  const [goals, setGoals] = useState<GoalRow[]>([])
  const [saving, setSaving] = useState(false)
  const [sellableQty, setSellableQty] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      db.goal.where('status').equals('active').toArray().then(setGoals)
      setType('buy')
      setSearchTerm('')
      setResults([])
      setSelectedStock(null)
      setDate(new Date().toISOString().slice(0, 10))
      setQuantity('')
      setPrice('')
      setBrokerage('')
      setGoalId('')
      setNotes('')
      setSellableQty(0)
      setTimeout(() => searchRef.current?.focus(), 100)
    }
  }, [open])

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
    setResults([])

    const holding = await db.portfolio
      .filter((h) => h.symbol === stock.symbol)
      .first()
    setSellableQty(holding?.quantity ?? 0)
  }, [])

  const handleSave = useCallback(async () => {
    if (!selectedStock || !quantity || !price || !date) return
    setSaving(true)
    try {
      const qty = Number(quantity)
      const unitPrice = Number(price)
      const brokerageAmt = brokerage ? Number(brokerage) : 0
      const now = new Date().toISOString()

      await db.tx.add({
        symbol: selectedStock.symbol,
        date,
        type,
        quantity: qty,
        price: unitPrice,
        brokerage: brokerageAmt || undefined,
        notes: notes || undefined,
        goalId: goalId || undefined,
        createdAt: now,
      })

      const existing = await db.portfolio
        .filter((h) => h.symbol === selectedStock.symbol)
        .first()

      if (type === 'buy') {
        if (existing) {
          const totalQty = existing.quantity + qty
          const totalCost = existing.quantity * existing.avgBuyPrice + qty * unitPrice
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
            avgBuyPrice: unitPrice,
            purchaseDate: date,
            goalId: goalId || undefined,
            createdAt: now,
            updatedAt: now,
          })
        }
      } else if (type === 'sell') {
        if (existing) {
          const remaining = existing.quantity - qty
          if (remaining <= 0) {
            await db.portfolio.delete(existing.id!)
          } else {
            await db.portfolio.update(existing.id!, {
              quantity: remaining,
              updatedAt: now,
            })
          }
        }
      }

      onSaved()
      onClose()
    } catch (err) {
      console.error('Failed to save transaction:', err)
    } finally {
      setSaving(false)
    }
  }, [selectedStock, type, quantity, price, date, brokerage, goalId, notes, onSaved, onClose])

  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" aria-label="Record Transaction" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--card-foreground)]">Record Transaction</h2>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Type</label>
            <div className="flex gap-2">
              {(['buy', 'sell', 'sip'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                    type === t
                      ? 'border-[var(--ring)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {type === 'sell' && selectedStock && (
            <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] p-2 text-sm text-[var(--muted-foreground)]">
              Available to sell: {sellableQty} units
            </div>
          )}

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
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Quantity</label>
              <input
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Brokerage (optional)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={brokerage}
                onChange={(e) => setBrokerage(e.target.value)}
                className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>
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
            disabled={!selectedStock || !quantity || !price || saving}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Record Transaction
          </button>
        </div>
      </div>
    </div>
  )
}
