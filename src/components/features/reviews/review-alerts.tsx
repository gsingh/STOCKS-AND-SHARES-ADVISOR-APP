import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import type { ReviewRow } from '../../../services/db'

interface ReviewAlertsProps {
  reviews: ReviewRow[]
  onDismiss: () => void
}

interface Alert {
  id: string
  type: 'drift' | 'exposure' | 'role-fit' | 'benchmark'
  severity: 'warning' | 'critical'
  message: string
  reviewId: string
}

function generateAlerts(reviews: ReviewRow[]): Alert[] {
  const alerts: Alert[] = []
  const latest = reviews[0]
  if (!latest) return alerts

  if (latest.driftResults) {
    for (const [symbol, result] of Object.entries(latest.driftResults)) {
      if (result.status === 'red') {
        alerts.push({
          id: `drift-${symbol}-${latest.id}`,
          type: 'drift',
          severity: 'critical',
          message: `${symbol} has significant drift (${result.drift.toFixed(1)}% deviation from target)`,
          reviewId: latest.id!,
        })
      } else if (result.status === 'amber') {
        alerts.push({
          id: `drift-${symbol}-${latest.id}`,
          type: 'drift',
          severity: 'warning',
          message: `${symbol} is drifting (${result.drift.toFixed(1)}% deviation) — review recommended`,
          reviewId: latest.id!,
        })
      }
    }
  }

  if (latest.exposureResults) {
    for (const [sector, result] of Object.entries(latest.exposureResults)) {
      if (result.status === 'exceeded') {
        alerts.push({
          id: `exposure-${sector}-${latest.id}`,
          type: 'exposure',
          severity: 'critical',
          message: `${sector} exposure (${result.current.toFixed(1)}%) exceeds the ${result.cap}% cap`,
          reviewId: latest.id!,
        })
      } else if (result.status === 'at_limit') {
        alerts.push({
          id: `exposure-${sector}-${latest.id}`,
          type: 'exposure',
          severity: 'warning',
          message: `${sector} exposure is at the ${result.cap}% limit`,
          reviewId: latest.id!,
        })
      }
    }
  }

  if (latest.roleFitResults) {
    for (const [symbol, result] of Object.entries(latest.roleFitResults)) {
      if (result.verdict === 'consider_rebalancing') {
        alerts.push({
          id: `role-${symbol}-${latest.id}`,
          type: 'role-fit',
          severity: 'critical',
          message: `${symbol} does not fit its ${result.role} role — consider rebalancing`,
          reviewId: latest.id!,
        })
      } else if (result.verdict === 'review_needed') {
        alerts.push({
          id: `role-${symbol}-${latest.id}`,
          type: 'role-fit',
          severity: 'warning',
          message: `${symbol} needs role-fit review (assigned: ${result.role})`,
          reviewId: latest.id!,
        })
      }
    }
  }

  if (latest.benchmarkResults) {
    for (const [symbol, result] of Object.entries(latest.benchmarkResults)) {
      if (result.gap < -10) {
        alerts.push({
          id: `benchmark-${symbol}-${latest.id}`,
          type: 'benchmark',
          severity: 'critical',
          message: `${symbol} is underperforming benchmark by ${Math.abs(result.gap).toFixed(1)}%`,
          reviewId: latest.id!,
        })
      } else if (result.gap < -5) {
        alerts.push({
          id: `benchmark-${symbol}-${latest.id}`,
          type: 'benchmark',
          severity: 'warning',
          message: `${symbol} slightly underperforming benchmark by ${Math.abs(result.gap).toFixed(1)}%`,
          reviewId: latest.id!,
        })
      }
    }
  }

  return alerts
}

export function ReviewAlerts({ reviews, onDismiss }: ReviewAlertsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const alerts = generateAlerts(reviews).filter((a) => !dismissed.has(a.id))

  if (alerts.length === 0) return null

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id))
    onDismiss()
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start gap-3 rounded-lg border p-3 ${
            alert.severity === 'critical'
              ? 'border-[var(--destructive)]/30 bg-[var(--score-red-bg)]'
              : 'border-[var(--warning)]/30 bg-[var(--score-amber-bg)]'
          }`}
        >
          <AlertTriangle
            size={18}
            className={`mt-0.5 shrink-0 ${
              alert.severity === 'critical'
                ? 'text-[var(--destructive)]'
                : 'text-[var(--warning)]'
            }`}
          />
          <p
            className={`flex-1 text-sm ${
              alert.severity === 'critical'
                ? 'text-[var(--score-red)]'
                : 'text-[var(--score-amber)]'
            }`}
          >
            {alert.message}
          </p>
          <button
            onClick={() => handleDismiss(alert.id)}
            className="shrink-0 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            aria-label="Dismiss alert"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
