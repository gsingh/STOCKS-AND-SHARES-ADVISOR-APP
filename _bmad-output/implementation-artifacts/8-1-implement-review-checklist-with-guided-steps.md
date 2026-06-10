## Story
**As a** retail investor,
**I want** a guided portfolio review checklist with 5 steps,
**So that** I can systematically evaluate my portfolio health and make informed decisions.

## Acceptance Criteria
1. **5 Guided Steps**: Drift Check, Exposure Check, Role-Fit, Benchmark Comparison, Rationale — each displayed as a step in a stepper/progress indicator.
2. **Step Navigation**: "Next" and "Previous" buttons to move between steps; step indicator shows current step (e.g., "Step 2 of 5").
3. **Step 1 – Drift Check**: Shows drift analysis results (from story 8.2) per holding with status badges (on_track/watch/review). User can add notes per holding.
4. **Step 2 – Exposure Check**: Shows sector exposure results with cap warnings (from story 8.3). User can acknowledge each warning.
5. **Step 3 – Role-Fit**: Shows role-fit assessment results (from story 8.4) per holding. User can confirm or override the verdict.
6. **Step 4 – Benchmark Comparison**: Shows benchmark comparison results (from story 8.5). User can add notes for underperforming holdings.
7. **Step 5 – Rationale**: Free-form textarea for overall review rationale, key takeaways, and action items.
8. **Save Review**: On completion, the entire review state (step results + notes) is saved to Dexie `reviews` table with the current date.

## Tasks / Subtasks
- [ ] Create `src/components/features/reviews/review-checklist.tsx` component
- [ ] Build step progress indicator (1-5)
- [ ] Build Step 1: Drift Check with holding-level results and notes
- [ ] Build Step 2: Exposure Check with sector warnings and acknowledgements
- [ ] Build Step 3: Role-Fit with verdicts and overrides
- [ ] Build Step 4: Benchmark Comparison with underperformance notes
- [ ] Build Step 5: Rationale textarea
- [ ] Implement navigation (next/previous/save)
- [ ] Persist completed review to Dexie `reviews` table
- [ ] Write co-located tests: `review-checklist.test.tsx`

## Dev Notes
- Review schema: `{ id, date, steps: { driftCheck: {...}, exposureCheck: {...}, roleFit: {...}, benchmarkComparison: {...}, rationale: string }, createdAt }`.
- Each step stores its results + user notes + any user overrides.
- Use a stepper component (shadcn or custom) with completed/active/upcoming states.
- Data persisted as a single JSON blob per review in the `reviews` table.
- Route: `/reviews/new` and `/reviews/:reviewId`.

## Dev Agent Record
- **Component:** `review-checklist.tsx`
- **Data Flow:** Start review → compute drift/exposure/role-fit/benchmark → user completes each step → save to Dexie
- **Key States:** loading (computing), in-progress (step N), saving, saved, error
- **Related Stores:** `useReviewStore`
- **Related Services:** `db.ts` (reviews table), drift-analysis service, exposure-check service
