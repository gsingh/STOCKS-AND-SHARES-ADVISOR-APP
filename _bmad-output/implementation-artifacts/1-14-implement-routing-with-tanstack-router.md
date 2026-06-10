# Story 1.14: Implement routing with TanStack Router

Status: ready-for-dev

## Story

As a developer,
I want all routes configured with TanStack Router including lazy loading and data loaders,
So that each surface loads on demand and route-level data fetching is centralized.

## Acceptance Criteria

1. Routes defined in `src/routes/` match the IA from EXPERIENCE.md: `__root.tsx`, `index.tsx` (Dashboard), `stocks.tsx` (Browser), `stocks.$symbol.tsx` (Detail), `compare.tsx` (Compare), `portfolio.tsx` (Portfolio), `goals.tsx` (Goals), `goals.$goalId.tsx` (Goal Detail), `reviews.tsx` (Reviews), `journal.tsx` (Journal), `watchlist.tsx` (Watchlist), `settings.tsx` (Settings), `glossary.tsx` (Glossary)
2. Each route uses lazy loading (code splitting) via TanStack Router's dynamic import pattern
3. `__root.tsx` renders the App Shell layout (`<AppShell>`) as an outlet wrapper
4. Route definitions have correct TypeScript types for params (e.g., `$symbol` in `stocks.$symbol.tsx`, `$goalId` in `goals.$goalId.tsx`)
5. Navigating to each route loads and renders the correct component
6. Routes are connected in `src/main.tsx` or `src/app.tsx` via `<RouterProvider>`

## Tasks / Subtasks

- [ ] Create `src/routes/__root.tsx` with AppShell layout wrapper (AC: #3)
- [ ] Create `src/routes/index.tsx` — Dashboard route (AC: #1)
- [ ] Create `src/routes/stocks.tsx` — Stock Browser route (AC: #1)
- [ ] Create `src/routes/stocks.$symbol.tsx` — Stock Detail route with symbol param (AC: #1, #4)
- [ ] Create `src/routes/compare.tsx` — Compare route (AC: #1)
- [ ] Create `src/routes/portfolio.tsx` — Portfolio route (AC: #1)
- [ ] Create `src/routes/goals.tsx` — Goals route (AC: #1)
- [ ] Create `src/routes/goals.$goalId.tsx` — Goal Detail route with goalId param (AC: #1, #4)
- [ ] Create `src/routes/reviews.tsx` — Reviews route (AC: #1)
- [ ] Create `src/routes/journal.tsx` — Journal route (AC: #1)
- [ ] Create `src/routes/watchlist.tsx` — Watchlist route (AC: #1)
- [ ] Create `src/routes/settings.tsx` — Settings route (AC: #1)
- [ ] Create `src/routes/glossary.tsx` — Glossary route (AC: #1)
- [ ] Wire router in `src/app.tsx` or `src/main.tsx` via `<RouterProvider>` (AC: #6)
- [ ] Implement lazy loading for all non-root routes (AC: #2)
- [ ] Write smoke test verifying route definitions (AC: #5)

## Dev Notes

### Architecture Patterns & Constraints

- **Zero-backend mandate:** All computation client-side. No server, no auth, no API keys. [Source: architecture.md#L44-L46]
- **feature-based directory structure:** `src/features/` for pure domain logic, `src/components/features/` for React components. [Source: architecture.md#L188-L192]
- **Naming conventions:** kebab-case files, PascalCase components, camelCase functions/vars. [Source: architecture.md#L170-L184]
- **Co-located tests:** `__root.test.tsx` next to `__root.tsx` (smoke test). [Source: architecture.md#L184]
- **TanStack Router** for client-side routing with lazy loading. [Source: architecture.md#L77]

### TanStack Router File-Based vs Code-Based Setup

TanStack Router supports both file-based routing (like Next.js) and code-based routing (explicit route tree). For this project, use code-based routing with `createFileRoute` and a generated route tree, as it is the recommended approach for Vite + React SPAs.

Current TanStack Router (v1.x) uses `@tanstack/react-router` with:

1. Route files in `src/routes/` using `createFileRoute`
2. A route tree generated at build time via `@tanstack/router-plugin` or `@tanstack/router-vite-plugin`
3. `<RouterProvider>` in `app.tsx` to mount the router

### Route Tree Configuration

The route tree is generated from the file system. Use `@tanstack/router-plugin/vite` in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ...
})
```

This plugin automatically generates `src/route-tree.gen.ts` from the route files in `src/routes/`.

### Wire Router in app.tsx

```tsx
// src/app.tsx
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './route-tree.gen'

const router = createRouter({ routeTree })

// Type-safe router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function App() {
  return <RouterProvider router={router} />
}
```

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'
import './globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### Root Route (__root.tsx)

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AppShell } from '../components/shared/layout'

export const Route = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})
```

The `__root.tsx` is the root layout. It wraps all child routes in the AppShell, which provides the sidebar + topbar + content area.

### Simple Routes (No Params)

```tsx
// src/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  return <div>Dashboard</div>
}
```

All simple routes follow this pattern:

| File | Route | Page Name |
|---|---|---|
| `index.tsx` | `/` | DashboardPage |
| `stocks.tsx` | `/stocks` | StocksPage |
| `compare.tsx` | `/compare` | ComparePage |
| `portfolio.tsx` | `/portfolio` | PortfolioPage |
| `goals.tsx` | `/goals` | GoalsPage |
| `reviews.tsx` | `/reviews` | ReviewsPage |
| `journal.tsx` | `/journal` | JournalPage |
| `watchlist.tsx` | `/watchlist` | WatchlistPage |
| `settings.tsx` | `/settings` | SettingsPage |
| `glossary.tsx` | `/glossary` | GlossaryPage |

### Parametrized Routes

```tsx
// src/routes/stocks.$symbol.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/stocks/$symbol')({
  component: StockDetailPage,
})

function StockDetailPage() {
  const { symbol } = Route.useParams()
  return <div>Stock Detail: {symbol}</div>
}
```

```tsx
// src/routes/goals.$goalId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/goals/$goalId')({
  component: GoalDetailPage,
})

function GoalDetailPage() {
  const { goalId } = Route.useParams()
  return <div>Goal Detail: {goalId}</div>
}
```

### Lazy Loading Pattern

TanStack Router supports lazy loading via dynamic imports. Use `@tanstack/react-router`'s built-in code splitting:

```tsx
// src/routes/stocks.tsx (lazy loaded)
import { createFileRoute, lazy } from '@tanstack/react-router'

const StocksPage = lazy(() => import('../components/features/stocks/stocks-page'))

export const Route = createFileRoute('/stocks')({
  component: StocksPage,
})
```

Each route component is placed in `src/components/features/` following the feature-based directory structure. The route file itself stays minimal — it only defines the route configuration and imports the component.

Alternatively, the component can be defined inline in the route file for simpler pages. The lazy loading happens at the route file level via Vite's automatic code splitting (each route file becomes a separate chunk).

With `@tanstack/router-plugin/vite`, code splitting is handled automatically — each route file becomes its own lazy-loaded chunk.

### Data Loader Pattern (for Stock Detail)

TanStack Router supports data loaders (loaders in route config) for pre-fetching data. This is useful for the Stock Detail page:

```tsx
// src/routes/stocks.$symbol.tsx
import { createFileRoute } from '@tanstack/react-router'
import { stockService } from '../services/stock-service'

export const Route = createFileRoute('/stocks/$symbol')({
  loader: async ({ params: { symbol } }) => {
    const data = await stockService.getStockData(symbol)
    return { data }
  },
  component: StockDetailPage,
})

function StockDetailPage() {
  const { data } = Route.useLoaderData()
  // data is DataEnvelope<StockData>
  return <div>Stock Detail</div>
}
```

The loader runs before the component renders, so data is available on first paint. Error handling via `errorComponent`:

```tsx
export const Route = createFileRoute('/stocks/$symbol')({
  loader: async ({ params: { symbol } }) => { /* ... */ },
  errorComponent: ({ error }) => <div>Error: {error.message}</div>,
  component: StockDetailPage,
})
```

### Type-Safe Params

TanStack Router automatically infers param types from the file name. For `stocks.$symbol.tsx`:
- Params type: `{ symbol: string }`
- Access via `Route.useParams()` which returns the typed object

For `goals.$goalId.tsx`:
- Params type: `{ goalId: string }`
- Access via `Route.useParams()`

### Complete Route File Structure

```
src/routes/
├── __root.tsx              # Root layout with AppShell + Outlet
├── index.tsx               # Dashboard (/) — lazy loaded
├── stocks.tsx              # Stock Browser (/stocks) — lazy loaded
├── stocks.$symbol.tsx      # Stock Detail (/stocks/$symbol) — lazy loaded
├── compare.tsx             # Compare (/compare) — lazy loaded
├── portfolio.tsx           # Portfolio (/portfolio) — lazy loaded
├── goals.tsx               # Goals (/goals) — lazy loaded
├── goals.$goalId.tsx       # Goal Detail (/goals/$goalId) — lazy loaded
├── reviews.tsx             # Reviews (/reviews) — lazy loaded
├── journal.tsx             # Journal (/journal) — lazy loaded
├── watchlist.tsx           # Watchlist (/watchlist) — lazy loaded
├── settings.tsx            # Settings (/settings) — lazy loaded
└── glossary.tsx            # Glossary (/glossary) — lazy loaded
```

### Empty/Loading States in Route Components

Each route component should use the shared components from Story 1.9:

```tsx
// Pattern for all data-fetching route components
function StocksPage() {
  const { data, isLoading, error } = useStockBrowser()

  if (isLoading) return <LoadingState variant="table-row" rows={6} />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data || data.length === 0) return <EmptyState message="No stocks found" />

  return <StockBrowserTable stocks={data} />
}
```

### Testing

- Smoke test: verify all route definitions exist and router creates without error
- Navigation test: verify `useNavigate` and `<Link>` navigate to correct routes
- Param test: verify `$symbol` and `$goalId` params are extracted correctly

```tsx
// routes.test.tsx (smoke test)
import { describe, it, expect } from 'vitest'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './route-tree.gen'

describe('router', () => {
  it('creates without error', () => {
    const router = createRouter({ routeTree })
    expect(router).toBeDefined()
  })

  it('has all required routes', () => {
    const router = createRouter({ routeTree })
    const routes = router.routesById
    expect(routes['/']).toBeDefined()
    expect(routes['/stocks']).toBeDefined()
    expect(routes['/stocks/$symbol']).toBeDefined()
    expect(routes['/compare']).toBeDefined()
    expect(routes['/portfolio']).toBeDefined()
    expect(routes['/goals']).toBeDefined()
    expect(routes['/goals/$goalId']).toBeDefined()
    expect(routes['/reviews']).toBeDefined()
    expect(routes['/journal']).toBeDefined()
    expect(routes['/watchlist']).toBeDefined()
    expect(routes['/settings']).toBeDefined()
    expect(routes['/glossary']).toBeDefined()
  })
})
```

### Dependencies

This story depends on:
- Story 1.1: TanStack Router installed (`@tanstack/react-router`)
- Story 1.8: AppShell layout component (used in `__root.tsx`)
- Story 1.9: LoadingState and ErrorState shared components (for route-level loading/error UI)
- Story 1.10: Zustand stores (theme, stock selection accessed from route components)

### References

- [Source: epics-and-stories.md#L431-L444] — Story 1.14 acceptance criteria
- [Source: EXPERIENCE.md#L22-L36] — Information Architecture (route mapping)
- [Source: architecture.md#L77] — TanStack Router decision
- [Source: architecture.md#L243-L371] — Project structure (routes/ directory)

## Dev Agent Record

### Agent Model Used

BMad Create-Story workflow (v6.8.1-next.4)

### Debug Log References

### Completion Notes List

### File List
