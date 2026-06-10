## Story
**As a** retail investor,
**I want** to link transactions to specific goals,
**So that** I can track how much I've invested toward each goal and see its performance.

## Acceptance Criteria
1. **Goal Selector in Transaction Form**: The transaction dialog includes a goal dropdown selector populated from Dexie `goals` table.
2. **Link on Save**: When a goal is selected, the transaction is saved with the `goalId` foreign key.
3. **Goal Page Aggregation**: The goal detail page shows total invested (sum of transaction amounts) and current value from linked holdings.
4. **Multiple Goals**: A transaction can only be linked to one goal, but a goal can have many transactions.
5. **Holding-Goal Link**: When adding a holding via the portfolio form, the goal selector links the holding (and its future transactions) to the goal.
6. **Unlink Option**: Users can unlink a transaction from a goal via edit, clearing the `goalId`.
7. **Visual Indicator**: Transactions linked to a goal show a small goal badge/tag in the transaction list.

## Tasks / Subtasks
- [ ] Add goal selector dropdown to transaction dialog and add-holding dialog
- [ ] Persist `goalId` on transaction and holding records
- [ ] Update goal detail page to aggregate linked transaction/holding data
- [ ] Implement unlink functionality in transaction edit
- [ ] Add goal badge to transaction list items
- [ ] Write co-located tests: `goal-linking.test.tsx`

## Dev Notes
- Transaction schema updated with optional `goalId` field.
- Holding schema already includes `goalId` from story 6.1.
- Goal page aggregates: totalInvested = sum(transaction.quantity × transaction.price) for linked transactions.
- Current value comes from linked holdings: sum(holding.quantity × currentPrice).
- Goal badge: small pill with goal name and coloured dot based on goal type.

## Dev Agent Record
- **Component:** goal selector integrated into `transaction-dialog.tsx` and `add-holding-dialog.tsx`
- **Data Flow:** Select goal in form → save transaction/holding with goalId → goal page queries by goalId → aggregate
- **Key States:** no goals (selector hidden/disabled), goals available, linked, unlinked
- **Related Stores:** `useGoalStore`
- **Related Services:** `db.ts` (transactions table, holdings table, goals table)
