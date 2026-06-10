# Reconciliation Report: PRD vs Investor-adviser-app (Reference)

| | |
|---|---|
| **Input name** | Investor-adviser-app (Reference) |
| **PRD path** | `prd-STOCKS-AND-SHARES-ADVISOR-APP-2026-06-08/prd.md` |
| **Date** | 2026-06-08 |

## Gap 1: Overlap is scored inside the scorecard, not just a standalone tool

The reference app's 23-factor Fund Scorecard includes **Overlap with Holdings** as a live scoring factor (`scorecard.ts:663`). When a candidate fund's top-10 holdings overlap with existing portfolio holdings, the score is reduced proportionally. The PRD isolates sector overlap to FR-31 (standalone tool in §4.12) and omits it from the 17-parameter Scorecard in §4.2. This means a stock that duplicates existing holdings will not get any score penalty on its scorecard, dissociating portfolio-awareness from stock research.

**Action**: Add an overlap/sector-concentration factor to the stock scorecard, or cross-reference FR-31 results in the scorecard view.

---

## Gap 2: Return-analytics depth in scoring (23 factors vs 17 parameters)

The reference app computes **23 scoring factors** including trailing returns at 1Y/3Y/5Y, since-inception, calendar-year returns, quarterly returns, and year-wise consistency (`scorecard.ts`, `yearwise-returns.ts`). The PRD defines 17 parameters with score history as "at minimum 5 most recent evaluations" (FR-7) — a flat snapshot approach. The reference's depth reveals consistency trends (beats benchmark in X% of rolling periods, drawdown recovery, up/down capture asymmetry) that the PRD silently drops. Some of these concepts translate to stocks (e.g., EPS consistency over 5 years, revenue growth volatility, drawdown from peak price).

**Action**: Specify return-analytics depth for stocks — trailing price returns, EPS growth consistency scoring, and historical drawdown should be explicit scoring inputs, not buried in "5 snapshots."

---

## Gap 3: Review checklist drops benchmark underperformance detection

The reference app's review engine detects "benchmark underperformance" as a distinct alert type alongside drift and role-mismatch (`review.ts:3`, README §Features). The PRD's FR-22 review checklist mentions "benchmark comparison" as one step but provides no consequence (no alert, no threshold, no actionable output). The PRD also lacks the `duplicate_exposure` alert type present in the reference (`review.ts:3`), relying only on category caps (FR-24).

**Action**: Define benchmark underperformance thresholds, alert generation, and add `duplicate_exposure` alert type to FR-26.

---

## Key Finding 4: Qualitative UX patterns the FR structure silently drops

| Pattern | Reference app | PRD treatment |
|---|---|---|
| **Glossary content model** | Each entry has `definition`, `example`, `whyMatters` fields rendered in popovers (`TermInfo.tsx`) | FR-35/36 describe glossary + tooltips but no structured content model — risk of underspecified glossary UX |
| **TermInfo component** | `Popover`-based in-context tooltip with rich layout (definition body, example callout, why-matters accent bar) | FR-36 says "hover/tap icon that shows popover definition" — misses the richer layout pattern |
| **First-run redirect** | AppShell auto-redirects to `/profiling` if no risk profile exists (`AppShell.tsx:38-44`) | FR-14 mentions "First-run redirect to /profiling" — covered but worth preserving |
| **Toast/notification system** | Wraps app in `ToastProvider` for transient messages | No mention of toast system in PRD — alerts (FR-33) use persistent cards only |
| **Sidebar nav structure** | 9-item collapsible sidebar with icons + mobile sheet drawer (`Sidebar.tsx`) | Not specified in PRD — architecture/UX will need to define this |
| **Dark mode via CSS custom properties** | Uses Tailwind dark mode with custom CSS properties | FR-41 says "CSS custom properties (same pattern as MF app)" — adequate |

These are not blockers but represent established UX patterns in the reference that the PRD's functional-requirements structure may not carry forward unless explicitly noted.

---

## Summary

| # | Gap | Severity | Impact |
|---|---|---|---|
| 1 | Overlap not scored inside scorecard | Medium | Dissociates portfolio-awareness from stock research |
| 2 | Return-analytics depth underspecified | Low-Medium | Scorecard may miss consistency trends |
| 3 | Benchmark underperformance not actionable | Low | Review engine loses a known detection pattern |
| 4 | Qualitative UX patterns silently dropped | Low | Risk of diverging from reference UX conventions |
