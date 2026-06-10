## Story
**As a** retail investor viewing a stock's detail page,  
**I want** to see a comprehensive scorecard with 17 parameters organized into 6 categories and a composite score,  
**So that** I can quickly evaluate a stock's overall quality at a glance.

## Acceptance Criteria
1. **Composite Score**: A large, prominent composite score (0–100) is displayed at the top of the scorecard panel, color-coded: green (≥70), amber (≥50), orange (≥30), red (<30). The score is also shown as a circular progress ring.
2. **Six Categories**: Parameters are grouped into 6 categories: Business Quality, Financial Health, Profitability, Valuation, Management & Governance, and Liquidity & Technicals.
3. **17 Parameters**: Each parameter displays: label with TermInfo hover icon (ℹ️), current value, score (0–20), a horizontal contribution bar showing weight toward the composite score, and a tier label ("Excellent", "Good", "Fair", "Poor").
4. **Color Coding**: Each parameter score has a color: green (`#2E8B57`) for ≥15, amber (`#D97706`) for ≥10, orange (`#F97316`) for ≥5, red (`#DC2626`) for <5. The contribution bar and tier label use the same color.
5. **Animated Contribution Bar**: Each parameter's contribution bar animates from width 0 to its target width using CSS transition (`transition: width 0.6s ease-out`) triggered on render.
6. **Empty/Loading State**: While fundamental data loads, a skeleton matching the scorecard layout is displayed. If no data exists, show "No score data available. Trigger a data fetch to evaluate this stock."
7. **Staggered Animation**: Parameter bars animate in sequence with a 50ms stagger delay per row for a polished reveal effect.

## Tasks / Subtasks
- [ ] Create `src/components/features/scorecard/scorecard-panel.tsx`
- [ ] Build composite score circular ring component with color
- [ ] Create parameter row component (label, value, score, bar, tier)
- [ ] Implement TermInfo icon with tooltip/popover component
- [ ] Add CSS transition for contribution bar width animation
- [ ] Implement stagger animation with `animation-delay` per row
- [ ] Build loading skeleton for scorecard layout
- [ ] Build empty state when no fundamental data is available
- [ ] Integrate scorecard into Stock Detail page
- [ ] Write unit tests for score calculation and color thresholds

## Dev Notes
- The 17 parameters and 6 categories are defined in the scoring engine (`src/features/scoring/`) from Epic 1.
- Composite score = sum of (parameter score × parameter weight) across all 17 params, normalized to 0–100.
- TermInfo shows a brief explanation of each parameter (e.g., "Pledged percentage of promoter holdings" for Pledge %).
- Use `IntersectionObserver` to trigger the animation only when the scorecard enters the viewport.

## Dev Agent Record
- **Component:** `scorecard-panel.tsx`, `score-ring.tsx`, `score-parameter-row.tsx`, `term-info.tsx`
- **Data Flow:** `useStockStore.selectedStock` → scoring engine → computed params → render
- **Services:** `ScoringService.getScorecard(ticker)`
- **Stores:** `useScorecardStore` (params, compositeScore, loading)
- **Animations:** CSS `transition` on `width`, stagger via `animation-delay` inline styles
