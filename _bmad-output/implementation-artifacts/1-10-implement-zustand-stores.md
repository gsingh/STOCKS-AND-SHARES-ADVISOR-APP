# Story 1.10: Implement Zustand stores

Status: ready-for-dev

## Story

As a developer,
I want Zustand stores for cross-route state management,
So that stock selection, compare list, UI preferences, and dashboard state persist across navigations.

## Acceptance Criteria

1. `src/stores/stock-store.ts`: manages `selectedStock` (string | null), `compareList` (string[] max 4), `addToCompare(symbol)`, `removeFromCompare(symbol)`, `clearCompare()`, `setSelectedStock(symbol)`
2. `useStockStore` validates compareList length (max 4 items, push rejected if full)
3. `src/stores/ui-store.ts`: manages `theme` ('light' | 'dark'), `sidebarCollapsed` (boolean), `activeFilters` (Record<string, string[]>), `toggleTheme()`, `toggleSidebar()`, `setActiveFilters(filters)`, `clearActiveFilters()`
4. `src/stores/dashboard-store.ts`: manages `watchlistOrder` (string[]), `dashboardLayout` (object with preferences), `setWatchlistOrder(order)`, `setDashboardLayout(layout)`
5. Each store has complete TypeScript type definitions
6. Theme preference optionally persisted via Dexie `userPreference` table (bridge integration)
7. Store modules have zero React imports and do not require a Provider wrapper
8. Each store has a co-located test file (`*.test.ts`) covering all actions

## Tasks / Subtasks

- [ ] Create `src/stores/stock-store.ts` with selectedStock, compareList, and actions (AC: #1, #2)
- [ ] Create `src/stores/ui-store.ts` with theme, sidebar, filters state and actions (AC: #3)
- [ ] Create `src/stores/dashboard-store.ts` with watchlist order and layout preferences (AC: #4)
- [ ] Define TypeScript types for each store's state and actions (AC: #5)
- [ ] Implement theme persistence bridge to Dexie `userPreference` (AC: #6)
- [ ] Write co-located tests for each store (AC: #8)

## Dev Notes

### Architecture Patterns & Constraints

- **Zero-backend mandate:** All computation client-side. No server, no auth, no API keys. [Source: architecture.md#L44-L46]
- **feature-based directory structure:** `src/features/` for pure domain logic (zero React imports), `src/components/features/` for React components, `src/services/` for data access. [Source: architecture.md#L188-L192]
- **Naming conventions:** kebab-case files, PascalCase components, camelCase functions/vars. [Source: architecture.md#L170-L184]
- **Co-located tests:** `stock-store.test.ts` next to `stock-store.ts`. Never use `__tests__/` directories. [Source: architecture.md#L184]
- **en-IN locale** formatting for all displayed numeric/currency values. [Source: DESIGN.md#L140]
- **dark mode** via `.dark` class + CSS custom properties (not a separate stylesheet). [Source: DESIGN.md#L128]
- **No React in `features/` or `stores/`** — pure domain logic only. React components in `components/features/`. [Source: architecture.md#L239-L241]
- **Zustand stores** for cross-route state: stock selection, compare list, UI theme, dashboard layout. [Source: architecture.md#AR-3]

### Zustand 5.0.14 Store Creation Pattern

Zustand 5.x uses the `create` function from `zustand`. The pattern for each store:

```ts
import { create } from 'zustand'
```

No Provider wrapper is needed — Zustand stores are accessed directly via the generated hook.

### Stock Store (`src/stores/stock-store.ts`)

```ts
import { create } from 'zustand'

interface StockState {
  selectedStock: string | null
  compareList: string[]
  setSelectedStock: (symbol: string | null) => void
  addToCompare: (symbol: string) => void
  removeFromCompare: (symbol: string) => void
  clearCompare: () => void
}

const MAX_COMPARE = 4

export const useStockStore = create<StockState>((set, get) => ({
  selectedStock: null,
  compareList: [],

  setSelectedStock: (symbol) => set({ selectedStock: symbol }),

  addToCompare: (symbol) => {
    const { compareList } = get()
    if (compareList.length >= MAX_COMPARE) return
    if (compareList.includes(symbol)) return
    set({ compareList: [...compareList, symbol] })
  },

  removeFromCompare: (symbol) => {
    set((state) => ({
      compareList: state.compareList.filter((s) => s !== symbol),
    }))
  },

  clearCompare: () => set({ compareList: [] }),
}))
```

Validation rules in `addToCompare`:
- Maximum 4 symbols: if `compareList.length >= 4`, reject silently (caller checks return or length)
- No duplicates: if `symbol` already in list, reject
- React components should check `compareList.length` to disable the add button at 4 items

### UI Store (`src/stores/ui-store.ts`)

```ts
import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface UIState {
  theme: Theme
  sidebarCollapsed: boolean
  activeFilters: Record<string, string[]>
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setActiveFilters: (key: string, values: string[]) => void
  clearActiveFilters: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'light',
  sidebarCollapsed: false,
  activeFilters: {},

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light'
    set({ theme: newTheme })
    // Bridge to Dexie for persistence
    persistThemeToDexie(newTheme)
    // Toggle .dark class on <html>
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  },

  setTheme: (theme) => {
    set({ theme })
    persistThemeToDexie(theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  },

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setActiveFilters: (key, values) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, [key]: values },
    })),

  clearActiveFilters: () => set({ activeFilters: {} }),
}))
```

### Dashboard Store (`src/stores/dashboard-store.ts`)

```ts
import { create } from 'zustand'

export interface DashboardLayout {
  widgetOrder?: string[]
  collapsedSections?: string[]
}

interface DashboardState {
  watchlistOrder: string[]
  dashboardLayout: DashboardLayout
  setWatchlistOrder: (order: string[]) => void
  setDashboardLayout: (layout: DashboardLayout) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  watchlistOrder: [],
  dashboardLayout: {},

  setWatchlistOrder: (order) => set({ watchlistOrder: order }),
  setDashboardLayout: (layout) =>
    set((state) => ({
      dashboardLayout: { ...state.dashboardLayout, ...layout },
    })),
}))
```

### Theme Persistence Bridge to Dexie

Theme persistence is a cross-cutting concern. The bridge function reads/writes the `userPreference` table in Dexie:

```ts
import { db } from '@/services/db'

async function persistThemeToDexie(theme: 'light' | 'dark') {
  try {
    await db.userPreference.put({ key: 'theme', value: theme })
  } catch {
    // Silently fail — theme still works in-memory, persistence is best-effort
  }
}
```

On app startup (in `main.tsx` or an initializer), load the persisted theme:

```ts
async function loadTheme() {
  try {
    const pref = await db.userPreference.get('theme')
    if (pref?.value === 'dark' || pref?.value === 'light') {
      useUIStore.getState().setTheme(pref.value)
    }
  } catch {
    // Fall back to default (light)
  }
}
```

This bridge pattern allows the store to remain pure (no direct Dexie dependency in the store definition), with persistence handled at the app initialization boundary.

### No Provider Wrapper Required

Zustand stores are standalone and do not require React Context providers. Components access them directly:

```tsx
import { useStockStore } from '@/stores/stock-store'

function CompareButton() {
  const compareList = useStockStore((state) => state.compareList)
  const addToCompare = useStockStore((state) => state.addToCompare)
  // ...
}
```

Use selector functions for performance (avoid re-renders on unrelated state changes).

### TypeScript Type Definitions

Each store exports its state interface and action types. The selectors pattern:

```ts
// Selectors for derived state
export const useIsCompareFull = () =>
  useStockStore((state) => state.compareList.length >= 4)

export const useIsInCompareList = (symbol: string) =>
  useStockStore((state) => state.compareList.includes(symbol))
```

### Initial Values

| Store | Field | Default | Notes |
|---|---|---|---|
| stock-store | selectedStock | null | Set when user views a stock detail |
| stock-store | compareList | [] | Max 4 items |
| ui-store | theme | 'light' | Overridden by Dexie persistence on init |
| ui-store | sidebarCollapsed | false | Overridden by responsive breakpoint logic |
| ui-store | activeFilters | {} | Reset on navigation |
| dashboard-store | watchlistOrder | [] | Order preserved from user's last arrangement |
| dashboard-store | dashboardLayout | {} | Optional widget configuration |

### Testing Standards

- Co-located tests: `stock-store.test.ts` next to `stock-store.ts`
- Vitest as test runner
- Test each action: `addToCompare`, `removeFromCompare`, `clearCompare`, `toggleTheme`, etc.
- Test validation: max 4 items in compareList, duplicates rejected, empty states
- Test state immutability (actions create new state, do not mutate)

```ts
// stock-store.test.ts example
import { describe, it, expect, beforeEach } from 'vitest'
import { useStockStore } from './stock-store'

describe('stock-store', () => {
  beforeEach(() => {
    useStockStore.setState({ selectedStock: null, compareList: [] })
  })

  it('adds stock to compare list', () => {
    useStockStore.getState().addToCompare('RELIANCE')
    expect(useStockStore.getState().compareList).toEqual(['RELIANCE'])
  })

  it('rejects duplicate add', () => {
    useStockStore.getState().addToCompare('RELIANCE')
    useStockStore.getState().addToCompare('RELIANCE')
    expect(useStockStore.getState().compareList).toEqual(['RELIANCE'])
  })

  it('rejects add when compare list is full (max 4)', () => {
    useStockStore.getState().addToCompare('A')
    useStockStore.getState().addToCompare('B')
    useStockStore.getState().addToCompare('C')
    useStockStore.getState().addToCompare('D')
    useStockStore.getState().addToCompare('E')
    expect(useStockStore.getState().compareList).toHaveLength(4)
  })

  it('removes stock from compare list', () => {
    useStockStore.getState().addToCompare('RELIANCE')
    useStockStore.getState().removeFromCompare('RELIANCE')
    expect(useStockStore.getState().compareList).toEqual([])
  })

  it('clears compare list', () => {
    useStockStore.getState().addToCompare('RELIANCE')
    useStockStore.getState().addToCompare('TCS')
    useStockStore.getState().clearCompare()
    expect(useStockStore.getState().compareList).toEqual([])
  })
})
```

### Dependencies

- Zustand 5.0.14 (installed in Story 1.1)
- Dexie `userPreference` table (created in Story 1.3) — only for theme persistence bridge

### References

- [Source: epics-and-stories.md#L366-L381] — Story 1.10 acceptance criteria
- [Source: architecture.md#AR-3] — Zustand stores for cross-route state
- [Source: EXPERIENCE.md#L17] — Dark mode via `.dark` class pattern
- [Source: EXPERIENCE.md#L69-L71] — Compare list component interaction

## Dev Agent Record

### Agent Model Used

BMad Create-Story workflow (v6.8.1-next.4)

### Debug Log References

### Completion Notes List

### File List
