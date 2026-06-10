## Story
**As a** retail investor,
**I want** review-triggered alerts on my dashboard and a standalone drift calculator,
**So that** I stay informed about portfolio issues and can experiment with "what-if" allocation scenarios.

## Acceptance Criteria
1. **Dashboard Review Alerts**: Generate alerts for: review due (if no review in 90 days), drift flagged (any holding in "review" status), sector cap exceeded, role mismatch, benchmark underperformance.
2. **Alert Priorities**: Critical = sector cap exceeded + drift review; Warning = role mismatch + benchmark underperformance; Info = review due.
3. **Dismissible Alerts**: Each alert can be dismissed; dismissal persisted in Dexie.
4. **Alert Linking**: Each alert links to the relevant action (e.g., "Start Review", "Adjust Holdings", "Update Settings").
5. **Standalone Drift Calculator**: Separate dialog/page where user can input custom target allocations per holding and see the resulting drift analysis without affecting saved targets.
6. **Custom Allocation Input**: For each holding, a percentage input field for target weight; totals must equal 100% (validation error if not).
7. **Drift Results**: Shows computed drift per holding with status badges and aggregate drift score.
8. **Reset Button**: Reset to current weights or equal weight distribution.

## Tasks / Subtasks
- [ ] Create alert generation logic that runs on portfolio/review changes
- [ ] Integrate review alerts into dashboard alerts-section (story 5.3)
- [ ] Create `src/components/features/reviews/standalone-drift-calculator.tsx` component
- [ ] Build custom target allocation inputs per holding
- [ ] Implement total = 100% validation
- [ ] Compute and display drift results for custom allocations
- [ ] Implement reset to current / equal weight buttons
- [ ] Write co-located tests: `standalone-drift-calculator.test.tsx`

## Dev Notes
- Alert generation runs as a side effect when portfolio holdings change or when a review is completed.
- Alert data stored in Dexie `alerts` table with `type`, `severity`, `message`, `link`, `dismissed`, `createdAt`.
- Standalone drift calculator is read-only: it computes drift against user-entered targets without saving.
- Custom target inputs: number inputs with % suffix, validate that sum === 100.
- Reuse `drift-analysis.ts` pure function from story 8.2 for computation.
- Reset to current weight: fill inputs with each holding's current weight %.
- Reset to equal: fill inputs with (100 / count of holdings) each.

## Dev Agent Record
- **Component:** `standalone-drift-calculator.tsx` + alert integration
- **Data Flow:** Alert generation: portfolio/review change → evaluate conditions → upsert alerts. Drift calc: custom inputs → compute drift → render (no save)
- **Key States:** alert generation active, alerts rendered, drift calculator: input mode / results mode
- **Related Stores:** `useAlertStore`, `usePortfolioStore`, `useReviewStore`
- **Related Services:** `db.ts` (alerts table), `src/features/portfolio/drift-analysis.ts`
