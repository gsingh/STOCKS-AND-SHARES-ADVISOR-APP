## Story
**As a** retail investor,
**I want** to create detailed journal entries linked to stocks, goals, or reviews,
**So that** I can document my investment rationale, track my decision-making process, and set follow-up reminders.

## Acceptance Criteria
1. **Journal Form**: A form with fields: stock (autocomplete from listing), title, body (markdown editor), role (dropdown: Individual Investor / Analyst / Advisor / Trader), exit trigger conditions (multi-select: Stop Loss Hit / Target Achieved / Time Based / News Event / Thesis Invalidated), next review date (date picker), and tags (free-form comma-separated or chip input).
2. **Stock Autocomplete**: The stock field provides autocomplete suggestions fetched from the Dexie `stocks` table matching by name or ticker, with a debounce of 300ms.
3. **Markdown Editor**: The body field uses a lightweight markdown editor (or textarea with preview toggle) supporting basic formatting (bold, italic, lists, links).
4. **Link to Entities**: The journal entry can be optionally linked to a goal (from Dexie `goals` table) and/or a review (from Dexie `reviews` table) via dropdown selectors.
5. **Persistence**: On save, the entry is persisted to the Dexie `journalEntry` table with fields: `id`, `stockId`, `goalId`, `reviewId`, `title`, `body`, `role`, `exitTriggers`, `nextReviewDate`, `tags`, `createdAt`, `updatedAt`.
6. **Timestamp**: The `createdAt` timestamp is auto-generated on creation; `updatedAt` is updated on every edit.
7. **Validation**: The title and body fields are required. Stock, role, and next review date are optional. Validation errors are shown inline.
8. **Success Feedback**: After saving, a toast notification confirms the entry was saved, and the form resets or redirects to the new entry in the timeline.
9. **Cancel / Discard**: A cancel button discards unsaved changes with a confirmation dialog if the form is dirty.

## Tasks / Subtasks
- [ ] Define `JournalEntry` interface and add `journalEntry` table to Dexie schema
- [ ] Create `src/features/journal/journal-store.ts` (Zustand store for journal state)
- [ ] Build `src/components/features/journal/journal-form.tsx` with all form fields
- [ ] Implement stock autocomplete component with Dexie search
- [ ] Implement markdown editor with preview toggle
- [ ] Wire entity linking dropdowns for goals and reviews
- [ ] Add form validation with required field checks
- [ ] Implement save logic with Dexie put operation
- [ ] Add toast notification on successful save
- [ ] Implement dirty-form detection and discard confirmation

## Dev Notes
- Comma-separated tags input should trim whitespace and deduplicate; store as `string[]` in Dexie.
- The markdown editor can use a simple textarea with a separate preview pane — no heavy MD library needed. Use `marked` or `react-markdown` if already in the project.
- Exit trigger conditions are defined as a const enum; store as `string[]`.
- `nextReviewDate` stored as ISO date string for Dexie indexability.
- The stock autocomplete should reuse the existing `useStockSearch` hook or Dexie query pattern from Story 2.1.

## Dev Agent Record
- **Component:** `journal-form.tsx`
- **Data Flow:** Form state → Zustand store → Dexie `journalEntry` put → toast → timeline redirect
- **Dexie Table:** `journalEntry` (id, stockId, goalId, reviewId, title, body, role, exitTriggers, nextReviewDate, tags, createdAt, updatedAt)
- **Related Stores:** `useJournalStore` (entries, currentEntry, saveEntry, updateEntry)
