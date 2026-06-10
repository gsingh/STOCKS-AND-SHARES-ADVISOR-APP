import { useState, useEffect, useCallback } from 'react'
import { X, Loader2 } from 'lucide-react'
import { db, type GoalRow } from '../../../services/db'

interface GoalFormDialogProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editGoal?: GoalRow | null
}

const GOAL_TYPES: { value: GoalRow['type']; label: string }[] = [
  { value: 'emergency', label: 'Emergency Fund' },
  { value: 'medium_term', label: 'Medium-Term' },
  { value: 'long_term', label: 'Long-Term' },
  { value: 'custom', label: 'Custom' },
]

const RISK_PROFILES: { value: GoalRow['riskProfile']; label: string }[] = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'aggressive', label: 'Aggressive' },
]

export function GoalFormDialog({ open, onClose, onSaved, editGoal }: GoalFormDialogProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<GoalRow['type']>('long_term')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [riskProfile, setRiskProfile] = useState<GoalRow['riskProfile']>('moderate')
  const [preferredSectors, setPreferredSectors] = useState<string[]>([])
  const [availableSectors, setAvailableSectors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      db.stock
        .toArray()
        .then((stocks) => {
          const sectors = [...new Set(stocks.map((s) => s.sector).filter(Boolean))]
          setAvailableSectors(sectors.sort())
        })
        .catch(() => {})

      if (editGoal) {
        setName(editGoal.name)
        setType(editGoal.type)
        setTargetAmount(String(editGoal.targetAmount))
        setTargetDate(editGoal.targetDate)
        setCurrentAmount(String(editGoal.currentAmount))
        setRiskProfile(editGoal.riskProfile)
        setPreferredSectors(editGoal.preferredSectors)
      } else {
        setName('')
        setType('long_term')
        setTargetAmount('')
        setTargetDate('')
        setCurrentAmount('')
        setRiskProfile('moderate')
        setPreferredSectors([])
      }
    }
  }, [open, editGoal])

  const toggleSector = useCallback((sector: string) => {
    setPreferredSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector],
    )
  }, [])

  const handleSave = useCallback(async () => {
    if (!name || !targetAmount || !targetDate) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const data = {
        name,
        type,
        targetAmount: Number(targetAmount),
        targetDate,
        currentAmount: Number(currentAmount) || 0,
        riskProfile,
        preferredSectors,
        status: 'active' as const,
        updatedAt: now,
      }

      if (editGoal?.id) {
        await db.goal.update(editGoal.id, data)
      } else {
        await db.goal.add({
          ...data,
          id: crypto.randomUUID(),
          createdAt: now,
        })
      }

      onSaved()
      onClose()
    } catch (err) {
      console.error('Failed to save goal:', err)
    } finally {
      setSaving(false)
    }
  }, [name, type, targetAmount, targetDate, currentAmount, riskProfile, preferredSectors, editGoal, onSaved, onClose])

  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" aria-label="Goal Form" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--card-foreground)]">
            {editGoal ? 'Edit Goal' : 'Create Goal'}
          </h2>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Retirement Corpus"
              className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    type === t.value
                      ? 'border-[var(--ring)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Target Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Current Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Risk Profile</label>
              <select
                value={riskProfile}
                onChange={(e) => setRiskProfile(e.target.value as GoalRow['riskProfile'])}
                className="w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              >
                {RISK_PROFILES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Preferred Sectors</label>
            <div className="flex flex-wrap gap-2">
              {availableSectors.map((sector) => (
                <button
                  key={sector}
                  onClick={() => toggleSector(sector)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    preferredSectors.includes(sector)
                      ? 'border-[var(--ring)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                  }`}
                >
                  {sector}
                </button>
              ))}
            </div>
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
            disabled={!name || !targetAmount || !targetDate || saving}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {editGoal ? 'Update Goal' : 'Create Goal'}
          </button>
        </div>
      </div>
    </div>
  )
}
