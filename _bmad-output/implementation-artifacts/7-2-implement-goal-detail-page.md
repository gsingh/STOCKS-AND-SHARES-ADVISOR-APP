## Story
**As a** retail investor,
**I want** to view the detail page for a specific goal,
**So that** I can see my progress, linked holdings, and track performance toward the target.

## Acceptance Criteria
1. **Goal Header**: Displays goal name, type badge (Emergency/Medium-Term/Long-Term/Custom), risk profile badge, and created date.
2. **Progress Bar**: Large progress bar showing currentAmount / targetAmount with percentage label and ₹ amounts.
3. **Target Info**: Target amount (₹), current amount (₹), target date, and days remaining (calculated).
4. **Days Remaining**: If past due date, show "Overdue by X days" in red; if within 30 days, show amber countdown.
5. **Linked Holdings List**: Table or list showing holdings linked to this goal: ticker, quantity, current value, P&L (₹ and %).
6. **Goal Summary Row**: Total invested across linked holdings, total current value, total P&L.
7. **Empty State**: If no transactions are linked to this goal, display "No linked transactions yet. Add transactions to track progress toward this goal."
8. **Edit Goal**: Button to edit goal details (opens create dialog in edit mode).

## Tasks / Subtasks
- [ ] Create `src/components/features/goals/goal-detail.tsx` component
- [ ] Build goal header with type and risk badges
- [ ] Build progress bar with percentage and ₹ amounts
- [ ] Compute days remaining with overdue/countdown coloring
- [ ] Build linked holdings list with key metrics
- [ ] Compute aggregate metrics for linked holdings
- [ ] Implement edit mode (reuse create form with pre-filled data)
- [ ] Handle empty state for no linked transactions
- [ ] Write co-located tests: `goal-detail.test.tsx`

## Dev Notes
- Route: `/goals/:goalId` via TanStack Router.
- Linked holdings fetched by filtering `holdings` table where `goalId === goal.id`.
- Days remaining = Math.ceil((targetDate - today) / (1000 × 60 × 60 × 24)).
- Progress bar: `<div>` with width = `${progressPercent}%` and conditional colour (green if >= 75%, amber if >= 50%, red if < 50%).
- Reuse `create-goal-dialog.tsx` by passing an existing goal for edit mode.

## Dev Agent Record
- **Component:** `goal-detail.tsx`
- **Data Flow:** Load goal by ID → load linked holdings → compute progress → render
- **Key States:** loading, loaded, not found, empty (no linked holdings)
- **Related Stores:** `useGoalStore`, `usePortfolioStore`
- **Related Services:** `db.ts` (goals table, holdings table)
