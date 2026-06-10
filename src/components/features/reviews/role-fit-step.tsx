import { useMemo } from 'react'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import {
  assessRoleFits,
  type RoleFitInput,
  type RoleFitResult,
} from '../../../features/reviews/role-fit'

interface RoleFitStockItem {
  symbol: string
  name: string
  sector: string | null
  role: 'core_hold' | 'growth_play' | 'dividend_income' | 'tactical'
  dividendYield: number | null
  epsGrowth: number | null
  peRatio: number | null
  marketCap: number | null
  revenueGrowth: number | null
}

interface RoleFitStepProps {
  stocks: RoleFitStockItem[]
  onResults: (results: Record<string, { role: string; verdict: string; notes: string }>) => void
}

function getVerdictIcon(verdict: RoleFitResult['verdict']) {
  switch (verdict) {
    case 'fits_role': return <CheckCircle size={18} className="text-[var(--score-green)]" />
    case 'review_needed': return <AlertTriangle size={18} className="text-[var(--score-amber)]" />
    case 'consider_rebalancing': return <XCircle size={18} className="text-[var(--score-red)]" />
  }
}

function getVerdictColor(verdict: RoleFitResult['verdict']): string {
  switch (verdict) {
    case 'fits_role': return 'text-[var(--score-green)] bg-[var(--score-green-bg)]'
    case 'review_needed': return 'text-[var(--score-amber)] bg-[var(--score-amber-bg)]'
    case 'consider_rebalancing': return 'text-[var(--score-red)] bg-[var(--score-red-bg)]'
  }
}

export function RoleFitStep({ stocks, onResults }: RoleFitStepProps) {
  const results = useMemo(() => {
    const inputs: RoleFitInput[] = stocks.map((s) => ({
      symbol: s.symbol,
      role: s.role,
      dividendYield: s.dividendYield,
      epsGrowth: s.epsGrowth,
      peRatio: s.peRatio,
      marketCap: s.marketCap,
      sector: s.sector,
      revenueGrowth: s.revenueGrowth,
    }))
    const assessed = assessRoleFits(inputs)
    const resultMap: Record<string, { role: string; verdict: string; notes: string }> = {}
    for (const r of assessed) {
      resultMap[r.symbol] = { role: r.role, verdict: r.verdict, notes: r.reasons.join('; ') }
    }
    onResults(resultMap)
    return assessed
  }, [stocks, onResults])

  const goodFit = results.filter((r) => r.verdict === 'fits_role').length
  const needsReview = results.filter((r) => r.verdict === 'review_needed').length
  const rebalance = results.filter((r) => r.verdict === 'consider_rebalancing').length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle size={20} className="text-[var(--primary)]" />
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Stock Role-Fit Assessment</h3>
      </div>

      <p className="text-sm text-[var(--muted-foreground)]">
        Checks each holding against its assigned role to verify suitability.
      </p>

      {results.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">No stocks with assigned roles to assess.</p>
      ) : (
        <>
          <div className="flex gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--score-green)]">
              <CheckCircle size={14} />
              {goodFit} fit role
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--score-amber)]">
              <AlertTriangle size={14} />
              {needsReview} need review
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--score-red)]">
              <XCircle size={14} />
              {rebalance} consider rebalancing
            </span>
          </div>

          <div className="space-y-3">
            {results.map((r) => (
              <div
                key={r.symbol}
                className={`rounded-lg border p-4 ${getVerdictColor(r.verdict).split(' ')[1]}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getVerdictIcon(r.verdict)}
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {r.symbol}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Role: {r.roleLabel}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getVerdictColor(r.verdict)}`}>
                    {r.verdictLabel}
                  </span>
                </div>
                {r.reasons.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {r.reasons.map((reason, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[var(--muted-foreground)]">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--muted-foreground)]" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
