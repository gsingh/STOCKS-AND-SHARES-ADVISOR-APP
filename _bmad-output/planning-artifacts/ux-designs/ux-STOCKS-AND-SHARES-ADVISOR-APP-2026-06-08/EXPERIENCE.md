---
name: STOCKS-AND-SHARES-ADVISOR-APP
status: final
sources:
  - {planning_artifacts}/prds/prd-STOCKS-AND-SHARES-ADVISOR-APP-2026-06-08/prd.md
  - {planning_artifacts}/prds/prd-STOCKS-AND-SHARES-ADVISOR-APP-2026-06-08/addendum.md
  - {planning_artifacts}/architecture.md
updated: 2026-06-08
---

# Stock & Shares Advisor — Experience Spine

## Foundation

Single-surface responsive web. shadcn/ui on Vite + React 19 + Tailwind CSS 4. DESIGN.md is the visual identity reference; this spine is the experience — behavioral specs, IA, interactions, accessibility, key flows.

The app inherits shadcn/ui defaults wholesale. Brand-layer deltas (primary navy, forest green accent, Inter + JetBrains Mono typography, dark mode) are specified in DESIGN.md. The app mirrors the layout patterns of the reference Mutual Fund Advisor App: App Shell (sidebar + topbar + content), sidebar collapses at 768px, Sheet on mobile.

Single-user, zero-backend. All user data persisted in Dexie (IndexedDB). Stock data sourced from nse-bse-api (quotes) and Screener.in scraping (fundamentals), wrapped in DataEnvelope&lt;T&gt; with freshness metadata.

## Information Architecture

| Surface | Route | Reached from | Purpose |
|---|---|---|---|
| Dashboard | `/` | App open | Market summary (indices, gainers/losers), watchlist, alerts, Discover CTA |
| Stock Browser | `/stocks` | Sidebar nav | Search and filter NSE/BSE stocks, paginated results with score badges |
| Stock Detail | `/stocks/$symbol` | Browser row click, watchlist | Scorecard (17-param), fundamentals, price chart, corporate actions, journal entries |
| Compare | `/compare` | Sidebar nav, Stock Detail | Select up to 4 stocks, 8-step comparison framework, side-by-side parameter table |
| Portfolio | `/portfolio` | Sidebar nav | Holdings, sector allocation donut, transactions, goal breakdown, overlap warning |
| Goals | `/goals` | Sidebar nav | Goal cards with progress bars |
| Goal Detail | `/goals/$goalId` | Goal card click | Progress, SIP calculator, allocation drift |
| Reviews | `/reviews` | Sidebar nav | Alert list, periodic review checklist |
| Journal | `/journal` | Sidebar nav | Timeline of investment journal entries linked to stocks/goals/reviews |
| Watchlist | `/watchlist` | Sidebar nav, Dashboard widget | Full watchlist: grouped stocks, price changes, score trends |
| Settings | `/settings` | Sidebar nav | Review frequency, data export/import, theme |
| Glossary | `/glossary` | Sidebar nav | Full glossary of 44 terms with search |

Sidebar collapses to icons at 768px, becomes Sheet on mobile. Modals stack one level deep (dialog on top of a surface, never dialog-on-dialog).

## Voice and Tone

Microcopy. Brand voice in DESIGN.md. Manager-facing counts and verbs; same tone regardless of user type.

| Do | Don't |
|---|---|
| "Score: 78/100 — Strong buy" | "This stock scored 78 points out of a possible 100!" |
| "3 stocks in watchlist" | "You have 3 watchlisted equities 🚀" |
| "Portfolio down 2.3% today" | "Your investments experienced a negative daily return" |
| "No stocks match your filter" | "No results found. Please try different search criteria." |

Microcopy is direct, numeric, avoids financial jargon where possible. Use TermInfo popovers for unavoidable jargon (P/E, ROE, etc.). 

## Component Patterns

Behavioral. Visual specs in DESIGN.md.Components or shadcn defaults.

| Component | Use | Behavioral rules |
|---|---|---|
| Stock row | Browser, Watchlist | Click anywhere opens Stock Detail. Score badge (color-coded) and current price shown. Hover reveals quick-actions (add to watchlist, compare). |
| Scorecard panel | Stock Detail | Shows composite score (0-100) as large bold number, color-coded (>=70 green, >=50 amber, <50 red). 17 parameter rows: label with TermInfo, score (0-20) color-coded green (>=15)/amber (>=10)/orange (>=5)/red (<5), contribution bar, weighted value, explanation. |
| Comparison table | Compare | Side-by-side columns (up to 4 stocks). Rows grouped by parameter category. Winner highlighted green per row. 8-step framework summary at top with overall leader. |
| Market summary | Dashboard | Indices row (Nifty 50, Sensex) with change %. Gainers/losers lists (compact). FreshnessBadge showing staleness. |
| Watchlist card | Dashboard | Compact list of watched stocks with price, change %, score badge. |
| Portfolio donut | Portfolio | Recharts PieChart donut. Sector allocation. Hover or click slice filters holdings table below. |
| Goal card | Goals | Progress bar, target amount, current amount, target date. Color-coded progress. |
| Transaction row | Portfolio | Date, stock, type (buy/sell), quantity, price, total. |
| Journal entry | Journal | Timestamp, linked stock/goal/review, body text. Inline edit. |
| Alert card | Dashboard, Reviews | Severity icon (critical/warning/info), title, description, action button. |
| FreshnessBadge | Any data display | Green dot (within TTL), yellow (2x TTL), red (expired), gray (missing/never fetched). Color + text label for accessibility. |
| Score contribution bar | Scorecard panel | Horizontal bar per parameter, width proportional to weighted contribution. Color-coded by score tier (green >=15, amber >=10, orange >=5, red <5). Animates on initial render. |
| Chart palette | Compare, Stock Detail, SIP Calculator | 4-color sequence for line charts: green, blue, amber, red. Donut charts use 10-color extended palette. Consistent across all visualizations. |
| TermInfo | Scorecard, Compare, Glossary | Popover on hover/click showing definition, example, "why it matters" for financial terms. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Cold app load | Any | shadcn Skeleton rows (4-6) matching expected layout. Resolves on data. |
| Stock search loading | Browser | Skeleton result rows (6). |
| Stock detail loading | Stock Detail | Skeleton: scorecard area (4 parameter skeletons), chart area (rectangular skeleton). |
| Comparison loading | Compare | Skeleton cards for each stock column. |
| Empty watchlist | Watchlist | "No stocks watched yet. Browse stocks to add your first." + "Browse Stocks" button. |
| Empty portfolio | Portfolio | "No holdings yet. Add your first transaction." + "Add Transaction" button. |
| Empty goals | Goals | "No goals set. Create a goal to start tracking." + "Create Goal" button. |
| Empty journal | Journal | "No journal entries yet. Write your first investment note." + "Write Entry" button. |
| No search results | Browser | "No stocks match '{query}'. Try a different name or symbol." + "Clear filters" link. |
| Data stale | Stock Detail, Dashboard | FreshnessBadge shows yellow/red. Data still displayed with staleness indicator. |
| Data source error | Stock Detail | "Couldn't fetch fundamentals for {symbol}. Using cached data from {date}." + Retry button. |
| Offline | Global | Single toast: "You're offline. Cached data shown with staleness indicators." Local writes continue. |
| First-time user | Any (via profiling redirect) | Auto-redirect to risk profiling if no profile exists. Same as MF app pattern. |
| Empty dashboard | Dashboard | "No stocks watched. Browse stocks to add your first watchlist entry." + "Browse Stocks" button. Market summary still shows if index data available. |
| Empty goal detail | Goal Detail | If goal exists but no progress data, show skeleton with progress bar at 0%. "No transactions yet for this goal. Add one to track progress." + "Add Transaction" button. |
| Reviews loading | Reviews | Skeleton for alert list (3-4 rows) and checklist steps. Checklist auto-fill computation shows spinner per step. |
| Empty reviews | Reviews | "No reviews scheduled. Set a review frequency in Settings." + "Go to Settings" button. |
| Reviews error | Reviews | "Couldn't compute review data. Using last saved state." + Retry button per failed step. |
| Settings load | Settings | Skeleton for frequency buttons and data management section. |
| Glossary load | Glossary | Search input immediately available. Term list shows skeleton pills while loading. |
| Empty glossary | Glossary | "No terms match your search." + "Clear search" link (same as browser no-results pattern). |

## Interaction Primitives

**Mouse-primary.** Priya uses laptop in evenings. Click to navigate, click to act.

- Click stock row → opens Stock Detail (route navigation)
- Click + on watchlist → add stock to watchlist
- Click score parameter → expands detail with TermInfo popover
- Click compare checkbox → adds to compare tray
- Hover on donut slice → tooltip with sector name + % allocation
- Click donut slice → filters holdings table below

**Keyboard:**
- Tab order matches reading order on every surface
- Enter/space activates focused elements
- Escape closes dialogs, popovers, sheets
- Arrow keys navigate within select/dropdown components
- / focuses search in Browser

**Banned:** infinite scroll (pagination only), drag-to-reorder in v1, hover-only affordances on mobile, modal stacks >1 deep.

## Accessibility Floor

Behavioral. Visual contrast in DESIGN.md (inherits shadcn's WCAG AA-compliant defaults).

- WCAG 2.2 AA across responsive web surface.
- Screen reader announces page surface on navigation: "Dashboard, market summary and watchlist" / "Stock Detail, {symbol name}, score {score}".
- Tab order matches reading order. Escape always closes topmost modal/popover.
- Score colors (green/amber/orange/red) accompanied by text labels ("Strong", "Average", "Below Average", "Weak") for color-blind users.
- FreshnessBadge uses both color and shape (dot + text label).
- Focus rings inherit shadcn ring token — visible at AA contrast against background.
- All chart data available in table form below chart for screen reader access.
- Form validation errors announced via aria-live regions.

## Key Flows

### Flow 1 — Morning discovery (Priya, retired, evening on laptop)

1. Priya opens the app. Dashboard loads: market summary (Nifty up 0.4%), her watchlist showing 3 stocks with green freshness dots, an alert card: "HDFC Bank score changed from 72 to 78."
2. She clicks the alert. It takes her to HDFC Bank Stock Detail. The scorecard shows 78/100 with 17 parameters. Promoter Holding is green (18/20). She hovers the TermInfo icon — it explains why high promoter holding matters.
3. She clicks "Compare" in the action bar. Compare view opens with HDFC Bank already selected. She adds ICICI Bank and Kotak Mahindra Bank from the search dropdown. The 8-step framework highlights HDFC Bank as the overall leader.
4. **Climax:** She scrolls down the comparison table. ICICI Bank wins on P/E and debt-to-equity. HDFC Bank wins on ROE and promoter holding. The tiebreaker at the bottom gives HDFC Bank the edge. She clicks "Add to Watchlist" on HDFC Bank and writes a quick journal entry: "Strong fundamentals, good for long-term hold. Consider ICICI for value play."
5. She returns to Dashboard. Watchlist now shows 4 stocks. She closes the laptop.

Failure: Screener.in scrape fails for HDFC Bank fundamentals → Stock Detail loads with stale data and yellow FreshnessBadge. Priya sees "Using data from yesterday" notice and chooses to proceed or retry. Journal entry saves locally regardless.

### Flow 2 — Quarterly review (Priya, Sunday afternoon)

1. Priya opens the app and sees a yellow alert on Dashboard: "Quarterly review due. Last review: 3 months ago."
2. She clicks "Start Review" which takes her to Reviews → Checklist. The 5-step checklist auto-fills: sector drift (portfolio 90% banking), score changes (HDFC Bank 78→74, ICICI 71→73), benchmark comparison (both outperformed Nifty 50).
3. Step 3 — Goal alignment: Her goal "Retirement Corpus Growth" shows 12% progress, slightly behind target. The checklist flags this.
4. **Climax:** On Step 4 — Rationale, she adds a note: "Banking concentration too high. Add IT and pharma exposure next quarter." She completes the review. The app schedules the next review in 3 months.
5. She opens Portfolio. The donut shows 90% banking with an overlap warning badge. She clicks it. The Overlap Detector dialog shows: "HDFC Bank and ICICI Bank share 70% sector overlap. Consider diversifying." She nods — her review note already captured this.
6. She closes satisfied: one clear action item, captured in the system.

Failure: Checklist auto-fill fails to compute sector drift because portfolio data is incomplete → Step 1 shows spinner with error: "Couldn't compute sector drift. Check portfolio holdings." Remaining 4 steps still load from cached data. Review saves with partial data.

## Responsive & Platform

| Breakpoint | Behavior |
|---|---|
| &gt;=1024px (lg) | Sidebar expanded (260px). Dashboard 2-column: market summary + watchlist. Stock Detail 2-column: scorecard + chart. Compare: side-by-side columns. |
| 768-1023px (md) | Sidebar collapsed to icons (64px) with tooltips. All surfaces single-column. |
| &lt;768px (sm/mobile) | Sidebar becomes Sheet from left. Comparison stacks vertically. Tables scroll horizontally. |

Desktop-primary. Functional on mobile for read + simple actions, but the primary surface is laptop/desktop given data density of scorecards and comparison tables.

## Inspiration & Anti-patterns

- **Lifted from MF app (reference):** App Shell layout, sidebar navigation, card-based information architecture, TermInfo pattern, dashboard alert system, review checklist workflow, empty state pattern (icon + message + CTA), score visualization (color-coded contribution bars), en-IN formatting.
- **Rejected — Gamification:** No streaks, badges, or achievement notifications. Stock investing is serious; the tool treats it that way.
- **Rejected — Real-time streaming:** Quotes are polled, not streamed. FreshnessBadge communicates this transparently.
- **Rejected — Chat/AI assistant:** v1 is a research tool, not a conversation. Priya reads, compares, decides — the app doesn't tell her what to do.
- **Rejected — Social features:** No sharing, no community portfolios. Private tool for individual investors.

## Invented Sections

(none)
