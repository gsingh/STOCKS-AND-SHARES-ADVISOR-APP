## Story
**As a** retail investor,
**I want** to view all my journal entries in a reverse-chronological timeline with inline editing,
**So that** I can review my past investment thinking, update my notes, and see how my thesis evolved over time.

## Acceptance Criteria
1. **Timeline View**: The journal page displays all entries in reverse-chronological order (newest first), grouped by date (Today, Yesterday, This Week, This Month, Older).
2. **Entry Card**: Each entry card shows: timestamp (relative format like "2h ago" or date), linked stock name/ticker (if any) as a clickable chip, linked goal/review references as badges, title (bold), body preview (first 150 characters with ellipsis), role badge, and tag chips.
3. **Stock Link**: Clicking the stock chip navigates to that stock's detail page.
4. **Expand/Collapse**: Clicking an entry card expands it to show the full body content (rendered markdown). A second click collapses it back.
5. **Inline Edit**: The expanded view includes an "Edit" button that switches the card to editable form fields (same fields as creation form). A "Save" button persists changes and updates the `updatedAt` timestamp.
6. **Delete**: Each card has a delete icon (trash) with a confirmation dialog before removal.
7. **Pagination / Infinite Scroll**: If more than 20 entries exist, pagination controls or infinite scroll loads additional entries (20 at a time).
8. **Entry Count**: A header line shows "X entries" total count.
9. **Loading State**: A skeleton loading placeholder is shown while entries are being fetched from Dexie.
10. **Empty State**: When no entries exist, display "No journal entries yet. Write your first investment note." with a link/button to the creation form.

## Tasks / Subtasks
- [ ] Build `src/components/features/journal/journal-timeline.tsx` container component
- [ ] Build `src/components/features/journal/journal-entry-card.tsx` with expand/collapse
- [ ] Implement date grouping logic (Today, Yesterday, etc.)
- [ ] Implement relative timestamp formatting using en-IN locale
- [ ] Render markdown body in expanded view using react-markdown or similar
- [ ] Implement inline edit mode (reuse form fields from Story 9.1)
- [ ] Build delete confirmation dialog (shadcn AlertDialog)
- [ ] Implement pagination or infinite scroll with Dexie offset/limit
- [ ] Build skeleton loading placeholder UI
- [ ] Build empty state with CTA to create entry

## Dev Notes
- Use Dexie `orderBy('createdAt').reverse()` for the query, then paginate with `.offset().limit()`.
- Date grouping: compare entry date to today's start, yesterday's start, this week's start, this month's start.
- Relative time formatting: use `Intl.RelativeTimeFormat` with `en-IN` locale.
- The inline edit form should pre-populate with existing entry data and use the same validation rules.
- Consider using `react-markdown` for body rendering in expanded view; if not in the project, a simple text renderer suffices.

## Dev Agent Record
- **Component:** `journal-timeline.tsx`, `journal-entry-card.tsx`
- **Data Flow:** Dexie query → date grouping → card rendering → expand/edit/delete interactions
- **Dexie Table:** `journalEntry` (read, update, delete operations)
- **Related Stores:** `useJournalStore` (fetchEntries, updateEntry, deleteEntry, pagination state)
