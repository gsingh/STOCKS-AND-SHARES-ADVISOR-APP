---
title: Stocks & Shares Advisor App
created: 2026-06-08
updated: 2026-06-08
status: final
---

# PRD: Stocks & Shares Advisor App

## 0. Document Purpose

This PRD defines the Stocks & Shares Advisor App (SSAA) — a single-page web application for Indian stock market research, scoring, portfolio management, and investment decision support. It is modeled after the existing Mutual Fund Advisor App (`Investor-adviser-app`) which the user relies on for mutual fund visualisation and analysis.

The PRD is structured with features grouped into sections, each with globally numbered FRs. Assumptions are tagged inline `[ASSUMPTION]` and indexed in §9. This document is the primary input for architecture design (`bmad-create-architecture`), UX specification (`bmad-ux`), and epic/story breakdown (`bmad-create-epics-and-stories`).

## 1. Vision

The Stocks & Shares Advisor App is a personal, browser-based research and portfolio management tool for direct equity investing on Indian markets (NSE/BSE). It translates the proven mental model of the Mutual Fund Advisor App to the stock domain, replacing MF-specific scoring factors (expense ratio, fund age, AUM, fund manager) with stock-specific fundamentals (17 parameters from the Stock Study Guide: P/E, ROE, ROCE, debt-to-equity, promoter holding, governance quality, and more).

The app helps the user make intelligent, data-driven stock investment decisions by:
- Scoring stocks across 17 quantitative and qualitative parameters with customisable weights
- Guiding through a structured 8-step comparison framework (business model → peer comparison → financials → profitability → valuation → balance sheet → governance → liquidity)
- Tracking a personal portfolio of stock holdings with transaction history and goal-linking
- Running periodic portfolio reviews with drift analysis, sector exposure checks, and stock-role-fit assessments
- Surfacing cross-parameter interplay warnings (e.g., high P/E paired with low growth, high promoter pledge paired with falling promoter holding)

All user data lives locally in IndexedDB (via Dexie), making the app a zero-backend, privacy-respecting personal finance tool. Live stock quotes are fetched from the free npm package `nse-bse-api`. Fundamental data (P/E, ROE, ROCE, debt-to-equity, promoter holding, margins, FCF, etc.) is automatically scraped from Screener.in (`screener.in/company/{slug}/`) and cached in IndexedDB. This combined approach provides comprehensive stock data at zero API cost.

## 2. Target User

### 2.1 Jobs To Be Done

- Research a stock systematically and decide whether to buy, hold, or sell
- Compare a shortlist of stocks across a consistent set of valuation and quality parameters
- Track my stock portfolio holdings and transactions without depending on a broker's interface
- Understand how my portfolio is allocated across sectors, market caps, and investment styles
- Know when my portfolio has drifted from its target allocation and which stocks to review
- Record my investment thesis and reasoning for each stock I own or watch
- Project whether my goal-based SIP investments in stocks/ETFs will meet their targets
- Learn and internalise stock evaluation concepts via an in-app glossary

### 2.2 Non-Users (v1)

See §5 Non-Users & Non-Goals. The app is not designed for day traders, broker-integrated trading, US/international markets, or derivatives trading.

### 2.3 Key User Journeys

- **UJ-1. Boss researches a stock before buying.**
  - **Persona + context:** Boss, a retail investor, hears about a stock (e.g., Tata Elxsi) from a peer. He opens the app to research it before committing capital.
  - **Entry state:** Authenticated session (or fresh load). Landed on the Dashboard.
  - **Path:**
    1. Opens the Stock Browser, searches for "Tata Elxsi".
    2. Taps the result to open the Stock Detail / Scorecard view.
    3. Sees the 17-parameter scorecard with auto-populated live data (price, market cap) and manually-entered fundamentals.
    4. Reads the interplay warnings section — notices high P/E with moderate growth, flagged as a caution.
    5. Taps "Compare" and selects 2-3 peers (Tata Motors, L&T Technology Services).
    6. Reviews the side-by-side comparison across all parameters.
    7. Opens the 8-Step Framework view, works through each step.
    8. Records a journal entry: "Strong moat in engineering services, high P/E justified by consistent growth, buying on dips."
    9. Goes back to Dashboard.
  - **Climax:** The scorecard and comparison give Boss enough confidence to decide "buy on dips" vs. "pass."
  - **Resolution:** Journal entry saved; stock is bookmarked for future reference.
  - **Edge case:** If the stock is not found in the free API, Boss enters the ticker manually or imports from a CSV.

- **UJ-2. Boss reviews his stock portfolio for the quarter.**
  - **Persona + context:** Boss has been holding 8-10 stocks across sectors and checks the app at the start of a new quarter.
  - **Entry state:** Dashboard shows an alert: "Portfolio review due — 2 weeks overdue."
  - **Path:**
    1. Taps the alert → navigates to the Reviews page.
    2. Review Checklist: Step 1 — Drift check. Sees that Infosys has drifted to 18% (target 12%), flagged "review."
    3. Step 2 — Category exposure. Sees IT sector at 45% (cap 35%), flagged "excessive."
    4. Step 3 — Stock role-fit. Checks if each stock still fits its assigned role (e.g., "HDFC Bank = core hold").
    5. Step 4 — Parameter re-check. Re-evaluates the 17-parameter scores, notices SBI's ROE dropped below 15%.
    6. Records the review with notes: "Trim Infosys, add pharma to balance IT exposure."
  - **Climax:** Completed review with actionable decisions recorded.
  - **Resolution:** Next review date set; alerts updated.

## 3. Glossary

Full glossary moved to addendum.md (37+ terms from the Stock Study Guide). Key categories covered: valuation ratios, profitability metrics, financial health, growth metrics, ownership indicators, market classification, investment styles, and app-specific concepts (scorecard, drift, review, role, watchlist).

## 4. Features

### 4.1 Stock Browser / Screener

**Description:** The entry point for stock discovery. Users can search stocks by name, ticker symbol, or sector. Results show key data at a glance (price, market cap, sector, P/E). Users can filter by: market cap category (Large/Mid/Small), sector, P/E range, ROE range, and score range. Data is fetched from free npm packages (nse-bse-api) for live quotes and supplemented with manually entered or imported fundamentals stored in IndexedDB. Realises UJ-1.

**Functional Requirements:**

#### FR-1: Search stocks

User can search stocks by name or ticker symbol. Search queries the local IndexedDB cache first, then falls back to the live API. Results are deduplicated by ticker.

**Consequences (testable):**
- Search returns results within 2 seconds for a partial name match
- Deduplication: same stock (by ticker) appears once regardless of source
- Search returns "No results" state with option to add manually

#### FR-1.1: Auto-fetch fundamentals from Screener.in

When a stock is viewed in the Scorecard, the system automatically fetches fundamental data from `screener.in/company/{slug}/` (where slug is derived from the stock name/ticker). Data scraped includes: market cap, P/E, P/B, ROE, ROCE, debt-to-equity, operating margin, net profit margin, EPS, dividend yield, book value, promoter holding, and free cash flow. Results are cached in IndexedDB with a configurable refresh interval (default 24 hours).

**Consequences (testable):**
- Scraping runs client-side (CORS proxy via Vite/nginx, same pattern as MF app's API proxies)
- If scraping fails (site down, rate-limited, HTML changed), app degrades gracefully with cached data
- User can manually trigger a refresh for any stock
- Cache timestamp shown on the Scorecard ("Data as of: 08 Jun 2026")

**Out of Scope:**
- FR-1.1 does not include real-time fundamental updates; fundamentals are quarterly, so daily refresh is sufficient

#### FR-2: Filter stocks

User can filter the stock list by: market cap category (Large/Mid/Small), sector, P/E range, ROE range, and score range.

**Consequences (testable):**
- Filters stack (AND logic)
- Each filter shows the count of matching stocks
- Reset all filters in one action

#### FR-3: Stock list with key metrics

Stock list displays: ticker, name, sector, current price, market cap, P/E ratio, ROE, and composite score (if scored). Realises UJ-1.

**Consequences (testable):**
- Columns are sortable ascending/descending
- User can tap a row → navigates to Stock Detail (Scorecard view)
- User can long-tap → add to comparison

**Feature-specific NFRs:**
- API calls to nse-bse-api are cached in IndexedDB for a minimum of 5 minutes to avoid rate limits
- Stock list paginated at 50 items per page

**Notes:**
- `[ASSUMPTION]` nse-bse-api npm package provides reliable price data for NSE/BSE stocks
- `[ASSUMPTION]` Screener.in scraping (client-side via CORS proxy) provides fundamental data; HTML structure may change and require maintenance
- `[ASSUMPTION]` We use Yahoo Finance (via yfinance or similar) as a fallback for quote data

---

### 4.2 17-Parameter Scorecard

**Description:** The core evaluation engine. Each stock is scored across 17 parameters derived from the Stock Study Guide. Each parameter is scored out of 20, with weights applied to produce a composite score out of 100. Parameters are grouped into categories: Valuation (P/E, P/B, PEG, Dividend yield), Quality (ROE, ROCE, Operating margin, Net margin), Financial Health (Debt-to-equity, FCF, Book value), Growth (Revenue growth, EPS growth), Ownership (Promoter holding, Pledged shares, Governance quality), and Size (Market cap). Users can customise weights; defaults are provided. The scorecard also cross-references the Sector Overlap Analysis (FR-31) — if a stock would push a sector over its cap, a portfolio-awareness note is shown on the scorecard. Realises UJ-1.

**Functional Requirements:**

#### FR-4: View stock scorecard

User opens the Stock Detail view and sees the full 17-parameter scorecard with individual scores, category scores, and the composite score. Realises UJ-1.

**Consequences (testable):**
- Each parameter shows: name, value, score (0-20), and a visual bar
- Categories are visually grouped with subtotals
- Composite score displayed prominently out of 100
- Colour coding: green (good), amber (caution), red (poor) per parameter

#### FR-5: Parameter interplay warnings

The system flags cross-parameter contradictions and warnings: high P/E with low growth (overvalued risk), high EV/EBITDA with low operating margin (overvalued without profitability), high pledge with falling promoter holding (distress signal), high ROE with high debt (leverage-driven ROE), high sector overlap with existing portfolio (concentration risk). A portfolio-awareness note is shown when the candidate stock's sector would push combined exposure over the user's sector cap (cross-references FR-31). Realises UJ-1.

**Consequences (testable):**
- Warnings section visible below scorecard
- Each warning has a severity level (info / caution / alert)
- Warnings include an explanation text

#### FR-6: Customise weights

User can adjust the weight of each parameter or parameter category. Changes persist in IndexedDB. Realises UJ-1.

**Consequences (testable):**
- Weights UI shows default values with slider/number input
- User resets to defaults in one action
- System normalises if weights don't sum to 100

**Out of Scope:**
- FR-6 does not include sharing weight presets between devices

#### FR-7: Score history

The system tracks scorecard snapshots over time. User can see how a stock's score changed across evaluation dates.

**Consequences (testable):**
- Score history shown as a timeline or line chart
- At minimum 5 most recent evaluations stored

**Feature-specific NFRs:**
- Score calculation must complete within 500ms client-side
- All scoring logic runs locally — no external compute

---

### 4.3 Stock Comparison

**Description:** Side-by-side comparison of 2-5 stocks across all 17 parameters. Visual comparison using bar charts and radar/spider charts. Highlights which stock leads on each parameter. Realises UJ-1.

**Functional Requirements:**

#### FR-8: Select stocks to compare

User can add stocks to the comparison from the Browser, Scorecard, or Portfolio views. Minimum 2, maximum 5 stocks.

**Consequences (testable):**
- Comparison page updates in real time as stocks are added/removed
- Clear all in one action

#### FR-9: Parameter comparison view

Side-by-side table: rows = parameters, columns = stocks, cells = values + scores. Visual highlighting for the best value per row.

**Consequences (testable):**
- Cells colour-coded: green = leader, amber = middle, red = laggard
- User can sort rows by any stock's score

#### FR-10: Visual comparison charts

Comparison data rendered as: bar chart (each parameter grouped by stock), radar/spider chart (multi-dimensional overview).

**Consequences (testable):**
- Radar chart shows all 17 parameters at once
- Bar chart allows per-parameter family drill-down
- Charts are interactive (hover to see values)

---

### 4.4 8-Step Comparison Framework

**Description:** A guided, step-by-step walkthrough implementing the 8-Step Comparison Framework from the Stock Study Guide (Business Model → Peer Comparison → Financials → Profitability → Valuation → Balance Sheet → Governance → Liquidity). Each step provides prompts, data fields, and scoring guidance. Step 5 (Valuation) explicitly covers P/E, P/B, and EV/EBITDA. Step 8 (Liquidity) covers free float, daily trading volume, and bid-ask spread thresholds. The framework is available as a view within the Scorecard and also as a standalone workflow for deep-dive research.

**Functional Requirements:**

#### FR-11: Step-by-step framework view

User opens the 8-Step Framework from the Scorecard or Navigator. Each step is a card/section with: title, guidance text, data fields specific to that step, and a completion toggle.

**Consequences (testable):**
- Steps are numbered 1-8
- User can navigate forward/backward
- Progress indicator shows X/8 complete
- Data entered persists locally
- User can jump to any step directly from a summary view

#### FR-12: Framework summary

A summary view that compiles all 8 steps into a one-page research report for the stock.

**Consequences (testable):**
- Summary is printable (print-friendly CSS)
- Summary can be exported as a text/markdown snippet

#### FR-13: Auto-populate framework data

Where the 17-parameter scorecard data overlaps with framework steps (e.g., Step 4 Profitability → ROE/ROCE from scorecard), the framework auto-populates.

**Consequences (testable):**
- Linked data updates when scorecard is refreshed
- User can override auto-populated values with manual entries

---

### 4.5 Risk Profiling

**Description:** An interactive questionnaire adapted for stock investing (similar to the MF app's risk profiler). Determines the user's risk profile (Conservative / Moderate / Aggressive) and preferred investment style (Growth / Value / Dividend / Blend). Captures monthly investment capacity, time horizon, and stock-specific risk tolerance (e.g., comfort with mid-cap/small-cap volatility).

**Functional Requirements:**

#### FR-14: Risk questionnaire

User answers a set of questions about financial situation, investment horizon, loss tolerance, and stock-specific risk comfort.

**Consequences (testable):**
- Minimum 10 questions
- Results computed immediately
- Profile stored in IndexedDB
- First-run redirect to /profiling if no profile exists

#### FR-15: Style preference

The questionnaire determines an investment style recommendation: Growth, Value, Dividend, or Blend, based on answers.

**Consequences (testable):**
- Style recommendation shown on results page
- User can override the recommendation

---

### 4.6 Financial Goals

**Description:** Goal-based investing with stock SIPs and lump-sum investments. Users create goals (Emergency / Medium-Term / Long-Term / Custom) with target amount, target date, risk profile, and preferred sectors. Project future value under conservative (6%), moderate (8%), and optimistic (10%) return scenarios.

**Functional Requirements:**

#### FR-16: Create goal

User creates a financial goal with: name, type, target amount, target date, current amount, risk profile, and sector preferences.

**Consequences (testable):**
- Goal saved to IndexedDB
- Status tracking: active / closed / paused

#### FR-17: Goal projection calculator

SIP/lump-sum projection for goal-linked stock investments. Shows gap analysis and suggests increasing the monthly investment.

**Consequences (testable):**
- Projection under 3 scenarios (conservative/moderate/optimistic)
- "On track" indicator based on current vs. required contribution
- Suggests increased monthly amount if behind target

#### FR-18: Link transactions to goals

Stock transactions can be linked to a goal. Goal detail page shows holdings summary and progress.

**Consequences (testable):**
- Transaction creation form includes optional goal selector
- Goal page shows total invested and current value

---

### 4.7 Portfolio Management

**Description:** Track personal stock holdings, buy/sell transactions, and portfolio allocation. View allocation by sector, market cap, and investment style. Realises UJ-2.

**Functional Requirements:**

#### FR-19: Add stock holding

User adds a stock to the portfolio with: ticker, quantity, average buy price, purchase date, and optional goal link. Realises UJ-2.

**Consequences (testable):**
- Holding saved to IndexedDB
- Current value calculated using live price
- P&L computed: absolute and percentage

#### FR-20: Record transactions

User records buy/sell transactions for portfolio stocks. Fields: date, type (Buy/Sell), quantity, price per unit, brokerage, notes, goal link.

**Consequences (testable):**
- Transaction list per stock with running total of units
- Sell transactions reduce holding quantity
- SIP transaction type supported (recurring buys)

#### FR-21: Portfolio allocation view

Visual breakdown of portfolio by sector, market cap category (Large/Mid/Small), investment style (Growth/Value/Dividend), and individual stock weight.

**Consequences (testable):**
- Pie charts for sector, market cap, and style allocation
- Each stock shows its weight percentage vs. target weight
- "Excessive" flag when a single stock > 15% weight (or user-set cap)

---

### 4.8 Portfolio Reviews

**Description:** Periodic portfolio health checks with structured checklist. Drift analysis, category exposure checks, stock role-fit assessment, and parameter re-evaluation. Generates alerts when review is due. Realises UJ-2.

**Functional Requirements:**

#### FR-22: Review checklist

Guided review with steps: drift check, category exposure check, stock role-fit assessment, benchmark comparison, rationale/outcome review. Realises UJ-2. The benchmark comparison step compares each stock's trailing returns (1Y, 3Y, 5Y) against its sector index or Nifty 50 benchmark. Underperformance beyond a configurable threshold (default: >5% below benchmark over 1Y) generates an alert.

**Consequences (testable):**
- Steps are numbered and trackable
- Each step has guidance text and input fields
- Review saved to IndexedDB with date
- Benchmark underperformance threshold configurable in Settings (default 5%)
- Underperformance detected per stock with % gap displayed

#### FR-23: Drift analysis

Computes percentage change between current allocation vs target allocation per stock. Statuses: on_track (< 5%), watch (5-10%), review (> 10%).

**Consequences (testable):**
- Drift % shown per stock in portfolio
- Colour-coded status indicator
- Aggregate portfolio drift score

#### FR-24: Category exposure check

Flags when any sector exceeds user-defined category cap. For example, IT sector at 45% when cap is 35%.

**Consequences (testable):**
- Auto-calculates sector exposure from portfolio holdings
- User-configurable caps per sector
- Warning when approaching cap (e.g., 80% of limit)

#### FR-25: Stock role-fit check

For each stock, user assigns a role (core hold, growth play, dividend income, tactical) and the review checks if the stock still fits that role based on current fundamentals.

**Consequences (testable):**
- Role stored per holding
- Review surfaces role-fit questions
- User records role-fit verdict (still fits / needs re-evaluation / exit)

#### FR-26: Review alerts

Dashboard alerts when review is due (based on configurable frequency: monthly/quarterly). Alerts for drift, excessive category exposure, role mismatches, and benchmark underperformance.

**Consequences (testable):**
- Alert card on Dashboard with actionable link
- Dismissible alerts
- Next review date tracked and displayed

---

### 4.9 Investment Journal

**Description:** Per-stock investment diary. Record why you bought a stock, your thesis, role in portfolio, exit triggers, and notes. Linked to portfolio holdings.

**Functional Requirements:**

#### FR-27: Create journal entry

User writes a journal entry for a stock. Fields: stock, title, body (thesis, reasoning), role, exit trigger conditions, next review date, tags.

**Consequences (testable):**
- Entry saved with timestamp
- Entries viewable per stock or globally
- Markdown-supported body

#### FR-28: Journal timeline

Chronological view of all journal entries. Filterable by stock, role, tag, date range.

**Consequences (testable):**
- Reverse chronological order
- Search by text
- Filter by stock tag

---

### 4.10 SIP Calculator

**Description:** Project future value of a Systematic Investment Plan in a stock or ETF. Enter monthly amount, expected return rate, and duration. Shows projected corpus, total invested, and estimated gains.

**Functional Requirements:**

#### FR-29: SIP projection

User enters: monthly amount, expected annual return (or uses scenarios: 6/8/10%), duration in years. System projects future value using compounding formula.

**Consequences (testable):**
- Results: total invested, estimated returns, final corpus
- Scenario comparison view
- Breakdown chart (principal vs. gains)

---

### 4.11 Drift Calculator

**Description:** Standalone tool (also integrated into Reviews) to calculate allocation drift between current and target.

**Functional Requirements:**

#### FR-30: Calculate drift

User selects a portfolio or custom allocation and enters current vs. target weights. System shows drift per stock and overall portfolio drift.

**Consequences (testable):**
- Drift per holding: absolute and percentage
- Three statuses: on_track / watch / review
- Portfolio-level drift score

---

### 4.12 Sector Overlap Analysis

**Description:** When considering a new stock, analyse its sector exposure overlap with existing portfolio holdings. Shows new combined exposure and overlap percentage.

**Functional Requirements:**

#### FR-31: Overlap analysis

User selects a candidate stock and sees its sector vs. current portfolio sectors. Overlap % and new combined exposure computed.

**Consequences (testable):**
- Results: overlap % with existing holdings
- New combined sector exposure if purchased
- Warning if new purchase would push sector over cap

---

### 4.13 Dashboard

**Description:** At-a-glance view of portfolio status. Shows portfolio value, top holdings, recent alerts, next review date, and quick actions.

**Functional Requirements:**

#### FR-32: Portfolio snapshot

Dashboard shows: total portfolio value, day change, total invested, total returns (absolute and %).

**Consequences (testable):**
- Values update on page load
- Summary cards for key metrics

#### FR-33: Active alerts

Shows review alerts, drift alerts, and category exposure alerts from the latest review cycle. Each alert is actionable (tap to navigate).

**Consequences (testable):**
- Alert priority ordering (high first)
- Dismiss action per alert
- Empty state when no active alerts

#### FR-34: Quick actions

One-tap navigation to: Add Stock, New Journal Entry, Start Review, New Comparison.

**Consequences (testable):**
- Floating action button or quick-bar
- Visible on Dashboard only

---

### 4.14 Glossary

**Description:** In-app financial terms glossary seeded from the Stock Study Guide (37+ terms). Searchable, with in-context tooltips via a TermInfo component.

**Functional Requirements:**

#### FR-35: Glossary browser

Alphabetical list of financial terms with definitions. Searchable by term name.

**Consequences (testable):**
- At minimum 37 terms pre-seeded
- Search filters in real-time
- Tap term → full definition view

#### FR-36: In-context tooltips

Terms used throughout the app are annotated with a hover/tap icon that shows a popover definition (TermInfo component).

**Consequences (testable):**
- Tooltips shown on scorecard parameter names
- Tooltips shown on comparison table headers
- Tap outside → dismiss

---

### 4.15 XIRR Calculator

**Description:** Extended Internal Rate of Return calculator for irregular cash flows in stock investments. Uses Newton-Raphson numerical method.

**Functional Requirements:**

#### FR-37: XIRR computation

User enters a list of transactions (date + amount, where buys are negative and current value is positive). System computes annualised XIRR.

**Consequences (testable):**
- Handles irregular dates and amounts
- Convergence safeguards (max iterations, fallback)
- Result as percentage to 2 decimal places

---

### 4.16 Settings

**Description:** App configuration: review frequency, data export/import, weight defaults, theme toggle.

**Functional Requirements:**

#### FR-38: Configure review frequency

User sets review frequency (Monthly, Quarterly). Next review date auto-calculated.

**Consequences (testable):**
- Changing frequency updates next review date
- Manual override of next review date

#### FR-39: Data export

User exports all IndexedDB data as a JSON file.

**Consequences (testable):**
- Export includes: portfolio, transactions, goals, journals, scores, settings
- Downloadable .json file

#### FR-40: Data import

User imports a previously exported JSON file to restore data.

**Consequences (testable):**
- Import replaces existing data (with confirmation dialog)
- Validation on import format

#### FR-41: Theme toggle

User switches between light and dark mode.

**Consequences (testable):**
- Toggle in Settings and/or Topbar
- Preference persisted in IndexedDB
- Dark mode uses CSS custom properties (same pattern as MF app)

---

### 4.17 Cross-Cutting NFRs

**Consequences (testable):**
- All calculations (score, XIRR, drift, SIP) complete within 500ms client-side
- App loads under 3 seconds on a typical broadband connection
- Offline-capable for all user-entered data (queries cached from API calls)
- IndexedDB operations are wrapped in try-catch with user-visible error messages
- `[ASSUMPTION]` Free npm packages for stock data may go down; app degrades gracefully with stale cached data
- `[ASSUMPTION]` Screener.in HTML structure may change; scraping logic is isolated in a single module for easy maintenance

## 5. Non-Users & Non-Goals (Explicit)

**Who this app is not for (v1):**
- Day traders or active intraday traders — the app is designed for fundamental research, not tick-level charting
- Users who want automated trading or broker integration — this is a research and tracking tool, not a trading terminal
- US/international market investors — v1 focuses exclusively on Indian markets (NSE/BSE)
- Options, futures, or derivatives traders

**What this app will not do:**
- **Not a trading platform** — no order placement, broker integration, or execution
- **No real-time streaming** — polling-based updates at most; no WebSocket stream
- **No options/futures/derivatives** — analysis limited to cash equity
- **No US/international markets in v1** — NSE/BSE only
- **No multi-user or sharing** — single-user, client-only app
- **No mobile native app** — responsive web SPA only; PWA support considered for v2
- **No AI/ML-based predictions** — scores and analysis are deterministic and rule-based
- **No PDF reporting** — print styles for the web view suffice in v1

## 6. MVP Scope

### 6.1 In Scope

All 16 features defined in §4 are in scope for MVP.

### 6.2 Out of Scope for MVP

- PWA (Progressive Web App) offline support beyond IndexedDB — defer to v2
- Multi-device sync via any backend — defer to v2
- Watchlist feature (separate from Portfolio) — defer to v2
- Import from broker CSV files — defer to v2
- News feed or sentiment analysis — defer to v2
- Technical analysis charts (candlestick, moving averages) — defer to v3
- Social/community features (shared watchlists, public notes) — never planned
- Mobile native apps (iOS/Android) — never planned

## 7. Success Metrics

**Primary:**
- **SM-1**: App usage frequency — Boss opens the app at least 3 times per week and uses it for actual investment decisions. Validates FR-1 through FR-41.

**Secondary:**
- **SM-2**: Data completeness — at least 10 stocks have complete 17-parameter data within 1 month of launch. Validates FR-4, FR-19.
- **SM-3**: Review adherence — portfolio reviews completed on schedule (monthly or quarterly) without reminder fatigue. Validates FR-22 through FR-26.

**Counter-metrics (do not optimize):**
- **SM-C1**: Time spent per session — this is a research tool, not a social app. Long sessions signal deep research, not poor UX. Do not optimise for session length reduction.

## 8. Open Questions

1. **Screener.in scraping stability**: Screener.in may change HTML structure or implement anti-scraping measures (CAPTCHA, rate-limiting). Need a fallback strategy — yfinance fundamentals API as backup, or manual override.
2. **API reliability**: How stable are the free npm packages (nse-bse-api) for production use? Need to evaluate and establish fallback strategy.
3. **Rate limiting**: What are the rate limits of the free quote API and Screener.in? Need to design caching/retry accordingly.
4. **Sector taxonomy**: Need to define the sector classification list for Indian markets (BSE/NSE sectors vs. AMFI-style grouping).
5. **Stock identifier scheme**: Using NSE symbol, BSE code, or ISIN as the canonical identifier? `[ASSUMPTION]` NSE symbol as primary key. Screener.in uses URL slugs (e.g., `reliance-industries` for RELIANCE) which need a mapping.

## 9. Assumptions Index

- `[ASSUMPTION]` nse-bse-api npm package provides reliable price data for NSE/BSE stocks (§4.1)
- `[ASSUMPTION]` Screener.in scraping (client-side via CORS proxy) provides fundamental data; HTML structure may change and require maintenance (§4.1)
- `[ASSUMPTION]` Yahoo Finance (via yfinance or similar) is used as a fallback for quote data (§4.1)
- `[ASSUMPTION]` NSE symbol as the canonical stock identifier throughout the app, with a slug mapping for Screener.in URLs (§8)
- `[ASSUMPTION]` Free API / scraping sources may go down; app degrades gracefully with stale cached data (§4.17)
- `[ASSUMPTION]` Screener.in scraping logic is isolated in a single module for easy maintenance when HTML changes (§4.17)
- `[ASSUMPTION]` The MF app's architecture (TanStack Router, Dexie, Tailwind CSS, shadcn/ui, Recharts) is directly reusable for the stock domain
- `[ASSUMPTION]` Dark mode implementation follows the same CSS custom properties pattern as the MF app
