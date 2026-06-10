## Story
**As a** retail investor,  
**I want** to see warnings when certain parameter combinations indicate potential risks,  
**So that** I am alerted to red flags that a single-parameter view might miss.

## Acceptance Criteria
1. **Parameter Interplay Section**: A dedicated section titled "Parameter Interplay" appears below the scorecard on the Stock Detail page.
2. **Five Checks**: The system performs 5 interplay checks:
   - **High P/E + Low Growth**: P/E > 50 AND revenue growth < 5% → alert
   - **High Pledge + Falling Promoter Holding**: Pledge > 30% AND promoter holding down YoY → caution
   - **High ROE + High D/E**: ROE > 20% AND D/E > 1.5 → caution
   - **High EV/EBITDA + Low Margin**: EV/EBITDA > 20 AND net margin < 8% → alert
   - **Sector Overlap**: Stock belongs to a sector where 3+ other portfolio stocks also belong → info
3. **Severity Levels**: Each check has a severity with matching icon and color:
   - `info` (blue, ℹ️): Informational observation
   - `caution` (amber, ⚠️): Potential risk to monitor
   - `alert` (red, 🚩): Significant red flag
4. **Check Detail**: Each warning shows the check title, severity badge, a one-line explanation, and the specific values that triggered it.
5. **Empty State**: When no checks trigger, show "No parameter interplay issues detected" with a checkmark icon in muted text.
6. **Loading State**: Skeleton placeholders matching warning card layout while data loads.

## Tasks / Subtasks
- [ ] Create `src/components/features/scorecard/interplay-warnings.tsx`
- [ ] Implement 5 interplay check functions in `src/features/scoring/interplay-checks.ts`
- [ ] Build warning card component with severity icon, title, explanation, values
- [ ] Implement empty state rendering
- [ ] Build loading skeleton matching warning cards
- [ ] Wire interplay section into Stock Detail below scorecard
- [ ] Write unit tests for each interplay check function with edge cases

## Dev Notes
- The "Sector Overlap" check currently only checks against the compare tray stocks (Story 4.1). Future: check against user's watchlist/portfolio.
- Threshold values are initial defaults. Story 3.3 allows customization of thresholds in a future iteration.
- Each check function returns `null` if no issue, or `{ severity, title, explanation, values }` if triggered.
- The interplay section is pure presentation — it does not affect the composite score.

## Dev Agent Record
- **Component:** `interplay-warnings.tsx`, `interplay-check-card.tsx`
- **Logic:** `src/features/scoring/interplay-checks.ts` (5 pure functions)
- **Data Flow:** Scorecard params → interplay checks → warning list → render
- **Stores:** `useScorecardStore` (fundamentalData)
