import type { FundamentalData } from '../../services/screener-service'
import type { EnterprisingGateDefinition, EnterprisingGateResult, EnterprisingResult } from './enterprising-types'
import { ENTERPRISING_THRESHOLD } from './enterprising-types'
import { safeNum } from '../graham/graham-utils'

export const ENTERPRISING_GATES: EnterprisingGateDefinition[] = [
  {
    id: 'financialCondition',
    label: 'Current Ratio ≥ 1.5 & D/E < 2.0',
    description: 'Graham requires a reasonable financial condition for enterprising investors — adequate current assets and manageable debt',
    evaluate: (d) => {
      const cr = d.currentRatio
      const de = d.debtToEquity
      const crOk = cr !== undefined && cr !== null && Number.isFinite(cr) && cr >= 1.5
      const deOk = de !== undefined && de !== null && Number.isFinite(de) && de >= 0 && de < 2.0
      return crOk && deOk
    },
  },
  {
    id: 'earningsStability',
    label: 'No Losses in 5 Years',
    description: 'Earnings stability — no deficit in net income over the past 5 years',
    evaluate: (d) => {
      return d.earningsStable5Y === true
    },
  },
  {
    id: 'dividendRecord',
    label: 'Dividends 5+ Years',
    description: 'Some dividend record — at least 5 years of consecutive dividend payments',
    evaluate: (d) => {
      const v = d.dividendYears
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 5
    },
  },
  {
    id: 'earningsGrowth',
    label: 'EPS Growth ≥ 20% in 5 Years',
    description: 'Minimum increase of 20% in per-share earnings over 5 years (using 3-year averages)',
    evaluate: (d) => {
      const v5 = d.netIncomeCagr5Y
      if (v5 !== undefined && v5 !== null && Number.isFinite(v5) && v5 >= 20) return true
      const v10 = d.netIncomeCagr10Y
      return v10 !== undefined && v10 !== null && Number.isFinite(v10) && v10 >= 10
    },
  },
  {
    id: 'moderatePe',
    label: 'P/E ≤ 20 (3yr Avg)',
    description: 'Current price should not exceed 20x average earnings of past 3 years',
    evaluate: (d) => {
      const pe = d.pe3yAvg ?? d.peRatio
      return pe !== undefined && pe !== null && Number.isFinite(pe) && pe > 0 && pe <= 20
    },
  },
  {
    id: 'moderatePb',
    label: 'P/E×P/B ≤ 35',
    description: 'Product of P/E and P/B should not exceed 35 (relaxed from defensive 22.5)',
    evaluate: (d) => {
      const pb = d.pbRatio
      if (pb !== undefined && pb !== null && Number.isFinite(pb) && pb <= 2.5) return true
      const ptp = d.peTimesPb
      return ptp !== undefined && ptp !== null && Number.isFinite(ptp) && ptp <= 35
    },
  },
  {
    id: 'adequateSize',
    label: 'Market Cap ≥ ₹500 Cr',
    description: 'Reasonable size for the diligent enterprising investor — small caps acceptable with thorough research',
    evaluate: (d) => {
      const v = d.marketCap
      return v !== undefined && v !== null && Number.isFinite(v) && v >= 500
    },
  },
]

function buildGateResults(gates: EnterprisingGateDefinition[], data: Partial<FundamentalData>): EnterprisingGateResult[] {
  return gates.map((gate) => {
    const passed = gate.evaluate(data)

    let actualValue: number | string = '—'
    let format: EnterprisingGateResult['format'] = 'number'

    switch (gate.id) {
      case 'financialCondition': {
        const cr = safeNum(data.currentRatio)
        const de = safeNum(data.debtToEquity)
        actualValue = cr !== null && de !== null ? `CR ${cr.toFixed(2)}, D/E ${de.toFixed(2)}` : '—'
        break
      }
      case 'earningsStability': {
        actualValue = data.earningsStable5Y === true ? 'Stable' : 'Unstable / No data'
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
        break
      }
      case 'moderatePb': {
        const pb = safeNum(data.pbRatio)
        const ptp = safeNum(data.peTimesPb)
        actualValue = ptp !== null ? `P/B ${pb?.toFixed(2) ?? '—'}, P/E×P/B ${ptp.toFixed(2)}` : pb !== null ? `P/B ${pb.toFixed(2)}` : '—'
        break
      }
      case 'adequateSize': {
        const rv = safeNum(data.marketCap)
        actualValue = rv !== null ? `₹${rv.toFixed(0)} Cr` : '—'
        format = 'cr'
        break
      }
    }

    return { id: gate.id, label: gate.label, description: gate.description, passed, actualValue, format }
  })
}

export function evaluateEnterprisingResult(data: Partial<FundamentalData>): Omit<EnterprisingResult, 'symbol' | 'name'> {
  const gateResults = buildGateResults(ENTERPRISING_GATES, data)
  const gatesPassed = gateResults.filter((g) => g.passed).length
  const enterprisingScore = Math.round((gatesPassed / ENTERPRISING_GATES.length) * 100)

  return {
    gatesPassed,
    gatesTotal: ENTERPRISING_GATES.length,
    isEnterprisingCompliant: gatesPassed >= ENTERPRISING_THRESHOLD,
    enterprisingScore,
    gateResults,
  }
}

export function evaluateEnterprisingSimple(data: Partial<FundamentalData>): { gatesPassed: number; isEnterprisingCompliant: boolean } {
  let gatesPassed = 0
  for (const gate of ENTERPRISING_GATES) {
    if (gate.evaluate(data)) gatesPassed++
  }
  return { gatesPassed, isEnterprisingCompliant: gatesPassed >= ENTERPRISING_THRESHOLD }
}
