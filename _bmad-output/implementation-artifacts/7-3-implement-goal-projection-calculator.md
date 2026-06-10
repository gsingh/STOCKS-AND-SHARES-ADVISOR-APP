## Story
**As a** retail investor,
**I want** to see future value projections for my goal under different return scenarios,
**So that** I can assess whether I'm on track and adjust my savings accordingly.

## Acceptance Criteria
1. **Three Scenarios**: Cards for conservative (6% p.a.), moderate (8% p.a.), and optimistic (10% p.a.) return projections.
2. **Projection Calculation**: Uses goal's currentAmount, monthly contribution (user input), years remaining, and scenario return rate to compute future value via compound interest formula.
3. **Gap Analysis**: For each scenario, shows: projected corpus, target amount, gap (target - projected), and a "Shortfall" or "Surplus" label.
4. **On Track Indicator**: Green checkmark + "On track" if projected corpus ≥ target amount; red "Behind" otherwise.
5. **Suggested Increase**: If behind, shows the additional monthly amount needed to close the gap under the moderate scenario.
6. **Monthly Contribution Input**: User can adjust the monthly contribution amount to see updated projections in real-time.
7. **Years Remaining**: Automatically computed from target date; shown prominently.

## Tasks / Subtasks
- [ ] Create `src/components/features/goals/goal-projection.tsx` component
- [ ] Implement future value formula: FV = P × ((1 + r)^n - 1) / r × (1 + r) + currentAmount × (1 + r)^n
- [ ] Build 3 scenario cards with projection results
- [ ] Implement gap analysis (surplus/shortfall)
- [ ] Implement "On track" / "Behind" indicator
- [ ] Implement suggested additional monthly amount calculation
- [ ] Build monthly contribution input with real-time update
- [ ] Write co-located tests: `goal-projection.test.tsx`

## Dev Notes
- Future value formula for SIP: FV = P × [((1 + r)^n - 1) / r] × (1 + r) where P = monthly contribution, r = monthly rate (annual/12), n = months remaining.
- Add lump sum growth: currentAmount × (1 + r)^n.
- Suggested increase: use goal seek to find the monthly contribution that makes projected corpus = target amount.
- Monthly rate: r = scenarioRate / 12 / 100.
- Number of months: n = yearsRemaining × 12.
- Display currency in en-IN format.

## Dev Agent Record
- **Component:** `goal-projection.tsx`
- **Data Flow:** Load goal → compute years remaining → user enters monthly contribution → compute 3 scenarios → render with gap analysis
- **Key States:** loading, computed (with results), no goal found
- **Related Stores:** `useGoalStore`
- **Dependencies:** custom financial math utilities (pure functions in `src/features/`)
