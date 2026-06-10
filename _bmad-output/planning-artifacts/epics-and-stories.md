---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - prds/prd-STOCKS-AND-SHARES-ADVISOR-APP-2026-06-08/prd.md
  - prds/prd-STOCKS-AND-SHARES-ADVISOR-APP-2026-06-08/addendum.md
  - architecture.md
  - ux-designs/ux-STOCKS-AND-SHARES-ADVISOR-APP-2026-06-08/DESIGN.md
  - ux-designs/ux-STOCKS-AND-SHARES-ADVISOR-APP-2026-06-08/EXPERIENCE.md
workflowType: 'epics-and-stories'
project_name: 'STOCKS-AND-SHARES-ADVISOR-APP'
user_name: 'Boss'
date: '2026-06-08'
domain: fintech
project_type: web_app
domain_complexity: high
---

# STOCKS-AND-SHARES-ADVISOR-APP - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Stocks & Shares Advisor App, decomposing the requirements from the PRD (41 FRs, cross-cutting NFRs), Architecture decisions (DataEnvelope, tiered TTL, zero-backend, feature-based structure), and UX specifications (DESIGN.md visual identity + EXPERIENCE.md behavior/IA/flows) into implementable stories.

Each epic delivers a coherent increment of user value. Epic boundaries follow feature ownership and dependency ordering: Foundation first (scaffold, data layer, shared components), then research features (Browser → Scorecard → Compare), then monitoring features (Dashboard → Portfolio → Goals → Reviews), then supporting features (Journal → Risk → Glossary/XIRR → Settings).

## Requirements Inventory

### Functional Requirements

| ID | Description | Source |
|----|-------------|--------|
| FR-1 | Search stocks by name or ticker symbol | PRD §4.1 |
| FR-1.1 | Auto-fetch fundamentals from Screener.in | PRD §4.1 |
| FR-2 | Filter stocks by market cap, sector, P/E, ROE, score | PRD §4.1 |
| FR-3 | Stock list with key metrics (ticker, name, sector, price, market cap, P/E, ROE, score) | PRD §4.1 |
| FR-4 | View stock scorecard with 17 parameters, categories, composite score | PRD §4.2 |
| FR-5 | Parameter interplay warnings with severity levels | PRD §4.2 |
| FR-6 | Customise parameter/category weights | PRD §4.2 |
| FR-7 | Score history as timeline/line chart (min 5 snapshots) | PRD §4.2 |
| FR-8 | Select stocks to compare (2-5 stocks) | PRD §4.3 |
| FR-9 | Parameter comparison table with highlighting | PRD §4.3 |
| FR-10 | Visual comparison charts (bar chart, radar/spider chart) | PRD §4.3 |
| FR-11 | Step-by-step 8-step framework view | PRD §4.4 |
| FR-12 | Framework summary with print/export | PRD §4.4 |
| FR-13 | Auto-populate framework data from scorecard | PRD §4.4 |
| FR-14 | Risk questionnaire (min 10 questions) | PRD §4.5 |
| FR-15 | Style preference recommendation (Growth/Value/Dividend/Blend) | PRD §4.5 |
| FR-16 | Create financial goal with target amount, date, risk profile, sector preferences | PRD §4.6 |
| FR-17 | Goal projection calculator with 3 scenarios | PRD §4.6 |
| FR-18 | Link transactions to goals | PRD §4.6 |
| FR-19 | Add stock holding with quantity, avg buy price, purchase date, goal link | PRD §4.7 |
| FR-20 | Record buy/sell transactions with quantity, price, brokerage, notes | PRD §4.7 |
| FR-21 | Portfolio allocation view (sector, market cap, style pie charts) | PRD §4.7 |
| FR-22 | Review checklist with 5 steps (drift, exposure, role-fit, benchmark, rationale) | PRD §4.8 |
| FR-23 | Drift analysis per stock with colour-coded status | PRD §4.8 |
| FR-24 | Category exposure check with configurable caps | PRD §4.8 |
| FR-25 | Stock role-fit check (core hold / growth play / dividend income / tactical) | PRD §4.8 |
| FR-26 | Review alerts on Dashboard with actionable links | PRD §4.8 |
| FR-27 | Create journal entry with stock, title, body, role, exit triggers, tags | PRD §4.9 |
| FR-28 | Journal timeline with reverse-chronological order, filterable | PRD §4.9 |
| FR-29 | SIP projection with monthly amount, return scenarios, duration | PRD §4.10 |
| FR-30 | Standalone drift calculator for custom allocations | PRD §4.11 |
| FR-31 | Overlap analysis: candidate stock vs portfolio sector exposure | PRD §4.12 |
| FR-32 | Portfolio snapshot on Dashboard (total value, day change, returns) | PRD §4.13 |
| FR-33 | Active alerts on Dashboard with priority ordering | PRD §4.13 |
| FR-34 | Quick actions (Add Stock, New Journal, Start Review, New Comparison) | PRD §4.13 |
| FR-35 | Glossary browser with 37+ terms, searchable | PRD §4.14 |
| FR-36 | In-context TermInfo tooltips on scorecard parameters, compare headers | PRD §4.14 |
| FR-37 | XIRR computation for irregular cash flows using Newton-Raphson | PRD §4.15 |
| FR-38 | Configure review frequency (monthly/quarterly) | PRD §4.16 |
| FR-39 | Data export as JSON file | PRD §4.16 |
| FR-40 | Data import from JSON file with validation | PRD §4.16 |
| FR-41 | Theme toggle (light/dark) persisted in IndexedDB | PRD §4.16 |

### NonFunctional Requirements

| ID | Description | Source |
|----|-------------|--------|
| NFR-1 | All calculations (score, XIRR, drift, SIP) complete within 500ms client-side | PRD §4.17 |
| NFR-2 | App loads under 3 seconds on typical broadband connection | PRD §4.17 |
| NFR-3 | Offline-capable for all user-entered data; stale-cache for API data | PRD §4.17 |
| NFR-4 | IndexedDB operations wrapped in try-catch with user-visible error messages | PRD §4.17 |
| NFR-5 | API calls to nse-bse-api cached min 5 minutes | PRD §4.1 |
| NFR-6 | Stock list paginated at 50 items per page | PRD §4.1 |
| NFR-7 | Scoring logic runs entirely client-side | PRD §4.2 |
| NFR-8 | All data returns wrapped in DataEnvelope<T> with fetchedAt, source, error | Architecture |
| NFR-9 | Data freshness enforced via tiered TTL (15min quotes, 24h fundamentals, 7d corp actions) | Architecture |
| NFR-10 | WCAG 2.2 AA compliance across all surfaces | EXPERIENCE.md |
| NFR-11 | en-IN locale for all formatted numeric values | DESIGN.md |
| NFR-12 | Dark mode via `.dark` class + CSS custom properties | DESIGN.md |

### Additional Requirements

| ID | Description | Source |
|----|-------------|--------|
| AR-1 | Zero-backend: all user data in IndexedDB via Dexie with versioned migrations | Architecture |
| AR-2 | CORS proxy via nginx (production) + Vite server.proxy (dev) for nse-bse-api and Screener.in | Architecture |
| AR-3 | Zustand stores for cross-route state (stock selection, compare list, UI theme, dashboard) | Architecture |
| AR-4 | Pure domain logic in src/features/ (zero React imports); React in src/components/features/ | Architecture |
| AR-5 | Feature-based directory structure under src/ with co-located tests | Architecture |
| AR-6 | FreshnessBadge component: green/yellow/red/gray dot + text label | Architecture + EXPERIENCE.md |
| AR-7 | Shared LoadingState, ErrorState components for consistent data-fetching UX | Architecture |
| AR-8 | Score tiers: 4-tier (green >=15, amber >=10, orange >=5, red <5) with text labels | EXPERIENCE.md |
| AR-9 | Composite score thresholds: >=70 green (Strong), >=50 amber (Average), <50 red (Weak) | EXPERIENCE.md |
| AR-10 | App Shell layout: fixed sidebar (260px expanded, 64px collapsed) + topbar + content area | EXPERIENCE.md |
| AR-11 | Sidebar collapses to icons at 768px, becomes Sheet on mobile | EXPERIENCE.md |
| AR-12 | 4-color chart palette: `['#2E8B57', '#2563EB', '#D97706', '#DC2626']` | DESIGN.md |
| AR-13 | First-run redirect to risk profiling if no profile exists | EXPERIENCE.md |
| AR-14 | NSE symbol as canonical stock identifier; Screener.in slug mapping | PRD §8 Assumptions |

### UX Design Requirements

| ID | Description | Source |
|----|-------------|--------|
| UX-1 | 12 surfaces: Dashboard, Stock Browser, Stock Detail, Compare, Portfolio, Goals, Goal Detail, Reviews, Journal, Watchlist, Settings, Glossary | EXPERIENCE.md |
| UX-2 | Dashboard as landing page with market summary + watchlist + alerts + Discover CTA | EXPERIENCE.md |
| UX-3 | Stock Detail combines scorecard + fundamentals + price chart on single page | EXPERIENCE.md |
| UX-4 | Compare surface: side-by-side columns (up to 4 stocks), winner highlighted per row | EXPERIENCE.md |
| UX-5 | Portfolio surface: holdings, sector allocation donut, transactions, goal breakdown, overlap warning | EXPERIENCE.md |
| UX-6 | Goals surface: goal cards with progress bars, status tracking | EXPERIENCE.md |
| UX-7 | Review surface: alert list, periodic review checklist, auto-fill computations | EXPERIENCE.md |
| UX-8 | Journal surface: timeline of entries linked to stocks/goals/reviews, inline edit | EXPERIENCE.md |
| UX-9 | Settings surface: review frequency, data export/import, theme toggle | EXPERIENCE.md |
| UX-10 | Glossary surface: searchable term list with TermInfo popovers | EXPERIENCE.md |
| UX-11 | Empty state pattern: icon + message + CTA button for every data surface | EXPERIENCE.md |
| UX-12 | Loading state pattern: shadcn Skeleton rows matching expected layout | EXPERIENCE.md |
| UX-13 | Data source error pattern: "Couldn't fetch" message + cached data + retry button | EXPERIENCE.md |
| UX-14 | Offline toast notification: "You're offline. Cached data shown with staleness indicators." | EXPERIENCE.md |
| UX-15 | ErrorState + LoadingState components used on every data-consuming view | EXPERIENCE.md |
| UX-16 | Microcopy: direct, numeric, manager-facing. No emojis, no exclamation-mark enthusiasm | EXPERIENCE.md |
| UX-17 | Tab order matches reading order; Escape closes topmost modal/popover; / focuses search | EXPERIENCE.md |
| UX-18 | Click stock row → Stock Detail; click compare checkbox → compare tray; hover donut → tooltip | EXPERIENCE.md |
| UX-19 | Score color (green/amber/orange/red) accompanied by text labels for color-blind users | EXPERIENCE.md |
| UX-20 | Chart data available in table form below chart for screen reader access | EXPERIENCE.md |
| UX-21 | Form validation errors announced via aria-live regions | EXPERIENCE.md |
| UX-22 | Banned: infinite scroll (pagination only), drag-to-reorder in v1, hover-only on mobile, modal stacks >1 deep | EXPERIENCE.md |
| UX-23 | Visual identity: Navy #1B3A5C primary, Forest Green #1E7A45 accent, Inter + JetBrains Mono, dark mode | DESIGN.md |

### FR Coverage Map

| Feature | FRs | Epic |
|---------|-----|------|
| Project Scaffold & Tooling | (infrastructure) | 1 |
| Dexie Data Layer | NFR-1, NFR-3, NFR-4, NFR-5, NFR-8, NFR-9, AR-1 | 1 |
| Scoring Engine (pure logic) | FR-4 (engine), NFR-1, NFR-7 | 1 |
| Data Services (quote, screener) | FR-1.1, AR-2, AR-14 | 1 |
| Shared UI Components | NFR-10, AR-6, AR-7, AR-8, AR-9, AR-12, UX-11, UX-12, UX-13, UX-14, UX-15 | 1 |
| Stock Browser / Screener | FR-1, FR-2, FR-3, NFR-5, NFR-6, UX-18 | 2 |
| Scorecard | FR-4, FR-5, FR-6, FR-7, UX-3, UX-19 | 3 |
| Stock Comparison | FR-8, FR-9, FR-10, UX-4 | 4 |
| 8-Step Framework | FR-11, FR-12, FR-13 | 4 |
| Dashboard | FR-32, FR-33, FR-34, UX-2 | 5 |
| Portfolio Management | FR-19, FR-20, FR-21, FR-31, UX-5 | 6 |
| Goals & SIP | FR-16, FR-17, FR-18, FR-29, UX-6 | 7 |
| Portfolio Reviews | FR-22, FR-23, FR-24, FR-25, FR-26, FR-30, UX-7 | 8 |
| Investment Journal | FR-27, FR-28, UX-8 | 9 |
| Risk Profiling | FR-14, FR-15, AR-13 | 10 |
| Glossary & XIRR | FR-35, FR-36, FR-37, UX-10 | 11 |
| Settings & Data Mgmt | FR-38, FR-39, FR-40, FR-41, UX-9 | 12 |

## Epic List

| # | Epic | FRs | Stories | Value |
|---|------|-----|---------|-------|
| 1 | Foundation & Infrastructure | NFR-1-9, AR-1-14, UX-10-23 | 14 | Project skeleton, data layer, shared patterns — everything builds on this |
| 2 | Stock Browser & Discovery | FR-1, FR-1.1, FR-2, FR-3 | 6 | User can find and explore stocks |
| 3 | Scorecard & Stock Evaluation | FR-4, FR-5, FR-6, FR-7 | 5 | User can evaluate a stock across 17 parameters |
| 4 | Compare & 8-Step Framework | FR-8, FR-9, FR-10, FR-11, FR-12, FR-13 | 6 | User can compare stocks and follow the decision framework |
| 5 | Dashboard | FR-32, FR-33, FR-34 | 4 | User sees portfolio-at-a-glance on landing |
| 6 | Portfolio Management | FR-19, FR-20, FR-21, FR-31 | 5 | User tracks holdings, transactions, allocation |
| 7 | Goals & SIP Calculator | FR-16, FR-17, FR-18, FR-29 | 5 | User creates goals and projects investments |
| 8 | Portfolio Reviews & Drift | FR-22, FR-23, FR-24, FR-25, FR-26, FR-30 | 6 | User runs periodic portfolio health checks |
| 9 | Investment Journal | FR-27, FR-28 | 3 | User records investment thesis and notes |
| 10 | Risk Profiling | FR-14, FR-15 | 3 | User determines risk profile and style |
| 11 | Glossary & XIRR Calculator | FR-35, FR-36, FR-37 | 4 | User learns terms and computes XIRR |
| 12 | Settings & Data Management | FR-38, FR-39, FR-40, FR-41 | 5 | User configures app and manages data |

---

## Epic 1: Foundation & Infrastructure

**Goal:** Establish the complete project skeleton, data layer, shared components, and infrastructure so that all downstream feature epics have a consistent foundation to build on.

This epic delivers: Vite scaffold with all dependencies, Dexie schema with versioned migrations, data services wrapping nse-bse-api + Screener.in with DataEnvelope<T> + tiered TTL caching, pure scoring engine module, shared UI components (Layout, FreshnessBadge, LoadingState, ErrorState, ScoreGauge, TermInfo), Zustand stores, nginx CORS proxy config, and the App Shell layout.

### Story 1.1: Scaffold Vite project and install dependencies

As a developer,
I want the project scaffolded with Vite + React 19 + TypeScript and all runtime/dev dependencies installed,
So that the codebase has a working build pipeline and all required libraries available.

**Acceptance Criteria:**

**Given** no project exists
**When** I run `npm create vite@latest . -- --template react-ts` and install dependencies
**Then** the following dependencies are present in package.json:
  - react@19, react-dom@19
  - @tanstack/react-router
  - dexie
  - zustand@5.0.14
  - recharts
  - tailwindcss@4
  - @tailwindcss/vite
  - shadcn/ui (initialized via `npx shadcn@latest init`)
  - nse-bse-api
  - vitest, @testing-library/react, jsdom
  - eslint, prettier
**And** `npm run dev` starts Vite dev server without errors
**And** `npm run build` produces a production build
**And** `npm run test` runs Vitest and passes

### Story 1.2: Configure Tailwind CSS 4 with brand design tokens

As a developer,
I want Tailwind CSS 4 configured with the brand design tokens (Navy #1B3A5C primary, Forest Green #1E7A45 accent, Inter + JetBrains Mono, shadcn dark mode),
So that all components render with consistent visual identity.

**Acceptance Criteria:**

**Given** the project is scaffolded
**When** Tailwind CSS 4 is configured with CSS custom properties for brand tokens
**Then** `globals.css` defines:
  - `--primary: #1B3A5C` (light) / `--primary-dark: #5A8FC5` (dark)
  - `--accent: #1E7A45` (light) / `--accent-dark: #5DAE7D` (dark)
  - Sidebar tokens: sidebar-bg, sidebar-fg, sidebar-active
  - Score tokens: score-green, score-amber, score-orange, score-red
  - Chart palette tokens: chart-color-1 through chart-color-4
  - Freshness dots: freshness-dot-green/yellow/red/gray
  - Inter and JetBrains Mono loaded via `@font-face` or CSS import
**And** `html.dark` class triggers dark mode token overrides
**And** shadcn/ui `Button` renders with brand primary colour

### Story 1.3: Implement Dexie database with schema definitions and migrations

As a developer,
I want the IndexedDB schema defined with all required object stores and versioned migrations,
So that all user data (portfolio, goals, journal, etc.) and cached stock data have a structured, versioned persistence layer.

**Acceptance Criteria:**

**Given** Dexie is initialized in `src/services/db.ts`
**When** the database is opened with version N
**Then** the following object stores exist with correct indexes:
  - `stock` — primary key: symbol (string)
  - `priceHistory` — primary key: id, index: symbol
  - `fundamental` — primary key: symbol
  - `corporateAction` — primary key: id, index: symbol
  - `portfolio` — primary key: id, index: symbol
  - `goal` — primary key: id
  - `sip` — primary key: id, index: goalId
  - `review` — primary key: id
  - `journalEntry` — primary key: id, indexes: symbol, goalId, reviewId, createdAt
  - `watchlist` — primary key: id, index: symbol
  - `userPreference` — primary key: key (string)
  - `scoreSnapshot` — primary key: id, indexes: symbol, createdAt
**And** `db.version(N+1).stores()` supports future migrations
**And** all Dexie operations in services are wrapped in try-catch

### Story 1.4: Implement QuoteService wrapping nse-bse-api

As a developer,
I want a QuoteService that fetches live NSE/BSE stock quotes via nse-bse-api, caches results in Dexie with 15-minute TTL,
So that stock browser and detail views display current prices without excessive API calls.

**Acceptance Criteria:**

**Given** QuoteService is implemented in `src/services/quote-service.ts`
**When** `getQuote(symbol)` is called
**Then** it returns `DataEnvelope<QuoteData>` where QuoteData includes: lastPrice, change, changePercent, dayHigh, dayLow, volume, fetchedAt, source
**And** it checks Dexie `stock` table for cached data first
**And** if cache exists and is within 15-minute TTL, returns cached data (source: 'cache')
**And** if cache is stale or missing, fetches from nse-bse-api, stores in Dexie, returns fresh data (source: 'api')
**And** if API call fails, returns stale cached data with error message (source: 'cache', error: string)
**And** `getQuotes(symbols[])` supports batch fetching and returns `Record<string, DataEnvelope<QuoteData>>`

### Story 1.5: Implement ScreenerService for fundamental data scraping

As a developer,
I want a ScreenerService that fetches fundamental data from Screener.in via CORS proxy, parses HTML, and caches with 24-hour TTL,
So that scorecard views display fundamental metrics without manual data entry.

**Acceptance Criteria:**

**Given** ScreenerService is implemented in `src/services/screener-service.ts`
**When** `getFundamentals(symbol)` is called
**Then** it returns `DataEnvelope<FundamentalData>` where FundamentalData includes: marketCap, peRatio, pbRatio, roe, roce, debtToEquity, operatingMargin, netProfitMargin, eps, dividendYield, bookValue, promoterHolding, freeCashFlow
**And** it checks Dexie `fundamental` table for cached data (24-hour TTL)
**And** if cache is stale or missing, fetches from `/api/screener/company/{slug}/` via CORS proxy
**And** parses HTML response using DOMParser to extract fundamental values
**And** if scraping fails (HTML change, rate limit, 403), returns stale cached data with error message
**And** NSE symbol to Screener.in slug mapping is maintained in a config map

### Story 1.6: Implement pure Scoring Engine module

As a developer,
I want the 17-parameter scoring engine implemented as pure functions in `src/features/scorecard/`,
So that Scorecard, Compare, and Dashboard can evaluate stocks consistently without side effects.

**Acceptance Criteria:**

**Given** the scoring engine is implemented in `src/features/scorecard/scoring-engine.ts`
**When** `calculateScore(fundamentals, weights)` is called
**Then** it computes individual scores (0-20) for all 17 parameters grouped into: Valuation (P/E, P/B, PEG, Dividend yield), Quality (ROE, ROCE, Operating margin, Net margin), Financial Health (Debt-to-equity, FCF, Book value), Growth (Revenue growth, EPS growth), Ownership (Promoter holding, Pledged shares, Governance quality), Size (Market cap)
**And** returns `ScoringResult` with: parameterScores[], categoryScores, compositeScore (0-100), tier labels
**And** results are deterministic (same input → same output)
**And** the module has zero React imports and zero side effects
**And** `calculateScore` completes in <50ms for any input (well within NFR-1's 500ms budget)
**And** tests in `scoring-engine.test.ts` cover: all 17 parameter score boundaries, weight normalization, edge cases (missing data, zero values, extreme values)

### Story 1.7: Implement StockService composite data service

As a developer,
I want a StockService that composes QuoteService + ScreenerService + Dexie cache into a single data-fetching pipeline,
So that feature components request all stock data through one service with freshness-aware results.

**Acceptance Criteria:**

**Given** StockService is implemented in `src/services/stock-service.ts`
**When** `getStockData(symbol)` is called
**Then** it returns `DataEnvelope<StockData>` where StockData includes: quote data + fundamental data + score (if fundamentals available)
**And** it fetches quote and fundamental data in parallel
**And** each sub-envelope preserves its own fetchedAt/timestamp for independent freshness tracking
**And** the service handles partial failures (quote succeeds, fundamentals fail) gracefully

### Story 1.8: Implement App Shell layout (sidebar + topbar + content)

As a user,
I want the App Shell layout with sidebar navigation, topbar, and content area,
So that I can navigate between all app surfaces and understand my current location.

**Acceptance Criteria:**

**Given** the App Shell is implemented in `src/components/shared/layout.tsx`
**When** the app loads
**Then** the sidebar is visible on the left (260px) with nav items: Dashboard, Stocks, Compare, Portfolio, Goals, Reviews, Journal, Watchlist, Settings, Glossary
**And** the sidebar active item matches the current route
**And** the sidebar collapses to icon-only (64px) at <1024px width
**And** the sidebar becomes a Sheet overlay at <768px (mobile)
**And** the topbar shows the current page title
**And** the topbar has a hamburger button (mobile) and theme toggle
**And** navigation via sidebar updates the route without full page reload
**And** route definitions in `src/routes/` match the IA table from EXPERIENCE.md

### Story 1.9: Implement shared UI components

As a developer,
I want shared UI components (FreshnessBadge, LoadingState, ErrorState, ScoreGauge, TermInfo) implemented,
So that all feature surfaces consume consistent loading, error, freshness, and score-display patterns.

**Acceptance Criteria:**

**Given** shared components exist in `src/components/shared/`
**When** `FreshnessBadge` receives a fetchedAt timestamp and TTL
**Then** it renders: green dot + "Current" (within TTL), yellow dot + "Stale" (2x TTL), red dot + "Expired" (beyond 2x TTL), gray dot + "Unavailable" (no data)
**And** both color and text label are present for accessibility (UX-19)
**When** `LoadingState` is rendered
**Then** it displays shadcn Skeleton rows matching expected content layout (UX-12)
**When** `ErrorState` receives a message and optional retry callback
**Then** it displays the error message and a "Retry" button
**When** `ScoreGauge` receives a score (0-100)
**Then** it displays the score number and color-coded tier label: >=70 green "Strong", >=50 amber "Average", <50 red "Weak"
**When** `TermInfo` receives a term name and definition
**Then** it renders a hover/click icon that opens a Popover with: term name, definition, example, "why it matters"
**And** Popover dismisses on click outside (UX-17)

### Story 1.10: Implement Zustand stores

As a developer,
I want Zustand stores for cross-route state management,
So that stock selection, compare list, UI preferences, and dashboard state persist across navigations.

**Acceptance Criteria:**

**Given** Zustand stores exist in `src/stores/`
**When** `useStockStore` is created
**Then** it manages: `selectedStock` (current stock symbol), `compareList` (array of up to 4 symbols), `addToCompare(symbol)`, `removeFromCompare(symbol)`, `clearCompare()`
**And** `useStockStore` validates compareList length (max 4)
**When** `useUIStore` is created
**Then** it manages: `theme` ('light' | 'dark'), `sidebarCollapsed` (boolean), `activeFilters` (object), `toggleTheme()`, `toggleSidebar()`
**When** `useDashboardStore` is created
**Then** it manages: `watchlistOrder` (symbol[]), `dashboardLayout` (preferences object)

### Story 1.11: Configure nginx for production (static serving + CORS proxy)

As a developer,
I want the nginx configuration for production deployment,
So that the static SPA is served with proper caching headers, SPA routing, and CORS proxy routes for nse-bse-api and Screener.in.

**Acceptance Criteria:**

**Given** nginx configuration exists in `nginx/default.conf`
**When** nginx receives a request for `/`
**Then** it serves the static SPA from the build directory
**And** all sub-routes (/*) fall back to `index.html` for SPA routing
**And** `/api/nse-bse/*` requests are proxied to the nse-bse-api backend
**And** `/api/screener/*` requests are fetched server-side via subrequest (not client-side CORS)
**And** static assets have Cache-Control headers for long-term caching with content hashes
**And** Vite dev config (`vite.config.ts`) mirrors the same proxy routes via `server.proxy`

### Story 1.12: Implement SyncService for background data refresh

As a developer,
I want a SyncService that periodically refreshes stale cached data in the background,
So that frequently viewed stocks have up-to-date information without manual refresh.

**Acceptance Criteria:**

**Given** SyncService is implemented in `src/services/sync-service.ts`
**When** `refreshIfStale(symbol)` is called
**Then** it checks quote data TTL (15min) and fundamental data TTL (24h) for the given symbol
**And** if any data is stale, triggers parallel refresh via QuoteService and/or ScreenerService
**And** returns the updated data without blocking the caller
**When** the Dashboard loads
**Then** SyncService triggers background refresh for all watchlisted stocks

### Story 1.13: Implement nse-bse-api stock listing for seed data

As a developer,
I want the initial stock universe seeded from nse-bse-api,
So that the Browser has a searchable list of NSE/BSE stocks on first load.

**Acceptance Criteria:**

**Given** the stock listing service is implemented
**When** the app first initializes
**Then** it fetches the stock universe from nse-bse-api (list of all available symbols with names and sectors)
**And** stores the listing in Dexie `stock` table
**And** subsequent loads read from the cached listing
**And** the listing is refreshable via Settings

### Story 1.14: Implement routing with TanStack Router

As a developer,
I want all routes configured with TanStack Router including lazy loading and data loaders,
So that each surface loads on demand and route-level data fetching is centralized.

**Acceptance Criteria:**

**Given** routes are defined in `src/routes/`
**When** navigating to each route
**Then** the correct component loads and renders
**And** route definitions match the IA from EXPERIENCE.md: `__root.tsx`, `index.tsx` (Dashboard), `stocks.tsx` (Browser), `stocks.$symbol.tsx` (Detail), `compare.tsx` (Compare), `portfolio.tsx` (Portfolio), `goals.tsx` (Goals), `goals.$goalId.tsx` (Goal Detail), `reviews.tsx` (Reviews), `journal.tsx` (Journal), `watchlist.tsx` (Watchlist), `settings.tsx` (Settings), `glossary.tsx` (Glossary)
**And** each route uses lazy loading (code splitting) via TanStack Router's lazy import pattern
**And** `__root.tsx` renders the App Shell layout as an outlet wrapper

---

## Epic 2: Stock Browser & Discovery

**Goal:** Enable the user to search, filter, and discover NSE/BSE stocks with key metrics displayed in a paginated list.

Depends on: Epic 1 (data services, shared components, routing). Delivers FR-1, FR-1.1, FR-2, FR-3.

### Story 2.1: Implement stock search by name and ticker

As a user,
I want to search stocks by name or ticker symbol,
So that I can quickly find a stock I'm interested in.

**Acceptance Criteria:**

**Given** the user is on the Stock Browser page
**When** they type in the search input
**Then** results update in real-time (debounced 300ms) matching against stock name and ticker
**And** the search queries the local IndexedDB stock listing first
**And** results are deduplicated by ticker symbol
**And** if no local results match, the search falls back to nse-bse-api live search
**And** "/" keypress focuses the search input (UX-17)
**And** when no results match: displays "No stocks match '{query}'. Try a different name or symbol." + "Clear filters" link (UX-11)

### Story 2.2: Implement stock filters (market cap, sector, P/E, ROE, score)

As a user,
I want to filter the stock list by market cap category, sector, P/E range, ROE range, and score range,
So that I can narrow down stocks matching my investment criteria.

**Acceptance Criteria:**

**Given** the Stock Browser page is open
**When** the user applies filters
**Then** filters stack with AND logic
**And** each filter dropdown shows the count of matching stocks for that filter value
**And** there is a "Reset All Filters" button that clears all filters
**And** the URL query parameters update to reflect active filters (for shareable/bookmarkable URLs)
**And** filter options include: market cap (Large/Mid/Small), sector (from sector taxonomy), P/E range (slider), ROE range (slider), score range (slider)

### Story 2.3: Implement paginated stock list with sortable columns

As a user,
I want the stock list displayed as a table with sortable columns showing key metrics,
So that I can browse stocks and identify candidates at a glance.

**Acceptance Criteria:**

**Given** the Stock Browser has search results
**When** results are displayed
**Then** each row shows: ticker, name, sector, current price, market cap, P/E ratio, ROE, and composite score badge (if scored)
**And** results are paginated at 50 items per page (NFR-6)
**And** pagination controls show: page number, total pages, prev/next buttons
**And** each column header is clickable for sorting ascending/descending
**And** clicking a stock row navigates to Stock Detail (`/stocks/{symbol}`)
**And** a "+" icon on each row adds the stock to the comparison list (visual feedback in the compare tray)
**And** numeric values formatted in en-IN locale (₹1,00,000)

### Story 2.4: Implement Screener.in fundamental fetch trigger from Browser

As a user,
I want the app to automatically fetch fundamental data for a stock when I view its detail page,
So that I don't have to manually enter P/E, ROE, and other metrics.

**Acceptance Criteria:**

**Given** the user clicks a stock row in the Browser
**When** the Stock Detail page loads
**Then** StockService.triggerFetch(symbol) is called, which initiates ScreenerService.getFundamentals(symbol) in the background
**And** if Screener.in data is already cached (within 24h), the cached data is displayed immediately
**And** if cache is stale or missing, a loading skeleton is shown while scraping runs
**And** if scraping succeeds, the Stock Detail updates with fresh fundamental data
**And** if scraping fails, the cached data (if any) is displayed with a yellow FreshnessBadge and error message
**And** the user can manually trigger a refresh via a "Refresh Data" button

### Story 2.5: Implement price auto-fetch on stock view

As a user,
I want the current stock price to fetch automatically when I view a stock,
So that I see up-to-date pricing without manual refresh.

**Acceptance Criteria:**

**Given** the Stock Detail page is loading
**When** the page mounts
**Then** StockService.getQuote(symbol) is called, which checks nse-bse-api cache (15min TTL)
**And** if cached, price displays immediately with green FreshnessBadge
**And** if stale, price refreshes in the background and updates when ready
**And** the price display shows: current price (₹), change (₹), change percentage (%), day high/low
**And** all formatted in en-IN locale with tabular-nums

### Story 2.6: Implement keyboard navigation and accessibility for Browser

As a user,
I want the Stock Browser to be fully keyboard-navigable and screen-reader accessible,
So that I can browse stocks efficiently with keyboard controls.

**Acceptance Criteria:**

**Given** the Stock Browser page is open
**When** the user presses Tab
**Then** focus moves through: search → filters → results table → pagination in reading order
**And** Enter/space activates the focused row (navigates to Stock Detail)
**And** Arrow keys navigate within select/dropdown filter components
**And** screen reader announces: "Stock Browser, {N} results" on page load (UX-17)
**And** each row announces: "{ticker}, {name}, price {price}, score {score}" when focused

---

## Epic 3: Scorecard & Stock Evaluation

**Goal:** Enable the user to evaluate a single stock across 17 parameters with a visual scorecard, interplay warnings, customizable weights, and score history tracking.

Depends on: Epic 1 (scoring engine, data services, shared components), Epic 2 (stock fetch). Delivers FR-4, FR-5, FR-6, FR-7.

### Story 3.1: Implement Stock Detail page with scorecard display

As a user,
I want to see the full 17-parameter scorecard for a stock on its detail page,
So that I can evaluate the stock's strengths and weaknesses at a glance.

**Acceptance Criteria:**

**Given** the user navigates to `/stocks/{symbol}`
**Then** the Stock Detail page renders with three sections: scorecard (left/primary), price chart (right), fundamentals table (bottom)
**When** fundamental data is available
**Then** the scorecard displays: composite score (0-100) prominently at top with color-coded tier label (UX-19)
**And** 17 parameters grouped into 6 categories: Valuation, Quality, Financial Health, Growth, Ownership, Size
**And** each parameter row shows: label with TermInfo icon, value, score (0-20) color-coded (green >=15, amber >=10, orange >=5, red <5), contribution bar (width proportional to weighted contribution), tier label text
**And** category subtotals are visually grouped
**And** contribution bars animate on initial render with a CSS transition from 0 to target width

### Story 3.2: Implement parameter interplay warnings

As a user,
I want the scorecard to show cross-parameter interplay warnings,
So that I'm alerted to contradictory signals (e.g., high P/E with low growth) before making a decision.

**Acceptance Criteria:**

**Given** scorecard data is computed for a stock
**When** the scorecard renders
**Then** a "Parameter Interplay" section is visible below the scorecard
**And** the following interplay checks are evaluated:
  - High P/E (>25) AND low revenue growth (<10%) → "Overvalued risk" (caution)
  - High pledge (>30%) AND falling promoter holding (YoY decrease) → "Distress signal" (alert)
  - High ROE (>18%) AND high debt-to-equity (>1.5) → "Leverage-driven ROE" (info)
  - High EV/EBITDA (>20) AND low operating margin (<15%) → "Overpriced without profitability" (caution)
  - Sector overlap with portfolio > cap → "Concentration risk" (info with portfolio-awareness note)
**And** each warning displays: severity icon (info/caution/alert), title, explanation text
**And** empty state: "No parameter interplay issues detected" when no warnings triggered

### Story 3.3: Implement weight customization UI

As a user,
I want to customize the weight of each parameter and category,
So that the scoring reflects my personal investment priorities.

**Acceptance Criteria:**

**Given** the user is on the Stock Detail page
**When** they open the weight customization panel
**Then** they see each category and its parameters with current weight values (default: equal-weighted)
**And** each weight has a slider (0-100) and a number input
**And** changing a parameter weight auto-normalizes the category subtotal to 100%
**And** a "Reset to Defaults" button restores factory weights
**And** weight changes persist to IndexedDB via Dexie `userPreference` table
**And** the scorecard re-renders with updated weights when weights change
**And** weights persist across app sessions

### Story 3.4: Implement score history tracking

As a user,
I want to see how a stock's score has changed over time,
So that I can identify improving or deteriorating fundamentals.

**Acceptance Criteria:**

**Given** the user is on the Stock Detail page
**When** they view the score history section
**Then** a timeline or line chart shows composite score at each scoring date
**And** a minimum of 5 most recent evaluations are stored and displayed
**And** each snapshot records: composite score, date, weights used
**And** if no history exists, displays: "No score history yet. Score a stock to start tracking." (UX-11)

### Story 3.5: Implement price chart on Stock Detail

As a user,
I want to see a price chart for the stock on its detail page,
So that I can assess price trends alongside fundamental scores.

**Acceptance Criteria:**

**Given** the Stock Detail page is open
**When** price history data is available
**Then** a Recharts line chart renders showing closing price over time (default: 1-month)
**And** the chart has interval selectors: 1W, 1M, 3M, 1Y
**And** hovering over a data point shows a tooltip with date and price
**And** chart colors use chart-color-1 (#2E8B57) from the brand palette
**And** if no price history exists, shows chart placeholder with loading skeleton (UX-12)
**And** chart data available in table form below the chart for screen reader access (UX-20)

---

## Epic 4: Compare & 8-Step Framework

**Goal:** Enable the user to compare 2-4 stocks side-by-side across all 17 parameters with visual charts, and work through the 8-step decision framework.

Depends on: Epic 1 (scoring engine, data services, stores), Epic 3 (scorecard). Delivers FR-8, FR-9, FR-10, FR-11, FR-12, FR-13.

### Story 4.1: Implement compare tray and stock selection

As a user,
I want to select stocks for comparison from the Browser, Scorecard, or Compare page,
So that I can build a comparison set of 2-4 stocks.

**Acceptance Criteria:**

**Given** the user is on any stock view
**When** they click the compare checkbox/button
**Then** the stock is added to the compare list (useStockStore)
**And** a compare tray slides up from the bottom showing selected stocks with remove buttons
**And** the tray shows a "Compare" button that activates when >=2 stocks are selected
**And** the user can add up to 4 stocks; at 4, the add button is disabled with "Max 4 stocks" tooltip
**And** navigating to `/compare` auto-populates the compare page with the selected stocks
**And** clicking "Clear All" empties the compare list
**And** compare list persists across navigations (Zustand store)

### Story 4.2: Implement parameter comparison table

As a user,
I want to see all 17 parameters compared side-by-side for my selected stocks,
So that I can identify which stock leads on each metric.

**Acceptance Criteria:**

**Given** the Compare page has 2-4 stocks selected
**When** the comparison table renders
**Then** each row is a parameter, grouped by category
**And** columns are sorted as: [parameter label] | [stock 1 column] | [stock 2 column] | ... | [category average]
**And** the winning value per row is highlighted green with a subtle highlight
**And** second-place is amber, third is orange, last is red
**And** clicking a row header shows TermInfo popover for that parameter (UX-18)
**And** numeric values format in en-IN locale
**And** the table scrolls horizontally on mobile (UX-22)

### Story 4.3: Implement visual comparison charts

As a user,
I want visual charts comparing my selected stocks,
So that I can quickly grasp multi-dimensional differences.

**Acceptance Criteria:**

**Given** the Compare page has 2-4 stocks selected
**Then** two chart types render above the comparison table:
  - Radar/spider chart: one axis per parameter (17 axes), one trace per stock
  - Bar chart: grouped bars per category, one bar per stock
**And** each stock trace uses a consistent color from the 4-color chart palette (AR-12)
**And** hovering on chart elements shows a tooltip with stock name, parameter, value
**And** charts are interactive (click to select/deselect traces)
**And** chart data available in table form below charts for screen reader access (UX-20)

### Story 4.4: Implement 8-step guided framework

As a user,
I want to work through the 8-Step Comparison Framework step by step,
So that I systematically evaluate a stock without missing any critical analysis dimension.

**Acceptance Criteria:**

**Given** the user opens the 8-Step Framework view (from Scorecard or Compare)
**When** the framework renders
**Then** 8 steps are shown as numbered cards: (1) Business Model, (2) Peer Comparison, (3) Financials, (4) Profitability, (5) Valuation, (6) Balance Sheet, (7) Governance, (8) Liquidity
**And** each step has: title, guidance text, relevant data fields, completion checkbox
**And** the user can navigate forward/backward via prev/next buttons
**And** a progress indicator shows "3/8 complete"
**And** the user can jump to any step from a summary view
**And** data entered per step persists in IndexedDB
**And** Step 5 (Valuation) explicitly shows P/E, P/B, EV/EBITDA with market context
**And** Step 8 (Liquidity) shows free float, daily trading volume, bid-ask spread context

### Story 4.5: Implement framework summary with export

As a user,
I want to see all 8 steps compiled into a one-page research report,
So that I have a printable summary of my analysis.

**Acceptance Criteria:**

**Given** the user has completed steps in the 8-Step Framework
**When** they view the summary
**Then** all 8 steps are compiled into a single-page report format
**And** the summary has print-friendly CSS (no sidebar, no nav, clean typography)
**And** an "Export as Markdown" button generates and downloads a `.md` file with the report content

### Story 4.6: Implement framework auto-populate from scorecard

As a user,
I want the framework to auto-populate data from the scorecard where they overlap,
So that I don't re-enter data that's already scored.

**Acceptance Criteria:**

**Given** the 8-Step Framework view is open for a scored stock
**When** a step that overlaps with scorecard data loads
**Then** the following auto-populate: Step 4 (Profitability) shows ROE/ROCE from scorecard, Step 3 (Financials) shows debt-to-equity/FCF from scorecard, Step 5 (Valuation) shows P/E/P/B from scorecard, Step 6 (Balance Sheet) shows book value from scorecard
**And** auto-populated values are visually distinct (e.g., muted label: "from scorecard")
**And** the user can override auto-populated values with manual entries
**And** when scorecard refreshes, a "Sync with scorecard" button appears if auto-populated values are stale

---

## Epic 5: Dashboard

**Goal:** Provide the user with an at-a-glance landing page showing portfolio snapshot, market summary, active alerts, and quick actions.

Depends on: Epic 1 (data services, stores, layout), Epic 6 (portfolio data), Epic 8 (review alerts). Delivers FR-32, FR-33, FR-34.

### Story 5.1: Implement market summary section

As a user,
I want the Dashboard to show a market summary with Nifty 50 and Sensex indices,
So that I see the market context immediately when I open the app.

**Acceptance Criteria:**

**Given** the Dashboard loads
**Then** the market summary section shows: Nifty 50 index value + change %, Sensex index value + change %
**And** top gainers and top losers lists (3-5 each compact rows) with stock name, price, change %
**And** each data point has a FreshnessBadge showing staleness
**And** gainers/losers show up/down arrows with green/red coloring
**And** if index data is unavailable, shows stale cache with yellow badge or skeleton if never fetched (UX-12)

### Story 5.2: Implement portfolio snapshot section

As a user,
I want the Dashboard to show a portfolio snapshot with total value, day change, and returns,
So that I monitor my holdings without navigating to Portfolio.

**Acceptance Criteria:**

**Given** the Dashboard loads and the user has portfolio holdings
**Then** the portfolio snapshot shows: total portfolio value (₹), day change (₹ and %), total invested (₹), total returns (₹ and %, green/red)
**And** top 3-5 holdings listed by weight with score badges
**And** if no portfolio exists, shows: "No holdings yet. Add your first transaction." + "Add Transaction" button (UX-11)

### Story 5.3: Implement active alerts section

As a user,
I want the Dashboard to show active alerts from the latest review cycle,
So that I know what requires my attention.

**Acceptance Criteria:**

**Given** the Dashboard loads and there are active alerts
**Then** alerts display in priority order (critical first, then warning, then info)
**And** each alert is a card with: severity icon, title, description, actionable link (tap navigates to relevant page)
**And** alerts include: review due, drift flagged, sector cap exceeded, role mismatch, benchmark underperformance
**And** each alert is dismissible (cross button)
**And** if no active alerts: shows a green card: "All clear. No outstanding alerts." (UX-11)

### Story 5.4: Implement quick actions bar

As a user,
I want the Dashboard to have a quick actions bar for common tasks,
So that I can start key workflows in one click.

**Acceptance Criteria:**

**Given** the Dashboard is open
**Then** a quick actions section shows 4 buttons: "Add Stock" → navigates to Browser, "New Journal Entry" → opens Journal with empty form, "Start Review" → navigates to Reviews checklist, "New Comparison" → navigates to Compare
**And** buttons are styled as outlined primary buttons in a horizontal row
**And** buttons have labels and small icons

---

## Epic 6: Portfolio Management

**Goal:** Enable the user to track stock holdings, record transactions, view portfolio allocation across sectors/market-cap/style, and analyse sector overlap.

Depends on: Epic 1 (Dexie, shared components), Epic 5 (dashboard snapshot). Delivers FR-19, FR-20, FR-21, FR-31.

### Story 6.1: Implement add stock holding form

As a user,
I want to add a stock to my portfolio with quantity, average buy price, and purchase date,
So that I can track my holdings.

**Acceptance Criteria:**

**Given** the user is on the Portfolio page
**When** they click "Add Holding"
**Then** a form opens (dialog/modal) with fields: stock search/select (autocomplete from stock listing), quantity (number), average buy price (currency), purchase date (date picker), optional goal link (dropdown), optional notes (textarea)
**And** the stock selector searches the local stock listing by name/ticker
**And** on save, the holding is persisted in Dexie `portfolio` table
**And** the portfolio view updates to show the new holding
**And** current value is auto-calculated using live price from QuoteService (with FreshnessBadge)
**And** P&L computed and displayed: absolute (₹) and percentage (%), green for gain, red for loss

### Story 6.2: Implement transaction recording

As a user,
I want to record buy and sell transactions for my portfolio stocks,
So that I have a complete audit trail of my trades.

**Acceptance Criteria:**

**Given** the user is on the Portfolio or Stock Detail page
**When** they record a transaction
**Then** the transaction form includes: date, type (Buy/Sell), stock (pre-filled if from Stock Detail), quantity, price per unit, brokerage (optional), notes (optional), goal link (optional)
**And** on save, the transaction is persisted in Dexie
**And** sell transactions reduce the holding quantity
**And** if a sell transaction reduces quantity below 0, validation error: "Insufficient holdings"
**And** SIP transaction type is supported (recurring buy)
**And** the transaction list for each stock shows running total of units after each transaction

### Story 6.3: Implement portfolio holdings list

As a user,
I want to see all my portfolio holdings in a sortable list with current values and P&L,
So that I can monitor my entire portfolio at a glance.

**Acceptance Criteria:**

**Given** the Portfolio page loads and the user has holdings
**Then** each holding row shows: stock ticker + name, quantity, average buy price, current price (with FreshnessBadge), invested value, current value, P&L (₹ and %), weight %, score badge, role badge
**And** the list is sortable by any column
**And** clicking a holding navigates to its Stock Detail page
**And** totals shown at the top: total invested, total current value, total P&L

### Story 6.4: Implement portfolio allocation visualizations

As a user,
I want to see my portfolio allocation broken down by sector, market cap, and investment style,
So that I can assess diversification at a glance.

**Acceptance Criteria:**

**Given** the Portfolio page loads
**Then** three Recharts PieChart donuts render showing allocation by: sector, market cap (Large/Mid/Small), investment style (Growth/Value/Dividend)
**And** hovering on a donut slice shows a tooltip: sector name + percentage + total value
**And** clicking a donut slice filters the holdings table below to show only that category
**And** sector caps are configurable (default: 35%)
**And** each stock shows its weight % vs target weight % with an "Excessive" flag when >15% of portfolio

### Story 6.5: Implement sector overlap analysis

As a user,
I want to see how a candidate stock's sector overlaps with my existing portfolio,
So that I avoid excessive sector concentration.

**Acceptance Criteria:**

**Given** the user is on the Stock Detail or Portfolio page
**When** they initiate overlap analysis for a stock
**Then** a dialog shows: candidate stock name, its sector, current portfolio sector exposure (%), new combined exposure if purchased (%), overlap % with existing holdings
**And** if new combined exposure exceeds the user's sector cap, a warning is shown: "Adding {stock} would push {sector} to {X}%, exceeding your cap of {Y}%."
**And** if no portfolio holdings exist, shows: "No holdings in portfolio to compare overlap against." (UX-11)

---

## Epic 7: Goals & SIP Calculator

**Goal:** Enable the user to create financial goals, project their progress, link transactions to goals, and compute SIP projections.

Depends on: Epic 1 (Dexie, shared components). Delivers FR-16, FR-17, FR-18, FR-29.

### Story 7.1: Implement goal creation

As a user,
I want to create a financial goal with target amount, target date, risk profile, and sector preferences,
So that I can track my progress toward specific investment objectives.

**Acceptance Criteria:**

**Given** the user is on the Goals page
**When** they click "Create Goal"
**Then** a form opens with fields: name (text), type (Emergency / Medium-Term / Long-Term / Custom), target amount (currency), target date (date picker), current amount (currency, optional), risk profile (Conservative / Moderate / Aggressive), preferred sectors (multi-select)
**And** on save, the goal is persisted in Dexie `goal` table
**And** the goal appears as a card on the Goals page with: name, progress bar, target amount, current amount, target date, status badge (Active / Closed / Paused)

### Story 7.2: Implement goal detail page

As a user,
I want to view a goal's detail page showing progress, linked holdings, and projection,
So that I can track whether I'm on track to meet my goal.

**Acceptance Criteria:**

**Given** the user clicks a goal card on the Goals page
**When** the Goal Detail page loads
**Then** it shows: goal name, type, progress bar (current vs target), target amount, current amount, target date, days remaining
**And** it lists linked holdings (stocks linked to this goal) with quantity, current value, P&L
**And** if no transactions are linked yet, shows: "No transactions yet for this goal. Add one to track progress." + "Add Transaction" button (UX-11)

### Story 7.3: Implement goal projection calculator

As a user,
I want to see a projection for my goal under conservative (6%), moderate (8%), and optimistic (10%) return scenarios,
So that I can assess whether my current investment rate will meet the target.

**Acceptance Criteria:**

**Given** the Goal Detail page is open
**When** the projection section loads
**Then** it shows 3 scenario columns: Conservative (6%), Moderate (8%), Optimistic (10%)
**And** each scenario shows: projected corpus at target date, total invested, estimated gains
**And** an "On Track" or "Behind" indicator compares current monthly contribution to required monthly contribution
**And** if behind, suggests an increased monthly amount: "Increase monthly investment to ₹{amount} to stay on track."
**And** the projection uses the compound interest formula: FV = P × (((1 + r)^n - 1) / r)

### Story 7.4: Implement goal-to-transaction linking

As a user,
I want to link stock transactions to a goal when recording them,
So that the goal page reflects invested amount and progress accurately.

**Acceptance Criteria:**

**Given** the user records a buy transaction (Story 6.2)
**When** they select a goal from the optional goal selector
**Then** the transaction amount is attributed to the selected goal
**And** the goal's current amount updates to reflect the linked investment
**And** the Goal Detail page shows the linked transaction in the goal's holdings list
**And** multiple transactions can link to the same goal

### Story 7.5: Implement SIP calculator

As a user,
I want to project the future value of a monthly SIP in a stock or ETF,
So that I can plan my systematic investments.

**Acceptance Criteria:**

**Given** the user opens the SIP Calculator page
**When** they enter: monthly amount (₹), expected annual return (%), duration (years)
**Then** the SIP calculator computes: total invested, estimated returns, final corpus
**And** shows a scenario comparison view with 6%, 8%, 10% return scenarios
**And** shows a breakdown chart (Recharts) of principal vs gains
**And** the formula: FV = P × [((1 + r)^n - 1) / r] × (1 + r) where P = monthly amount, r = monthly rate, n = months
**And** results update in real-time as inputs change

---

## Epic 8: Portfolio Reviews & Drift

**Goal:** Enable the user to run periodic portfolio health checks with structured checklist covering drift, category exposure, role-fit, benchmark comparison, and alerts.

Depends on: Epic 1 (Dexie, shared components), Epic 6 (portfolio data), Epic 7 (goals). Delivers FR-22, FR-23, FR-24, FR-25, FR-26, FR-30.

### Story 8.1: Implement review checklist with guided steps

As a user,
I want a guided review checklist with 5 steps,
So that I run a complete portfolio health check without missing any analysis dimension.

**Acceptance Criteria:**

**Given** the user navigates to the Reviews page
**When** they start a new review
**Then** a 5-step checklist renders: (1) Drift Check, (2) Category Exposure Check, (3) Stock Role-Fit Assessment, (4) Benchmark Comparison, (5) Rationale / Outcome Review
**And** each step has: guidance text, computed data (or "computing..." spinner), input fields for user notes
**And** steps auto-fill where data is available
**And** each step can be individually completed/to-do
**And** the user can navigate between steps via prev/next and a step indicator
**And** on completion, the review is saved to Dexie `review` table with date and all step data

### Story 8.2: Implement drift analysis computation

As a user,
I want the review to compute allocation drift between current and target allocations,
So that I know which positions need rebalancing.

**Acceptance Criteria:**

**Given** the review is on Step 1 (Drift Check)
**When** the drift analysis computes
**Then** each portfolio holding shows: stock, current weight %, target weight %, drift % (absolute and percentage), status indicator (green "On Track" <5%, amber "Watch" 5-10%, red "Review" >10%)
**And** an aggregate portfolio drift score is displayed
**And** if no target allocations exist, default weight = 1/N (equal weight)

### Story 8.3: Implement category exposure check

As a user,
I want the review to flag when any sector exceeds my category cap,
So that I maintain sector-level diversification.

**Acceptance Criteria:**

**Given** the review is on Step 2 (Category Exposure)
**When** the exposure check computes
**Then** it shows each sector present in the portfolio: sector name, current exposure %, user-defined cap %, warning indicator
**And** flags sectors "Approaching cap" when >80% of the cap, "Exceeds cap" when over the cap
**And** sector caps are configurable per sector (default: 35%)
**And** if no caps are set, uses defaults from `userPreference`

### Story 8.4: Implement stock role-fit assessment

As a user,
I want the review to check if each stock still fits its assigned role,
So that I reassess positions that may have shifted character.

**Acceptance Criteria:**

**Given** the review is on Step 3 (Role-Fit)
**When** the role-fit assessment loads
**Then** each stock with an assigned role shows: stock name, current role (Core Hold / Growth Play / Dividend Income / Tactical), key metrics relevant to that role
**And** the user can record a verdict per stock: "Still Fits" / "Needs Re-evaluation" / "Exit"
**And** the user can add notes per stock
**And** if a stock has no role assigned, shows: "No role assigned. Set a role for this stock." (UX-11)

### Story 8.5: Implement benchmark comparison

As a user,
I want the review to compare each stock's trailing returns against its sector index or Nifty 50,
So that I identify underperformers.

**Acceptance Criteria:**

**Given** the review is on Step 4 (Benchmark Comparison)
**When** the comparison computes
**Then** each stock shows: 1Y trailing return, 3Y trailing return, 5Y trailing return, benchmark return (same periods), outperformance/underperformance gap (%)
**And** stocks that underperform by more than the configurable threshold (default: 5% over 1Y) are flagged
**And** the underperformance threshold is read from user settings (FR-38)
**And** if return data is insufficient, shows: "Insufficient price history for benchmark comparison"

### Story 8.6: Implement review alerts and standalone drift calculator

As a user,
I want review-related alerts on the Dashboard and a standalone drift calculator,
So that I'm reminded of upcoming reviews and can compute drift outside the full review workflow.

**Acceptance Criteria:**

**Given** a review is due (based on configured frequency)
**When** the Dashboard loads
**Then** an alert card shows: "Portfolio review due — last review {X} months ago" with "Start Review" button
**Given** the user opens the standalone Drift Calculator (FR-30)
**When** they enter current and target weights (or select a portfolio)
**Then** it computes drift per holding and overall portfolio drift score with the same status indicators as Story 8.2

---

## Epic 9: Investment Journal

**Goal:** Enable the user to record and browse investment journal entries linked to stocks, goals, and reviews.

Depends on: Epic 1 (Dexie, shared components). Delivers FR-27, FR-28.

### Story 9.1: Implement journal entry creation

As a user,
I want to write a journal entry for a stock with my investment thesis and reasoning,
So that I can revisit my decision rationale later.

**Acceptance Criteria:**

**Given** the user is on the Journal page or Stock Detail page
**When** they create a new journal entry
**Then** a form opens with fields: stock (autocomplete, pre-filled if from Stock Detail), title (text), body (textarea with Markdown support), role (Core Hold / Growth Play / Dividend Income / Tactical), exit trigger conditions (textarea), next review date (date picker), tags (text, comma-separated), optional goal link, optional review link
**And** on save, the entry is persisted in Dexie `journalEntry` table with timestamp
**And** the entry appears in the journal timeline
**And** Markdown body renders as formatted text in view mode

### Story 9.2: Implement journal timeline

As a user,
I want to see all my journal entries in a reverse-chronological timeline,
So that I can review my investment thinking over time.

**Acceptance Criteria:**

**Given** the Journal page loads
**Then** entries display in reverse-chronological order (newest first)
**And** each entry shows: date, stock name, title, body preview (first 200 chars), tags, role badge
**And** clicking an entry expands it to full view with formatted Markdown
**And** entries support inline edit (click to edit body text)
**And** entries can be deleted with confirmation dialog

### Story 9.3: Implement journal filtering and search

As a user,
I want to filter journal entries by stock, tag, role, and date range,
So that I find specific entries quickly.

**Acceptance Criteria:**

**Given** the Journal page is open
**Then** filter controls are available above the timeline: stock selector (dropdown), tag search (text input), role filter (checkboxes), date range (start/end date pickers)
**And** filters stack (AND logic)
**And** a text search searches entry titles and body text
**And** filter state is reflected in URL query parameters
**And** when no entries exist, shows: "No journal entries yet. Write your first investment note." + "Write Entry" button (UX-11)
**And** when filters match nothing, shows: "No entries match your filters." + "Clear filters" link

---

## Epic 10: Risk Profiling

**Goal:** Enable the user to complete a risk questionnaire, determine their risk profile and investment style, and handle first-run redirect.

Depends on: Epic 1 (Dexie, shared components, routing). Delivers FR-14, FR-15, AR-13.

### Story 10.1: Implement risk questionnaire flow

As a user,
I want to answer a risk questionnaire with at least 10 questions,
So that the app can determine my risk profile.

**Acceptance Criteria:**

**Given** the user navigates to the Risk Profiling page (or is redirected on first run)
**When** they answer the questionnaire
**Then** at least 10 questions are presented covering: financial situation, investment horizon, loss tolerance, stock-specific risk comfort (mid-cap/small-cap volatility), income stability, investment knowledge
**And** each question is a single-select (multiple choice)
**And** the user can navigate forward/backward
**And** a progress indicator shows "Question X of 10"
**And** incomplete answers are validated before proceeding

### Story 10.2: Implement risk profile result and storage

As a user,
I want to see my risk profile result immediately after completing the questionnaire,
So that I understand my investor profile.

**Acceptance Criteria:**

**Given** the user completes the questionnaire
**When** results compute
**Then** the risk profile is displayed: Conservative / Moderate / Aggressive with a description
**And** an investment style recommendation is shown: Growth / Value / Dividend / Blend
**And** the user can override the style recommendation
**And** the profile (risk level + style preference) is persisted in Dexie `userPreference` table
**And** subsequent app loads use the stored profile
**And** the user can retake the questionnaire from Settings

### Story 10.3: Implement first-run redirect to risk profiling

As a user,
I want to be automatically redirected to risk profiling on my first use,
So that I complete my profile before using the app.

**Acceptance Criteria:**

**Given** a user opens the app for the first time (no profile in IndexedDB)
**When** the app loads
**Then** an overlay/inline prompt shows: "Let's set up your investor profile. This helps personalize your experience."
**And** the user can "Start Profiling" or "Skip for now"
**And** if they skip, the app proceeds to Dashboard but shows a persistent banner: "Complete risk profiling for personalized scores."
**And** subsequent app opens with profile stored do NOT show the redirect

---

## Epic 11: Glossary & XIRR Calculator

**Goal:** Provide the user with an in-app glossary of financial terms with TermInfo tooltips, and an XIRR calculator for irregular cash flows.

Depends on: Epic 1 (routing, shared components). Delivers FR-35, FR-36, FR-37.

### Story 11.1: Implement glossary browser with 37+ pre-seeded terms

As a user,
I want to browse an alphabetical list of financial terms with definitions,
So that I can learn stock evaluation concepts.

**Acceptance Criteria:**

**Given** the user navigates to the Glossary page
**Then** an alphabetical list of 37+ financial terms is displayed
**And** each term shows: name, category (Valuation / Profitability / Financial Health / Growth / Ownership / Market / Strategy), definition
**And** the list is searchable by term name in real-time
**And** clicking a term expands to full definition view with: detailed explanation, example (numerical where applicable), "why it matters" context
**And** terms are seeded from the addendum.md glossary and the Stock Study Guide

### Story 11.2: Implement in-context TermInfo tooltips

As a user,
I want to see TermInfo tooltips when I encounter financial terms in scorecards and comparison tables,
So that I learn terminology without leaving the current view.

**Acceptance Criteria:**

**Given** any view that displays financial term labels (scorecard parameters, compare headers, framework steps)
**When** the user hovers or clicks the TermInfo icon (`ⓘ`) next to a term
**Then** a Popover opens showing: term name, category, definition, example, "why it matters"
**And** the Popover dismisses on click outside or Escape key (UX-17)
**And** TermInfo is implemented as a reusable component (Story 1.9)
**And** TermInfo is wired for all 17 scorecard parameters, all comparison table headers, and all framework step titles

### Story 11.3: Implement XIRR calculator

As a user,
I want to compute the XIRR of a set of irregular cash flows,
So that I can measure the annualized return of my stock investments.

**Acceptance Criteria:**

**Given** the user opens the XIRR Calculator page
**When** they enter a list of transactions (date + amount, negative for buys, positive for current value)
**Then** the system computes the annualized XIRR using the Newton-Raphson numerical method
**And** the result is displayed as a percentage to 2 decimal places
**And** the computation includes convergence safeguards: max 100 iterations, fallback to bisection method if NR diverges
**And** if computation fails to converge, shows: "Could not compute XIRR. Check your cash flow entries." + guidance
**And** the user can add/remove rows dynamically
**And** a "Clear All" button resets the form

### Story 11.4: Implement XIRR result visualization

As a user,
I want to see my XIRR computation visualized,
So that I understand the return distribution.

**Acceptance Criteria:**

**Given** the XIRR calculator has computed a result
**Then** a Recharts chart shows: cash flow timeline with bars (negative red, positive green)
**And** the XIRR percentage is displayed prominently below the chart
**And** summary stats shown: total invested, total returns, number of transactions, date range

---

## Epic 12: Settings & Data Management

**Goal:** Enable the user to configure review frequency, export/import data, and toggle theme.

Depends on: Epic 1 (Dexie, shared components, routing). Delivers FR-38, FR-39, FR-40, FR-41.

### Story 12.1: Implement review frequency configuration

As a user,
I want to set my portfolio review frequency to monthly or quarterly,
So that the app reminds me when a review is due.

**Acceptance Criteria:**

**Given** the user is on the Settings page
**When** they configure review frequency
**Then** they can select: Monthly or Quarterly via radio/button group
**And** the next review date auto-calculates based on the last review date + frequency
**And** the user can manually override the next review date with a date picker
**And** changes persist in Dexie `userPreference` table
**And** the Dashboard alert (FR-26) uses this frequency to trigger review reminders

### Story 12.2: Implement data export

As a user,
I want to export all my IndexedDB data as a JSON file,
So that I have a backup of my portfolio, goals, journal, and settings.

**Acceptance Criteria:**

**Given** the user is on the Settings page
**When** they click "Export Data"
**Then** a JSON file is generated containing all user data: portfolio holdings, transactions, goals, SIPs, journal entries, reviews, score snapshots, user preferences, watchlist
**And** the file downloads with a timestamped filename: `ssaa-export-2026-06-08.json`
**And** the file includes a version field for import validation
**And** stock cache data (quotes, fundamentals) is NOT included in the export

### Story 12.3: Implement data import

As a user,
I want to import a previously exported JSON file,
So that I can restore my data on a different device or after clearing IndexedDB.

**Acceptance Criteria:**

**Given** the user is on the Settings page
**When** they click "Import Data" and select a JSON file
**Then** the system validates: file format (valid JSON), version field present, required keys present
**And** if validation fails, shows: "Invalid file format. Please select a valid SSAA export file." with error details
**And** if validation passes, shows a confirmation dialog listing what will be imported (portfolio: X items, goals: Y items, etc.)
**And** on confirmation, existing data is replaced with imported data
**And** on success, shows: "Data imported successfully. {N} holdings, {M} goals, {P} journal entries restored."
**And** on error, shows a descriptive error message with no data loss (import is atomic or rolls back)

### Story 12.4: Implement theme toggle

As a user,
I want to switch between light and dark mode,
So that I can use the app comfortably in different lighting conditions.

**Acceptance Criteria:**

**Given** the user is on any page
**When** they toggle the theme (from Topbar or Settings)
**Then** the app switches between light and dark mode
**And** the preference is persisted in Dexie `userPreference` table
**And** on next app load, the saved theme is applied
**And** the theme toggle is accessible from both the Topbar (icon button) and Settings (radio/select)
**And** transition between themes is smooth (no flash)

### Story 12.5: Implement weight defaults configuration

As a user,
I want to view and reset my custom weight defaults from Settings,
So that I can manage my scoring preferences centrally.

**Acceptance Criteria:**

**Given** the user is on the Settings page
**When** they open the "Scoring Weights" section
**Then** current custom weights are displayed (if any) with "Factory Reset" button
**And** clicking "Reset to Defaults" clears custom weights and restores equal-weighted defaults
**And** a confirmation dialog appears before reset: "This will reset all parameter weights to default values."
