## Story
**As a** user viewing the Dashboard,  
**I want** a retry button when the market forecast preview fails to load,  
**So that** I can recover from transient forecast-service errors without refreshing the page.

## Acceptance Criteria
1. **Retry button in error state**: The `MarketForecastPreview` error state includes a prominent retry button (matching `ForecastPanel`'s pattern).
2. **Retry behavior**: Clicking retry re-initiates the full load sequence: fetch price history → call forecast service → render chart.
3. **Clear error guidance**: The error message still shows the `AlertTriangle` icon and descriptive text, but also tells the user they can retry.
4. **Consistency with ForecastPanel**: The retry button uses the same styling as `ForecastPanel.tsx:137-141` (`rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700`).
5. **Loading state on retry**: While retrying, the component shows the existing loading state (spinner).

## Tasks / Subtasks
- [ ] Add `load` function ref (via `useCallback` or extract to named function) in `MarketForecastPreview`
- [ ] Add a retry `<button>` in the error state UI (lines 118-126), styled consistently with `ForecastPanel`
- [ ] Wire the retry button to call `load()` on click
- [ ] Ensure cleanup (`cancelled` flag in `useEffect`) works correctly on retry (new load cancels previous)
- [ ] Remove the static "Run npm run forecast..." instruction or move it below the retry button

## Dev Notes
- The current error state (`MarketForecastPreview.tsx:117-127`) shows the error message and static help text but no retry mechanism. The user must manually refresh the page or toggle routes to retry.
- The `load()` function is currently inline in `useEffect`. Extract it to a named function so both the effect and retry button can call it.
- Ensure the `cancelled` ref properly handles rapid retries without race conditions.

### Review Findings
- [x] [Review][Patch] High: `^NSEI` caret symbol not URI-encoded in fetch URL — added `encodeURIComponent()` [MarketForecastPreview.tsx:19]
- [x] [Review][Defer] No AbortController — network requests leak on unmount. App-wide pattern.

## Dev Agent Record
- **Component:** `src/features/forecast/MarketForecastPreview.tsx`
- **Pattern reference:** `src/features/forecast/ForecastPanel.tsx:136-141`
- **Impact:** Improves dashboard reliability when forecast service is temporarily unavailable
