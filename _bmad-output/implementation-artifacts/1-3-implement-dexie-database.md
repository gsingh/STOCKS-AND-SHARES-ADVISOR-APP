# Story 1.3: Implement Dexie database with schema definitions and migrations

## Story

**As a** developer,
**I want** a fully configured Dexie database with typed object stores, indexes, and migration support,
**so that** all data access layers have a consistent, versioned, and reactive storage foundation.

## Acceptance Criteria

1. Dexie is initialized in `src/services/db.ts` with all required object stores defined.
2. The following stores exist with correct primary keys and indexes:
   - `stock` — key `symbol`, indexes: `name`, `sector`, `isin`
   - `priceHistory` — key `[symbol+date]` (compound), indexes: `symbol`, `date`
   - `fundamental` — key `symbol`, indexes: `marketCap`, `peRatio`, `sector`
   - `corporateAction` — key `++id` (auto-increment), indexes: `symbol`, `exDate`, `actionType`
   - `portfolio` — key `++id`, indexes: `symbol`, `createdAt`
   - `goal` — key `++id`, indexes: `targetDate`, `priority`
   - `sip` — key `++id`, indexes: `symbol`, `nextDate`, `active`
   - `review` — key `++id`, indexes: `symbol`, `reviewDate`
   - `journalEntry` — key `++id`, indexes: `symbol`, `createdAt`, `tags` (multi-entry)
   - `watchlist` — key `++id`, indexes: `name`, `createdAt`
   - `userPreference` — key `key` (string literal key)
   - `scoreSnapshot` — key `++id`, indexes: `symbol`, `createdAt`, `compositeScore`
3. `db.version(N+1).stores()` is used for schema versioning — the initial version number matches the current epic sequence so future migrations are clear.
4. Each store entry for external data uses `DataEnvelope<T>` as the value shape, wrapping `{ data: T | null, fetchedAt: string | null, source: 'cache' | 'api' | 'scraper' | 'user', error?: string }`.
5. All Dexie operations are wrapped in typed try-catch helper functions that return `{ data: T | null, error?: string }`.
6. A `db.ts` smoke test (`src/services/__tests__/db.test.ts`) verifies that the database opens, stores are accessible, and a basic write/read cycle works on the `stock` table.
7. Dexie's `liveQuery()` is exported as a re-usable utility so React hooks can subscribe reactively.

## Tasks / Subtasks

- [ ] 1.3.1 Install `dexie` package (`npm install dexie`)
- [ ] 1.3.2 Create `src/services/db.ts` with `AppDatabase` class extending `Dexie`, defining version 1 with all 12 stores
- [ ] 1.3.3 Define TypeScript interfaces for each store's row type in `src/types/db.ts` (or co-located in `db.ts`)
- [ ] 1.3.4 Implement typed helper functions: `dbGet<T>`, `dbPut<T>`, `dbDelete`, `dbGetAll<T>`, `dbBulkPut<T>` — each wrapping in try-catch returning `{ data: T | null, error?: string }`
- [ ] 1.3.5 Export `useLiveQuery` convenience wrapper that wraps `liveQuery()` for reactive subscriptions
- [ ] 1.3.6 Create `src/services/__tests__/db.test.ts` verifying open, write, read, delete lifecycle on `stock` store
- [ ] 1.3.7 Write a brief MIGRATION.md note (or inline comment) documenting how to add stores/indexes in future versions

## Dev Notes

### Table Schemas

| Store             | Primary Key      | Indexes                                                       |
|-------------------|------------------|---------------------------------------------------------------|
| `stock`           | `symbol`         | `name`, `sector`, `isin`                                     |
| `priceHistory`    | `[symbol+date]`  | `symbol`, `date`                                              |
| `fundamental`     | `symbol`         | `marketCap`, `peRatio`, `sector`                              |
| `corporateAction` | `++id`           | `symbol`, `exDate`, `actionType`                              |
| `portfolio`       | `++id`           | `symbol`, `createdAt`                                         |
| `goal`            | `++id`           | `targetDate`, `priority`                                      |
| `sip`             | `++id`           | `symbol`, `nextDate`, `active`                                |
| `review`          | `++id`           | `symbol`, `reviewDate`                                        |
| `journalEntry`    | `++id`           | `symbol`, `createdAt`, `*tags` (multi-entry)                  |
| `watchlist`       | `++id`           | `name`, `createdAt`                                           |
| `userPreference`  | `key`            | —                                                             |
| `scoreSnapshot`   | `++id`           | `symbol`, `createdAt`, `compositeScore`                       |

**Key syntax rules (Dexie `stores()` string):**
- `symbol` — simple key path
- `++id` — auto-increment primary key
- `[symbol+date]` — compound primary key
- `*tags` — multi-entry index (array values indexed individually)
- Comma-separated after primary key: `'++id, symbol, createdAt'`

Initial version string for `db.version(1).stores()`:
```ts
{
  stock: 'symbol, name, sector, isin',
  priceHistory: '[symbol+date], symbol, date',
  fundamental: 'symbol, marketCap, peRatio, sector',
  corporateAction: '++id, symbol, exDate, actionType',
  portfolio: '++id, symbol, createdAt',
  goal: '++id, targetDate, priority',
  sip: '++id, symbol, nextDate, active',
  review: '++id, symbol, reviewDate',
  journalEntry: '++id, symbol, createdAt, *tags',
  watchlist: '++id, name, createdAt',
  userPreference: 'key',
  scoreSnapshot: '++id, symbol, createdAt, compositeScore',
}
```

### Migration Strategy

```ts
db.version(1).stores({ /* all 12 stores above */ })
db.version(2).stores({
  fundamental: 'symbol, marketCap, peRatio, sector, dividendYield' // added index
})
```

Dexie runs upgrade callbacks between versions. Use `db.version(N).upgrade(tx => { ... })` for data transforms.

### Try-Catch Wrapper Pattern

```ts
// src/services/db.ts
import Dexie, { type EntityTable } from 'dexie'

async function dbGet<T>(table: Dexie.Table<T, string>, key: string): Promise<{ data: T | null; error?: string }> {
  try {
    const data = await table.get(key)
    return { data: data ?? null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown Dexie error' }
  }
}
```

### Dexie `liveQuery` Reactive Utility

```ts
// src/services/db.ts
import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react' // Note: React import OK here since this is a hook utility

export function useLiveQuery<T>(querier: () => Promise<T>, deps: unknown[] = []): { data: T | undefined; loading: boolean; error?: Error } {
  const [result, setResult] = useState<{ data: T | undefined; loading: boolean; error?: Error }>({ data: undefined, loading: true })
  useEffect(() => {
    const observable = liveQuery(querier)
    const sub = observable.subscribe({
      next: (val) => setResult({ data: val, loading: false }),
      error: (err) => setResult({ data: undefined, loading: false, error: err as Error }),
    })
    return () => sub.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return result
}
```

### DataEnvelope Row Shape in Storage

Every store that holds fetched external data stores values matching:

```ts
interface DataEnvelope<T> {
  data: T | null
  fetchedAt: string | null  // ISO 8601
  source: 'cache' | 'api' | 'scraper' | 'user'
  error?: string
}
```

### Testing Standards (Vitest)

```ts
// src/services/__tests__/db.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('AppDatabase', () => {
  it('opens successfully', async () => { ... })
  it('writes and reads a stock entry', async () => { ... })
  it('deletes a stock entry', async () => { ... })
})
```

### Library Versions

- `dexie: ^4.0.10` (latest stable 4.x)

### Source Tree After Implementation

```
src/
├── services/
│   ├── db.ts                       # AppDatabase class, helpers, useLiveQuery
│   └── __tests__/
│       └── db.test.ts              # Database smoke tests
├── types/
│   └── db.ts                       # (optional, or inline in db.ts)
```

### References

- Dexie API docs: https://dexie.org/docs/Table/Table
- Dexie compound indexes: https://dexie.org/docs/Compound-Index
- Dexie liveQuery: https://dexie.org/docs/liveQuery()

## Dev Agent Record

| Field | Value |
|-------|-------|
| Story | 1-3 |
| Epic | 1 — Foundation & Infrastructure |
| Status | Planned |
| Priority | High |
| Dependencies | 1-1, 1-2 |
| Estimated Effort | Medium (4–6 hrs) |
| Agent | To be assigned |
