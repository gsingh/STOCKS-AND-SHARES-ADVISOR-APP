## Story
**As a** retail investor,
**I want** to see a market summary section on my dashboard showing Nifty 50 and Sensex data with top gainers and losers,
**So that** I can quickly assess the overall market direction without navigating elsewhere.

## Acceptance Criteria
1. **Market Indices Display**: Two prominent cards show Nifty 50 and Sensex with current value, change (₹), and change percentage (%).
2. **Up/Down Arrows**: Green upward arrow + green text when change > 0, red downward arrow + red text when change < 0, gray dash when unchanged.
3. **Top Gainers/Losers**: A compact list of 3-5 top gainers and 3-5 top losers, each showing ticker, last price, and change%.
4. **FreshnessBadge Integration**: Each data point (Nifty, Sensex, gainers, losers) shows a FreshnessBadge indicating data recency.
5. **Stale Cache Fallback**: If the cached quote data exceeds the configured freshness threshold, show stale indicators with a muted opacity overlay.
6. **Skeleton Loading State**: If market data has never been fetched, show a skeleton/placeholder UI with pulsing animation.
7. **Auto-Refresh**: Market summary data refreshes automatically every 5 minutes when the dashboard is visible.
8. **Responsive Layout**: Cards stack vertically on mobile, side-by-side on tablet/desktop.

## Tasks / Subtasks
- [ ] Create `src/components/features/dashboard/market-summary.tsx` component
- [ ] Fetch Nifty 50 and Sensex data via `quote-service` from Dexie cached indices
- [ ] Compute change% from current vs previous close
- [ ] Build top gainers/losers compact list with conditional coloring
- [ ] Wire FreshnessBadge per data point using `ui-store` freshness config
- [ ] Implement stale cache detection and fallback overlay
- [ ] Build skeleton placeholder for first-load state
- [ ] Set up auto-refresh interval (5 min) with visibility-based pause
- [ ] Add responsive grid layout using Tailwind grid utilities
- [ ] Write co-located tests: `market-summary.test.tsx`

## Dev Notes
- Use `stock-service.getIndices()` to fetch index data from Dexie `quotes` table.
- Gainers/losers come from `stock-service.getTopGainers()` / `getTopLosers()`.
- Stale threshold defaults to 15 minutes; configurable in Settings.
- Skeleton uses `LoadingState` component with custom layout matching card dimensions.
- Auto-refresh uses `useInterval` hook with `document.visibilityState` check.

## Dev Agent Record
- **Component:** `market-summary.tsx`
- **Data Flow:** Mount → check Dexie cache → fetch if stale → render indices + gainers/losers → schedule refresh
- **Key States:** loading (skeleton), loaded (fresh), loaded (stale), error
- **Related Services:** `quote-service`, `stock-service`
- **Related Stores:** `ui-store` (freshness config), `useDashboardStore`
