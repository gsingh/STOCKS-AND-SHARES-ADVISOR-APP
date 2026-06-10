## Story
**As a** retail investor,  
**I want** to filter stocks by market cap, sector, P/E ratio, ROE, and composite score,  
**So that** I can narrow down the universe to stocks matching my investment criteria.

## Acceptance Criteria
1. **Filter Panel**: A collapsible filter panel sits above the stock table with sections for each filter type.
2. **Market Cap Filter**: Three checkboxes or toggle chips for Large-cap, Mid-cap, Small-cap; multiple can be selected (OR logic within group).
3. **Sector Dropdown**: A dropdown select (shadcn Select) listing all unique sectors populated from IndexedDB, single-select.
4. **Range Sliders**: Three range sliders for P/E ratio, ROE (%), and composite score (0-100) with editable min/max number inputs on each end.
5. **AND Logic**: Filters use AND logic across groups — a stock must satisfy all active filter groups to appear.
6. **Filter Counts**: Each filter value displays the count of matching stocks (e.g., "Large-cap (142)") for transparency.
7. **Reset All**: A "Reset All Filters" link/button clears all active filters at once.
8. **URL Persistence**: All active filters are serialized to URL query params (e.g., `?cap=large,mid&sector=IT&pe_min=10&pe_max=25`) for shareable bookmarks.
9. **Debounced Inputs**: Range inputs update the list after a 200ms debounce (not on every keystroke).
10. **Active Filter Badges**: Active filters appear as removable badges below the filter panel header for quick visibility.

## Tasks / Subtasks
- [ ] Create `src/components/features/browser/stock-filters.tsx`
- [ ] Build market cap checkbox group with count labels
- [ ] Populate sector dropdown from Dexie distinct sector values
- [ ] Implement P/E, ROE, score range sliders with bound inputs
- [ ] Implement AND/OR logic composition for filter predicates
- [ ] Sync filter state to URL query params using TanStack Router
- [ ] Build active filter badges with individual dismiss
- [ ] Implement reset-all action
- [ ] Add debounce to range inputs

## Dev Notes
- Filter state should be managed in a custom hook `useStockFilters` that returns `filteredStocks`, `activeFilters`, `setFilter`, `resetFilters`.
- Pre-compute filter counts from the full dataset, not the already-filtered set (user needs to know total universe counts).
- Range slider component can use shadcn Slider with min/max inputs beside it.

## Dev Agent Record
- **Component:** `stock-filters.tsx`
- **Data Flow:** Filter UI → URL query params → Dexie query → filtered results → StockTable
- **Related Stores:** `useFilterStore` (filterState, setFilter, resetFilters)
- **Route Integration:** TanStack Router `validateSearch` schema for filter params
