import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Calendar,
  Download,
  Upload,
  Sun,
  Moon,
  SlidersHorizontal,
  RotateCcw,
  Save,
  AlertTriangle,
  X,
} from 'lucide-react'
import { useUIStore } from '../stores'
import { db, clearAllData, exportAllData } from '../services/db'
import { showToast } from '../components/shared/toast'
import { CATEGORIES, PARAMETER_META } from '../features/scorecard/parameters'

function ConfirmationDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-[var(--warning)]" />
            <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mb-6 text-sm text-[var(--foreground)]">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-[var(--destructive)] px-4 py-2 text-sm font-medium text-[var(--destructive-foreground)] hover:bg-[var(--destructive)]/90"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useUIStore()
  const [reviewFrequency, setReviewFrequency] = useState('monthly')
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [pendingImport, setPendingImport] = useState<Record<string, unknown[]> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [categoryWeights, setCategoryWeights] = useState<Record<string, number>>({})

  useEffect(() => {
    db.userPreference.get('reviewFrequency').then((row) => {
      if (row?.value) setReviewFrequency(row.value as string)
    })
    db.userPreference.get('defaultWeights').then((row) => {
      if (row?.value) {
        setCategoryWeights(row.value as Record<string, number>)
      } else {
        setCategoryWeights(
          Object.fromEntries(CATEGORIES.map((c) => [c.id, c.weight])),
        )
      }
    })
  }, [])

  const handleFrequencyChange = useCallback(
    async (value: string) => {
      setReviewFrequency(value)
      await db.userPreference.put({ key: 'reviewFrequency', value, updatedAt: new Date().toISOString() })
      showToast('Review frequency saved', 'success')
    },
    [],
  )

  const handleExport = useCallback(async () => {
    try {
      const data = await exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().slice(0, 10)
      a.download = `stocks-advisor-export-${dateStr}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('Data exported successfully', 'success')
    } catch {
      showToast('Export failed', 'error')
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string)
        if (typeof json !== 'object' || json === null) {
          showToast('Invalid JSON format', 'error')
          return
        }
        setPendingImport(json)
        setImportDialogOpen(true)
      } catch {
        showToast('Invalid JSON file', 'error')
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleImportConfirm = useCallback(async () => {
    if (!pendingImport) return
    try {
      await clearAllData()
      for (const [tableName, rows] of Object.entries(pendingImport)) {
        if (Array.isArray(rows) && rows.length > 0) {
          const table = db.table(tableName)
          if (table) {
            await table.bulkAdd(rows)
          }
        }
      }
      showToast('Data imported successfully', 'success')
    } catch {
      showToast('Import failed. The file format may be incompatible.', 'error')
    }
    setImportDialogOpen(false)
    setPendingImport(null)
  }, [pendingImport])

  const handleWeightChange = useCallback((key: string, value: number) => {
    setCategoryWeights((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSaveWeights = useCallback(async () => {
    await db.userPreference.put({
      key: 'defaultWeights',
      value: categoryWeights,
      updatedAt: new Date().toISOString(),
    })
    showToast('Default weights saved', 'success')
  }, [categoryWeights])

  const handleResetWeights = useCallback(async () => {
    const defaults = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.weight]))
    setCategoryWeights(defaults)
    await db.userPreference.put({
      key: 'defaultWeights',
      value: defaults,
      updatedAt: new Date().toISOString(),
    })
    showToast('Weights reset to factory defaults', 'info')
  }, [])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Review Frequency */}
        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-3 flex items-center gap-3">
            <Calendar size={18} className="text-[var(--muted-foreground)]" />
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Review Frequency
            </h2>
          </div>
          <p className="mb-3 text-xs text-[var(--muted-foreground)]">
            How often should the app remind you to review your portfolio?
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="reviewFrequency"
                value="monthly"
                checked={reviewFrequency === 'monthly'}
                onChange={(e) => handleFrequencyChange(e.target.value)}
                className="text-[var(--accent)]"
              />
              <span className="text-sm text-[var(--foreground)]">Monthly</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="reviewFrequency"
                value="quarterly"
                checked={reviewFrequency === 'quarterly'}
                onChange={(e) => handleFrequencyChange(e.target.value)}
                className="text-[var(--accent)]"
              />
              <span className="text-sm text-[var(--foreground)]">Quarterly</span>
            </label>
          </div>
        </section>

        {/* Theme */}
        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'light' ? (
                <Sun size={18} className="text-[var(--muted-foreground)]" />
              ) : (
                <Moon size={18} className="text-[var(--muted-foreground)]" />
              )}
              <div>
                <h2 className="text-sm font-semibold text-[var(--foreground)]">Theme</h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Switch between light and dark mode
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                theme === 'dark' ? 'bg-[var(--accent)]' : 'bg-[var(--input)]'
              }`}
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label="Toggle theme"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Data Export */}
        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-3 flex items-center gap-3">
            <Download size={18} className="text-[var(--muted-foreground)]" />
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Data Export</h2>
          </div>
          <p className="mb-3 text-xs text-[var(--muted-foreground)]">
            Download all your portfolio data as a JSON file.
          </p>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            <Download size={16} />
            Export Data
          </button>
        </section>

        {/* Data Import */}
        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-3 flex items-center gap-3">
            <Upload size={18} className="text-[var(--muted-foreground)]" />
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Data Import</h2>
          </div>
          <p className="mb-3 text-xs text-[var(--muted-foreground)]">
            Import data from a previously exported JSON file. This will replace all existing data.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            <Upload size={16} />
            Choose File & Import
          </button>
        </section>

        {/* Weight Defaults */}
        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-3 flex items-center gap-3">
            <SlidersHorizontal size={18} className="text-[var(--muted-foreground)]" />
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Default Weights
            </h2>
          </div>
          <p className="mb-4 text-xs text-[var(--muted-foreground)]">
            Adjust the default category weights used for stock scoring.
          </p>

          <div className="space-y-4">
            {CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {cat.name}
                  </span>
                  <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
                    {(categoryWeights[cat.id] ?? cat.weight) * 100}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={categoryWeights[cat.id] ?? cat.weight}
                  onChange={(e) => handleWeightChange(cat.id, parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
                <div className="flex flex-wrap gap-1.5">
                  {cat.parameterKeys.map((pk) => {
                    const meta = PARAMETER_META[pk]
                    return (
                      <span
                        key={pk}
                        className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]"
                      >
                        {meta?.name ?? pk}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSaveWeights}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90"
            >
              <Save size={16} />
              Save as Defaults
            </button>
            <button
              onClick={handleResetWeights}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
            >
              <RotateCcw size={16} />
              Reset to Factory
            </button>
          </div>
        </section>
      </div>

      <ConfirmationDialog
        open={importDialogOpen}
        title="Import Data"
        message="This will replace all existing data. Continue?"
        onConfirm={handleImportConfirm}
        onCancel={() => {
          setImportDialogOpen(false)
          setPendingImport(null)
        }}
      />
    </div>
  )
}
