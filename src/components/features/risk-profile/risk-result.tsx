import { Shield, CheckCircle } from 'lucide-react'
import { ScoreGauge } from '../../shared/score-gauge'
import type { RiskProfileResult } from '../../../features/risk-profile/risk-calculator'

interface RiskResultProps {
  result: RiskProfileResult
}

const PROFILE_GLYPH: Record<string, string> = {
  conservative: '🛡️',
  moderate: '⚖️',
  aggressive: '🚀',
}

export function RiskResult({ result }: RiskResultProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)]/10">
          <Shield size={32} className="text-[var(--primary)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">Your Risk Profile</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Based on your responses, here is your investment profile.
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--primary)]/10">
          <ScoreGauge score={result.totalScore} />
        </div>

        <div className="mt-4">
          <span className="text-5xl">{PROFILE_GLYPH[result.profile]}</span>
          <h3 className="mt-3 text-2xl font-bold capitalize text-[var(--foreground)]">
            {result.profile}
          </h3>
          <p className="mt-1 text-sm capitalize text-[var(--muted-foreground)]">
            Style Preference: {result.stylePreference}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <h4 className="mb-2 text-sm font-semibold text-[var(--foreground)]">
            What this means
          </h4>
          <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
            {result.explanation}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <h4 className="mb-2 text-sm font-semibold text-[var(--foreground)]">
            Recommended Approach
          </h4>
          <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
            {result.recommendedApproach}
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--score-green-bg)] px-4 py-2">
          <CheckCircle size={16} className="text-[var(--score-green)]" />
          <span className="text-sm text-[var(--score-green)]">
            Risk profile saved. You can retake the assessment anytime from Settings.
          </span>
        </div>
      </div>
    </div>
  )
}
