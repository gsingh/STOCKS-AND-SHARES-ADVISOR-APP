## Story
**As a** retail investor,  
**I want** Yahoo Finance ticker lookups to work for all Nifty 50 stocks,  
**So that** forecasts and price history load correctly for every major Indian stock, not just those with matching NSE and Yahoo symbols.

## Acceptance Criteria
1. **Research Nifty 50 Yahoo mappings**: For each stock in the Nifty 50 index, verify the `toYahooSymbol()` function produces the correct Yahoo Finance ticker. Identify any symbols where the Yahoo ticker differs from the NSE symbol with `.NS` suffix.
2. **Populate override map**: Add entries to `src/services/yahoo-symbol.ts` `NSE_TO_YAHOO` record for all identified mismatches.
3. **Test symbol resolution**: Verify `toYahooSymbol()` returns the correct Yahoo ticker for stocks in the override map and the standard `SYMBOL.NS` for all others.
4. **Handle special characters**: If any symbols contain characters requiring URL encoding (e.g., `&`), ensure `toYahooSymbol()` produces a ticker that works with the Yahoo Finance proxy endpoint.

## Tasks / Subtasks
- [ ] Get the current Nifty 50 constituent list (NSE symbols)
- [ ] For each symbol, attempt Yahoo Finance chart fetch with `<NSE_SYMBOL>.NS` and identify failures
- [ ] Research correct Yahoo tickers for failed symbols via Yahoo Finance search
- [ ] Add entries to `NSE_TO_YAHOO` record in `src/services/yahoo-symbol.ts`
- [ ] Test `fromYahooSymbol()` round-trip still works for overridden symbols
- [ ] Verify forecasts and price history load for all mapped stocks

## Dev Notes
- Current override map only has one entry: `TATAMOTORS: 'TMCV'` (`src/services/yahoo-symbol.ts:2`)
- Common NSE-Yahoo mismatches for Nifty 50 may include symbols with special characters (e.g., `M&M`), REITs/InvITs, or symbols where Yahoo uses a different convention.
- The forecast service resolves symbols via `toYahooSymbol()` → `SYMBOL.NS` → Yahoo Finance API. A wrong mapping means no historical prices for forecasting.
- Use the Yahoo Finance proxy endpoint `/api/yahoo/v8/finance/chart/<SYMBOL>` to test each ticker.

### Review Findings
- [x] [Review][Defer] `toYahooSymbol('')` returns `.NS` — no empty string guard. Rare edge case; symbols come from NSE CSV [yahoo-symbol.ts]
- [ ] [Review][Patch] AC1-AC3 violations: symbol map research incomplete; only TATAMOTORS mapped. No tests for symbol resolution.

## Dev Agent Record
- **Component:** `src/services/yahoo-symbol.ts`
- **Data Flow:** `toYahooSymbol(NSE_SYMBOL) → Yahoo_TICKER → Yahoo Finance proxy → price data → forecast`
- **Impact:** Missing mappings cause forecast failures for affected stocks
