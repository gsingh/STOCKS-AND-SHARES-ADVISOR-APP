## Story
**As a** retail investor,
**I want** to see a portfolio snapshot on my dashboard showing total value, day change, invested amount, and top holdings,
**So that** I can get a quick overview of my portfolio's performance at a glance.

## Acceptance Criteria
1. **Key Metrics Display**: Four metric cards showing: Total Value (₹), Day Change (₹ and %), Total Invested (₹), Total Returns (₹ and %).
2. **Day Change Coloring**: Positive day change = green text + up arrow, negative = red + down arrow, zero = gray dash.
3. **Top Holdings List**: Compact list of 3-5 holdings sorted by weight percentage, each showing ticker, weight%, and score badge.
4. **Score Badge Integration**: Each holding displays the ScoreGauge component showing its fundamental score (green >=15/70, amber >=10/50, orange >=5, red <5/<50).
5. **FreshnessBadge**: Overall portfolio freshness indicator next to the Total Value.
6. **Empty State**: When no holdings exist, display "No holdings yet. Add your first transaction." with an "Add Transaction" button that navigates to the Portfolio page.
7. **Skeleton Loading**: Pulsing skeleton cards while portfolio data loads.
8. **Responsive Grid**: 2x2 metric grid on desktop, stacked on mobile.

## Tasks / Subtasks
- [ ] Create `src/components/features/dashboard/portfolio-snapshot.tsx` component
- [ ] Compute aggregate portfolio metrics from Dexie `holdings` table with live quotes
- [ ] Build metric cards with conditional coloring for day change
- [ ] Build top holdings compact list sorted by weight descending
- [ ] Integrate ScoreGauge for each holding's score badge
- [ ] Add FreshnessBadge linked to latest quote timestamp
- [ ] Implement empty state with CTA button
- [ ] Implement skeleton loading state
- [ ] Write co-located tests: `portfolio-snapshot.test.tsx`

## Dev Notes
- Use `useDashboardStore` for aggregated portfolio metrics.
- Total Value = sum of (quantity × current price) across all holdings.
- Day Change = sum of (quantity × day change) across all holdings.
- Weight % = (holding current value / total portfolio value) × 100.
- Empty state button routes to `/portfolio` via TanStack Router `useNavigate`.

## Dev Agent Record
- **Component:** `portfolio-snapshot.tsx`
- **Data Flow:** Mount → load holdings from Dexie → fetch live quotes → compute metrics → render
- **Key States:** loading (skeleton), loaded (with holdings), empty (no holdings), error
- **Related Stores:** `useDashboardStore`, `usePortfolioStore`
- **Related Services:** `quote-service`, `stock-service`
