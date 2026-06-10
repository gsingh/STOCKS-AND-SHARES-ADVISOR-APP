## Story
**As a** retail investor,  
**I want** to see a side-by-side parameter comparison table for my selected stocks,  
**So that** I can directly compare key metrics across stocks in one view.

## Acceptance Criteria
1. **Comparison Table**: A full-page table with rows grouped by the 6 scorecard categories and each stock as a column. The first column is the parameter name with TermInfo icon.
2. **Side-by-Side Columns**: Up to 4 stock columns, each showing the parameter's value and its individual score (0–20) in parentheses.
3. **Winner Highlighting**: Per row, the best-performing stock is highlighted with a green left border, 2nd is amber, 3rd is orange, last is red. Ties share the same color.
4. **TermInfo on Headers**: Each row header (parameter name) has a TermInfo hover icon showing a brief explanation of the parameter.
5. **Horizontal Scroll**: On narrow screens, the table horizontally scrolls with sticky first column (parameter name) for reference.
6. **Category Summary Row**: Each category group ends with a summary row showing the category subtotal score for each stock, bolded.
7. **Empty State**: If the compare list is empty (user navigates to `/compare` directly), show a message "No stocks selected for comparison. Add stocks from the Browser." with a link back to the Browser.

## Tasks / Subtasks
- [ ] Create `src/components/features/compare/comparison-table.tsx`
- [ ] Build comparison table layout with sticky first column
- [ ] Implement winner ranking algorithm per row (rank 1-4, handle ties)
- [ ] Apply color-coded left borders based on ranking
- [ ] Add TermInfo icon to each parameter row header
- [ ] Build category summary rows with subtotal scores
- [ ] Implement horizontal scroll on mobile with sticky left column
- [ ] Build empty state when compare list is empty
- [ ] Add loading skeleton while scorecard data loads for each stock

## Dev Notes
- The comparison fetches scorecard data for all selected stocks in parallel using `Promise.all`.
- Winner ranking is done per-row: higher score wins. For parameters where lower is better (like P/E, D/E), invert the ranking.
- The left border highlight should be a 4px `border-left` with the rank color.
- Use `position: sticky; left: 0` with a `z-index` for the first column. The first column background should be `bg-surface` to overlay the scrolling columns.

## Dev Agent Record
- **Component:** `comparison-table.tsx`, `comparison-row.tsx`, `comparison-header.tsx`
- **Data Flow:** `compareList` → parallel scorecard fetches → compare data → table render
- **Helpers:** `rankAcrossStocks(paramScores, lowerIsBetter)`, `getRankColor(rank)`
- **Stores:** `useCompareStore` (comparisonData, loading)
