import type { FundamentalData } from '../../services/fundamentals-service'
import { calculateScore } from '../scorecard/scoring-engine'
import type { GateDefinition, GateResult, JhunjhunwalaResult } from './types'
import { JHUNJHUNWALA_THRESHOLD, JHUNJHUNWALA_MODIFIED_THRESHOLD } from './types'

function safeNum(v: number | undefined | null): number | null {
  if (v === undefined || v === null || !Number.isFinite(v)) return null
  return v
}

export const JHUNJHUNWALA_GATES: GateDefinition[] = [
  {
    id: 'roe',
    label: 'ROE ≥ 15%',
    description: 'Return on Equity above 15% signals efficient use of shareholder capital',
    evaluate: (d) => {
      const v = d.roe
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 15
    },
  },
  {
    id: 'roce',
    label: 'ROCE ≥ 15%',
    description: 'Return on Capital Employed above 15% indicates efficient capital allocation',
    evaluate: (d) => {
      const v = d.roce
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 15
    },
  },
  {
    id: 'debtEquity',
    label: 'D/E < 0.5',
    description: 'Low debt-to-equity indicates earnings are generated from equity, not borrowed money',
    evaluate: (d) => {
      const v = d.debtToEquity
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 0 && v < 0.5
    },
  },
  {
    id: 'salesGrowth',
    label: 'Sales Growth 3Y ≥ 12%',
    description: 'Consistent revenue growth above 12% over 3 years shows a growing business',
    evaluate: (d) => {
      const v = d.revenueGrowth
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 12
    },
  },
  {
    id: 'profitGrowth',
    label: 'Profit Growth 3Y ≥ 12%',
    description: 'Consistent profit growth above 12% over 3 years shows sustainable earnings',
    evaluate: (d) => {
      const v = d.epsGrowth
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 12
    },
  },
  {
    id: 'peRatio',
    label: 'P/E < 25',
    description: 'Reasonable price-to-earnings ratio with margin of safety',
    evaluate: (d) => {
      const v = d.peRatio
      return v !== undefined && v !== null && Number.isFinite(v) && v > 0 && v < 25
    },
  },
  {
    id: 'marketCap',
    label: 'Market Cap > ₹500 Cr',
    description: 'Minimum market capitalization for adequate liquidity and established business',
    evaluate: (d) => {
      const v = d.marketCap
      return v !== undefined && v !== null && Number.isFinite(v) && v > 500
    },
  },
]

export const MODIFIED_JHUNJHUNWALA_GATES: GateDefinition[] = [
  {
    id: 'roe',
    label: 'ROE ≥ 12%',
    description: 'Return on Equity above 12% signals above-average capital efficiency for Indian markets',
    evaluate: (d) => {
      const v = d.roe
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 12
    },
  },
  {
    id: 'roce',
    label: 'ROCE ≥ 12%',
    description: 'Return on Capital Employed above 12% indicates decent capital allocation',
    evaluate: (d) => {
      const v = d.roce
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 12
    },
  },
  {
    id: 'debtEquity',
    label: 'D/E < 1.0',
    description: 'Moderate debt-to-equity accommodates Indian capital structures while avoiding excessive leverage',
    evaluate: (d) => {
      const v = d.debtToEquity
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 0 && v < 1.0
    },
  },
  {
    id: 'salesGrowth',
    label: 'Sales Growth 3Y ≥ 10%',
    description: 'Revenue growth above 10% over 3 years shows a growing business',
    evaluate: (d) => {
      const v = d.revenueGrowth
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 10
    },
  },
  {
    id: 'profitGrowth',
    label: 'Profit Growth 3Y ≥ 10%',
    description: 'Profit growth above 10% over 3 years shows sustainable earnings trajectory',
    evaluate: (d) => {
      const v = d.epsGrowth
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 10
    },
  },
  {
    id: 'peRatio',
    label: 'P/E < 30',
    description: 'Acknowledges Indian market growth premium while filtering speculative froth',
    evaluate: (d) => {
      const v = d.peRatio
      return v !== undefined && v !== null && Number.isFinite(v) && v > 0 && v < 30
    },
  },
  {
    id: 'marketCap',
    label: 'Market Cap > ₹250 Cr',
    description: 'Opens up small-cap companies with established business models',
    evaluate: (d) => {
      const v = d.marketCap
      return v !== undefined && v !== null && Number.isFinite(v) && v > 250
    },
  },
]

export const JHUNJHUNWALA_WEIGHTS = {
  categories: {
    valuation: 0.20,
    quality: 0.35,
    financial_health: 0.15,
    growth: 0.25,
    ownership: 0.00,
    size: 0.05,
  },
}

export const MODIFIED_JHUNJHUNWALA_WEIGHTS = {
  categories: {
    valuation: 0.20,
    quality: 0.35,
    financial_health: 0.15,
    growth: 0.25,
    ownership: 0.00,
    size: 0.05,
  },
}

function buildGateResults(gates: GateDefinition[], data: Partial<FundamentalData>): GateResult[] {
  return gates.map((gate) => {
    const passed = gate.evaluate(data)

    let actualValue: number | string = '—'
    let format: GateResult['format'] = 'number'

    switch (gate.id) {
      case 'roe': {
        const rv = safeNum(data.roe)
        actualValue = rv !== null ? `${rv.toFixed(1)}%` : '—'
        format = 'percentage'
        break
      }
      case 'roce': {
        const rv = safeNum(data.roce)
        actualValue = rv !== null ? `${rv.toFixed(1)}%` : '—'
        format = 'percentage'
        break
      }
      case 'debtEquity': {
        const rv = safeNum(data.debtToEquity)
        actualValue = rv !== null ? rv.toFixed(2) : '—'
        format = 'number'
        break
      }
      case 'salesGrowth': {
        const rv = safeNum(data.revenueGrowth)
        actualValue = rv !== null ? `${rv >= 0 ? '+' : ''}${rv.toFixed(1)}%` : '—'
        format = 'percentage'
        break
      }
      case 'profitGrowth': {
        const rv = safeNum(data.epsGrowth)
        actualValue = rv !== null ? `${rv >= 0 ? '+' : ''}${rv.toFixed(1)}%` : '—'
        format = 'percentage'
        break
      }
      case 'peRatio': {
        const rv = safeNum(data.peRatio)
        actualValue = rv !== null ? rv.toFixed(1) : '—'
        format = 'number'
        break
      }
      case 'marketCap': {
        const rv = safeNum(data.marketCap)
        actualValue = rv !== null ? `₹${rv.toFixed(0)} Cr` : '—'
        format = 'cr'
        break
      }
    }

    return {
      id: gate.id,
      label: gate.label,
      description: gate.description,
      passed,
      actualValue,
      format,
    }
  })
}

function buildScoreInput(data: Partial<FundamentalData>) {
  return {
    peRatio: data.peRatio,
    pbRatio: data.pbRatio,
    dividendYield: data.dividendYield,
    roe: data.roe,
    roce: data.roce,
    operatingMargin: data.operatingMargin,
    netProfitMargin: data.netProfitMargin,
    debtToEquity: data.debtToEquity,
    freeCashFlow: data.freeCashFlow,
    bookValue: data.bookValue,
    revenueGrowth: data.revenueGrowth,
    epsGrowth: data.epsGrowth,
    promoterHolding: data.promoterHolding,
    pledgedShares: data.pledgedShares,
    governanceQuality: data.governanceQuality,
    marketCap: data.marketCap,
  }
}

export function evaluateJhunjhunwalaResult(data: Partial<FundamentalData>): JhunjhunwalaResult {
  const gateResults = buildGateResults(JHUNJHUNWALA_GATES, data)
  const gatesPassed = gateResults.filter((g) => g.passed).length
  const scoreInput = buildScoreInput(data)
  const jhunjhunwalaScore = calculateScore(scoreInput, JHUNJHUNWALA_WEIGHTS).compositeScore

  return {
    gatesPassed,
    gatesTotal: JHUNJHUNWALA_GATES.length,
    isJhunjhunwalaCompliant: gatesPassed >= JHUNJHUNWALA_THRESHOLD,
    jhunjhunwalaScore: Math.round(jhunjhunwalaScore * 100) / 100,
    gateResults,
  }
}

export function evaluateJhunjhunwalaSimple(data: Partial<FundamentalData>): {
  gatesPassed: number
  isJhunjhunwalaCompliant: boolean
} {
  let gatesPassed = 0
  for (const gate of JHUNJHUNWALA_GATES) {
    if (gate.evaluate(data)) gatesPassed++
  }
  return {
    gatesPassed,
    isJhunjhunwalaCompliant: gatesPassed >= JHUNJHUNWALA_THRESHOLD,
  }
}

export function evaluateJhunjhunwalaModifiedResult(data: Partial<FundamentalData>): JhunjhunwalaResult {
  const gateResults = buildGateResults(MODIFIED_JHUNJHUNWALA_GATES, data)
  const gatesPassed = gateResults.filter((g) => g.passed).length
  const scoreInput = buildScoreInput(data)
  const jhunjhunwalaScore = calculateScore(scoreInput, MODIFIED_JHUNJHUNWALA_WEIGHTS).compositeScore

  return {
    gatesPassed,
    gatesTotal: MODIFIED_JHUNJHUNWALA_GATES.length,
    isJhunjhunwalaCompliant: gatesPassed >= JHUNJHUNWALA_MODIFIED_THRESHOLD,
    jhunjhunwalaScore: Math.round(jhunjhunwalaScore * 100) / 100,
    gateResults,
  }
}

export function evaluateJhunjhunwalaModifiedSimple(data: Partial<FundamentalData>): {
  gatesPassed: number
  isJhunjhunwalaCompliant: boolean
} {
  let gatesPassed = 0
  for (const gate of MODIFIED_JHUNJHUNWALA_GATES) {
    if (gate.evaluate(data)) gatesPassed++
  }
  return {
    gatesPassed,
    isJhunjhunwalaCompliant: gatesPassed >= JHUNJHUNWALA_MODIFIED_THRESHOLD,
  }
}
