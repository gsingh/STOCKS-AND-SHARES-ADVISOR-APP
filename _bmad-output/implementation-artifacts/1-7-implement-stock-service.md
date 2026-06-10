# Story 1.7: Implement StockService composite data service

## Story

**As a** user viewing a stock's detailed analysis page,
**I want** the app to fetch and compose real-time price data, fundamental data, and scoring into a single unified data envelope,
**so that** the UI can render a complete stock snapshot with minimal latency and graceful partial-failure handling.

## Acceptance Criteria

1. `src/services/stock-service.ts` is created exposing:
   - `getStockData(symbol: string): Promise<DataEnvelope<StockData>>`
   - `getStockDataBatch(symbols: string[]): Promise<Map<string, DataEnvelope<StockData>>>`
2. `StockData` is a composite type:
   ```ts
   interface StockData {
     symbol: string
     name?: string
     quote: DataEnvelope<QuoteData>
     fundamentals: DataEnvelope<FundamentalData>
     score?: DataEnvelope<ScoringResult>
   }
   ```
3. `getStockData` fires parallel requests for quote (`getQuote`) and fundamentals (`getFundamentals`), then passes the fundamental data to the scoring engine (`calculateScore`).
4. All three sub-envelopes preserve their own independent `fetchedAt` timestamps and `source` labels.
5. If quote or fundamentals fail with no cached fallback, `StockData` still returns with `null` data for that envelope and `error` populated — the other envelopes are unaffected.
6. If the scoring engine is called but fundamentals returned `null`, scoring is skipped (score envelope = `null`).
7. `getStockDataBatch` uses `Promise.allSettled` to handle partial failures across symbols, returning a `Map` of symbol → result.
8. The top-level envelope's `fetchedAt` reflects the *latest* successful sub-fetch time, and `source` is the most recent among sub-sources (priority: `api > scraper > cache`).
9. Unit tests in `src/services/__tests__/stock-service.test.ts` cover: happy path (all services succeed), partial failure (quote fails, fundamentals succeed), full failure (both fail), scoring skipped when fundamentals are null.

## Tasks / Subtasks

- [ ] 1.7.1 Define `StockData` composite interface in `src/types/stock.ts`
- [ ] 1.7.2 Implement source priority helper `resolveSource(sources: DataSource[]): DataSource` with priority `api > scraper > cache > user`
- [ ] 1.7.3 Implement `getStockData(symbol)` with `Promise.all` parallel fetch of quote + fundamentals
- [ ] 1.7.4 Wire scoring engine: after fundamentals resolve, call `calculateScore(fundamentals.data)` if data exists
- [ ] 1.7.5 Implement `getStockDataBatch(symbols[])` with `Promise.allSettled` and chunking (batches of 10)
- [ ] 1.7.6 Create `src/services/__tests__/stock-service.test.ts` with full coverage of partial failure scenarios
- [ ] 1.7.7 Verify integration: confirm that the response's `fetchedAt` is the latest among sub-responses

## Dev Notes

### Composition Pattern

```ts
async function getStockData(symbol: string): Promise<DataEnvelope<StockData>> {
  // Parallel fetch
  const [quoteResult, fundamentalResult] = await Promise.allSettled([
    getQuote(symbol),
    getFundamentals(symbol),
  ])

  // Resolve each sub-envelope
  const quote: DataEnvelope<QuoteData> = quoteResult.status === 'fulfilled'
    ? quoteResult.value
    : { data: null, fetchedAt: null, source: 'api', error: quoteResult.reason?.message }

  const fundamentals: DataEnvelope<FundamentalData> = fundamentalResult.status === 'fulfilled'
    ? fundamentalResult.value
    : { data: null, fetchedAt: null, source: 'scraper', error: fundamentalResult.reason?.message }

  // Score (only if fundamentals succeeded)
  let score: DataEnvelope<ScoringResult> | undefined
  if (fundamentals.data) {
    score = {
      data: calculateScore(fundamentals.data),
      fetchedAt: new Date().toISOString(),
      source: 'cache', // computed locally, not fetched
    }
  }

  const stockData: StockData = {
    symbol: symbol.toUpperCase(),
    quote,
    fundamentals,
    score,
  }

  return {
    data: stockData,
    fetchedAt: latestFetchTime([quote.fetchedAt, fundamentals.fetchedAt, score?.fetchedAt ?? null]),
    source: resolveSource([quote.source, fundamentals.source, score?.source ?? 'cache']),
    error: deriveError([quote.error, fundamentals.error]),
  }
}
```

### Source Priority Resolution

```ts
type DataSource = 'api' | 'scraper' | 'cache' | 'user'

const SOURCE_PRIORITY: Record<DataSource, number> = {
  api: 4,
  scraper: 3,
  cache: 2,
  user: 1,
}

function resolveSource(sources: DataSource[]): DataSource {
  let best: DataSource = 'cache'
  for (const s of sources) {
    if (SOURCE_PRIORITY[s] > SOURCE_PRIORITY[best]) best = s
  }
  return best
}
```

### latestFetchTime Helper

```ts
function latestFetchTime(timestamps: (string | null)[]): string | null {
  const valid = timestamps
    .filter((t): t is string => t !== null)
    .map(t => new Date(t).getTime())
  if (valid.length === 0) return null
  return new Date(Math.max(...valid)).toISOString()
}
```

### deriveError Helper

```ts
function deriveError(errors: (string | undefined)[]): string | undefined {
  const nonEmpty = errors.filter((e): e is string => e !== undefined && e.length > 0)
  return nonEmpty.length > 0 ? nonEmpty.join('; ') : undefined
}
```

### Parallel Fetch with Promise.all

Use `Promise.allSettled` (not `Promise.all`) for all parallel operations so that one failure never takes down the entire request. Always handle both `fulfilled` and `rejected` states.

### Partial Failure Strategy

| Scenario | quote | fundamentals | score | Top-level error |
|----------|-------|-------------|-------|----------------|
| All succeed | full data | full data | computed | undefined |
| Quote fails, fundamentals succeed | error envelope | full data | computed | "Quote fetch failed: ..." |
| Quote succeeds, fundamentals fail | full data | error envelope | undefined | "Fundamentals fetch failed: ..." |
| Both fail | error envelope | error envelope | undefined | "Quote fetch failed: ...; Fundamentals fetch failed: ..." |
| Fund succeeds, fund data is null | full data | { data: null } | undefined (skipped) | undefined |

### DataEnvelope<StockData> Shape

```ts
{
  data: {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    quote: {
      data: { lastPrice: 2450, change: 25, changePercent: 1.03, ... },
      fetchedAt: '2026-06-08T10:30:00.000Z',
      source: 'api',
    },
    fundamentals: {
      data: { marketCap: 1650000, peRatio: 28.5, roe: 12.3, ... },
      fetchedAt: '2026-06-08T09:00:00.000Z',
      source: 'scraper',
    },
    score: {
      data: { compositeScore: 72, tier: 'Good', parameterScores: [...], ... },
      fetchedAt: '2026-06-08T10:30:01.000Z',
      source: 'cache',
    },
  },
  fetchedAt: '2026-06-08T10:30:01.000Z',
  source: 'api',      // highest priority among api, scraper, cache
}
```

### Batch Implementation

```ts
async function getStockDataBatch(symbols: string[]): Promise<Map<string, DataEnvelope<StockData>>> {
  const results = new Map<string, DataEnvelope<StockData>>()
  const CHUNK_SIZE = 10

  for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
    const chunk = symbols.slice(i, i + CHUNK_SIZE)
    const chunkResults = await Promise.allSettled(chunk.map(s => getStockData(s)))
    chunk.forEach((sym, idx) => {
      const res = chunkResults[idx]
      results.set(
        sym.toUpperCase(),
        res.status === 'fulfilled'
          ? res.value
          : { data: null, fetchedAt: null, source: 'api', error: res.reason?.message }
      )
    })
  }
  return results
}
```

### Testing Standards

```ts
// src/services/__tests__/stock-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as quoteService from '../quote-service'
import * as screenerService from '../screener-service'

describe('getStockData', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('composes quote, fundamentals, and score on success', async () => { ... })
  it('handles quote failure gracefully', async () => { ... })
  it('handles fundamentals failure gracefully', async () => { ... })
  it('skips scoring when fundamentals data is null', async () => { ... })
  it('sets top-level fetchedAt to latest sub-fetch time', async () => { ... })
  it('sets top-level source to highest priority between subs', async () => { ... })
  it('populates top-level error when any sub fails', async () => { ... })
})

describe('getStockDataBatch', () => {
  it('returns map for all symbols', async () => { ... })
  it('handles partial failures across symbols', async () => { ... })
  it('chunks requests in groups of 10', async () => { ... })
})
```

Mock `quote-service.getQuote`, `screener-service.getFundamentals`, and `scoring-engine.calculateScore` to control test scenarios. Verify that `Promise.allSettled` is used (not `Promise.all`) by asserting that one failing mock does not prevent the other from resolving.

### Integration Note

The stock service is the **primary data entry point for the UI**. Every stock detail page, watchlist, and portfolio view will call `getStockData` or `getStockDataBatch`. Ensure it has proper error boundaries at the React level to display partial data gracefully.

### Library Versions

No new library dependencies. Uses services from stories 1-4, 1-5, and feature from 1-6.

### Source Tree After Implementation

```
src/
├── services/
│   ├── db.ts
│   ├── ttl.ts
│   ├── quote-service.ts
│   ├── screener-service.ts
│   ├── screener-slugs.ts
│   ├── stock-service.ts              # NEW: getStockData, getStockDataBatch
│   └── __tests__/
│       ├── db.test.ts
│       ├── quote-service.test.ts
│       ├── screener-service.test.ts
│       ├── screener-slugs.test.ts
│       └── stock-service.test.ts    # NEW
├── types/
│   ├── quote.ts
│   ├── fundamental.ts
│   └── stock.ts                     # NEW: StockData interface
```

### References

- Promise.allSettled: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
- Scoring engine: see story 1-6
- Quote service: see story 1-4
- Screener service: see story 1-5

## Dev Agent Record

| Field | Value |
|-------|-------|
| Story | 1-7 |
| Epic | 1 — Foundation & Infrastructure |
| Status | Planned |
| Priority | High |
| Dependencies | 1-4, 1-5, 1-6 |
| Estimated Effort | Medium (4–5 hrs) |
| Agent | To be assigned |
