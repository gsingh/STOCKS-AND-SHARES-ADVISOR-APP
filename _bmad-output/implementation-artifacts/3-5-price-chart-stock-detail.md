## Story
**As a** retail investor,  
**I want** to see a price chart on the Stock Detail page with configurable time intervals,  
**So that** I can analyze price trends and patterns over different periods.

## Acceptance Criteria
1. **Price Chart Section**: A "Price Chart" section on the Stock Detail page below the score history.
2. **Line Chart**: A Recharts `LineChart` rendering closing price over time. Chart color is `chart-color-1` (`#2E8B57`).
3. **Interval Selectors**: Four interval buttons — 1W, 1M (default), 3M, 1Y — that switch the visible data range.
4. **Data Source**: Price data comes from Dexie `priceHistory` table (populated by QuoteService aggregates). If insufficient data exists, show a message "Insufficient price data. Data will accumulate as you view this stock."
5. **Hover Tooltip**: A tooltip on hover displays the date and closing price (₹ en-IN format).
6. **Accessible Table**: Below the chart, an HTML table renders the same data in tabular format for screen reader users and data export. The table has columns: Date, Close Price, Change.
7. **Responsive**: The chart fills the container width (100%) with a fixed aspect ratio (e.g., 2:1). On mobile, interval buttons stack vertically.
8. **Loading State**: Skeleton placeholder matching the chart dimensions while price data loads.

## Tasks / Subtasks
- [ ] Create `src/components/features/scorecard/price-chart.tsx`
- [ ] Build Recharts LineChart with responsive container
- [ ] Implement interval selector button group (1W, 1M, 3M, 1Y)
- [ ] Query Dexie `priceHistory` table filtered by ticker and date range
- [ ] Build custom tooltip component for chart hover
- [ ] Build accessible HTML data table below chart
- [ ] Implement insufficient-data message
- [ ] Build loading skeleton for chart area
- [ ] Add responsive CSS for mobile interval button stacking

## Dev Notes
- Interval logic: 1W = last 7 calendar days, 1M = last 30 days, 3M = last 90 days, 1Y = last 365 days.
- If the stock has fewer than 5 data points, show the insufficient-data message instead of the chart.
- Use `ResponsiveContainer` from Recharts for responsive width.
- The table below the chart should be visually compact and hidden from non-screen-reader users (visually hidden but `aria-hidden="false"`).
- Chart should use gradient area fill below the line for visual appeal.

## Dev Agent Record
- **Component:** `price-chart.tsx`, `price-chart-tooltip.tsx`, `price-chart-table.tsx`
- **Data Flow:** Dexie `priceHistory` → filtered by interval → Recharts → chart + table render
- **Services:** `QuoteService.getPriceHistory(ticker, interval)`
- **Stores:** `usePriceStore` (priceHistory, selectedInterval, loading)
