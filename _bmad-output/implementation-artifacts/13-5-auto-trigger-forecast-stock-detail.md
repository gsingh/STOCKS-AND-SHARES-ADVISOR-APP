## Story
**As a** user viewing a stock's detail page,  
**I want** the price forecast to auto-generate on page load instead of requiring a manual click,  
**So that** I see forecast data immediately without an extra interaction step.

## Acceptance Criteria
1. **Auto-trigger on mount**: When `ForecastPanel` mounts and price history has loaded with sufficient data (≥4 data points), the forecast is automatically requested. No "Generate Forecast" button is needed.
2. **Keep manual refresh**: The existing "Refresh" button in the footer (after forecast is shown) remains for manual re-generation.
3. **Keep empty state for insufficient data**: If price history has <4 data points, the existing "Not enough historical data" message is shown (no auto-trigger, no generate button).
4. **Loading states preserved**: While auto-loading, the existing loading spinner with "Generating forecast..." text is displayed.
5. **Horizon switching triggers re-fetch**: Changing the horizon selector (30 / 90 / 365 days) still triggers a new forecast fetch automatically (current behavior via `activeHorizon` dependency in `useCallback`).

## Tasks / Subtasks
- [ ] In `ForecastPanel.tsx`, add a `useEffect` that calls `loadForecast()` when history is loaded and result is null
- [ ] Remove the "Ready to generate" empty state UI (lines 146-159) that prompts the user to click "Generate Forecast"
- [ ] Ensure the auto-trigger does not fire during horizon changes (already handled by `loadForecast` dependency on `activeHorizon`)
- [ ] Guard against re-triggering when `entry?.result` already exists (only auto-trigger if no cached forecast)
- [ ] Verify the forecast-store caching still works: switching horizons and coming back should show cached result without re-fetching

## Dev Notes
- Current flow: User arrives → history loads → "Ready to generate a N-day forecast" prompt → user clicks "Generate Forecast" → forecast loads
- Target flow: User arrives → history loads → forecast auto-generates → chart renders
- The `entryKey` includes both symbol and horizon, so cached results are per-horizon. Auto-trigger should only fire when `entry?.result` is undefined.
- Add `useEffect` after line 43 to trigger auto-generation:

```typescript
useEffect(() => {
  if (history.length >= 4 && !result && !isLoading && !error) {
    loadForecast()
  }
}, [history, result, isLoading, error, loadForecast])
```

- The "Not enough data" state (lines 162-167) is preserved for stocks with <4 history points.

### Review Findings
- [x] [Review][Patch] Critical: `loadForecast` referenced before declaration — moved useEffect after declaration [ForecastPanel.tsx:51]
- [x] [Review][Patch] Critical: Error state unreachable — `setError` set `loading: true`, blocking error UI forever. Changed to `loading: false` [forecast-store.ts:83]
- [x] [Review][Defer] No AbortController — network requests leak on unmount. App-wide pattern, low impact for this feature.

## Dev Agent Record
- **Component:** `src/features/forecast/ForecastPanel.tsx`
- **Related:** `src/stores/forecast-store.ts`
- **Impact:** Removes one unnecessary user interaction step; forecast data is available immediately on stock detail view
