# Story 1.4: Implement QuoteService wrapping nse-bse-api

## Story

**As a** user viewing stock quotes,
**I want** the app to fetch and cache real-time and historical price data from NSE/BSE,
**so that** I see current prices with freshness indicators and the app works offline with stale data.

## Acceptance Criteria

1. `src/services/quote-service.ts` is created exposing:
   - `getQuote(symbol: string): Promise<DataEnvelope<QuoteData>>`
   - `getQuotes(symbols: string[]): Promise<Map<string, DataEnvelope<QuoteData>>>`
2. `QuoteData` type contains: `lastPrice`, `change`, `changePercent`, `dayHigh`, `dayLow`, `volume`, `previousClose`, `open`, `lastUpdateTime`, `symbol`.
3. `getQuote` first checks the Dexie `stock` table for cached data. If cache exists and is fresher than 15 minutes, return cache (source = `'cache'`).
4. If cache is stale or absent, fetch from nse-bse-api, store result in Dexie `stock` table with `fetchedAt = new Date().toISOString()` and `source = 'api'`.
5. If the API call fails, fall back to returning the stale cache (if any) with `source = 'cache'` and `error` field populated. If no cache exists, return `{ data: null, error: message }`.
6. `getQuotes` fires parallel requests for all symbols (batching at most 10 at a time to avoid rate limits).
7. All network errors are caught and surfaced without throwing — the function always returns a `DataEnvelope` (never throws).
8. Unit tests in `src/services/__tests__/quote-service.test.ts` cover: fresh cache hit, stale cache + API success, stale cache + API failure, empty cache + API failure, and batch scenario.

## Tasks / Subtasks

- [ ] 1.4.1 Define `QuoteData` interface in `src/types/quote.ts`
- [ ] 1.4.2 Install `nse-bse-api` package (`npm install nse-bse-api`)
- [ ] 1.4.3 Create TTL utility `src/services/ttl.ts` with `isFresh(fetchedAt: string | null, ttlMinutes: number): boolean`
- [ ] 1.4.4 Implement `getQuote(symbol)` with cache-before-fetch logic
- [ ] 1.4.5 Implement `getQuotes(symbols[])` with parallel batching (chunk size 10)
- [ ] 1.4.6 Create `src/services/__tests__/quote-service.test.ts` with full coverage
- [ ] 1.4.7 Wire `getQuote` return to ensure `fetchedAt` and `source` are always populated on success

## Dev Notes

### Cache-Before-Fetch Pattern

```ts
async function getQuote(symbol: string): Promise<DataEnvelope<QuoteData>> {
  // 1. Check cache
  const cached = await dbGet<DataEnvelope<QuoteData>>(db.stock, symbol.toUpperCase())
  if (cached.data && isFresh(cached.data.fetchedAt, 15)) {
    return { ...cached.data, source: 'cache' }
  }

  // 2. Fetch from API
  try {
    const raw = await nseApi.getQuote(symbol) // from nse-bse-api
    const quote: QuoteData = mapRawToQuote(raw)
    const envelope: DataEnvelope<QuoteData> = {
      data: quote,
      fetchedAt: new Date().toISOString(),
      source: 'api',
    }
    await dbPut(db.stock, symbol.toUpperCase(), envelope)
    return envelope
  } catch (err) {
    // 3. Fallback to stale cache
    if (cached.data) {
      return { ...cached.data, source: 'cache', error: err instanceof Error ? err.message : 'API error' }
    }
    return { data: null, fetchedAt: null, source: 'api', error: err instanceof Error ? err.message : 'API error' }
  }
}
```

### TTL Utility

```ts
// src/services/ttl.ts
export function isFresh(fetchedAt: string | null, ttlMinutes: number): boolean {
  if (!fetchedAt) return false
  const age = Date.now() - new Date(fetchedAt).getTime()
  return age < ttlMinutes * 60 * 1000
}
```

### nse-bse-api Usage Patterns

The `nse-bse-api` package provides two top-level exports:

```ts
import { nse, bse } from 'nse-bse-api'

// NSE quote
const quote = await nse.getQuote('RELIANCE')
// Returns: { symbol, lastPrice, change, changePercent, dayHigh, dayLow, volume, previousClose, open, lastUpdateTime }

// BSE quote
const bseQuote = await bse.getQuote('500325') // BSE uses security ID
```

Normalize to `QuoteData` shape internally. The service should auto-detect whether input is an ISIN, BSE security ID, or NSE symbol (or accept a `exchange` parameter).

For this story, assume NSE symbols by default. Add a `getBseQuote(securityId)` later if needed.

### Batch Request Optimization

```ts
async function getQuotes(symbols: string[]): Promise<Map<string, DataEnvelope<QuoteData>>> {
  const results = new Map<string, DataEnvelope<QuoteData>>()
  const CHUNK_SIZE = 10
  for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
    const chunk = symbols.slice(i, i + CHUNK_SIZE)
    const chunkResults = await Promise.allSettled(chunk.map(s => getQuote(s)))
    chunk.forEach((sym, idx) => {
      const res = chunkResults[idx]
      results.set(sym, res.status === 'fulfilled' ? res.value : { data: null, fetchedAt: null, source: 'api', error: res.reason?.message })
    })
  }
  return results
}
```

### DataEnvelope Return Contract

Every public function in `quote-service.ts` must return a `DataEnvelope<QuoteData>` with all top-level fields non-nullable except `data`:

```ts
interface DataEnvelope<T> {
  data: T | null
  fetchedAt: string | null   // ISO 8601 — always set on success
  source: 'cache' | 'api' | 'scraper' | 'user'
  error?: string             // only present on failure
}
```

### Testing Standards

```ts
// src/services/__tests__/quote-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('getQuote', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns cached data when fresh', async () => { ... })
  it('fetches from API when cache is stale', async () => { ... })
  it('falls back to stale cache on API failure', async () => { ... })
  it('returns error envelope when no cache and API fails', async () => { ... })
})

describe('getQuotes', () => {
  it('fetches multiple symbols in parallel batches', async () => { ... })
  it('handles partial failures', async () => { ... })
})
```

Mock Dexie and nse-bse-api using Vitest's `vi.mock()`. Create a mock factory for Dexie that returns controllable data.

### Library Versions

- `nse-bse-api: ^1.0.0` (or latest available)
- `dexie: ^4.0.10`

### Source Tree After Implementation

```
src/
├── services/
│   ├── db.ts                       # (existing)
│   ├── ttl.ts                      # TTL freshness check
│   ├── quote-service.ts            # getQuote, getQuotes
│   └── __tests__/
│       ├── db.test.ts              # (existing)
│       └── quote-service.test.ts   # Quote service tests
├── types/
│   └── quote.ts                    # QuoteData interface
```

### References

- nse-bse-api documentation: https://www.npmjs.com/package/nse-bse-api
- Dexie Table.get: https://dexie.org/docs/Table/Table.get()
- Promise.allSettled: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled

## Dev Agent Record

| Field | Value |
|-------|-------|
| Story | 1-4 |
| Epic | 1 — Foundation & Infrastructure |
| Status | Planned |
| Priority | High |
| Dependencies | 1-3 |
| Estimated Effort | Medium (4–6 hrs) |
| Agent | To be assigned |
