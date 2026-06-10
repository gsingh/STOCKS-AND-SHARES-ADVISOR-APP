import type { FundamentalData } from '../../services/fundamentals-service'
import { calculateScore } from '../scorecard/scoring-engine'
import type { GateDefinition, GateResult, BuffettResult } from './types'
import { BUFFETT_THRESHOLD, MODIFIED_BUFFETT_THRESHOLD } from './types'

function safeNum(v: number | undefined | null): number | null {
  if (v === undefined || v === null || !Number.isFinite(v)) return null
  return v
}

function isPresent(v: number | undefined | null): boolean {
  return safeNum(v) !== null && safeNum(v) !== 0
}

export const BUFFETT_GATES: GateDefinition[] = [
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
    id: 'debtEquity',
    label: 'D/E < 0.5',
    description: 'Low debt-to-equity indicates earnings are generated from equity, not borrowed money',
    evaluate: (d) => {
      const v = d.debtToEquity
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 0 && v < 0.5
    },
  },
  {
    id: 'peRatio',
    label: 'P/E < 25',
    description: 'Reasonable price-to-earnings ratio (Buffett historically preferred <15, adjusted for market)',
    evaluate: (d) => {
      const v = d.peRatio
      return v !== undefined && v !== null && Number.isFinite(v) && v > 0 && v < 25
    },
  },
  {
    id: 'opMargin',
    label: 'Op. Margin ≥ 10%',
    description: 'Healthy operating margin shows pricing power and cost control',
    evaluate: (d) => {
      const v = d.operatingMargin
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 10
    },
  },
  {
    id: 'netMargin',
    label: 'Net Margin ≥ 8%',
    description: 'Strong net profit margin indicates a durable competitive advantage',
    evaluate: (d) => {
      const v = d.netProfitMargin
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 8
    },
  },
  {
    id: 'fcf',
    label: 'Positive FCF',
    description: 'Positive free cash flow means the business generates real cash for owners',
    evaluate: (d) => {
      const v = d.freeCashFlow
      return v !== undefined && v !== null && Number.isFinite(v) && v > 0
    },
  },
  {
    id: 'marketCap',
    label: 'Market Cap > ₹4,000 Cr',
    description: 'Large, established businesses (>$500M equivalent) with proven track records',
    evaluate: (d) => {
      const v = d.marketCap
      return v !== undefined && v !== null && Number.isFinite(v) && v > 4000
    },
  },
  {
    id: 'promoter',
    label: 'Promoter ≥ 25%',
    description: 'Management with significant ownership has skin in the game',
    evaluate: (d) => {
      const v = d.promoterHolding
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 25
    },
  },
  {
    id: 'pledged',
    label: 'Pledged = 0%',
    description: 'No pledged promoter shares means no hidden leverage risk',
    evaluate: (d) => {
      const v = d.pledgedShares
      if (v === undefined || v === null) return true
      return v === 0
    },
  },
]

export const MODIFIED_BUFFETT_GATES: GateDefinition[] = [
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
    id: 'debtEquity',
    label: 'D/E < 1.0',
    description: 'Moderate debt-to-equity accommodates Indian infrastructure/industrial capital structures',
    evaluate: (d) => {
      const v = d.debtToEquity
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 0 && v < 1.0
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
    id: 'opMargin',
    label: 'Op. Margin ≥ 10%',
    description: 'Healthy operating margin shows pricing power and cost control',
    evaluate: (d) => {
      const v = d.operatingMargin
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 10
    },
  },
  {
    id: 'netMargin',
    label: 'Net Margin ≥ 5%',
    description: 'Minimum profitability filter while allowing thin-margin Indian industrials',
    evaluate: (d) => {
      const v = d.netProfitMargin
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 5
    },
  },
  {
    id: 'fcf',
    label: 'Positive FCF',
    description: 'Positive free cash flow means the business generates real cash for owners',
    evaluate: (d) => {
      const v = d.freeCashFlow
      return v !== undefined && v !== null && Number.isFinite(v) && v > 0
    },
  },
  {
    id: 'marketCap',
    label: 'Market Cap ≥ ₹2,000 Cr',
    description: 'Opens up mid-cap companies with established business models',
    evaluate: (d) => {
      const v = d.marketCap
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 2000
    },
  },
  {
    id: 'promoter',
    label: 'Promoter ≥ 25%',
    description: 'Management with significant ownership has skin in the game',
    evaluate: (d) => {
      const v = d.promoterHolding
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 25
    },
  },
  {
    id: 'pledged',
    label: 'Pledged < 10%',
    description: 'Small pledging (<10%) is common for Indian promoters without signalling distress',
    evaluate: (d) => {
      const v = d.pledgedShares
      if (v === undefined || v === null) return true
      return Number.isFinite(v) && v < 10
    },
  },
]

export const BUFFETT_WEIGHTS = {
  categories: {
    valuation: 0.25,
    quality: 0.35,
    financial_health: 0.25,
    growth: 0.10,
    ownership: 0.05,
    size: 0.00,
  },
}

export const MODIFIED_BUFFETT_WEIGHTS = {
  categories: {
    valuation: 0.25,
    quality: 0.35,
    financial_health: 0.25,
    growth: 0.10,
    ownership: 0.05,
    size: 0.00,
  },
}

function buildGateResults(gates: GateDefinition[], data: Partial<FundamentalData>): GateResult[] {
  return gates.map((gate) => {
    const passed = gate.evaluate(data)

    let actualValue: number | string = '—'
    let format: GateResult['format'] = 'number'

    switch (gate.id) {
      case 'roe':
      case 'opMargin':
      case 'netMargin':
      case 'promoter': {
        if (gate.id === 'roe') {
          const rv = safeNum(data.roe)
          actualValue = rv !== null ? `${rv.toFixed(1)}%` : '—'
        } else if (gate.id === 'opMargin') {
          const rv = safeNum(data.operatingMargin)
          actualValue = rv !== null ? `${rv.toFixed(1)}%` : '—'
        } else if (gate.id === 'netMargin') {
          const rv = safeNum(data.netProfitMargin)
          actualValue = rv !== null ? `${rv.toFixed(1)}%` : '—'
        } else if (gate.id === 'promoter') {
          const rv = safeNum(data.promoterHolding)
          actualValue = rv !== null ? `${rv.toFixed(1)}%` : '—'
        }
        format = 'percentage'
        break
      }
      case 'peRatio':
      case 'debtEquity': {
        if (gate.id === 'peRatio') {
          const rv = safeNum(data.peRatio)
          actualValue = rv !== null ? rv.toFixed(1) : '—'
        } else {
          const rv = safeNum(data.debtToEquity)
          actualValue = rv !== null ? rv.toFixed(2) : '—'
        }
        format = 'number'
        break
      }
      case 'fcf': {
        const rv = safeNum(data.freeCashFlow)
        actualValue = rv !== null ? `₹${rv.toFixed(0)} Cr` : '—'
        format = 'currency'
        break
      }
      case 'marketCap': {
        const rv = safeNum(data.marketCap)
        actualValue = rv !== null ? `₹${rv.toFixed(0)} Cr` : '—'
        format = 'cr'
        break
      }
      case 'pledged': {
        const rv = safeNum(data.pledgedShares)
        actualValue = rv !== null ? `${rv.toFixed(1)}%` : '0%'
        format = 'percentage'
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

export function evaluateBuffettResult(data: Partial<FundamentalData>): BuffettResult {
  const gateResults = buildGateResults(BUFFETT_GATES, data)
  const gatesPassed = gateResults.filter((g) => g.passed).length
  const scoreInput = buildScoreInput(data)
  const buffettScore = calculateScore(scoreInput, BUFFETT_WEIGHTS).compositeScore

  return {
    gatesPassed,
    gatesTotal: BUFFETT_GATES.length,
    isBuffettCompliant: gatesPassed >= BUFFETT_THRESHOLD,
    buffettScore: Math.round(buffettScore * 100) / 100,
    gateResults,
  }
}

export function evaluateBuffettSimple(data: Partial<FundamentalData>): {
  gatesPassed: number
  isBuffettCompliant: boolean
} {
  let gatesPassed = 0
  for (const gate of BUFFETT_GATES) {
    if (gate.evaluate(data)) gatesPassed++
  }
  return {
    gatesPassed,
    isBuffettCompliant: gatesPassed >= BUFFETT_THRESHOLD,
  }
}

export function evaluateModifiedBuffettResult(data: Partial<FundamentalData>): BuffettResult {
  const gateResults = buildGateResults(MODIFIED_BUFFETT_GATES, data)
  const gatesPassed = gateResults.filter((g) => g.passed).length
  const scoreInput = buildScoreInput(data)
  const buffettScore = calculateScore(scoreInput, MODIFIED_BUFFETT_WEIGHTS).compositeScore

  return {
    gatesPassed,
    gatesTotal: MODIFIED_BUFFETT_GATES.length,
    isBuffettCompliant: gatesPassed >= MODIFIED_BUFFETT_THRESHOLD,
    buffettScore: Math.round(buffettScore * 100) / 100,
    gateResults,
  }
}

export function evaluateModifiedBuffettSimple(data: Partial<FundamentalData>): {
  gatesPassed: number
  isBuffettCompliant: boolean
} {
  let gatesPassed = 0
  for (const gate of MODIFIED_BUFFETT_GATES) {
    if (gate.evaluate(data)) gatesPassed++
  }
  return {
    gatesPassed,
    isBuffettCompliant: gatesPassed >= MODIFIED_BUFFETT_THRESHOLD,
  }
}
