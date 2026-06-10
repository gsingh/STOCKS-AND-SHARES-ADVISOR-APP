---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - prd-STOCKS-AND-SHARES-ADVISOR-APP-2026-06-08/prd.md
  - prd-STOCKS-AND-SHARES-ADVISOR-APP-2026-06-08/addendum.md
workflowType: 'architecture'
project_name: 'STOCKS-AND-SHARES-ADVISOR-APP'
user_name: 'Boss'
date: '2026-06-08'
domain: fintech
project_type: web_app
domain_complexity: high
lastStep: 8
status: 'complete'
completedAt: '2026-06-08'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- 41 FRs across 16 features: Stock Browser, Scorecard (17-param evaluation), Compare (8-step framework), Risk Profiling, Goal Planning, Portfolio Tracking, Periodic Reviews, Investment Journal, SIP Calculator, Sector Drift Analysis, Overlap Detection, Dashboard, Glossary, XIRR Calculator, Settings
- Two user journeys: (1) research-driven — browse → score → compare → decide; (2) monitoring — dashboard → portfolio → review → rebalance

**Non-Functional Requirements:**
- Score calculation must complete in <500ms client-side
- Initial page load <3s on average connection
- Graceful degradation when data sources are unavailable — stale-cache-first approach
- All user data persisted in IndexedDB (zero backend)
- Data freshness indicators required for every displayed data point

**Scale & Complexity:**
- **Primary domain:** Web SPA (React 19 + TypeScript + Vite)
- **Complexity level:** High (fintech, dual data sourcing, 16 features, 41 FRs)
- **Estimated architectural components:** 40+ (15+ IndexedDB tables, 8+ data service modules, 30+ route components, shared scoring engine, comparison engine, caching layer)

### Technical Constraints & Dependencies

- **Zero-backend mandate:** All computation is client-side; no server, no auth, no API keys
- **Data sourcing tier 1 — nse-bse-api:** npm package for live NSE/BSE quotes, corporate actions; reliability unknown for production
- **Data sourcing tier 2 — Screener.in scraping:** Client-side via CORS proxy; fragile to HTML changes; anti-scraping risk; mapping needed between NSE symbols and Screener.in slugs
- **IndexedDB via Dexie:** 15+ object stores with migration strategy needed; Dexie's `version()` API for schema evolution
- **Mirror MF app stack:** React 19, TanStack Router, Tailwind CSS 4, shadcn/ui, Recharts — must follow same patterns for Boss's familiarity
- **Dark mode:** CSS custom properties pattern (same as MF app), included at launch

### Cross-Cutting Concerns Identified

1. **Data freshness & staleness model** — Every data point needs `{ value, fetchedAt, source }` metadata; FreshnessBadge UI component (green/yellow/red); affects all data-displaying views
2. **Scraping resilience** — Isolated behind a single `ScreenerService` module; graceful degradation with manual override UI; stale-cache fallback when scrape fails
3. **Scoring engine consistency** — 17-parameter evaluation used in Scorecard, Compare, and Dashboard; must be a single shared module with testable pure functions
4. **IndexedDB schema design** — Must support all 16 features with room for migration; key tables: stocks, price_history, fundamentals, portfolios, goals, sips, reviews, journal entries, user_preferences
5. **CORS proxy routing** — Vite dev server + nginx production proxy rules needed for both nse-bse-api and Screener.in
6. **Offline degradation** — Read operations always work from cache; writes (portfolio, goals, journal) always work locally; quote refresh shows stale indicator when offline

## Starter Template Evaluation

### Primary Technology Domain
Web SPA (React + TypeScript) — mirrored from reference MF app

### Starter Options Considered

- **Option A: `create-vite` (react-ts template)** — Fresh scaffold, current deps, clean slate
- **Option B: Fork MF app repo** — Pre-existing structure, inherits tech debt, needs dep upgrades

### Selected Starter: `create-vite` react-ts template

**Rationale for Selection:**
The reference MF app predates Vite 6 and Tailwind 4. Forking would immediately require a major upgrade of the toolchain, making the "time savings" illusory. A fresh scaffold with `create-vite` gives us current versions, zero inherited debt, and the MF app's file organization conventions serve as a reference for structure. This aligns with the principle: fork the structure, not the debt.

### Initialization Command:
```bash
npm create vite@latest . -- --template react-ts
```

### Architectural Decisions Provided by Starter:

**Language & Runtime:**
TypeScript 5.x, ESM, Node >=18

**Styling Solution:**
Tailwind CSS 4 + shadcn/ui (added post-scaffold via `npx shadcn@latest init`)

**Build Tooling:**
Vite 6, SWC/esbuild for transforms, HMR in dev

**Testing Framework:**
Vitest (added post-scaffold)

**Code Organization:**
`src/` with feature-based subdirectories (following MF app pattern conventions)

**Development Experience:**
HMR, TypeScript strict mode, ESLint flat config

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data Architecture: Dexie (IndexedDB) with tiered TTL caching — quotes/price data 15min, fundamentals 24h, corporate actions weekly, user data never stale
- State Management: Zustand 5.0.14 for cross-route shared state (scoring results, UI state, active filters)
- Data Service Layer: Repository pattern with `{ value, fetchedAt, source }` metadata envelope on every return type

**Important Decisions (Shape Architecture):**
- Frontend state boundaries: Zustand for volatile UI state (selected stocks, compare list, dashboard filters); Dexie for durable data (portfolio, goals, journal)
- CORS proxy: nginx in production (same server as static assets); Vite proxy config in dev

**Deferred Decisions (Post-MVP):**
- PWA/service worker for full offline support (v1 uses stale-cache degradation only)
- Notification system for price alerts and review reminders

### Data Architecture

- **Database:** Dexie (IndexedDB wrapper) — 15+ object stores with versioned migrations via `dexie.version().stores()`
- **Caching Strategy (Tiered TTL):**
  - Quotes/price data: 15-minute TTL — high volatility, frequent refresh
  - Fundamentals (P/E, ROE, ROCE, etc.): 24-hour TTL — quarterly-reported data, daily refresh sufficient
  - Corporate actions: 7-day TTL — infrequent events
  - User data (portfolio, goals, journal, reviews, SIPs): Never stale — user-authoritative, never auto-cleared
- **Data freshness model:** Every stored entity wraps values in `{ data: T, fetchedAt: timestamp, source: 'nse-bse-api' | 'screener' | 'user' }`
- **Scraping resilience:** Single `ScreenerService` module with try→cache→manual-override fallback chain

### Frontend Architecture

- **State management:** Zustand 5.0.14 — lightweight, no Provider wrapper, ~1.2KB gzipped
- **State boundaries:**
  - Zustand stores: `useStockStore` (current selection, compare list), `useUIStore` (theme, sidebar, filters), `useDashboardStore` (layout preferences, watchlist)
  - Dexie (direct): Portfolio holdings, goals, SIP schedules, journal entries, review records — read/written directly via Dexie, not mirrored in Zustand
  - TanStack Router loaders: Route-level data fetching for stock detail, compare, etc.
- **Component architecture:** Feature-based directories under `src/` (mirroring MF app conventions)

### Infrastructure & Deployment

- **Hosting:** Static SPA served via nginx on VPS
- **Production CORS proxy:** Same nginx instance proxies `/api/nse-bse/*` → nse-bse-api backend and `/api/screener/*` → Screener.in via server-side fetch (avoids browser CORS restrictions)
- **Dev CORS proxy:** Vite `server.proxy` configuration matching the same route patterns
- **CI/CD:** Deferred — initial deployment manual via rsync/scp to VPS
- **Environment config:** `.env` files with `VITE_` prefix for Vite; nginx config managed separately

### Decision Impact Analysis

**Implementation Sequence:**
1. `npm create vite` scaffold + dep installation (Zustand, Dexie, TanStack Router, shadcn/ui, Recharts)
2. nginx config for static serving + CORS proxy routes
3. Dexie schema definitions + data service layer
4. Scorecard (core feature — 17-param engine drives everything else)
5. Stock Browser (data source integration + search/filter)
6. Compare (builds on scorecard + browser)
7. Dashboard (summary of scored stocks + portfolio)
8. Remaining features (goals, SIP, journal, etc.)

**Cross-Component Dependencies:**
- Scoring engine is a shared pure module — must be built first, depended on by Scorecard, Compare, Dashboard
- Data freshness metadata pattern must be established in data service layer before any UI component renders data
- Zustand stores are independent of each other but consume the same freshness-aware data services

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 7 areas where AI agents could make different choices

### Naming Patterns

**Database Naming Conventions (Dexie):**
- Table names: singular (`stock`, `portfolio`, `goal`, `sip`, `review`, `journalEntry`, `priceHistory`, `fundamental`, `corporateAction`, `watchlist`)
- Field names: camelCase (`stockName`, `fetchedAt`, `currentPrice`, `peRatio`)
- Primary key: `id` (auto-increment or string UUID)
- Index naming: compound indexes via Dexie `&` (unique) and `*` (multi-entry) syntax in schema strings

**Code Naming Conventions:**
- Files: kebab-case (`stock-card.tsx`, `scoring-engine.ts`, `screener-service.ts`)
- Components: PascalCase (`StockCard`, `ScorecardPanel`, `CompareTable`)
- Functions/variables: camelCase (`calculateScore`, `fetchFundamentals`, `isStale`)
- Types/interfaces: PascalCase with `Type`/`Interface` suffix or plain (`StockData`, `FreshnessEnvelope<T>`)
- Zustand stores: camelCase with `use` prefix + `Store` suffix (`useStockStore`, `useUIStore`, `useDashboardStore`)
- Test files: co-located with source (`stock-card.test.tsx`, `scoring-engine.test.ts`)

### Structure Patterns

**Project Organization:**
- `src/` organized by feature: `src/features/scorecard/`, `src/features/browser/`, `src/features/compare/`, `src/features/portfolio/`, etc.
- Shared code: `src/lib/` (utilities, scoring engine), `src/services/` (data services, Dexie), `src/components/ui/` (shadcn/ui primitives), `src/stores/` (Zustand stores)
- Routes: `src/routes/` — TanStack Router file-based route definitions
- Types: `src/types/` — shared TypeScript type definitions and interfaces

### Format Patterns

**Data Service Envelope (MANDATORY):**
```typescript
interface DataEnvelope<T> {
  data: T | null
  fetchedAt: string | null  // ISO 8601
  source: 'cache' | 'api' | 'scraper' | 'user'
  error?: string
}
```

**Date Format:**
- Storage (Dexie): ISO 8601 strings (`2026-06-08T10:30:00.000Z`)
- Display: formatted via shared `formatDate` utility in `src/lib/`
- Comparison: direct string comparison (ISO sorts lexicographically)

### Communication Patterns

**State Management:**
- Zustand stores are feature-scoped — one store per domain concept
- Actions dispatch via store methods (`useStockStore.getState().selectStock(id)`)
- No event bus or pub/sub — React re-renders via Zustand subscriptions handle cross-feature updates
- Dexie live queries (`dexie.liveQuery()`) for reactive cache-to-UI updates where applicable

### Process Patterns

**Error Handling:**
- Data services return errors in the `DataEnvelope.error` field — never throw for expected failures (stale data, scrape failure, rate limit)
- Unexpected errors (TypeError, network timeout) propagate to a global error handler registered via Zustand middleware
- UI uses a shared `ErrorState` component for user-facing error display
- Loading states use a shared `LoadingState` component — every data-consuming view renders one of: `LoadingState | ErrorState | DataDisplay`

**Data Freshness Enforcement:**
- Every data-consuming component receives `DataEnvelope<T>` and renders `FreshnessBadge` based on `fetchedAt` + tier-specific TTL
- FreshnessBadge: green (within TTL), yellow (2x TTL), red (expired), gray (missing)

### Enforcement Guidelines

**All AI Agents MUST:**
- Wrap every data service return in `DataEnvelope<T>` — no raw data returns from services
- Co-locate tests with source files — never use `__tests__/` directories
- Use camelCase for all TypeScript identifiers and Dexie fields
- Store all dates as ISO 8601 strings in Dexie
- Use feature-based directories under `src/features/`
- Name files in kebab-case, components in PascalCase
- **`features/` contains zero React** — pure domain logic, types, algorithms only
- **`components/features/` contains React components** that consume logic from `features/` — never import React into a `features/` module

## Project Structure & Boundaries

### Complete Project Directory Structure

```
stocks-and-shares-advisor/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
├── tailwind.config.ts
├── postcss.config.js
├── .env
├── .env.example
├── .gitignore
├── README.md
├── nginx/
│   └── default.conf
│
├── public/
│   └── favicon.svg
│
└── src/
    ├── main.tsx
    ├── app.tsx
    ├── globals.css
    │
    ├── routes/
    │   ├── __root.tsx
    │   ├── index.tsx                 # Dashboard
    │   ├── stocks.tsx                # Stock Browser
    │   ├── stocks.$symbol.tsx        # Stock Detail / Scorecard
    │   ├── compare.tsx               # Compare
    │   ├── portfolio.tsx
    │   ├── goals.tsx
    │   ├── reviews.tsx
    │   ├── journal.tsx
    │   ├── sip-calculator.tsx
    │   ├── glossary.tsx
    │   └── settings.tsx
    │
    ├── components/
    │   ├── ui/                       # shadcn/ui primitives
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── dialog.tsx
    │   │   ├── input.tsx
    │   │   ├── select.tsx
    │   │   ├── table.tsx
    │   │   ├── tabs.tsx
    │   │   ├── badge.tsx
    │   │   └── ...
    │   ├── shared/                   # App-specific shared components
    │   │   ├── freshness-badge.tsx
    │   │   ├── loading-state.tsx
    │   │   ├── error-state.tsx
    │   │   ├── score-gauge.tsx
    │   │   ├── stock-search.tsx
    │   │   └── layout.tsx
    │   └── features/                 # Feature-specific React components
    │       ├── dashboard/
    │       ├── scorecard/
    │       ├── browser/
    │       ├── compare/
    │       ├── portfolio/
    │       ├── goals/
    │       └── ...
    │
    ├── features/                     # Pure domain logic (NO React)
    │   ├── scorecard/
    │   │   ├── scoring-engine.ts
    │   │   ├── scoring-engine.test.ts
    │   │   ├── parameters.ts
    │   │   └── types.ts
    │   ├── compare/
    │   │   ├── comparison-engine.ts
    │   │   ├── comparison-engine.test.ts
    │   │   ├── framework.ts
    │   │   └── types.ts
    │   ├── risk-profile/
    │   │   ├── risk-engine.ts
    │   │   ├── questionnaire.ts
    │   │   └── types.ts
    │   ├── overlap/
    │   │   ├── overlap-detector.ts
    │   │   └── types.ts
    │   └── xirr/
    │       ├── xirr-calculator.ts
    │       └── xirr-calculator.test.ts
    │
    ├── services/                     # Data access layer
    │   ├── db.ts                     # Dexie instance + schemas + migrations
    │   ├── quote-service.ts          # nse-bse-api wrapper
    │   ├── quote-service.test.ts
    │   ├── screener-service.ts       # Screener.in scraper + parser
    │   ├── screener-service.test.ts
    │   ├── stock-service.ts          # Composite: quote + fundamentals + cache
    │   └── sync-service.ts           # Background refresh scheduler
    │
    ├── stores/                       # Zustand stores
    │   ├── stock-store.ts
    │   ├── ui-store.ts
    │   └── dashboard-store.ts
    │
    ├── lib/                          # Pure utilities
    │   ├── format.ts
    │   ├── format.test.ts
    │   ├── math.ts
    │   ├── math.test.ts
    │   └── constants.ts
    │
    ├── types/                        # Shared TypeScript types
    │   ├── stock.ts
    │   ├── portfolio.ts
    │   ├── goal.ts
    │   ├── sip.ts
    │   ├── review.ts
    │   ├── journal.ts
    │   ├── envelope.ts
    │   └── common.ts
    │
    └── hooks/
        ├── use-data.ts
        ├── use-stock-data.ts
        └── use-dexie.ts
```

### Architectural Boundaries

**Component Boundaries (features/ vs components/features/):**
- `src/features/` — zero React imports. Pure functions, types, and algorithms for domain logic (scoring, comparison, risk calculation, overlap detection, XIRR). Importable by services, components, and tests alike.
- `src/components/features/` — React components that import and use modules from `src/features/`. These handle rendering, user interaction, and hooking into Zustand stores. Never contain domain logic — only orchestration and presentation.
- `src/services/` — the sole layer that touches external APIs (nse-bse-api, Screener.in) and Dexie. All returns wrapped in `DataEnvelope<T>`. Components never call fetch/axios directly.
- `src/stores/` — bridge between services and components for cross-route state. Components read from stores, stores call services. Router loaders can also call services directly for route-entry data.

**Data Boundaries:**
- Dexie tables are accessed exclusively through `src/services/db.ts` (schema + migration) and feature-specific service modules
- Zustand stores never persist to Dexie directly — user data flows: Component → Service → Dexie
- Cache reads go through services, not directly to Dexie from components

### Requirements to Structure Mapping

| Feature | Routes | Domain Logic | Components | Services |
|---------|--------|-------------|------------|----------|
| Stock Browser | `stocks.tsx` | — | `components/features/browser/` | `stock-service`, `quote-service` |
| Scorecard | `stocks.$symbol.tsx` | `features/scorecard/` | `components/features/scorecard/` | `stock-service`, `screener-service` |
| Compare | `compare.tsx` | `features/compare/` | `components/features/compare/` | `stock-service` |
| Dashboard | `index.tsx` | — | `components/features/dashboard/` | `stock-service`, `sync-service` |
| Portfolio | `portfolio.tsx` | — | `components/features/portfolio/` | `db.ts` |
| Goals | `goals.tsx` | — | `components/features/goals/` | `db.ts` |
| Reviews | `reviews.tsx` | — | `components/features/reviews/` | `db.ts` |
| Journal | `journal.tsx` | — | `components/features/journal/` | `db.ts` |
| SIP Calc | `sip-calculator.tsx` | `features/xirr/` | `components/features/xirr/` | — |
| Risk Profile | (dialog) | `features/risk-profile/` | `components/features/risk-profile/` | `db.ts` |
| Overlap | (dialog) | `features/overlap/` | `components/features/overlap/` | `stock-service` |
| Glossary | `glossary.tsx` | — | (static content) | — |
| Settings | `settings.tsx` | — | `components/features/settings/` | `db.ts` |

### Integration Points

**Internal Communication:**
- Route → Router Loader → Service → DataEnvelope → Component
- Component → Zustand Store action → Store calls Service → update state → re-render
- Component → Service (for Dexie writes: portfolio, goals, journal)
- `features/` modules are pure — called by services, stores, or components directly with no side effects

**External Integrations:**
- nse-bse-api npm package → wrapped by `quote-service.ts` → Vite/nginx CORS proxy
- Screener.in HTML → fetched via `screener-service.ts` → Vite/nginx CORS proxy → regex/DOMParser extraction
- No other external dependencies in v1

**Data Flow:**
- Stock research: User selects stock → Router loader calls `stock-service` → checks Dexie cache → if stale, calls `quote-service` + `screener-service` → wraps in `DataEnvelope` → caches in Dexie → returns to component → `FreshnessBadge` renders staleness
- User data: User edits portfolio → component calls `db.ts` directly → Dexie write → on next load, Dexie live query pushes update

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are compatible: React 19 + Vite 6 + Zustand 5.0.14 + TanStack Router + Dexie + Tailwind CSS 4 + shadcn/ui + Recharts. No version conflicts identified. The nginx CORS proxy pattern works for both nse-bse-api and Screener.in without conflicting route rules.

**Pattern Consistency:**
All naming conventions are internally consistent — kebab-case files, PascalCase components, camelCase TypeScript/Dexie fields, ISO 8601 dates. The `features/` (pure logic) vs `components/features/` (React) boundary is documented with enforcement rules. DataEnvelope pattern applies uniformly across all services.

**Structure Alignment:**
The project tree fully supports all architectural decisions. Route structure maps 1:1 to features. Service layer is the sole boundary to external data. Zustand stores sit between services and components for cross-route state.

### Requirements Coverage Validation ✅

**Feature Coverage:**
All 16 features mapped to specific files and directories in the requirements-to-structure table. Core MVP spine (Browser, Scorecard, Compare, Dashboard) has dedicated modules. Supporting features (Portfolio, Goals, Journal, SIP, Reviews, Settings) follow identical patterns.

**Functional Requirements Coverage:**
All 41 FRs are architecturally supported. The scoring engine (17 params), comparison engine (8-step framework), XIRR calculator, overlap detector, and risk profiler each have dedicated modules in `features/`. Data freshness (FR-xx) is addressed by the DataEnvelope pattern and FreshnessBadge component.

**Non-Functional Requirements Coverage:**
- <500ms calc time: scoring engine is pure functions with no I/O — easily meets target
- <3s initial load: Vite code splitting + TanStack Router lazy routes
- Graceful offline degradation: cache-first reads, stale indicators, never-blocking writes

### Implementation Readiness Validation ✅

**Decision Completeness:**
All critical decisions documented with verified versions. Technology stack fully specified. Integration patterns (CORS proxy, nginx, Vite dev) defined. Performance considerations addressed via Vite code splitting and pure function architecture.

**Structure Completeness:**
Complete directory tree with 60+ files defined. All component boundaries established. Integration points mapped. Requirements-to-structure mapping table complete.

**Pattern Completeness:**
All potential conflict points addressed — naming (7 rules), structure (feature-based), communication (service boundaries, Zustand patterns), process (error handling, loading states, freshness). Concrete examples provided for each pattern.

### Gap Analysis Results

| Gap | Priority | Status |
|-----|----------|--------|
| Dexie schema definitions (field-level) | Nice-to-Have | Will be defined in first implementation story |
| nginx default.conf content | Nice-to-Have | Standard pattern, will be filled during deployment story |
| CI/CD pipeline definition | Deferred | Post-MVP — manual rsync for initial deploy |
| PWA service worker | Deferred | V2 enhancement |
| Testing coverage thresholds | Nice-to-Have | Co-located tests pattern established, thresholds defined per-story |

**No critical or important gaps identified.**

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Clean layering: features (pure logic) → services (data) → stores (state) → components (UI)
- Single data access pattern (DataEnvelope) across all external sources
- Freshness model built into architecture from day one, not retrofitted
- Feature-based organization scales cleanly from MVP (4 features) to full scope (16 features)
- Zero-backend architecture eliminates auth, server management, and ops complexity

**Areas for Future Enhancement:**
- PWA/service worker for true offline support
- CI/CD pipeline for automated deployment
- Dexie schema definitions refined during implementation
- Testing coverage thresholds formalized per feature

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect the `features/` (pure logic) vs `components/features/` (React) boundary
- Wrap every data service return in `DataEnvelope<T>`
- Co-locate tests with source files
- Store all dates as ISO 8601 strings in Dexie
- Name files in kebab-case, components in PascalCase

**First Implementation Priority:**
```bash
npm create vite@latest . -- --template react-ts
```
