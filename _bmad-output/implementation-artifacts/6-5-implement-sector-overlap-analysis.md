## Story
**As a** retail investor,
**I want** to analyse sector overlap before adding a new stock to my portfolio,
**So that** I can avoid exceeding my sector exposure limits.

## Acceptance Criteria
1. **Dialog Interface**: Sector overlap analysis opens in a shadcn Dialog with a stock selector.
2. **Candidate Stock Selection**: Select a stock via autocomplete (reused from add-holding form).
3. **Current Exposure Display**: Shows the current portfolio exposure % for the candidate stock's sector.
4. **New Combined Exposure**: Projects what the sector exposure would be if the candidate stock is added (using a notional amount input).
5. **Overlap Warning**: If the new combined exposure % exceeds the sector cap (default 35%), display a prominent warning with "Exceeds cap by X%" message.
6. **Approaching Limit Warning**: If new combined exposure is within 80% of the cap, show an amber "approaching limit" warning.
7. **Amount Input**: User enters a notional investment amount (₹) to project the new combined exposure.
8. **Empty State**: If the portfolio has no holdings, display "No holdings in portfolio to compare overlap against."
9. **Action Button**: "Analyse" button triggers the projection, "Close" dismisses.

## Tasks / Subtasks
- [ ] Create `src/components/features/portfolio/sector-overlap-dialog.tsx` component
- [ ] Build stock selector autocomplete
- [ ] Compute current sector exposure from holdings
- [ ] Compute projected exposure with candidate stock + notional amount
- [ ] Implement overlap warning logic (exceeds cap, approaching limit)
- [ ] Handle empty portfolio state
- [ ] Write co-located tests: `sector-overlap-dialog.test.tsx`

## Dev Notes
- Current sector exposure = (sum of current values in sector) / (total portfolio value) × 100.
- Projected exposure = (sum of current sector values + notional amount) / (total portfolio value + notional amount) × 100.
- Cap config defaults to 35%, fetched from Settings store.
- Approaching limit = exposure >= cap × 0.8.
- Empty state displayed when `holdings.length === 0`.

## Dev Agent Record
- **Component:** `sector-overlap-dialog.tsx`
- **Data Flow:** Open dialog → select stock → enter notional amount → compute projection → show warning or all-clear
- **Key States:** dialog closed, stock selected, computing, results (warning / all-clear / empty)
- **Related Stores:** `usePortfolioStore`, `useSettingsStore`
