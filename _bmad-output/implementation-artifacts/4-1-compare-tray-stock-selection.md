## Story
**As a** retail investor,  
**I want** to select up to 4 stocks for side-by-side comparison from the Browser or Scorecard,  
**So that** I can evaluate multiple stocks together before making an investment decision.

## Acceptance Criteria
1. **Compare Toggle**: Each stock row in the Browser table and the Stock Detail header has a compare checkbox/"+ " icon toggle. Toggling adds or removes the stock from the compare list.
2. **Compare Tray**: A tray slides up from the bottom of the viewport showing the currently selected stocks as compact cards. The tray is persistent across page navigations.
3. **Max 4 Stocks**: The user can select a maximum of 4 stocks. Attempting to add a 5th shows a toast: "You can compare up to 4 stocks. Remove one to add another."
4. **Persist Across Navigations**: The compare list persists in Zustand (`useStockStore.compareList`) and survives page navigations within the app.
5. **Compare Button**: When 2 or more stocks are selected, a prominent "Compare" button appears in the tray. Clicking navigates to `/compare` route.
6. **Clear All**: A "Clear All" link in the tray empties the compare list and collapses the tray.
7. **Empty Tray**: When no stocks are selected, the tray is hidden. It only appears when ≥1 stock is added.
8. **Tray Animation**: The tray slides up with a CSS transition (`transform: translateY(0)` from `translateY(100%)`) over 200ms ease-out.

## Tasks / Subtasks
- [ ] Add `compareList` to `useStockStore` Zustand store with `addToCompare`, `removeFromCompare`, `clearCompare`, `isInCompare` actions
- [ ] Add compare toggle to Browser table rows (`stock-table.tsx`)
- [ ] Add compare toggle to Stock Detail header
- [ ] Create compare tray component `src/components/features/compare/compare-tray.tsx`
- [ ] Implement slide-up animation with CSS transition
- [ ] Add max-4 toast notification using shadcn Sonner/Toast
- [ ] Wire "Compare" button to router navigation to `/compare`
- [ ] Implement "Clear All" action

## Dev Notes
- Zustand `compareList` is an array of `{ ticker, name, sector }` objects (minimal data for tray display).
- The compare tray is rendered in the App Shell layout so it persists across routes.
- The tray should be `position: fixed; bottom: 0` and have a drag handle for future swipe-to-dismiss.
- Consider adding a close "×" button per stock card in the tray to remove individually.

## Dev Agent Record
- **Component:** `compare-tray.tsx`, `compare-toggle.tsx`
- **Stores:** `useStockStore` (compareList, addToCompare, removeFromCompare, clearCompare)
- **Data Flow:** Toggle click → Zustand store update → tray re-render (persistent via App Shell)
- **Route:** `/compare` (TanStack Router)
