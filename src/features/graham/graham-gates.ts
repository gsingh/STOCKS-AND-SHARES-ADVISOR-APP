import type { FundamentalData } from '../../services/screener-service'
import type { GrahamGateDefinition, GrahamGateResult, GrahamResult } from './graham-types'
import { GRAHAM_THRESHOLD, MODIFIED_GRAHAM_THRESHOLD } from './graham-types'
import { safeNum } from './graham-utils'

export const GRAHAM_GATES: GrahamGateDefinition[] = [
  {
    id: 'adequateSize',
    label: 'Market Cap ≥ ₹20,000 Cr',
    description: 'Graham requires a large, prominent company for defensive investors',
    evaluate: (d) => {
      const v = d.marketCap
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 20000
    },
  },
  {
    id: 'financialStrength',
    label: 'Current Ratio ≥ 2.0 & D/E < 1.1',
    description: 'Strong financial condition: current assets more than double current liabilities, manageable debt',
    evaluate: (d) => {
      const cr = d.currentRatio
      const de = d.debtToEquity
      const crOk = cr !== undefined && cr !== null && Number.isFinite(cr) && cr >= 2.0
      const deOk = de !== undefined && de !== null && Number.isFinite(de) && de >= 0 && de < 1.1
      return crOk && deOk
    },
  },
  {
    id: 'earningsStability',
    label: 'No Losses in 10 Years',
    description: 'Earnings stability — no deficit in net income over the past 10 years',
    evaluate: (d) => {
      return d.earningsStable === true
    },
  },
  {
    id: 'dividendRecord',
    label: 'Dividends 20+ Years',
    description: 'Uninterrupted dividend payments for at least 20 years',
    evaluate: (d) => {
      return d.dividendConsistent === true
    },
  },
  {
    id: 'earningsGrowth',
    label: 'EPS Growth ≥ 33% in 10 Years',
    description: 'Minimum increase of 33% in per-share earnings over 10 years (using 3-year averages)',
    evaluate: (d) => {
      const v = d.netIncomeCagr10Y
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 33
    },
  },
  {
    id: 'moderatePe',
    label: 'P/E ≤ 15 (3yr Avg)',
    description: 'Current price should not exceed 15x average earnings of past 3 years',
    evaluate: (d) => {
      const pe = d.pe3yAvg ?? d.peRatio
      return pe !== undefined && pe !== null && Number.isFinite(pe) && pe > 0 && pe <= 15
    },
  },
  {
    id: 'moderatePb',
    label: 'P/B ≤ 1.5 or P/E×P/B ≤ 22.5',
    description: 'Price-to-book should not exceed 1.5x, or product of P/E and P/B should not exceed 22.5',
    evaluate: (d) => {
      const pb = d.pbRatio
      if (pb !== undefined && pb !== null && Number.isFinite(pb) && pb <= 1.5) return true
      const ptp = d.peTimesPb
      return ptp !== undefined && ptp !== null && Number.isFinite(ptp) && ptp <= 22.5
    },
  },
]

export const MODIFIED_GRAHAM_GATES: GrahamGateDefinition[] = [
  {
    id: 'adequateSize',
    label: 'Market Cap ≥ ₹2,000 Cr',
    description: 'Relaxed size threshold for Indian mid-cap companies with established track records',
    evaluate: (d) => {
      const v = d.marketCap
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 2000
    },
  },
  {
    id: 'financialStrength',
    label: 'Current Ratio ≥ 1.5 & D/E < 1.5',
    description: 'Relaxed financial health for Indian capital structures',
    evaluate: (d) => {
      const cr = d.currentRatio
      const de = d.debtToEquity
      const crOk = cr !== undefined && cr !== null && Number.isFinite(cr) && cr >= 1.5
      const deOk = de !== undefined && de !== null && Number.isFinite(de) && de >= 0 && de < 1.5
      return crOk && deOk
    },
  },
  {
    id: 'earningsStability',
    label: 'No Losses in 5 Years',
    description: 'Relaxed stability check — no deficits in past 5 years',
    evaluate: (d) => {
      return d.earningsStable === true
    },
  },
  {
    id: 'dividendRecord',
    label: 'Dividends 10+ Years',
    description: 'Relaxed dividend record for Indian companies',
    evaluate: (d) => {
      const v = d.dividendYears
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 10
    },
  },
  {
    id: 'earningsGrowth',
    label: 'EPS Growth ≥ 20% in 5 Years',
    description: 'Relaxed growth threshold using 5-year perspective for faster-growing Indian market',
    evaluate: (d) => {
      const v5 = d.netIncomeCagr5Y
      if (v5 !== undefined && v5 !== null && Number.isFinite(v5) && v5 >= 20) return true
      const v10 = d.netIncomeCagr10Y
      return v10 !== undefined && v10 !== null && Number.isFinite(v10) && v10 >= 20
    },
  },
  {
    id: 'moderatePe',
    label: 'P/E ≤ 20 (3yr Avg)',
    description: 'Relaxed P/E threshold acknowledging Indian market growth premium',
    evaluate: (d) => {
      const pe = d.pe3yAvg ?? d.peRatio
      return pe !== undefined && pe !== null && Number.isFinite(pe) && pe > 0 && pe <= 20
    },
  },
  {
    id: 'moderatePb',
    label: 'P/B ≤ 2.0 or P/E×P/B ≤ 30',
    description: 'Relaxed book value threshold for Indian market',
    evaluate: (d) => {
      const pb = d.pbRatio
      if (pb !== undefined && pb !== null && Number.isFinite(pb) && pb <= 2.0) return true
      const ptp = d.peTimesPb
      return ptp !== undefined && ptp !== null && Number.isFinite(ptp) && ptp <= 30
    },
  },
]

function buildGateResults(gates: GrahamGateDefinition[], data: Partial<FundamentalData>): GrahamGateResult[] {
  return gates.map((gate) => {
    const passed = gate.evaluate(data)

    let actualValue: number | string = '—'
    let format: GrahamGateResult['format'] = 'number'

    switch (gate.id) {
      case 'adequateSize': {
        const rv = safeNum(data.marketCap)
        actualValue = rv !== null ? `₹${rv.toFixed(0)} Cr` : '—'
        format = 'cr'
        break
      }
      case 'financialStrength': {
        const cr = safeNum(data.currentRatio)
        const de = safeNum(data.debtToEquity)
        actualValue = cr !== null && de !== null ? `CR ${cr.toFixed(2)}, D/E ${de.toFixed(2)}` : '—'
        format = 'number'
        break
      }
      case 'earningsStability': {
        actualValue = data.earningsStable === true ? 'Stable' : 'Unstable / No data'
        format = 'boolean'
        break
      }
      case 'dividendRecord': {
        const rv = safeNum(data.dividendYears)
        actualValue = rv !== null ? `${rv} yrs` : '—'
        format = 'years'
        break
      }
      case 'earningsGrowth': {
        const rv5 = safeNum(data.netIncomeCagr5Y)
        const rv10 = safeNum(data.netIncomeCagr10Y)
        actualValue = rv10 !== null ? `${rv10.toFixed(1)}% (10yr)` : rv5 !== null ? `${rv5.toFixed(1)}% (5yr)` : '—'
        format = 'percentage'
        break
      }
      case 'moderatePe': {
        const pe3y = safeNum(data.pe3yAvg)
        const peT = safeNum(data.peRatio)
        actualValue = pe3y !== null ? `${pe3y.toFixed(1)} (3yr avg)` : peT !== null ? `${peT.toFixed(1)} (trailing)` : '—'
        format = 'number'
        break
      }
      case 'moderatePb': {
        const pb = safeNum(data.pbRatio)
        const ptp = safeNum(data.peTimesPb)
        actualValue = ptp !== null ? `P/B ${pb?.toFixed(2) ?? '—'}, P/E×P/B ${ptp.toFixed(2)}` : pb !== null ? `P/B ${pb.toFixed(2)}` : '—'
        format = 'number'
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

export function evaluateGrahamResult(data: Partial<FundamentalData>): Omit<GrahamResult, 'symbol' | 'name'> {
  const gateResults = buildGateResults(GRAHAM_GATES, data)
  const gatesPassed = gateResults.filter((g) => g.passed).length
  const grahamScore = Math.round((gatesPassed / GRAHAM_GATES.length) * 100)

  return {
    gatesPassed,
    gatesTotal: GRAHAM_GATES.length,
    isGrahamCompliant: gatesPassed >= GRAHAM_THRESHOLD,
    grahamScore,
    gateResults,
  }
}

export function evaluateModifiedGrahamResult(data: Partial<FundamentalData>): Omit<GrahamResult, 'symbol' | 'name'> {
  const gateResults = buildGateResults(MODIFIED_GRAHAM_GATES, data)
  const gatesPassed = gateResults.filter((g) => g.passed).length
  const grahamScore = Math.round((gatesPassed / MODIFIED_GRAHAM_GATES.length) * 100)

  return {
    gatesPassed,
    gatesTotal: MODIFIED_GRAHAM_GATES.length,
    isGrahamCompliant: gatesPassed >= MODIFIED_GRAHAM_THRESHOLD,
    grahamScore,
    gateResults,
  }
}

export function evaluateGrahamSimple(data: Partial<FundamentalData>): { gatesPassed: number; isGrahamCompliant: boolean } {
  let gatesPassed = 0
  for (const gate of GRAHAM_GATES) {
    if (gate.evaluate(data)) gatesPassed++
  }
  return { gatesPassed, isGrahamCompliant: gatesPassed >= GRAHAM_THRESHOLD }
}

export function evaluateModifiedGrahamSimple(data: Partial<FundamentalData>): { gatesPassed: number; isGrahamCompliant: boolean } {
  let gatesPassed = 0
  for (const gate of MODIFIED_GRAHAM_GATES) {
    if (gate.evaluate(data)) gatesPassed++
  }
  return { gatesPassed, isGrahamCompliant: gatesPassed >= MODIFIED_GRAHAM_THRESHOLD }
}
