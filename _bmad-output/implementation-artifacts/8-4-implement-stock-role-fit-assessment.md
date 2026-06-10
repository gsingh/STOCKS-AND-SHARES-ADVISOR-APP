## Story
**As a** retail investor,
**I want** to assess whether each holding still fits its intended role in my portfolio,
**So that** I can decide whether to keep, re-evaluate, or exit a position.

## Acceptance Criteria
1. **Role Assignment**: Each holding can be assigned a role: `core_hold`, `growth_play`, `dividend_income`, `tactical`.
2. **Role-Specific Questions**: For each role, the review surfaces tailored assessment questions:
   - Core Hold: "Is this stock still a market leader? Has its competitive moat weakened?"
   - Growth Play: "Is the growth story still intact? Are earnings beating estimates?"
   - Dividend Income: "Has the dividend yield remained stable? Is the payout ratio healthy?"
   - Tactical: "Is the thesis still valid? What is the exit trigger?"
3. **User Response**: For each question, user can answer Yes/No/Unsure with an optional note.
4. **Verdict**: Based on responses, compute a verdict: `still_fits` (all positive), `needs_re_evaluation` (mixed), `exit` (mostly negative).
5. **Verdict Badges**: Green check for still_fits, amber refresh for needs_re_evaluation, red "x" for exit.
6. **Verdict Override**: User can manually override the computed verdict.
7. **Standalone Access**: Role-fit assessment accessible outside review flow from portfolio page.

## Tasks / Subtasks
- [ ] Create `src/features/portfolio/role-fit-assessment.ts` — pure function for role-fit logic
- [ ] Create `src/components/features/reviews/role-fit-view.tsx` component
- [ ] Define role-specific question sets
- [ ] Build role-fit UI per holding with questions and Yes/No/Unsure toggles
- [ ] Implement verdict computation based on responses
- [ ] Build verdict badges with conditional coloring
- [ ] Implement verdict override
- [ ] Write co-located tests: `role-fit-assessment.test.ts` and `role-fit-view.test.tsx`

## Dev Notes
- Role assigned on the holding record (`role` field: core_hold | growth_play | dividend_income | tactical).
- Questions defined as static data in `src/features/portfolio/role-fit-assessment.ts`.
- Verdict logic: if all "Yes" → still_fits; any "No" → needs_re_evaluation; majority "No" → exit.
- Override stored in the review record, not on the holding.
- Role-fit UI uses shadcn RadioGroup or ToggleGroup for Yes/No/Unsure.

## Dev Agent Record
- **Component:** `role-fit-view.tsx`
- **Data Flow:** Load holdings → for each, get role → show role-specific questions → collect responses → compute verdict → allow override → save
- **Key States:** loading, assessing (per holding), verdict rendered, verdict overridden
- **Related Stores:** `usePortfolioStore`
- **Related Services:** `src/features/portfolio/role-fit-assessment.ts`
