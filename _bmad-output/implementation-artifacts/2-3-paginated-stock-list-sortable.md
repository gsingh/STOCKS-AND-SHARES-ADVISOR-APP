## Story
**As a** retail investor,  
**I want** a paginated, sortable table of stocks showing key metrics,  
**So that** I can browse, compare, and open stocks efficiently.

## Acceptance Criteria
1. **Table Columns**: The table displays: Ticker, Name, Sector, Price (₹), Market Cap, P/E Ratio, ROE (%), Composite Score (color-coded badge).
2. **Pagination**: The table shows 50 stocks per page with page controls (First, Prev, 1…N, Next, Last) and a "Showing X-Y of Z" label.
3. **Sortable Columns**: Clicking a column header sorts asc (first click) then desc (second click); a third click returns to default (insertion order). Active sort column has an arrow indicator.
4. **en-IN Formatting**: All numeric values display in Indian locale (en-IN) — e.g., ₹1,23,456.78 and 15.5%.
5. **Row Click**: Clicking any row navigates to the Stock Detail page (`/stock/:ticker`) via TanStack Router.
6. **Compare Toggle**: Each row has a "+" icon button that adds the stock to the compare tray (max 4). Added stocks show a checkmark instead.
7. **Composite Score Badge**: The score column renders a pill badge with color: green (≥70), amber (≥50), orange (≥30), red (<30).
8. **Loading Skeleton**: While data loads, show a skeleton placeholder matching the table layout (10 rows).
9. **Empty Table**: When no stocks match filters, display an illustration and "No stocks match your filters. Try adjusting your search or filters."

## Tasks / Subtasks
- [ ] Create `src/components/features/browser/stock-table.tsx`
- [ ] Implement `<DataTable>` with sort header click handlers
- [ ] Build pagination component with page range calculation
- [ ] Apply en-IN number formatting (`Intl.NumberFormat('en-IN')`)
- [ ] Wire row click to router navigation
- [ ] Add compare "+" button per row with max-4 guard
- [ ] Create ScoreBadge sub-component with color coding
- [ ] Build loading skeleton matching table layout
- [ ] Implement empty state component

## Dev Notes
- Use a virtualized table (e.g., TanStack Table) if the 50-per-page pagination approach proves too slow — but 50 items should be fine without virtualization.
- Sort state lives in URL query params (`?sort=pe&order=asc`) for shareability.
- The composite score is computed by the scoring engine (Epic 1) and stored in IndexedDB.
- Market cap formatting: display in Cr (Crores) using en-IN notation.

## Dev Agent Record
- **Component:** `stock-table.tsx`
- **Data Flow:** Filtered stocks → sort → paginate → render
- **Stores:** `useStockStore` (stocks, sortBy, sortOrder, page)
- **Helpers:** `formatIndianNumber`, `formatIndianCurrency`, `getScoreColor`
