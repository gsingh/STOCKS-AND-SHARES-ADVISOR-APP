## Story
**As a** retail investor viewing a stock's detail page,  
**I want** the current price and daily price data to be fetched and displayed automatically,  
**So that** I can make informed decisions based on the latest market data.

## Acceptance Criteria
1. **Auto-Fetch on Mount**: Stock Detail page calls `StockService.getQuote(symbol)` on component mount automatically.
2. **15-Minute TTL**: If cached quote data is less than 15 minutes old, no network request is made; cached data is shown.
3. **Price Display**: The stock header shows current price in ₹ (en-IN format), absolute change (₹), percentage change (%), and day's high/low range.
4. **Color Direction**: Positive change is displayed in green (`#2E8B57`), negative in red (`#DC2626`), neutral in muted text.
5. **FreshnessBadge**: A small badge next to the price shows "Live", "15m ago", "1h ago", or "Stale (>2h)" with corresponding color.
6. **Manual Refresh**: A circular refresh arrow icon next to the price allows manual quote refresh.
7. **Fallback**: If the API is unavailable, show the last cached price with a "(delayed)" label.

## Tasks / Subtasks
- [ ] Wire `StockService.getQuote(symbol)` into Stock Detail onMount
- [ ] Implement 15-min TTL check logic
- [ ] Build price display header component with en-IN formatting
- [ ] Create FreshnessBadge component with staleness tiers
- [ ] Add manual refresh button with loading spinner
- [ ] Handle API failure with graceful fallback to cached data
- [ ] Format day high/low as a visual range bar

## Dev Notes
- `StockService.getQuote` stores quote data in a `quotes` Dexie table with `ticker`, `price`, `change`, `changePercent`, `dayHigh`, `dayLow`, `fetchedAt`.
- Price refresh respects the 15-min TTL but the manual refresh button bypasses it.
- Consider adding auto-polling every 5 minutes while the stock detail page is open (with a max age check) — defer to a future story if scope is large.

## Dev Agent Record
- **Component:** `stock-price-header.tsx`, `freshness-badge.tsx`
- **Service:** `StockService.getQuote(symbol)`, `StockService.refreshQuote(symbol)`
- **Data Flow:** Mount → TTL check → cached/API → price header render
- **Stores:** `useQuoteStore` (quotes by ticker, loading state)
