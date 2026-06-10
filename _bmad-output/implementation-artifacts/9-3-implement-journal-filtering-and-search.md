## Story
**As a** retail investor,
**I want** to filter and search my journal entries by stock, role, tag, date range, and free text,
**So that** I can quickly find specific entries among a growing collection of investment notes.

## Acceptance Criteria
1. **Filter Bar**: A filter bar sits above the timeline with controls for each filter dimension: stock (autocomplete), role (dropdown), tags (multi-select chips), date range (start/end date pickers).
2. **Stock Filter**: Autocomplete field matching against linked stock names/tickers in journal entries; filters to entries with that stock link.
3. **Role Filter**: Dropdown to filter by role (Individual Investor / Analyst / Advisor / Trader) with an "All" default.
4. **Tag Filter**: Multi-select chip input showing all unique tags extracted from all journal entries. Selecting a tag filters to entries containing that tag.
5. **Date Range Filter**: Two date pickers (from / to) filtering entries by `createdAt` within the range.
6. **Text Search**: A search input with 300ms debounce searches across `title` and `body` fields using Dexie's `filter()` with case-insensitive substring matching.
7. **Combined Filters**: All active filters apply simultaneously (AND logic). The timeline updates reactively as filters change.
8. **Active Badges**: Active filters appear as removable badges below the filter bar (e.g., "Stock: Reliance", "Role: Analyst") with individual dismiss and a "Clear All" button.
9. **Empty Filter Result**: When filters match no entries, display "No entries match your filters. Try adjusting your search or filters." with a "Clear Filters" action.
10. **URL Sync**: Active filters sync to URL query parameters for bookmarkable filtered views.

## Tasks / Subtasks
- [ ] Build `src/components/features/journal/journal-filters.tsx` with all filter controls
- [ ] Implement stock autocomplete filter with Dexie distinct stock query
- [ ] Implement role dropdown filter
- [ ] Implement tag multi-select with unique tag extraction from entries
- [ ] Implement date range pickers using shadcn DatePicker or native inputs
- [ ] Implement text search with debounce across title and body
- [ ] Compose all filters with AND logic in a reactive query
- [ ] Build active filter badges with dismiss and clear all
- [ ] Build empty filter result state
- [ ] Sync filter state to URL query params via TanStack Router

## Dev Notes
- Extract unique tags across all entries using Dexie `orderBy('tags')` and `unique()` or a custom reduce.
- Date comparison: store all dates as ISO strings and compare with `new Date()`.
- Text search on body can be expensive for large entries — consider indexing or limit to title-only if performance is poor, with body search as secondary.
- Filter state managed in a custom hook `useJournalFilters` returning `filteredEntries`, `activeFilters`, and setter functions.

## Dev Agent Record
- **Component:** `journal-filters.tsx`
- **Data Flow:** Filter UI → filter state → combined Dexie query → filtered entries → timeline render
- **URL Sync:** TanStack Router `useSearch` with `validateSearch` schema for journal filter params
- **Related Stores:** `useJournalStore` (filteredEntries, setFilter, clearFilters)
