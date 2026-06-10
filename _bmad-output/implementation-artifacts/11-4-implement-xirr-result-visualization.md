## Story
**As a** retail investor,
**I want** to see my XIRR calculation results displayed with key metrics and visual indicators,
**So that** I can quickly understand my portfolio's annualised return, total invested, and overall gains.

## Acceptance Criteria
1. **Result Display**: The XIRR result card shows: XIRR percentage (large, bold, color-coded green for positive, red for negative), total amount invested, current portfolio value, and total gains/losses (absolute + percentage).
2. **Color Coding**: Positive XIRR is displayed in green (Accent #1E7A45), negative in red (#B22222), zero/neutral in muted text.
3. **Invested vs Current Visualization**: A stacked bar or side-by-side bar chart showing total invested vs current value using Recharts.
4. **Gains Breakdown**: If gains are positive, show "Profit of ₹X,XXX (XX%)"; if negative, show "Loss of ₹X,XXX (XX%)".
5. **Empty State**: When no transactions are available, display "Add transactions to compute XIRR" with an illustration/icon and a CTA button linking to the transaction entry form.
6. **Integration with Portfolio**: The XIRR display pulls transactions from the Dexie `transactions` table (buys as negative amounts, current holding value as positive). It uses the `calculateXIRR` pure function from Story 11.3.
7. **Loading State**: While XIRR is being computed (for large transaction sets), show a skeleton placeholder.
8. **Error State**: If XIRR computation fails to converge, display "Could not compute XIRR for this set of transactions. Try adjusting the date range or adding more transactions." with a retry button.

## Tasks / Subtasks
- [ ] Create `src/components/features/xirr/xirr-result.tsx` result card component
- [ ] Build XIRR percentage display with color coding
- [ ] Build invested vs current value summary section
- [ ] Build gains/losses display with absolute and percentage
- [ ] Implement Recharts bar chart for invested vs current
- [ ] Build empty state with CTA to add transactions
- [ ] Build loading skeleton
- [ ] Build error state with retry
- [ ] Wire transactions data from Dexie to the XIRR calculator
- [ ] Integrate with portfolio page / dedicated XIRR page

## Dev Notes
- The XIRR component can be placed on the portfolio summary page and/or a dedicated XIRR page.
- Data transformation: fetch all transactions from Dexie `transactions` table, map buys/sells to the required format (buys: negative amount, sells: positive amount), add current holding value as a final positive transaction with today's date.
- Use `Intl.NumberFormat('en-IN')` for all currency formatting.
- For the bar chart, use Recharts `<BarChart>` with two `<Bar>` components (Invested, Current Value).
- Consider adding a date range filter on the XIRR view so users can compute XIRR for custom periods.

## Dev Agent Record
- **Component:** `xirr-result.tsx`
- **Data Flow:** Dexie transactions → format as XIRRTransaction[] → calculateXIRR → display result
- **Dexie Table:** `transactions` (source data)
- **Chart:** Recharts BarChart (Invested vs Current Value)
- **Related Stores:** `usePortfolioStore` (transactions, currentValue)
