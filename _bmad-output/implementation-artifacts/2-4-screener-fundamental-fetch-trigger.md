## Story
**As a** retail investor viewing a stock's detail page,  
**I want** the app to automatically trigger a Screener.in data fetch for that stock,  
**So that** I see up-to-date fundamental data without manually initiating the process.

## Acceptance Criteria
1. **Auto-Trigger on View**: When Stock Detail loads for a ticker, `StockService.triggerFetch(symbol)` is called automatically with no user action required.
2. **24-Hour TTL Check**: Before fetching, the system checks if cached data exists with a timestamp within the last 24 hours. If valid, the cached data is displayed immediately and no network request is made.
3. **Loading Skeleton**: While the scrape is in progress (if needed), a skeleton UI matching the scorecard layout is displayed with a "Fetching data for [ticker]…" message.
4. **Background Scrape**: The fetch runs in the background; when complete, the page updates reactively.
5. **Refresh Data Button**: A manual "Refresh Data" button is always visible, allowing the user to force-refresh even within the 24-hour window.
6. **Staleness Indicator**: If cached data is older than 24 hours but still displayed (user hasn't refreshed), a subtle "Data from [date]" label appears.
7. **Error Handling**: If the fetch fails, show an inline error banner with "Failed to fetch data. Retry in 30 seconds." and an auto-retry mechanism.

## Tasks / Subtasks
- [ ] Implement auto-trigger in the Stock Detail route loader / onMount
- [ ] Add TTL check logic (24h) in `StockService.triggerFetch`
- [ ] Build loading skeleton matching scorecard layout
- [ ] Create RefreshDataButton component with loading state
- [ ] Implement staleness label when displaying cached data
- [ ] Add error banner with auto-retry logic (3 retries, exponential backoff)
- [ ] Update `StockService` types for fetch status (idle, loading, cached, stale, error)

## Dev Notes
- The `StockService.triggerFetch` updates a `fundamentalData` table in Dexie with ticker, data JSON, fetchedAt timestamp.
- The scrape itself runs via `nse-bse-api` which wraps Screener.in data extraction.
- Background fetch uses a microtask / `setTimeout(0)` to avoid blocking the render cycle.
- On component unmount, cancel any in-flight fetch to prevent stale updates.

## Dev Agent Record
- **Component:** `stock-detail.tsx` (integration), `refresh-data-button.tsx`
- **Service:** `StockService.triggerFetch(symbol)`
- **Data Flow:** Page mount → TTL check → fetch/display cached → background update → reactive re-render
- **Related:** `StockService.getFundamentals(ticker)`, `useFundamentalStore`
