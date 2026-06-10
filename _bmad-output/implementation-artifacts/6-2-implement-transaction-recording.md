## Story
**As a** retail investor,
**I want** to record buy and sell transactions for my holdings,
**So that** I can maintain an accurate transaction history and track cost basis.

## Acceptance Criteria
1. **Transaction Form Dialog**: shadcn Dialog with form fields: date, type (Buy/Sell/SIP), stock selector, quantity, price, brokerage, notes, goal link.
2. **Stock Selector**: Reusable autocomplete component that searches Dexie `stocks` table by name/ticker with debounce.
3. **Buy Transaction**: Adds quantity to the holding's running total; creates a new holding if one doesn't exist for that stock.
4. **Sell Transaction**: Reduces quantity; validation shows error if sell quantity exceeds current holding quantity.
5. **SIP Transaction Type**: Indicates systematic investment plan purchase; stored with `type: 'SIP'` and treated as buy for quantity tracking.
6. **Running Units Total**: After save, the holding's total quantity and average buy price are recalculated using FIFO or weighted average method.
7. **Brokerage Field**: Optional currency input for brokerage fees, stored per transaction.
8. **Validation**: Required fields enforced; sell quantity cannot exceed available holdings; date cannot be in the future.
9. **Persistence**: Transactions saved to Dexie `transactions` table; holdings `quantity` and `avgBuyPrice` updated accordingly.

## Tasks / Subtasks
- [ ] Create `src/components/features/portfolio/transaction-dialog.tsx` component
- [ ] Build form fields: date, type (Buy/Sell/SIP), stock, quantity, price, brokerage, notes, goal
- [ ] Implement stock autocomplete (reuse or compose from add-holding-dialog)
- [ ] Implement validation: sell ≤ holdings, required fields, date ≤ today
- [ ] Implement weighted average cost basis update on buy
- [ ] Implement quantity reduction on sell with validation
- [ ] Handle SIP type as buy for quantity tracking
- [ ] Persist to Dexie `transactions` table and update `holdings` table
- [ ] Write co-located tests: `transaction-dialog.test.tsx`

## Dev Notes
- Weighted average: newAvgBuyPrice = ((oldQty × oldAvg) + (newQty × newPrice)) / (oldQty + newQty).
- Sell transactions do not affect avgBuyPrice, only reduce quantity.
- SIP transactions are tagged for future SIP performance analytics.
- Transaction schema: `{ id, date, type, stockId, ticker, name, quantity, price, brokerage, notes, goalId?, createdAt }`.
- Holding schema updated fields: `quantity, avgBuyPrice, lastTransactionDate`.

## Dev Agent Record
- **Component:** `transaction-dialog.tsx`
- **Data Flow:** Open dialog → select stock → fill details → validate → save transaction → update holding
- **Key States:** dialog closed, stock searching, submitting, success, error (insufficient holdings)
- **Related Stores:** `usePortfolioStore`
- **Related Services:** `db.ts` (transactions table, holdings table)
