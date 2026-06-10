## Story
**As a** retail investor,  
**I want** to search for stocks by name or ticker symbol with real-time results,  
**So that** I can quickly find any stock in the NSE/BSE universe without navigating through paginated lists.

## Acceptance Criteria
1. **Search Input**: A search input (using shadcn Input component) is prominently placed at the top of the Stock Browser page with placeholder text "Search by name or ticker…".
2. **Real-time Search**: As the user types, search results update in real-time with a 300ms debounce to avoid excessive queries.
3. **Local-First Lookup**: The search queries IndexedDB (via Dexie) first for instant results; if no local matches exist, it falls back to `nse-bse-api`.
4. **Keyboard Shortcut**: Pressing the `/` key from anywhere on the Browser page focuses the search input.
5. **Empty State**: When no stocks match the query, display "No stocks match" with a muted text style and a search icon.
6. **Result Rendering**: Search results show ticker symbol (bold) and company name, matching against both fields with partial substring matching.
7. **Clear Button**: An "×" clear button appears in the input when it has text, clearing the search and resetting the list.
8. **URL Sync**: The search query updates the URL query parameter `?q=` for shareability and browser back/forward support.

## Tasks / Subtasks
- [ ] Create `src/components/features/browser/stock-search.tsx` with shadcn Input + search icon
- [ ] Implement `useDebounce` hook or inline debounce logic (300ms)
- [ ] Create local Dexie search query against `stocks` table (name, ticker fields)
- [ ] Wire fallback API call to `nse-bse-api` when local results are empty
- [ ] Add `/` key global listener to focus search input
- [ ] Handle empty state rendering
- [ ] Sync search term with URL query params via TanStack Router `useSearch`

## Dev Notes
- Keep the search input fixed at the top of the browser viewport when scrolling the results list.
- Consider displaying the last 5 recent searches below the input on focus (future enhancement).
- The debounce should cancel previous pending API calls to avoid stale results.
- IndexedDB search uses `stocks.where('name').startsWithIgnoreCase()` and `stocks.where('ticker').startsWithIgnoreCase()` with a union.

## Dev Agent Record
- **Component:** `stock-search.tsx`
- **Data Flow:** User types → debounce → Dexie query → fallback API → render results
- **Key Bindings:** `/` focuses search, `Escape` blurs/clears search
- **Related Stores:** `useStockStore` (searchTerm, setSearchTerm, searchResults)
