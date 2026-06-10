## Story
**As a** retail investor,
**I want** to compare each holding's returns against relevant benchmarks,
**So that** I can identify underperforming stocks and decide whether to replace them.

## Acceptance Criteria
1. **Benchmark Selection**: Each stock compared against its sector index if available, otherwise against Nifty 50.
2. **Time Periods**: Comparison shows trailing returns for 1Y, 3Y, and 5Y periods.
3. **Return Display**: For each period, show: stock return %, benchmark return %, and the difference (stock - benchmark).
4. **Underperformance Flag**: If stock underperforms benchmark by more than 5% in any period, highlight in red and show an alert badge.
5. **Overperformance Flag**: If stock outperforms by more than 5%, highlight in green with a positive badge.
6. **Summary Card**: Portfolio-level summary showing count of holdings outperforming, matching, and underperforming benchmarks.
7. **Configurable Threshold**: Underperformance alert threshold configurable in Settings (default 5%, range 1-20%).
8. **Standalone Access**: Benchmark comparison accessible outside review flow.

## Tasks / Subtasks
- [ ] Create `src/features/portfolio/benchmark-comparison.ts` — pure function for comparison logic
- [ ] Create `src/components/features/reviews/benchmark-comparison-view.tsx` component
- [ ] Fetch stock trailing returns (1Y, 3Y, 5Y) from quote-service or stock metadata
- [ ] Fetch benchmark returns for same periods
- [ ] Implement return comparison with difference calculation
- [ ] Implement under/over performance flagging with configurable threshold
- [ ] Build per-stock comparison table
- [ ] Build portfolio-level summary card
- [ ] Write co-located tests: `benchmark-comparison.test.ts` and `benchmark-comparison-view.test.tsx`

## Dev Notes
- Stock trailing returns stored in Dexie `stockReturns` table or computed from historical quotes.
- Benchmark returns stored similarly; sector indices mapped per stock in stock metadata.
- Underperformance: stockReturn - benchmarkReturn < -threshold (e.g., -5%).
- Overperformance: stockReturn - benchmarkReturn > threshold.
- Pure comparison function in `src/features/portfolio/benchmark-comparison.ts`.
- If no return data available for a period, show "N/A" with muted styling.

## Dev Agent Record
- **Component:** `benchmark-comparison-view.tsx`
- **Data Flow:** Load holdings → fetch returns + benchmark data → compare → flag → render
- **Key States:** loading, computed, missing data (N/A periods), empty (no holdings)
- **Related Stores:** `usePortfolioStore`, `useSettingsStore`
- **Related Services:** `quote-service`, `stock-service`, `src/features/portfolio/benchmark-comparison.ts`
