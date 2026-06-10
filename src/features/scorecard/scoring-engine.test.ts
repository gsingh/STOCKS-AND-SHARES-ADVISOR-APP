import { describe, it, expect } from 'vitest'
import { calculateScore, getDefaultWeights, normalizeWeights, getTier } from './scoring-engine'

describe('getTier', () => {
  it('returns strong for score >= 15 on parameter scale', () => {
    expect(getTier(15, 20).tier).toBe('strong')
    expect(getTier(20, 20).tier).toBe('strong')
  })

  it('returns average for score >= 10 on parameter scale', () => {
    expect(getTier(10, 20).tier).toBe('average')
    expect(getTier(14, 20).tier).toBe('average')
  })

  it('returns below_average for score >= 5 on parameter scale', () => {
    expect(getTier(5, 20).tier).toBe('below_average')
    expect(getTier(9, 20).tier).toBe('below_average')
  })

  it('returns weak for score < 5 on parameter scale', () => {
    expect(getTier(0, 20).tier).toBe('weak')
    expect(getTier(4, 20).tier).toBe('weak')
  })

  it('returns strong for composite score >= 70', () => {
    expect(getTier(70, 100).tier).toBe('strong')
    expect(getTier(100, 100).tier).toBe('strong')
  })

  it('returns average for composite score >= 50', () => {
    expect(getTier(50, 100).tier).toBe('average')
    expect(getTier(69, 100).tier).toBe('average')
  })

  it('returns weak for composite score < 50', () => {
    expect(getTier(0, 100).tier).toBe('weak')
    expect(getTier(49, 100).tier).toBe('weak')
  })
})

describe('normalizeWeights', () => {
  it('normalizes weights that sum to more than 1', () => {
    const result = normalizeWeights({ a: 0.6, b: 0.6 })
    expect(result.a).toBeCloseTo(0.5)
    expect(result.b).toBeCloseTo(0.5)
  })

  it('normalizes weights that sum to less than 1', () => {
    const result = normalizeWeights({ a: 0.1, b: 0.2 })
    expect(result.a).toBeCloseTo(1 / 3)
    expect(result.b).toBeCloseTo(2 / 3)
  })

  it('handles weights that already sum to 1', () => {
    const result = normalizeWeights({ a: 0.3, b: 0.7 })
    expect(result.a).toBeCloseTo(0.3)
    expect(result.b).toBeCloseTo(0.7)
  })

  it('handles single weight', () => {
    const result = normalizeWeights({ a: 1 })
    expect(result.a).toBeCloseTo(1)
  })

  it('handles all zero weights gracefully', () => {
    const result = normalizeWeights({ a: 0, b: 0 })
    expect(result.a).toBeCloseTo(0.5)
    expect(result.b).toBeCloseTo(0.5)
  })

  it('handles empty object', () => {
    const result = normalizeWeights({})
    expect(result).toEqual({})
  })
})

describe('getDefaultWeights', () => {
  it('returns correct default category weights', () => {
    const weights = getDefaultWeights()
    expect(weights.categories.valuation).toBeCloseTo(0.2)
    expect(weights.categories.quality).toBeCloseTo(0.25)
    expect(weights.categories.financialHealth).toBeCloseTo(0.2)
    expect(weights.categories.growth).toBeCloseTo(0.15)
    expect(weights.categories.ownership).toBeCloseTo(0.1)
    expect(weights.categories.size).toBeCloseTo(0.1)
  })

  it('default weights sum to 1', () => {
    const weights = getDefaultWeights()
    const sum = Object.values(weights.categories).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1)
  })
})

describe('calculateScore', () => {
  it('returns composite score within 0-100 range', () => {
    const result = calculateScore({
      peRatio: 15,
      pbRatio: 2,
      peg: 1,
      dividendYield: 2,
      roe: 15,
      roce: 15,
      operatingMargin: 20,
      netProfitMargin: 10,
      debtToEquity: 1,
      freeCashFlow: 100,
      bookValue: 500,
      revenueGrowth: 10,
      epsGrowth: 10,
      promoterHolding: 60,
      pledgedShares: 0,
      governanceQuality: 8,
      marketCap: 50000,
    })
    expect(result.compositeScore).toBeGreaterThanOrEqual(0)
    expect(result.compositeScore).toBeLessThanOrEqual(100)
    expect(result.totalMaxScore).toBe(100)
  })

  it('produces deterministic output for same input', () => {
    const input: Parameters<typeof calculateScore>[0] = {
      peRatio: 12,
      pbRatio: 1.5,
      peg: 0.8,
      dividendYield: 3,
    }
    const result1 = calculateScore(input)
    const result2 = calculateScore(input)
    expect(result1).toEqual(result2)
  })

  it('handles empty input gracefully', () => {
    const result = calculateScore({})
    expect(result.compositeScore).toBe(0)
    expect(result.compositeTier).toBe('weak')
    expect(result.categoryScores).toHaveLength(6)
    expect(result.parameterScores).toHaveLength(17)
    expect(result.totalMaxScore).toBe(100)
  })

  it('handles partial input with missing parameters', () => {
    const result = calculateScore({
      peRatio: 10,
      pbRatio: 1,
      dividendYield: 5,
    })
    expect(result.compositeScore).toBeGreaterThan(0)
    const valuation = result.categoryScores.find((c) => c.key === 'valuation')
    expect(valuation).toBeDefined()
    const paramNames = valuation!.parameters.map((p) => p.key)
    expect(paramNames).toContain('peRatio')
    expect(paramNames).toContain('pbRatio')
    expect(paramNames).toContain('dividendYield')
    expect(paramNames).toContain('peg')
    const presentParams = valuation!.parameters.filter(
      (p) => p.value !== null,
    )
    expect(presentParams).toHaveLength(3)
  })

  it('redistributes weight when parameters are missing', () => {
    const allPresent = calculateScore({
      peRatio: 10,
      pbRatio: 1,
      peg: 0.5,
      dividendYield: 3,
    })
    const valuationAll = allPresent.categoryScores.find(
      (c) => c.key === 'valuation',
    )!
    const weightAll = valuationAll.parameters[0].weight
    expect(weightAll).toBeCloseTo(0.25)

    const partial = calculateScore({
      peRatio: 10,
      pbRatio: 1,
      dividendYield: 3,
    })
    const valuationPartial = partial.categoryScores.find(
      (c) => c.key === 'valuation',
    )!
    const weightPartial = valuationPartial.parameters[0].weight
    expect(weightPartial).toBeCloseTo(1 / 3)
  })

  it('assigns correct composite tiers', () => {
    const strong = calculateScore({
      peRatio: 10,
      pbRatio: 0.5,
      peg: 0.5,
      dividendYield: 5,
      roe: 20,
      roce: 20,
      operatingMargin: 30,
      netProfitMargin: 20,
      debtToEquity: 0.1,
      freeCashFlow: 100,
      bookValue: 1000,
      revenueGrowth: 15,
      epsGrowth: 15,
      promoterHolding: 80,
      pledgedShares: 0,
      governanceQuality: 10,
      marketCap: 100000,
    })
    expect(strong.compositeTier).toBe('strong')

    const weak = calculateScore({})
    expect(weak.compositeTier).toBe('weak')
  })

  it('applies custom category weights', () => {
    const result = calculateScore(
      {
        peRatio: 10,
      },
      {
        categories: {
          valuation: 0.5,
          quality: 0.5,
        },
      },
    )
    const catWeights = Object.fromEntries(
      Object.entries(result.weightsUsed)
        .filter(([k]) => k.startsWith('category.'))
        .map(([k, v]) => [k.replace('category.', ''), v]),
    )
    const total = Object.values(catWeights).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1)
    expect(result.weightsUsed['category.valuation']).toBeGreaterThan(0.3)
    expect(result.weightsUsed['category.quality']).toBeGreaterThan(0.3)
  })
})

describe('parameter scoring at boundary values', () => {
  it('scores P/E ratio correctly', () => {
    expect(calculateScore({ peRatio: 5 }).parameterScores.find((p) => p.key === 'peRatio')!.score).toBe(20)
    expect(calculateScore({ peRatio: 10 }).parameterScores.find((p) => p.key === 'peRatio')!.score).toBe(20)
    expect(calculateScore({ peRatio: 12 }).parameterScores.find((p) => p.key === 'peRatio')!.score).toBe(16)
    expect(calculateScore({ peRatio: 15 }).parameterScores.find((p) => p.key === 'peRatio')!.score).toBe(16)
    expect(calculateScore({ peRatio: 18 }).parameterScores.find((p) => p.key === 'peRatio')!.score).toBe(12)
    expect(calculateScore({ peRatio: 20 }).parameterScores.find((p) => p.key === 'peRatio')!.score).toBe(12)
    expect(calculateScore({ peRatio: 25 }).parameterScores.find((p) => p.key === 'peRatio')!.score).toBe(8)
    expect(calculateScore({ peRatio: 30 }).parameterScores.find((p) => p.key === 'peRatio')!.score).toBe(4)
    expect(calculateScore({ peRatio: 50 }).parameterScores.find((p) => p.key === 'peRatio')!.score).toBe(2)
  })

  it('scores P/B ratio correctly', () => {
    expect(calculateScore({ pbRatio: 0 }).parameterScores.find((p) => p.key === 'pbRatio')!.score).toBe(20)
    expect(calculateScore({ pbRatio: 10 }).parameterScores.find((p) => p.key === 'pbRatio')!.score).toBe(15)
    expect(calculateScore({ pbRatio: 40 }).parameterScores.find((p) => p.key === 'pbRatio')!.score).toBe(0)
  })

  it('scores PEG ratio correctly', () => {
    expect(calculateScore({ peg: 0 }).parameterScores.find((p) => p.key === 'peg')!.score).toBe(20)
    expect(calculateScore({ peg: 1 }).parameterScores.find((p) => p.key === 'peg')!.score).toBe(15)
    expect(calculateScore({ peg: 4 }).parameterScores.find((p) => p.key === 'peg')!.score).toBe(0)
  })

  it('scores dividend yield correctly', () => {
    expect(calculateScore({ dividendYield: 0 }).parameterScores.find((p) => p.key === 'dividendYield')!.score).toBe(0)
    expect(calculateScore({ dividendYield: 2 }).parameterScores.find((p) => p.key === 'dividendYield')!.score).toBe(20)
    expect(calculateScore({ dividendYield: 5 }).parameterScores.find((p) => p.key === 'dividendYield')!.score).toBe(20)
  })

  it('scores ROE correctly', () => {
    expect(calculateScore({ roe: 0 }).parameterScores.find((p) => p.key === 'roe')!.score).toBe(0)
    expect(calculateScore({ roe: 15 }).parameterScores.find((p) => p.key === 'roe')!.score).toBe(20)
    expect(calculateScore({ roe: 30 }).parameterScores.find((p) => p.key === 'roe')!.score).toBe(20)
  })

  it('scores ROCE correctly', () => {
    expect(calculateScore({ roce: 0 }).parameterScores.find((p) => p.key === 'roce')!.score).toBe(0)
    expect(calculateScore({ roce: 15 }).parameterScores.find((p) => p.key === 'roce')!.score).toBe(20)
  })

  it('scores operating margin correctly', () => {
    expect(calculateScore({ operatingMargin: 0 }).parameterScores.find((p) => p.key === 'operatingMargin')!.score).toBe(0)
    expect(calculateScore({ operatingMargin: 25 }).parameterScores.find((p) => p.key === 'operatingMargin')!.score).toBe(5)
    expect(calculateScore({ operatingMargin: 100 }).parameterScores.find((p) => p.key === 'operatingMargin')!.score).toBe(20)
  })

  it('scores net profit margin correctly', () => {
    expect(calculateScore({ netProfitMargin: 0 }).parameterScores.find((p) => p.key === 'netProfitMargin')!.score).toBe(0)
    expect(calculateScore({ netProfitMargin: 25 }).parameterScores.find((p) => p.key === 'netProfitMargin')!.score).toBe(5)
    expect(calculateScore({ netProfitMargin: 100 }).parameterScores.find((p) => p.key === 'netProfitMargin')!.score).toBe(20)
  })

  it('scores debt-to-equity correctly', () => {
    expect(calculateScore({ debtToEquity: 0 }).parameterScores.find((p) => p.key === 'debtToEquity')!.score).toBe(20)
    expect(calculateScore({ debtToEquity: 2 }).parameterScores.find((p) => p.key === 'debtToEquity')!.score).toBe(10)
    expect(calculateScore({ debtToEquity: 4 }).parameterScores.find((p) => p.key === 'debtToEquity')!.score).toBe(0)
  })

  it('scores free cash flow correctly', () => {
    expect(calculateScore({ freeCashFlow: 100 }).parameterScores.find((p) => p.key === 'freeCashFlow')!.score).toBe(15)
    expect(calculateScore({ freeCashFlow: -100 }).parameterScores.find((p) => p.key === 'freeCashFlow')!.score).toBe(5)
    expect(calculateScore({ freeCashFlow: 0 }).parameterScores.find((p) => p.key === 'freeCashFlow')!.score).toBe(5)
  })

  it('scores book value correctly', () => {
    expect(calculateScore({ bookValue: 0 }).parameterScores.find((p) => p.key === 'bookValue')!.score).toBe(0)
    expect(calculateScore({ bookValue: 1000 }).parameterScores.find((p) => p.key === 'bookValue')!.score).toBe(20)
    expect(calculateScore({ bookValue: 100 }).parameterScores.find((p) => p.key === 'bookValue')!.score).toBe(2)
  })

  it('scores revenue growth correctly', () => {
    expect(calculateScore({ revenueGrowth: 0 }).parameterScores.find((p) => p.key === 'revenueGrowth')!.score).toBe(0)
    expect(calculateScore({ revenueGrowth: 10 }).parameterScores.find((p) => p.key === 'revenueGrowth')!.score).toBe(20)
    expect(calculateScore({ revenueGrowth: 5 }).parameterScores.find((p) => p.key === 'revenueGrowth')!.score).toBe(10)
  })

  it('scores EPS growth correctly', () => {
    expect(calculateScore({ epsGrowth: 0 }).parameterScores.find((p) => p.key === 'epsGrowth')!.score).toBe(0)
    expect(calculateScore({ epsGrowth: 10 }).parameterScores.find((p) => p.key === 'epsGrowth')!.score).toBe(20)
  })

  it('scores promoter holding correctly', () => {
    expect(calculateScore({ promoterHolding: 0 }).parameterScores.find((p) => p.key === 'promoterHolding')!.score).toBe(0)
    expect(calculateScore({ promoterHolding: 75 }).parameterScores.find((p) => p.key === 'promoterHolding')!.score).toBe(15)
    expect(calculateScore({ promoterHolding: 100 }).parameterScores.find((p) => p.key === 'promoterHolding')!.score).toBe(20)
  })

  it('scores pledged shares correctly', () => {
    expect(calculateScore({ pledgedShares: 0 }).parameterScores.find((p) => p.key === 'pledgedShares')!.score).toBe(20)
    expect(calculateScore({ pledgedShares: 5 }).parameterScores.find((p) => p.key === 'pledgedShares')!.score).toBe(15)
    expect(calculateScore({ pledgedShares: 15 }).parameterScores.find((p) => p.key === 'pledgedShares')!.score).toBe(10)
    expect(calculateScore({ pledgedShares: 35 }).parameterScores.find((p) => p.key === 'pledgedShares')!.score).toBe(5)
    expect(calculateScore({ pledgedShares: 60 }).parameterScores.find((p) => p.key === 'pledgedShares')!.score).toBe(0)
  })

  it('scores governance quality correctly', () => {
    expect(calculateScore({ governanceQuality: 0 }).parameterScores.find((p) => p.key === 'governanceQuality')!.score).toBe(0)
    expect(calculateScore({ governanceQuality: 5 }).parameterScores.find((p) => p.key === 'governanceQuality')!.score).toBe(10)
    expect(calculateScore({ governanceQuality: 10 }).parameterScores.find((p) => p.key === 'governanceQuality')!.score).toBe(20)
  })

  it('scores market cap correctly', () => {
    expect(calculateScore({ marketCap: 50000 }).parameterScores.find((p) => p.key === 'marketCap')!.score).toBe(20)
    expect(calculateScore({ marketCap: 10000 }).parameterScores.find((p) => p.key === 'marketCap')!.score).toBe(12)
    expect(calculateScore({ marketCap: 1000 }).parameterScores.find((p) => p.key === 'marketCap')!.score).toBe(6)
  })
})

describe('edge cases', () => {
  it('handles zero values for all parameters', () => {
    const result = calculateScore({
      peRatio: 0,
      pbRatio: 0,
      peg: 0,
      dividendYield: 0,
      roe: 0,
      roce: 0,
      operatingMargin: 0,
      netProfitMargin: 0,
      debtToEquity: 0,
      freeCashFlow: 0,
      bookValue: 0,
      revenueGrowth: 0,
      epsGrowth: 0,
      promoterHolding: 0,
      pledgedShares: 0,
      governanceQuality: 0,
      marketCap: 0,
    })
    expect(result.compositeScore).toBeGreaterThanOrEqual(0)
    expect(result.compositeScore).toBeLessThanOrEqual(100)
    expect(result.parameterScores.every((p) => p.score >= 0)).toBe(true)
  })

  it('handles extreme values without crashing', () => {
    const result = calculateScore({
      peRatio: 9999,
      pbRatio: 9999,
      peg: 9999,
      dividendYield: 9999,
      roe: 9999,
      roce: 9999,
      operatingMargin: 9999,
      netProfitMargin: 9999,
      debtToEquity: 9999,
      freeCashFlow: 9999,
      bookValue: 9999,
      revenueGrowth: 9999,
      epsGrowth: 9999,
      promoterHolding: 9999,
      pledgedShares: 9999,
      governanceQuality: 9999,
      marketCap: 9999,
    })
    expect(result.compositeScore).toBeGreaterThanOrEqual(0)
    expect(result.compositeScore).toBeLessThanOrEqual(100)
  })

  it('handles negative values where applicable', () => {
    const result = calculateScore({
      peRatio: -10,
      revenueGrowth: -5,
      epsGrowth: -5,
    })
    const r = (key: string) =>
      result.parameterScores.find((p) => p.key === key)!.score
    expect(r('peRatio')).toBe(20)
    expect(r('revenueGrowth')).toBe(0)
    expect(r('epsGrowth')).toBe(0)
  })

  it('all parameters perfectly scored', () => {
    const result = calculateScore({
      peRatio: 5,
      pbRatio: 0,
      peg: 0,
      dividendYield: 5,
      roe: 20,
      roce: 20,
      operatingMargin: 100,
      netProfitMargin: 100,
      debtToEquity: 0,
      freeCashFlow: 100,
      bookValue: 1000,
      revenueGrowth: 10,
      epsGrowth: 10,
      promoterHolding: 100,
      pledgedShares: 0,
      governanceQuality: 10,
      marketCap: 50000,
    })
    const perfectParams = result.parameterScores.filter(
      (p) => p.score === 20,
    )
    expect(perfectParams.length).toBeGreaterThanOrEqual(14)
    expect(result.compositeTier).toBe('strong')
  })

  it('handles null and undefined values in input', () => {
    const result = calculateScore({
      peRatio: undefined,
      pbRatio: null as unknown as undefined,
      dividendYield: 3,
    } as unknown as Parameters<typeof calculateScore>[0])
    expect(result.compositeScore).toBeGreaterThan(0)
    const pe = result.parameterScores.find((p) => p.key === 'peRatio')!
    expect(pe.score).toBe(0)
    expect(pe.value).toBeNull()
  })

  it('category scores are weighted sums of parameter scores', () => {
    const result = calculateScore({
      peRatio: 10,
      pbRatio: 1,
      peg: 0.5,
      dividendYield: 3,
    })
    const valuation = result.categoryScores.find(
      (c) => c.key === 'valuation',
    )!
    const paramContributions = valuation.parameters.reduce(
      (s, p) => s + p.contribution,
      0,
    )
    expect(valuation.score).toBeCloseTo(paramContributions, 1)
  })

  it('outputs all 17 parameter scores', () => {
    const result = calculateScore({
      peRatio: 10,
      pbRatio: 1,
      peg: 0.5,
      dividendYield: 3,
      roe: 15,
      roce: 12,
      operatingMargin: 20,
      netProfitMargin: 10,
      debtToEquity: 0.5,
      freeCashFlow: 100,
      bookValue: 200,
      revenueGrowth: 8,
      epsGrowth: 10,
      promoterHolding: 65,
      pledgedShares: 5,
      governanceQuality: 7,
      marketCap: 30000,
    })
    expect(result.parameterScores).toHaveLength(17)
    expect(result.categoryScores).toHaveLength(6)
  })
})
