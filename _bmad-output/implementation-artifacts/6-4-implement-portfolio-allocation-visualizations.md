## Story
**As a** retail investor,
**I want** to see my portfolio allocation visualised by sector, market cap, and investment style,
**So that** I can quickly identify concentration risks and imbalances.

## Acceptance Criteria
1. **Sector Allocation Donut**: PieChart donut showing allocation by sector (e.g., Banking, IT, Pharma, Auto, etc.) with percentage labels.
2. **Market Cap Donut**: PieChart donut showing allocation by market cap: Large Cap, Mid Cap, Small Cap.
3. **Investment Style Donut**: PieChart donut showing allocation by style: Growth, Value, Dividend.
4. **Hover Tooltip**: Hovering over a slice shows: name, percentage (1 decimal), and current value (₹).
5. **Click to Filter**: Clicking a donut slice filters the holdings table to show only holdings in that category.
6. **Sector Cap Warning**: If any sector exceeds the configured cap (default 35%), the sector label shows a warning icon and the slice is highlighted in amber/red.
7. **Excessive Holding Flag**: If any single stock exceeds 15% of the portfolio, it is flagged with "Excessive" badge.
8. **Configurable Caps**: Sector cap threshold configurable in Settings (default 35%, range 20-50%).

## Tasks / Subtasks
- [ ] Create `src/components/features/portfolio/allocation-charts.tsx` component
- [ ] Build sector allocation donut with Recharts PieChart
- [ ] Build market cap donut (Large/Mid/Small)
- [ ] Build investment style donut (Growth/Value/Dividend)
- [ ] Implement hover tooltips with name, %, and value
- [ ] Implement click-to-filter that sets a filter state in portfolio store
- [ ] Implement sector cap warning logic with configurable threshold
- [ ] Implement excessive holding flag (>15%) per stock
- [ ] Wire configurable caps from Settings store
- [ ] Write co-located tests: `allocation-charts.test.tsx`

## Dev Notes
- Each holding needs `sector`, `marketCap`, and `style` fields; these come from the stock metadata in Dexie `stocks` table.
- Aggregate by grouping holdings by the respective category and summing current values.
- Recharts `<PieChart>` with `<Pie>` innerRadius={60} outerRadius={100} for donut style.
- Filter state stored in `usePortfolioStore.allocationFilter`; reset filter with "Clear Filter" button.
- Sector cap constants: default `SECTOR_CAP = 0.35`, excessive holding `EXCESSIVE_THRESHOLD = 0.15`.
- Colours: generate from a predefined palette; excessive/over-cap slices get `fill="#ef4444"`.

## Dev Agent Record
- **Component:** `allocation-charts.tsx`
- **Data Flow:** Load holdings → group by sector/marketCap/style → compute percentages → render donuts → click sets filter
- **Key States:** loading, loaded, empty (no holdings)
- **Related Stores:** `usePortfolioStore` (allocationFilter, setAllocationFilter)
- **Dependencies:** Recharts (PieChart, Pie, Cell, Tooltip, Legend)
