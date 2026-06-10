import { useState, useEffect } from 'react'
import { AlertTriangle, AlertCircle, Info, X, CheckCircle, ExternalLink } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { db } from '../../../services/db'
import { getQuotes } from '../../../services/quote-service'
import { calculateAllocationBySector } from '../../../features/portfolio/portfolio-calculations'

interface Alert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  action: { label: string; to: string }
}

async function generateAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = []
  let id = 0
  const nextId = () => String(++id)

  const reviews = await db.review.toArray()
  const latestReview = reviews
    .filter((r) => r.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

  if (latestReview?.nextReviewDate && new Date(latestReview.nextReviewDate) < new Date()) {
    alerts.push({
      id: nextId(),
      severity: 'critical',
      title: 'Review Due',
      description: `Portfolio review was due on ${new Date(latestReview.nextReviewDate).toLocaleDateString()}. Stocks may need rebalancing.`,
      action: { label: 'Start Review', to: '/reviews' },
    })
  } else if (reviews.length === 0) {
    alerts.push({
      id: nextId(),
      severity: 'info',
      title: 'No Reviews Yet',
      description: 'You haven\'t created any portfolio reviews yet. Reviews help track drift and rebalance.',
      action: { label: 'Start Review', to: '/reviews' },
    })
  }

  const holdings = await db.portfolio.toArray()
  if (holdings.length > 0) {
    const symbols = [...new Set(holdings.map((h) => h.symbol))]
    const stockList = await Promise.all(symbols.map((s) => db.stock.get(s)))
    const stockSectors: Record<string, string | undefined> = {}
    for (const s of stockList) {
      if (s) stockSectors[s.symbol] = s.sector
    }

    const quoteResults = await getQuotes(symbols)
    const prices: Record<string, number | null> = {}
    for (const symbol of symbols) {
      prices[symbol] = quoteResults[symbol]?.data?.lastPrice ?? null
    }

    const sectorAllocations = calculateAllocationBySector(holdings, stockSectors, prices)
    const SECTOR_CAP = 25
    for (const sec of sectorAllocations) {
      if (sec.percentage > SECTOR_CAP) {
        alerts.push({
          id: nextId(),
          severity: 'warning',
          title: 'Sector Cap Exceeded',
          description: `${sec.name} sector allocation (${sec.percentage.toFixed(1)}%) has exceeded the ${SECTOR_CAP}% cap.`,
          action: { label: 'Review Allocation', to: '/portfolio' },
        })
      }
    }

    let staleCount = 0
    for (const symbol of symbols) {
      const quote = quoteResults[symbol]
      if (!quote?.data || quote.source === 'cache') {
        staleCount++
      }
    }
    if (staleCount > 0 && staleCount === symbols.length) {
      alerts.push({
        id: nextId(),
        severity: 'info',
        title: 'Stale Quotes',
        description: 'Real-time quotes are unavailable. Portfolio values may not reflect current market prices.',
        action: { label: 'Refresh', to: '/portfolio' },
      })
    }
  }

  return alerts
}

const SEVERITY_ICONS = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
}

const SEVERITY_COLORS = {
  critical: 'border-[var(--score-red)]/30 bg-[var(--score-red-bg)]',
  warning: 'border-[var(--score-amber)]/30 bg-[var(--score-amber-bg)]',
  info: 'border-[var(--primary)]/20 bg-[var(--primary)]/10',
}

const SEVERITY_ICON_COLORS = {
  critical: 'text-[var(--score-red)]',
  warning: 'text-[var(--score-amber)]',
  info: 'text-[var(--primary)]',
}

export function ActiveAlerts() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generateAlerts().then(setAlerts).finally(() => setLoading(false))
  }, [])

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">Checking alerts...</p>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <CheckCircle size={40} className="mx-auto mb-3 text-[var(--score-green)]" />
        <p className="text-sm font-medium text-[var(--foreground)]">All clear</p>
        <p className="text-xs text-[var(--muted-foreground)]">No outstanding alerts.</p>
      </div>
    )
  }

  const priorityOrder = { critical: 0, warning: 1, info: 2 }
  const sorted = [...alerts].sort((a, b) => priorityOrder[a.severity] - priorityOrder[b.severity])

  return (
    <div className="space-y-2">
      {sorted.map((alert) => {
        const Icon = SEVERITY_ICONS[alert.severity]
        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 rounded-lg border p-4 ${SEVERITY_COLORS[alert.severity]}`}
          >
            <Icon
              size={20}
              className={`mt-0.5 shrink-0 ${SEVERITY_ICON_COLORS[alert.severity]}`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">{alert.title}</h4>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  aria-label="Dismiss alert"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{alert.description}</p>
              <button
                onClick={() => navigate({ to: alert.action.to as any })}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
              >
                {alert.action.label}
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
