## Story
**As a** retail investor,
**I want** to create financial goals with target amounts and dates,
**So that** I can track my progress toward specific investment objectives.

## Acceptance Criteria
1. **Goal Creation Form**: shadcn Dialog or page with form fields: name, type, target amount, target date, current amount, risk profile, preferred sectors.
2. **Goal Types**: Dropdown with options: Emergency, Medium-Term, Long-Term, Custom.
3. **Target Amount**: Currency input (₹) in en-IN format, min=1,000.
4. **Target Date**: Date picker for goal deadline, must be in the future.
5. **Current Amount**: Currency input for amount already saved toward this goal, defaults to 0.
6. **Risk Profile**: Dropdown: Low, Moderate, High (stored as string).
7. **Preferred Sectors**: Multi-select dropdown for sector preferences (optional).
8. **Progress Bar**: After creation, goal is displayed as a card with a progress bar showing current/target percentage.
9. **Validation**: Name required (max 100 chars), target amount required, target date required and must be in the future.
10. **Persistence**: Goal saved to Dexie `goals` table with all fields and `createdAt` timestamp.

## Tasks / Subtasks
- [ ] Create `src/components/features/goals/create-goal-dialog.tsx` component
- [ ] Build form with all input fields using React Hook Form + Zod
- [ ] Implement goal type selector with descriptions
- [ ] Implement risk profile dropdown
- [ ] Implement preferred sectors multi-select
- [ ] Build goal card component with progress bar
- [ ] Implement form validation
- [ ] Persist goal to Dexie `goals` table
- [ ] Write co-located tests: `create-goal-dialog.test.tsx`

## Dev Notes
- Goal schema: `{ id, name, type, targetAmount, targetDate, currentAmount, riskProfile, preferredSectors[], createdAt, updatedAt }`.
- Progress % = (currentAmount / targetAmount) × 100, capped at 100.
- Goal cards displayed on Goals page with shadcn Card component.
- Multi-select uses shadcn Select with `multiple` or a custom checkbox dropdown.
- en-IN formatting for all currency displays via `Intl.NumberFormat`.

## Dev Agent Record
- **Component:** `create-goal-dialog.tsx`
- **Data Flow:** Open form → fill details → validate → save to Dexie → render goal card
- **Key States:** form open, submitting, success, validation error
- **Related Stores:** `useGoalStore`
- **Related Services:** `db.ts` (goals table)
