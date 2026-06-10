# Story 1.6: Implement pure Scoring Engine module

## Story

**As a** user viewing a stock scorecard,
**I want** the app to compute a quantitative score from fundamental data using 17 weighted parameters across 6 categories,
**so that** I get an objective, transparent, and reproducible stock quality assessment (0–100).

## Acceptance Criteria

1. `src/features/scorecard/scoring-engine.ts` is created with pure functions only — zero React imports, zero side-effects.
2. `calculateScore(fundamentals: FundamentalData, weights?: Partial<ParameterWeights>): ScoringResult` computes:
   - **Valuation** (5 params): P/E score, P/B score, PEG score, Dividend Yield score
   - **Quality** (4 params): ROE score, ROCE score, Operating Margin score, Net Profit Margin score
   - **Financial Health** (3 params): Debt-to-Equity score, Free Cash Flow score, Book Value score
   - **Growth** (2 params): Revenue Growth score (TTM), EPS Growth score (5Y)
   - **Ownership** (3 params): Promoter Holding score, Pledged Shares score (penalty), Governance score
   - **Size** (1 param): Market Cap score
3. Each parameter scores 0–20. Category scores are the sum of constituent parameter scores. Composite score is the sum of all category scores (0–100).
4. Default weights are uniform across all 17 parameters (each = 1/17). Custom weights are accepted via `weights` parameter and normalized to sum to 1.
5. Result includes:
   - `parameterScores: Array<{ name: string; category: string; raw: number | null; score: number; weight: number }>`
   - `categoryScores: Array<{ category: string; score: number; maxScore: number; percentage: number }>`
   - `compositeScore: number`
   - `tier: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Very Poor'`
   - `tierRange: [number, number]`
6. Tier thresholds: Excellent ≥80, Good ≥60, Fair ≥40, Poor ≥20, Very Poor <20.
7. Missing fundamentals (`null` values) are skipped — the weight is redistributed across remaining parameters in that category.
8. Fixed thresholds and scoring functions are deterministic — same input always produces same output.
9. Computation completes in <50ms for any valid input.
10. Tests in `src/features/scorecard/__tests__/scoring-engine.test.ts` cover all 17 parameter boundary conditions, weight normalization, null/missing handling, and tier edge cases.

## Tasks / Subtasks

- [ ] 1.6.1 Define `ParameterScores`, `CategoryScores`, `ScoringResult`, `ParameterWeights` types in `src/features/scorecard/types.ts`
- [ ] 1.6.2 Create `src/features/scorecard/parameters.ts` with the 17 scoring functions, each taking a `number | null` and returning `number (0–20)`
- [ ] 1.6.3 Create `src/features/scorecard/parameters.ts` constants: `PARAMETER_DEFINITIONS`, `CATEGORY_DEFINITIONS`, `DEFAULT_WEIGHTS`, `TIER_THRESHOLDS`
- [ ] 1.6.4 Implement `calculateScore(fundamentals, weights?)` in `src/features/scorecard/scoring-engine.ts`
- [ ] 1.6.5 Implement weight normalization helper `normalizeWeights(weights: Partial<ParameterWeights>): ParameterWeights`
- [ ] 1.6.6 Implement null-safe scoring that redistributes weight across scored parameters
- [ ] 1.6.7 Create `src/features/scorecard/__tests__/scoring-engine.test.ts` with comprehensive coverage
- [ ] 1.6.8 Verify with `vitest run` that all tests pass and scoring completes in <50ms

## Dev Notes

### All 17 Parameters by Category

#### Valuation (5 params) — max 20 category score (4 per param)
| # | Parameter | Scoring Logic (returns 0–20) | Thresholds |
|---|-----------|------------------------------|------------|
| 1 | P/E Score | Lower is better. 0–15 → 20, 15–25 → linear 20→10, 25–50 → linear 10→5, >50 or <0 → 0 | `[0, 15, 25, 50, Infinity]` mapped to `[20, 20, 10, 5, 0]` |
| 2 | P/B Score | Lower is better. 0–1.5 → 20, 1.5–3 → linear 20→10, 3–7 → linear 10→5, >7 → 0 | `[0, 1.5, 3, 7, Infinity]` → `[20, 20, 10, 5, 0]` |
| 3 | PEG Score | Lower is better. 0–1 → 20, 1–2 → linear 20→10, 2–5 → 5, >5 or <0 → 0 | `[0, 1, 2, 5, Infinity]` → `[20, 20, 10, 5, 0]` |
| 4 | Dividend Yield | Higher is better. >4% → 20, 2–4% → 10–20, 0–2% → 0–10, 0 → 0 | `[0, 0.01, 2, 4, Infinity]` → `[0, 0, 10, 20, 20]` |

#### Quality (4 params) — max 20 category score (5 per param)
| # | Parameter | Scoring Logic | Thresholds |
|---|-----------|---------------|------------|
| 5 | ROE Score | Higher is better. >20 → 20, 15–20 → 15–20, 10–15 → 10–15, 5–10 → 0–10, <5 → 0 | `[0, 5, 10, 15, 20, Infinity]` → `[0, 0, 5, 10, 15, 20]` |
| 6 | ROCE Score | Higher is better. >25 → 20, 15–25 → 10–20, 10–15 → 5–10, <10 → 0 | `[0, 10, 15, 25, Infinity]` → `[0, 0, 5, 10, 20]` |
| 7 | Op Margin Score | Higher is better. >20 → 20, 10–20 → linear 10→20, 5–10 → 5→10, <5 → 0 | `[0, 5, 10, 20, Infinity]` → `[0, 0, 5, 10, 20]` |
| 8 | Net Margin Score | Higher is better. >15 → 20, 8–15 → 10–20, 3–8 → 0–10, <3 → 0 | `[0, 3, 8, 15, Infinity]` → `[0, 0, 5, 10, 20]` |

#### Financial Health (3 params) — max 20 category score (6.67 per param)
| # | Parameter | Scoring Logic | Thresholds |
|---|-----------|---------------|------------|
| 9 | D/E Score | Lower is better. 0 → 20, 0–0.5 → 15–20, 0.5–1.5 → 5–15, 1.5–3 → 0–5, >3 → 0 | `[0, 0, 0.5, 1.5, 3, Infinity]` → `[20, 20, 15, 5, 0, 0]` |
| 10 | FCF Score | Positive → 20, Null/zero → 10, Negative → 0 | If FCF > 0 → 20, FCF === 0 or null → 10, FCF < 0 → 0 |
| 11 | Book Value Score | Higher is better. >500 → 20, 100–500 → 10–20, 10–100 → 0–10, <10 → 0 | `[0, 10, 100, 500, Infinity]` → `[0, 0, 5, 10, 20]` |

#### Growth (2 params) — max 20 category score (10 per param)
| # | Parameter | Scoring Logic | Thresholds |
|---|-----------|---------------|------------|
| 12 | Rev Growth Score | Higher is better. >20 → 20, 10–20 → 10–20, 5–10 → 5–10, 0–5 → 0–5, <0 → 0 | `[-Infinity, 0, 5, 10, 20, Infinity]` → `[0, 0, 2, 5, 10, 20]` |
| 13 | EPS Growth Score | Higher is better. >25 → 20, 15–25 → 10–20, 5–15 → 0–10, 0–5 → 0, <0 → 0 | `[-Infinity, 0, 5, 15, 25, Infinity]` → `[0, 0, 0, 5, 10, 20]` |

#### Ownership (3 params) — max 20 category score (6.67 per param)
| # | Parameter | Scoring Logic | Thresholds |
|---|-----------|---------------|------------|
| 14 | Promoter Holding Score | Higher is better. >75 → 20, 50–75 → 10–20, 25–50 → 5–10, <25 → 0 | `[0, 25, 50, 75, Infinity]` → `[0, 0, 5, 10, 20]` |
| 15 | Pledged Shares Score | Penalty-based. 0 → 20 (no penalty), >0 → linear deduction, >50 → 0 | `[0, 0, 10, 25, 50, Infinity]` → `[20, 20, 15, 10, 5, 0]` |
| 16 | Governance Score | Binary penalty check (related-party transactions, auditor qualifications, board independence). Default 20, deduct 5/10/15 based on flags. | Default 20, max deduction -15 |

#### Size (1 param) — max 20 category score (20 per param)
| # | Parameter | Scoring Logic | Thresholds |
|---|-----------|---------------|------------|
| 17 | Market Cap Score | Higher is better. Large-cap (>20k Cr) → 20, Mid-cap (5k–20k) → 10–20, Small-cap (1k–5k) → 5–10, Micro (<1k) → 0 | `[0, 1000, 5000, 20000, Infinity]` → `[0, 0, 5, 10, 20]` |

### Scoring Function Pattern

```ts
// src/features/scorecard/parameters.ts
type ScoringFn = (value: number | null) => number

function createStepScorer(thresholds: number[], scores: number[]): ScoringFn {
  return (value: number | null): number => {
    if (value === null || value === undefined) return 0
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (value >= thresholds[i]) return scores[i]
    }
    return scores[0]
  }
}

function createLinearScorer(breakpoints: Array<{ threshold: number; score: number }>): ScoringFn {
  return (value: number | null): number => {
    if (value === null || value === undefined) return 0
    // Linear interpolation between breakpoints
    for (let i = 0; i < breakpoints.length - 1; i++) {
      const lo = breakpoints[i], hi = breakpoints[i + 1]
      if (value >= lo.threshold && value < hi.threshold) {
        const t = (value - lo.threshold) / (hi.threshold - lo.threshold)
        return lo.score + t * (hi.score - lo.score)
      }
    }
    return breakpoints[breakpoints.length - 1].score
  }
}
```

Use `createStepScorer` for simplicity in the first implementation, as step-based scoring (bucket mapping) is deterministic and more transparent than linear interpolation.

### Weight Normalization

```ts
function normalizeWeights(custom: Partial<ParameterWeights>, defaults: ParameterWeights): ParameterWeights {
  const merged = { ...defaults, ...custom }
  const total = Object.values(merged).reduce((a, b) => a + b, 0)
  // Normalize to sum = 1
  const normalized = {} as ParameterWeights
  for (const key of Object.keys(merged) as Array<keyof ParameterWeights>) {
    normalized[key] = merged[key] / total
  }
  return normalized
}
```

### Tier Thresholds

| Tier | Range   | Label         |
|------|---------|---------------|
| 1    | 80–100  | Excellent     |
| 2    | 60–79   | Good          |
| 3    | 40–59   | Fair          |
| 4    | 20–39   | Poor          |
| 5    | 0–19    | Very Poor     |

### Null Handling and Weight Redistribution

When a parameter's raw value is `null`, skip scoring it and redistribute its weight proportionally across the remaining scored parameters in the *same category*. If all parameters in a category are null, the category score is 0.

### ScoringResult Type

```ts
// src/features/scorecard/types.ts
export interface ScoringResult {
  parameterScores: ParameterScore[]
  categoryScores: CategoryScore[]
  compositeScore: number           // 0–100
  tier: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Very Poor'
  tierRange: [number, number]
  computedAt: string               // ISO 8601
}

export interface ParameterScore {
  name: string
  category: string
  raw: number | null
  score: number     // 0–20 (before weight application)
  weightedScore: number  // score * weight
  weight: number
}

export interface CategoryScore {
  category: string
  score: number
  maxScore: number   // always 20
  percentage: number // score / maxScore * 100
}

export interface ParameterWeights {
  pe: number; pb: number; peg: number; divYield: number
  roe: number; roce: number; opMargin: number; netMargin: number
  debtToEquity: number; freeCashFlow: number; bookValue: number
  revGrowth: number; epsGrowth: number
  promoterHolding: number; pledgedShares: number; governance: number
  marketCap: number
}
```

### Determinism Constraint

No `Math.random()`, no `Date.now()`, no external state. The only non-input data is `computedAt` (the ISO timestamp of computation). All scores are purely derived from `fundamentals` and `weights`.

### Performance

The entire `calculateScore` function should process in <1ms for all 17 parameters with null checks. Micro-benchmark in test:

```ts
it('completes in <50ms for bulk scoring', () => {
  const start = performance.now()
  for (let i = 0; i < 1000; i++) {
    calculateScore(mockFundamentals)
  }
  expect(performance.now() - start).toBeLessThan(50)
})
```

### Testing Standards

```ts
// src/features/scorecard/__tests__/scoring-engine.test.ts
import { describe, it, expect } from 'vitest'

describe('calculateScore', () => {
  describe('Valuation parameters', () => {
    it('scores P/E of 10 as 20', () => { ... })
    it('scores P/E of null as redistributed', () => { ... })
    it('scores negative P/E as 0', () => { ... })
    // ... per-parameter boundary tests
  })

  describe('Composite score', () => {
    it('returns 100 for perfect fundamentals', () => { ... })
    it('returns 0 for worst fundamentals', () => { ... })
    it('tier is "Excellent" for score >= 80', () => { ... })
    it('tier is "Very Poor" for score < 20', () => { ... })
  })

  describe('Weight normalization', () => {
    it('normalizes custom weights to sum 1', () => { ... })
    it('uses default weights when none provided', () => { ... })
  })

  describe('Null handling', () => {
    it('redistributes weight when one param in category is null', () => { ... })
    it('scores category 0 when all params are null', () => { ... })
  })

  describe('Performance', () => {
    it('processes 1000 scores in <50ms', () => { ... })
  })
})
```

### Zero React Imports Enforcement

The `src/features/scorecard/` directory must never import from React. Use only TypeScript standard library types. The `computedAt` timestamp uses `new Date().toISOString()` — this is a standard JS built-in, not a React concept.

### Source Tree After Implementation

```
src/
├── features/
│   └── scorecard/
│       ├── types.ts                # ScoringResult, ParameterScore, etc.
│       ├── parameters.ts           # 17 scoring functions, constants, defaults
│       ├── scoring-engine.ts       # calculateScore(), normalizeWeights()
│       └── __tests__/
│           └── scoring-engine.test.ts
```

### References

- Step-function scoring pattern (deterministic, bucket-based)
- Vitest performance testing: https://vitest.dev/guide/features.html#performance

## Dev Agent Record

| Field | Value |
|-------|-------|
| Story | 1-6 |
| Epic | 1 — Foundation & Infrastructure |
| Status | Planned |
| Priority | High |
| Dependencies | 1-5 (needs FundamentalData type) |
| Estimated Effort | Large (6–8 hrs) |
| Agent | To be assigned |
