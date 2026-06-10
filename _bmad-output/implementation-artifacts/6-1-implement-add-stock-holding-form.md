## Story
**As a** retail investor,
**I want** to add a stock holding to my portfolio with purchase details,
**So that** I can track my investments and see real-time P&L.

## Acceptance Criteria
1. **Dialog Form**: Add stock holding opens in a shadcn Dialog component with a form.
2. **Stock Autocomplete**: A searchable stock selector that queries the local `stocks` Dexie table by name or ticker with a 300ms debounce.
3. **Quantity Field**: Number input for quantity with min=0.001, step=1.
4. **Average Buy Price**: Currency input (₹) in en-IN locale format, min=0.01.
5. **Date Picker**: shadcn DatePicker or native date input for purchase date, defaults to today.
6. **Goal Link**: Optional dropdown to link this holding to an existing goal from the `goals` table.
7. **Notes Field**: Optional textarea for purchase notes.
8. **Current Value Display**: Shows current market price from QuoteService with FreshnessBadge, and computed current value (quantity × current price).
9. **Validation**: Required fields (stock, quantity, avg buy price) validated before submission; errors shown inline.
10. **Persistence**: On submit, holding is saved to Dexie `holdings` table with computed P&L = (current price - avg buy price) × quantity.

## Tasks / Subtasks
- [ ] Create `src/components/features/portfolio/add-holding-dialog.tsx` component
- [ ] Build stock autocomplete with Dexie search and debounce
- [ ] Build form fields: quantity, avg buy price, date picker, goal selector, notes
- [ ] Fetch current price from QuoteService for live value display
- [ ] Implement form validation with Zod schema
- [ ] Wire goal selector from Dexie `goals` table
- [ ] Implement submit handler that persists to `holdings` table
- [ ] Write co-located tests: `add-holding-dialog.test.tsx`

## Dev Notes
- Use React Hook Form + Zod for form validation.
- Currency input should use en-IN formatting (e.g., ₹1,23,456.78).
- Goal selector is optional; link via foreign key `goalId` on the holding record.
- Holding record schema: `{ id, stockId, ticker, name, quantity, avgBuyPrice, purchaseDate, goalId?, notes, createdAt, updatedAt }`.
- Current price fetched from `quote-service.getQuote(stockId)`.

## Dev Agent Record
- **Component:** `add-holding-dialog.tsx`
- **Data Flow:** Open dialog → search stock → fill form → fetch live price → validate → save to Dexie
- **Key States:** dialog closed, stock searching, price loading, form submitting, success, error
- **Related Stores:** `usePortfolioStore`
- **Related Services:** `quote-service`, `stock-service`, `db.ts` (holdings table)
