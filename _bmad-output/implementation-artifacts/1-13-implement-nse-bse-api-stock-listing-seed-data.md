# Story 1.13: Implement nse-bse-api stock listing for seed data

Status: ready-for-dev

## Story

As a developer,
I want the initial stock universe seeded from nse-bse-api,
So that the Browser has a searchable list of NSE/BSE stocks on first load.

## Acceptance Criteria

1. On first app initialization, the stock universe is fetched from nse-bse-api (list of all available symbols with names, sectors, and ISIN)
2. The fetched listing is stored in Dexie `stock` table
3. Subsequent app loads read from the cached listing in Dexie (no redundant API call)
4. The stock listing is refreshable via Settings ("Refresh Stock List" button)
5. Failed fetch on initial load shows a descriptive error and retry option
6. The listing service is implemented in `src/services/stock-list-service.ts`
7. The service has a co-located test file

## Tasks / Subtasks

- [ ] Create `src/services/stock-list-service.ts` with `getStockList()` and `refreshStockList()` (AC: #1, #4)
- [ ] Implement Dexie caching: check cache first, fetch if empty/stale (AC: #2, #3)
- [ ] Implement refresh mechanism callable from Settings (AC: #4)
- [ ] Implement error handling for failed fetches (AC: #5)
- [ ] Wire the initialization call in app startup (AC: #1)
- [ ] Write co-located tests (AC: #7)

## Dev Notes

### Architecture Patterns & Constraints

- **Zero-backend mandate:** All computation client-side. No server, no auth, no API keys. [Source: architecture.md#L44-L46]
- **DataEnvelope pattern:** Every data service return MUST be wrapped in `DataEnvelope<T>` with `data`, `fetchedAt`, `source`, `error` fields. [Source: architecture.md#L196-L204]
- **feature-based directory structure:** `src/features/` for pure domain logic, `src/services/` for data access. [Source: architecture.md#L188-L192]
- **Naming conventions:** kebab-case files, camelCase functions/vars. [Source: architecture.md#L170-L184]
- **Co-located tests:** `stock-list-service.test.ts` next to `stock-list-service.ts`. [Source: architecture.md#L184]
- **ISO 8601 dates** stored as strings in Dexie. [Source: architecture.md#L207-L209]
- **NSE symbol as canonical stock identifier** with Screener.in slug mapping. [Source: architecture.md#AR-14]

### Initial Fetch Trigger Pattern

On app startup (in `main.tsx` or an app initializer component), check if the stock listing exists in Dexie:

```ts
// src/main.tsx or src/AppInitializer.tsx
import { stockListService } from '@/services/stock-list-service'

async function initializeApp() {
  try {
    await stockListService.ensureStockList()
  } catch (error) {
    // App still renders, but Browser will show error state
    console.warn('Failed to initialize stock list:', error)
  }
}

initializeApp()
```

The `ensureStockList()` method:
1. Check if Dexie `stock` table has any records
2. If yes → return cached listing (no fetch)
3. If no → fetch from nse-bse-api, store in Dexie, return listing
4. If fetch fails → return error envelope

### Stock Listing Caching Strategy

| Aspect | Value |
|---|---|
| Cache location | Dexie `stock` table |
| Cache key | Each stock stored as individual record with `symbol` as primary key |
| Cache TTL | Very long (7 days or more) — stock universe rarely changes |
| Refresh trigger | Manual via Settings "Refresh Stock List" button |
| On cache miss (first run) | Fetch from nse-bse-api |
| On fetch failure | Return error, retry on next app start or manual refresh |

### nse-bse-api Listing Endpoint Details

The nse-bse-api package provides methods to list available stocks. The exact endpoint depends on the package's API:

```ts
// Expected nse-bse-api shape (adjust based on actual package API):
import { getStocksList } from 'nse-bse-api'

interface StockListing {
  symbol: string           // NSE symbol (e.g., 'RELIANCE')
  name: string             // Company name (e.g., 'Reliance Industries Ltd')
  sector: string           // Sector classification
  isin: string             // ISIN number
  exchange: 'NSE' | 'BSE'  // Primary exchange
  marketCap?: 'Large' | 'Mid' | 'Small'
}
```

The service normalizes the API response into the Dexie `stock` table schema:

```ts
interface StockRecord {
  symbol: string       // Primary key — NSE symbol (e.g., 'RELIANCE')
  name: string         // Company name
  sector: string       // Sector
  isin: string         // ISIN
  exchange: string     // 'NSE' | 'BSE'
  marketCap?: string   // 'Large' | 'Mid' | 'Small'
  fetchedAt: string    // ISO 8601 timestamp
}
```

### Service Implementation

```ts
// src/services/stock-list-service.ts
import { db } from '@/services/db'
import type { DataEnvelope } from '@/types'

const STOCK_LIST_TTL_DAYS = 7

async function ensureStockList(): Promise<DataEnvelope<StockRecord[]>> {
  const cached = await db.stock.toArray()

  if (cached.length > 0) {
    const fetchedAt = cached[0].fetchedAt
    const isStale = isOlderThan(fetchedAt, STOCK_LIST_TTL_DAYS * 24 * 60)

    return {
      data: cached,
      fetchedAt,
      source: 'cache',
      ...(isStale ? { error: 'Stock list may be outdated. Refresh in Settings.' } : {}),
    }
  }

  return refreshStockList()
}

async function refreshStockList(): Promise<DataEnvelope<StockRecord[]>> {
  try {
    const stocks = await fetchStockListFromAPI()

    // Store in Dexie (replace all — clear and bulk add)
    await db.stock.clear()
    await db.stock.bulkAdd(stocks)

    return {
      data: stocks,
      fetchedAt: new Date().toISOString(),
      source: 'api',
    }
  } catch (error) {
    return {
      data: null,
      fetchedAt: null,
      source: 'api',
      error: error instanceof Error ? error.message : 'Failed to fetch stock list',
    }
  }
}

async function fetchStockListFromAPI(): Promise<StockRecord[]> {
  // Call nse-bse-api
  const response = await getStocksList()

  // Normalize to StockRecord[]
  return response.map((item: any) => ({
    symbol: item.symbol,
    name: item.name,
    sector: item.sector || 'Unknown',
    isin: item.isin || '',
    exchange: item.exchange || 'NSE',
    marketCap: classifyMarketCap(item.marketCap),
    fetchedAt: new Date().toISOString(),
  }))
}
```

### Screener.in Slug Mapping

For Screener.in scraping (Story 1.5), each NSE symbol needs to map to a Screener.in URL slug. This is maintained in a configuration map:

```ts
// src/config/screener-slugs.ts
export const SCREENER_SLUGS: Record<string, string> = {
  'RELIANCE': 'RELIANCE',
  'TCS': 'TCS',
  'HDFCBANK': 'HDFC-BANK',
  'ICICIBANK': 'ICICI-BANK',
  'SBIN': 'STATE-BANK-OF-INDIA',
  // ...
}
```

The slug is typically the company name in kebab-case or a known Screener.in identifier. This map is maintained manually or could be derived from the stock listing if the nse-bse-api provides the Screener.in slug.

### Settings Integration

In the Settings page (Story 12.x), a "Data" section includes:

```tsx
<Button onClick={() => stockListService.refreshStockList()}>
  Refresh Stock List
</Button>
```

This triggers a fresh fetch from nse-bse-api, replaces the Dexie cache, and shows a success/error toast.

### App Startup Integration

The startup sequence in `main.tsx` or an `AppInitializer` component:

```tsx
// src/components/shared/app-initializer.tsx
import { useEffect, useState } from 'react'
import { stockListService } from '@/services/stock-list-service'

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    stockListService.ensureStockList()
      .then(() => setReady(true))
      .catch((err) => {
        setError(err.message)
        setReady(true) // still render, Browser will show empty state
      })
  }, [])

  if (!ready) {
    return <LoadingState variant="card" rows={3} />
  }

  return <>{children}</>
}
```

### Error Handling

| Scenario | Behavior |
|---|---|
| First load, API succeeds | Stocks cached in Dexie, Browser shows list |
| First load, API fails | Error returned with `data: null`, `error` message. App shows retry prompt |
| Subsequent load, cache exists | Cached data returned immediately (source: 'cache') |
| Cache stale (>7 days) | Cached data returned with info message suggesting refresh |
| Manual refresh succeeds | Cache replaced, fresh data returned |
| Manual refresh fails | Previous cache preserved, error shown |

### Testing Standards

- Co-located tests: `stock-list-service.test.ts` next to `stock-list-service.ts`
- Vitest as test runner
- Mock nse-bse-api `getStocksList` to return sample data
- Mock Dexie `db.stock` for cache state control
- Test: first run (empty cache) fetches from API
- Test: subsequent runs read from cache (no API call)
- Test: failed fetch returns error envelope with data: null
- Test: refreshStockList replaces cache with fresh data
- Test: refreshStockList on failure preserves existing cache

```ts
// stock-list-service.test.ts example
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ensureStockList, refreshStockList } from './stock-list-service'

vi.mock('nse-bse-api', () => ({
  getStocksList: vi.fn(),
}))

describe('ensureStockList', () => {
  it('fetches from API when cache is empty', async () => {
    // Mock empty Dexie and successful API
    // Assert: API called, data returned with source: 'api'
  })

  it('returns cached data without API call when cache exists', async () => {
    // Mock populated Dexie
    // Assert: API not called, data returned with source: 'cache'
  })

  it('returns error envelope when API fails on first fetch', async () => {
    // Mock empty Dexie and failing API
    // Assert: data: null, error present, source: 'api'
  })
})
```

### Dependencies

- Story 1.1: nse-bse-api package installed
- Story 1.3: Dexie `stock` table with `symbol` as primary key
- Story 1.2: Tailwind CSS 4 (for LoadingState rendering during initialization)
- Story 1.9: LoadingState and ErrorState components (for UI feedback)

### References

- [Source: epics-and-stories.md#L416-L429] — Story 1.13 acceptance criteria
- [Source: architecture.md#AR-14] — NSE symbol as canonical stock identifier
- [Source: architecture.md#L243-L371] — Project structure

## Dev Agent Record

### Agent Model Used

BMad Create-Story workflow (v6.8.1-next.4)

### Debug Log References

### Completion Notes List

### File List
