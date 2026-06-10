## Story
**As a** retail investor,
**I want** to see a sortable table of all my holdings with key metrics,
**So that** I can analyse my portfolio composition and performance.

## Acceptance Criteria
1. **Holdings Table**: A responsive table (shadcn Table) listing all holdings with columns: ticker+name, quantity, avg buy price, current price, invested, current value, P&L (₹), P&L (%), weight %, score badge, role badge.
2. **Sortable Columns**: Clicking column headers sorts the table ascending/descending; active sort shown with arrow indicator.
3. **Ticker+Name Column**: Shows ticker symbol (bold) with company name below in muted text.
4. **P&L Coloring**: Positive P&L in green, negative in red; % shown in parentheses.
5. **Weight %**: Calculated as (holding current value / total portfolio current value) × 100, shown with one decimal.
6. **Score Badge**: Each holding shows ScoreGauge badge (green >=15/70, amber >=10/50, orange >=5, red <5/<50).
7. **Role Badge**: Each holding shows a role chip (Core Hold, Growth Play, Dividend Income, Tactical) if assigned.
8. **Totals Row**: Last row shows aggregate: total invested, total current value, total P&L (₹ and %), 100% weight.
9. **Row Click**: Clicking a row navigates to the Stock Detail page for that stock.
10. **Mobile Responsive**: On narrow screens, table collapses to card layout showing key fields.

## Tasks / Subtasks
- [ ] Create `src/components/features/portfolio/holdings-table.tsx` component
- [ ] Build sortable table with all columns
- [ ] Implement sort logic (client-side, toggle asc/desc per column)
- [ ] Compute derived metrics: P&L, weight %, totals row
- [ ] Integrate ScoreGauge for score badges
- [ ] Integrate role badges (core hold, growth play, dividend income, tactical)
- [ ] Wire row click to Stock Detail route via TanStack Router
- [ ] Build mobile-responsive card layout fallback
- [ ] Write co-located tests: `holdings-table.test.tsx`

## Dev Notes
- Data source: `usePortfolioStore.holdings` with live prices from `quote-service`.
- Sort state managed locally with `useState`; default sort by weight descending.
- P&L ₹ = (current price - avgBuyPrice) × quantity; P&L % = ((current price - avgBuyPrice) / avgBuyPrice) × 100.
- Totals: totalInvested = sum(quantity × avgBuyPrice), totalValue = sum(quantity × currentPrice).
- Click row → navigate to `/stock/$ticker` with TanStack Router.
- Mobile: use `hidden md:table-cell` for columns that collapse on mobile.

## Dev Agent Record
- **Component:** `holdings-table.tsx`
- **Data Flow:** Load holdings → fetch live prices → compute metrics → sort → render table
- **Key States:** loading (skeleton rows), loaded (data), empty ("No holdings yet"), error
- **Related Stores:** `usePortfolioStore`
- **Related Services:** `quote-service`
- **Router:** TanStack Router `useNavigate`
