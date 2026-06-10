export type StockRole = 'core_hold' | 'growth_play' | 'dividend_income' | 'tactical'

export type FitVerdict = 'fits_role' | 'review_needed' | 'consider_rebalancing'

export interface RoleFitInput {
  symbol: string
  role: StockRole
  dividendYield: number | null
  epsGrowth: number | null
  peRatio: number | null
  marketCap: number | null
  sector: string | null
  revenueGrowth: number | null
}

export interface RoleFitResult {
  symbol: string
  role: StockRole
  roleLabel: string
  verdict: FitVerdict
  verdictLabel: string
  reasons: string[]
}

const ROLE_LABELS: Record<StockRole, string> = {
  core_hold: 'Core Holding',
  growth_play: 'Growth Play',
  dividend_income: 'Dividend Income',
  tactical: 'Tactical',
}

const VERDICT_LABELS: Record<FitVerdict, string> = {
  fits_role: 'Fits Role',
  review_needed: 'Review Needed',
  consider_rebalancing: 'Consider Rebalancing',
}

export function getRoleLabel(role: StockRole): string {
  return ROLE_LABELS[role]
}

export function getVerdictLabel(verdict: FitVerdict): string {
  return VERDICT_LABELS[verdict]
}

export function assessRoleFit(input: RoleFitInput): RoleFitResult {
  const reasons: string[] = []

  switch (input.role) {
    case 'core_hold': {
      if (input.dividendYield != null && input.dividendYield > 1.5) {
        reasons.push('Dividend yield supports core stability')
      } else {
        reasons.push('Low dividend yield for a core holding')
      }
      if (input.marketCap != null && input.marketCap >= 10000) {
        reasons.push('Large-cap company suits core holding profile')
      } else if (input.marketCap != null) {
        reasons.push('Below large-cap threshold — may be riskier for core')
      }
      if (input.revenueGrowth != null && input.revenueGrowth > 10) {
        reasons.push('Strong revenue growth adds stability')
      }
      break
    }
    case 'growth_play': {
      if (input.epsGrowth != null && input.epsGrowth > 15) {
        reasons.push('Strong EPS growth aligns with growth objective')
      } else if (input.epsGrowth != null) {
        reasons.push('Modest EPS growth — verify growth thesis')
      }
      if (input.peRatio != null && input.peRatio > 30) {
        reasons.push('High P/E ratio typical for growth stocks')
      } else if (input.peRatio != null) {
        reasons.push('Below typical growth P/E — verify category')
      }
      if (input.revenueGrowth != null && input.revenueGrowth > 15) {
        reasons.push('Revenue growth supports growth narrative')
      }
      break
    }
    case 'dividend_income': {
      if (input.dividendYield != null && input.dividendYield >= 2.5) {
        reasons.push('Attractive dividend yield for income')
      } else if (input.dividendYield != null) {
        reasons.push('Dividend yield below 2.5% — consider alternatives')
      }
      if (input.marketCap != null && input.marketCap >= 10000) {
        reasons.push('Large-cap company with reliable dividend history')
      }
      if (input.peRatio != null && input.peRatio > 25) {
        reasons.push('High P/E may indicate overvaluation for income stock')
      }
      break
    }
    case 'tactical': {
      if (input.epsGrowth != null && input.epsGrowth > 20) {
        reasons.push('High EPS growth justifies tactical allocation')
      }
      if (input.marketCap != null && input.marketCap < 10000) {
        reasons.push('Mid/small-cap suitable for tactical positioning')
      }
      if (input.revenueGrowth != null && input.revenueGrowth > 20) {
        reasons.push('Strong revenue growth supports tactical thesis')
      }
      reasons.push('Tactical positions require active monitoring')
      break
    }
  }

  if (reasons.length === 0) {
    reasons.push('Insufficient data to assess role fit')
  }

  const score = reasons.filter((r) =>
    ['supports', 'suits', 'aligns', 'attractive', 'typical', 'justifies', 'adds stability'].some(
      (pos) => r.toLowerCase().includes(pos),
    ),
  ).length

  let verdict: FitVerdict
  if (score >= 2) {
    verdict = 'fits_role'
  } else if (score === 1) {
    verdict = 'review_needed'
  } else {
    verdict = 'consider_rebalancing'
  }

  return {
    symbol: input.symbol,
    role: input.role,
    roleLabel: getRoleLabel(input.role),
    verdict,
    verdictLabel: getVerdictLabel(verdict),
    reasons,
  }
}

export function assessRoleFits(inputs: RoleFitInput[]): RoleFitResult[] {
  return inputs.map(assessRoleFit)
}
