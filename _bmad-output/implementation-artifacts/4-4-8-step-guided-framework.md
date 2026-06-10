## Story
**As a** retail investor,  
**I want** to follow a guided 8-step framework for evaluating a stock,  
**So that** I systematically analyze all aspects of a company before investing.

## Acceptance Criteria
1. **8-Step Framework Page**: A dedicated page/route (`/framework/:ticker`) with 8 numbered step cards.
2. **Step List**: The 8 steps are:
   1. **Business Model**: What the company does, revenue sources, business moat
   2. **Peer Comparison**: Compare key metrics with 2-3 peers
   3. **Financials**: Revenue, profit, cash flow trends (auto-populated from scorecard)
   4. **Profitability**: Margins, ROE, ROCE trends (auto-populated from scorecard)
   5. **Valuation**: P/E, P/B, EV/EBITDA with industry context
   6. **Balance Sheet**: D/E ratio, current ratio, pledge % (auto-populated from scorecard)
   7. **Governance**: Promoter holding, pledge, auditor qualifications
   8. **Liquidity**: Free float, volume, bid-ask spread
3. **Navigation**: Prev/Next buttons at the bottom of each step. Step 1 has no "Prev", Step 8 shows "Finish" instead of "Next".
4. **Progress Indicator**: A step progress bar at the top showing "3/8 complete" with filled/unfilled step circles.
5. **Data Persistence**: User-entered notes and selections for each step persist in Dexie (`frameworkData` table).
6. **Step Completion**: A step is marked complete when the user has filled in required fields. Steps with auto-populated data are pre-marked complete if data exists.
7. **Exit and Resume**: Leaving the page and returning restores the user's progress from Dexie.

## Tasks / Subtasks
- [ ] Create `src/components/features/framework/framework-page.tsx`
- [ ] Create 8 step components under `src/components/features/framework/steps/`
- [ ] Build progress indicator with step circles and completion status
- [ ] Implement Prev/Next/Finish navigation with form validation
- [ ] Persist framework data to Dexie `frameworkData` table (keyed by `ticker`)
- [ ] Load saved progress on mount and restore state
- [ ] Implement step completion logic (required fields filled)
- [ ] Wire route `/framework/:ticker` in TanStack Router
- [ ] Build loading state while persisted data loads

## Dev Notes
- Step 5 (Valuation) shows P/E, P/B, EV/EBITDA from fundamental data. The user can add industry average for comparison.
- Step 8 (Liquidity) shows free float %, average volume, and bid-ask spread from quote data.
- Steps 3, 4, 6 auto-populate from scorecard data — these are detailed in Story 4.6.
- Use a Zustand store `useFrameworkStore` with actions per step and persistence to Dexie.
- The framework data schema: `{ ticker, steps: [{ stepId, data, notes, completedAt }], updatedAt }`.

## Dev Agent Record
- **Component:** `framework-page.tsx`, `progress-indicator.tsx`, `step-nav.tsx`
- **Step Components:** `step-01-business-model.tsx` through `step-08-liquidity.tsx`
- **Stores:** `useFrameworkStore` (currentStep, stepData, setStepData, markComplete, saveProgress)
- **Persistence:** Dexie `frameworkData` table
- **Route:** `/framework/:ticker`
