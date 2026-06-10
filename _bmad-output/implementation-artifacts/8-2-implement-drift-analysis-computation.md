## Story
**As a** retail investor,
**I want** to see how much each holding has drifted from its target allocation,
**So that** I can rebalance my portfolio when allocations deviate significantly.

## Acceptance Criteria
1. **Per-Stock Drift**: For each holding, compute drift % = (current weight % - target weight %) / target weight % × 100.
2. **Target Weight Input**: User sets target allocation % per stock (or defaults to equal weight = 100 / number of holdings).
3. **Drift Statuses**: `on_track` (drift < 5% from target), `watch` (drift 5-10%), `review` (drift > 10%).
4. **Status Badges**: Green badge for on_track, amber for watch, red for review with appropriate icon.
5. **Aggregate Drift Score**: Portfolio-level drift score = weighted average of absolute drift % values, displayed as a percentage.
6. **Drift Summary**: Summary card showing total holdings on_track, watch, and review counts.
7. **Standalone Access**: Drift analysis can also be accessed outside the review flow via a "Drift Analysis" link in the portfolio page.

## Tasks / Subtasks
- [ ] Create `src/features/portfolio/drift-analysis.ts` — pure function for drift computation
- [ ] Create `src/components/features/reviews/drift-analysis-view.tsx` component
- [ ] Implement per-stock drift % calculation
- [ ] Implement drift status classification (< 5%, 5-10%, > 10%)
- [ ] Build drift summary card (on_track/watch/review counts)
- [ ] Compute aggregate portfolio drift score
- [ ] Build status badges with conditional coloring
- [ ] Implement target weight input (default equal weight)
- [ ] Write co-located tests: `drift-analysis.test.ts` and `drift-analysis-view.test.tsx`

## Dev Notes
- Current weight % = (holding current value / total portfolio value) × 100.
- Target weight %: user-configurable per holding, defaults to equal weight.
- Drift % = ((currentWeight - targetWeight) / targetWeight) × 100. Handle division by zero (if targetWeight = 0, drift is infinite = "review").
- Aggregate drift score = sum(abs(drift%) × currentWeight) / sum(currentWeight).
- Pure drift computation function goes in `src/features/portfolio/drift-analysis.ts` (no React dependency).

## Dev Agent Record
- **Component:** `drift-analysis-view.tsx`
- **Data Flow:** Load holdings → get target weights → compute drift % → classify status → render
- **Key States:** loading, computed (with results), no holdings (empty)
- **Related Stores:** `usePortfolioStore`
- **Related Services:** `src/features/portfolio/drift-analysis.ts`
