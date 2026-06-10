## Story
**As a** visual investor,  
**I want** to see radar and bar charts comparing my selected stocks,  
**So that** I can visually identify the strengths and weaknesses of each stock across categories.

## Acceptance Criteria
1. **Radar/Spider Chart**: A Recharts `RadarChart` with 17 axes (one per parameter) and one trace per stock (up to 4). Each axis shows the score (0–20).
2. **Grouped Bar Chart**: A Recharts `BarChart` with the 6 categories on the X-axis and grouped bars per stock showing the category subtotal score.
3. **Chart Color Palette**: 4 fixed colors for the 4 stock traces: `#2E8B57` (stock 1), `#2563EB` (stock 2), `#D97706` (stock 3), `#DC2626` (stock 4).
4. **Hover Tooltips**: Hovering on a data point shows a tooltip with stock name, category/parameter, and score.
5. **Legend**: A legend below each chart showing the stock ticker and its color swatch.
6. **Accessible Data Tables**: Below each chart, an HTML table renders the same data in tabular format for screen reader users and data export.
7. **Empty State**: If compare list is empty, show "Select stocks to view comparison charts."
8. **Responsive**: Charts use `ResponsiveContainer` for fluid width. On mobile (<640px), charts stack vertically with the table below each.

## Tasks / Subtasks
- [ ] Create `src/components/features/compare/comparison-charts.tsx`
- [ ] Build RadarChart with 17 parameter axes and up to 4 traces
- [ ] Build grouped BarChart for 6 categories
- [ ] Implement chart color palette assignment (1:1 mapping to compare list order)
- [ ] Build custom tooltips for both charts
- [ ] Add legend components per chart
- [ ] Build accessible HTML data tables below each chart
- [ ] Implement responsive layout (stack on mobile)
- [ ] Build empty state

## Dev Notes
- Radar chart polygon fill should use low opacity (`fillOpacity: 0.1`) of the trace color.
- The bar chart `Bar` components should have `radius` for rounded top corners.
- Consider adding an option to toggle between showing scores (0–20) and raw values for each parameter (future enhancement).
- Accessible tables use `aria-hidden="true"` on the chart SVG and `aria-hidden="false"` on the table, with the table visually hidden but screen-reader accessible.

## Dev Agent Record
- **Component:** `comparison-charts.tsx`, `radar-chart.tsx`, `bar-chart.tsx`
- **Data Flow:** Compare data → Recharts RadarChart + BarChart → render
- **Palette:** `['#2E8B57', '#2563EB', '#D97706', '#DC2626']`
- **Helpers:** `formatChartTooltip`, `buildComparisonRadarData`, `buildComparisonBarData`
