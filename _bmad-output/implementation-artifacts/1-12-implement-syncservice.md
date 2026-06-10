# Story 1.12: Implement SyncService for background data refresh

Status: ready-for-dev

## Story

As a developer,
I want a SyncService that periodically refreshes stale cached data in the background,
So that frequently viewed stocks have up-to-date information without manual refresh.

## Acceptance Criteria

1. `src/services/sync-service.ts` implements `refreshIfStale(symbol)`
2. `refreshIfStale(symbol)` checks quote data TTL (15 minutes) for the given symbol
3. `refreshIfStale(symbol)` checks fundamental data TTL (24 hours) for the given symbol
4. If any data is stale, triggers parallel refresh via QuoteService and/or ScreenerService
5. Returns updated `DataEnvelope<QuoteData>` and/or `DataEnvelope<FundamentalData>` without blocking the caller
6. Dashboard triggers background refresh for all watchlisted stocks on load
7. Refresh is throttled to prevent rapid re-fetches of the same symbol (minimum 30-second interval between refreshes per symbol)
8. SyncService has a co-located test file covering stale/current states and throttling

## Tasks / Subtasks

- [ ] Create `src/services/sync-service.ts` with core `refreshIfStale` function (AC: #1)
- [ ] Implement TTL check logic for quote (15min) and fundamental (24h) data (AC: #2, #3)
- [ ] Implement parallel refresh via Promise.all for stale data (AC: #4)
- [ ] Return updated data envelopes without blocking (AC: #5)
- [ ] Implement Dashboard watchlist background refresh trigger (AC: #6)
- [ ] Implement per-symbol throttling (minimum 30s interval) (AC: #7)
- [ ] Write co-located tests (AC: #8)

## Dev Notes

### Architecture Patterns & Constraints

- **Zero-backend mandate:** All computation client-side. No server, no auth, no API keys. [Source: architecture.md#L44-L46]
- **DataEnvelope pattern:** Every data service return MUST be wrapped in `DataEnvelope<T>` with `data`, `fetchedAt`, `source`, `error` fields. [Source: architecture.md#L196-L204]
- **Tiered TTL:** Quotes 15 minutes, fundamentals 24 hours, corporate actions 7 days. [Source: architecture.md#NFR-9]
- **feature-based directory structure:** `src/features/` for pure domain logic, `src/services/` for data access. [Source: architecture.md#L188-L192]
- **Naming conventions:** kebab-case files, camelCase functions/vars. [Source: architecture.md#L170-L184]
- **Co-located tests:** `sync-service.test.ts` next to `sync-service.ts`. [Source: architecture.md#L184]
- **ISO 8601 dates** stored as strings in Dexie. [Source: architecture.md#L207-L209]
- **Offline-capable:** Local writes continue when offline, stale-cache shown with staleness indicators. [Source: EXPERIENCE.md#L89]

### Non-Blocking Refresh Pattern

The core pattern is fire-and-forget: the caller does NOT await the refresh. The function checks TTL, fires off parallel refreshes if needed, and returns immediately. The caller gets the (potentially stale) cached data right away, and the fresh data updates the store asynchronously.

```ts
export async function refreshIfStale(symbol: string): Promise<{
  quote: DataEnvelope<QuoteData>
  fundamentals: DataEnvelope<FundamentalData>
}> {
  const throttleKey = `refresh-${symbol}`
  if (isThrottled(throttleKey)) {
    // Return existing cached data without refreshing
    return getCachedData(symbol)
  }
  markThrottled(throttleKey)

  const quoteTTL = 15 // minutes
  const fundamentalTTL = 24 * 60 // minutes

  const quoteEnvelope = await quoteService.getQuote(symbol)
  const fundamentalEnvelope = await screenerService.getFundamentals(symbol)

  const refreshPromises: Promise<void>[] = []

  if (isStale(quoteEnvelope, quoteTTL)) {
    refreshPromises.push(
      quoteService.getQuote(symbol, { forceRefresh: true }).then((fresh) => {
        // Store fresh data back to Dexie (handled by quoteService internally)
        // Optionally update any in-memory caches or stores
      })
    )
  }

  if (isStale(fundamentalEnvelope, fundamentalTTL)) {
    refreshPromises.push(
      screenerService.getFundamentals(symbol, { forceRefresh: true }).then((fresh) => {
        // Store fresh data back to Dexie
      })
    )
  }

  // Fire refreshes in parallel, do not await
  if (refreshPromises.length > 0) {
    Promise.all(refreshPromises).catch((error) => {
      console.warn(`[SyncService] Background refresh failed for ${symbol}:`, error)
    })
  }

  // Return the current (possibly stale) data immediately
  return {
    quote: quoteEnvelope,
    fundamentals: fundamentalEnvelope,
  }
}
```

### DataEnvelope TTL Check

```ts
function isStale<T>(envelope: DataEnvelope<T>, ttlMinutes: number): boolean {
  if (!envelope.fetchedAt) return true
  if (envelope.source === 'user') return false // User-entered data never stale
  const elapsed = Date.now() - new Date(envelope.fetchedAt).getTime()
  return elapsed > ttlMinutes * 60 * 1000
}
```

### Throttling Implementation

Prevent rapid re-fetches of the same symbol with a simple in-memory throttle map:

```ts
const refreshThrottleMap = new Map<string, number>()
const THROTTLE_MS = 30_000 // 30 seconds

function isThrottled(key: string): boolean {
  const lastRefresh = refreshThrottleMap.get(key)
  if (!lastRefresh) return false
  return Date.now() - lastRefresh < THROTTLE_MS
}

function markThrottled(key: string): void {
  refreshThrottleMap.set(key, Date.now())
}
```

The throttle key is `refresh-${symbol}` so each symbol is throttled independently.

### Parallel Refresh via Promise.all

When both quote and fundamental data are stale, both refreshes fire in parallel:

```ts
Promise.all(refreshPromises)
```

This ensures:
- Both refreshes start simultaneously (not sequentially)
- Total refresh time is max(quoteTime, fundamentalTime), not sum
- Individual failures are caught independently

### Dashboard Watchlist Integration

The Dashboard component calls SyncService for its watchlisted stocks:

```tsx
// In Dashboard component (or a custom hook)
import { useDashboardStore } from '@/stores/dashboard-store'
import { refreshIfStale } from '@/services/sync-service'

function useDashboardRefresh() {
  const watchlistOrder = useDashboardStore((state) => state.watchlistOrder)

  useEffect(() => {
    if (watchlistOrder.length === 0) return

    // Refresh all watchlisted stocks in parallel, non-blocking
    watchlistOrder.forEach((symbol) => {
      refreshIfStale(symbol).catch(() => {
        // Individual refresh failures are handled inside refreshIfStale
      })
    })
  }, [watchlistOrder])
}
```

This runs once on Dashboard mount. The `refreshIfStale` function returns cached data immediately while background refreshes fire asynchronously.

### SyncService Full API

```ts
export interface SyncServiceAPI {
  refreshIfStale(symbol: string): Promise<{
    quote: DataEnvelope<QuoteData>
    fundamentals: DataEnvelope<FundamentalData>
  }>

  refreshWatchlist(watchlistSymbols: string[]): Promise<void>

  getRefreshStatus(symbol: string): {
    isRefreshing: boolean
    lastRefreshedAt: string | null
    nextRefreshAt: string | null
  }
}
```

- `refreshWatchlist` — calls `refreshIfStale` for each symbol in the watchlist, non-blocking
- `getRefreshStatus` — returns the current throttle/refresh state for a given symbol (useful for UI indicators)

### Module Structure

```
src/services/sync-service.ts
src/services/sync-service.test.ts
```

### Testing Standards

- Co-located tests: `sync-service.test.ts` next to `sync-service.ts`
- Vitest as test runner
- Mock `quoteService.getQuote` and `screenerService.getFundamentals` to control stale/current states
- Test: returns cached data immediately when within TTL
- Test: triggers parallel refresh when stale
- Test: throttle prevents rapid re-fetches (second call within 30s does not trigger refresh)
- Test: `refreshWatchlist` calls `refreshIfStale` for each symbol
- Test: handles partial failures (quote fails, fundamentals succeed)

```ts
// sync-service.test.ts example
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { refreshIfStale } from './sync-service'

vi.mock('@/services/quote-service', () => ({
  getQuote: vi.fn(),
}))

vi.mock('@/services/screener-service', () => ({
  getFundamentals: vi.fn(),
}))

describe('refreshIfStale', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns cached data without refresh when within TTL', async () => {
    // Mock fresh data (fetched 1 minute ago)
    // Assert: refresh not triggered
  })

  it('triggers background refresh when data is stale', async () => {
    // Mock stale data (fetched 30 minutes ago for quote)
    // Assert: refresh triggered in background
  })

  it('throttles rapid re-fetches of the same symbol', async () => {
    // Call refreshIfStale twice in quick succession
    // Assert: second call does not trigger refresh
  })
})
```

### Dependencies

This story depends on:
- Story 1.4: QuoteService with `getQuote(symbol, { forceRefresh })` support
- Story 1.5: ScreenerService with `getFundamentals(symbol, { forceRefresh })` support
- Story 1.10: Dashboard store for watchlistOrder
- Story 1.3: Dexie db instance for cached data access
- Types: `DataEnvelope<T>`, `QuoteData`, `FundamentalData`

The services should support a `forceRefresh` option that bypasses the cache and fetches fresh data from the API.

### References

- [Source: epics-and-stories.md#L400-L414] — Story 1.12 acceptance criteria
- [Source: architecture.md#NFR-9] — Tiered TTL (15min quotes, 24h fundamentals, 7d corp actions)
- [Source: architecture.md#L196-L204] — DataEnvelope pattern
- [Source: EXPERIENCE.md#L89] — Offline stale-cache behavior

## Dev Agent Record

### Agent Model Used

BMad Create-Story workflow (v6.8.1-next.4)

### Debug Log References

### Completion Notes List

### File List
