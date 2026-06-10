## Story
**As a** retail investor,
**I want** to browse a comprehensive glossary of financial terms with clear definitions, examples, and explanations of why each term matters,
**So that** I can understand the metrics and ratios used in stock analysis without leaving the app.

## Acceptance Criteria
1. **Glossary Page**: A dedicated glossary page accessible from the main navigation with a searchable, alphabetically sorted list of financial terms.
2. **Minimum 37 Terms**: The glossary contains at least 37 pre-seeded financial terms including but not limited to: P/E Ratio, P/B Ratio, ROE, ROCE, Market Capitalization, EPS, Dividend Yield, Debt-to-Equity, Current Ratio, Quick Ratio, Operating Margin, Net Profit Margin, EBITDA, PEG Ratio, Dividend Payout Ratio, Book Value, Face Value, Beta, Alpha, Sharpe Ratio, Standard Deviation, RSI, MACD, Moving Average, Bollinger Bands, Volume, 52-Week High/Low, CAGR, IRR, XIRR, NAV, AUM, Free Cash Flow, Operating Cash Flow, Promoter Holding, FII/DII Holding, and Price to Sales.
3. **Search**: A search input at the top filters terms in real-time by name (case-insensitive substring match) with 200ms debounce. Shows "No terms match your search" when no results.
4. **Alphabetical Index**: A quick-jump letter index (A-Z) on the side or top, clicking a letter scrolls to terms starting with that letter.
5. **Term Card**: Each term is displayed as a card showing the term name (bold) and a one-line short definition.
6. **Full Definition View**: Clicking/tapping a term card opens an expanded view or modal showing: term name, full definition, a concrete numerical example (e.g., "If a stock's price is ₹100 and EPS is ₹10, P/E = 10"), and a "Why it matters" section explaining the term's practical significance for investment decisions.
7. **Persistent Glossary Data**: Terms are defined as a static TypeScript data file (not fetched from an API) and optionally cached in Dexie for offline access.
8. **Accessibility**: All definition views are keyboard-navigable and screen-reader friendly.

## Tasks / Subtasks
- [ ] Create `src/features/glossary/glossary-data.ts` with 37+ term objects (name, shortDef, fullDef, example, whyItMatters)
- [ ] Create `src/features/glossary/glossary-store.ts` (Zustand store for search/selection state)
- [ ] Create `src/components/features/glossary/glossary-browser.tsx` page component
- [ ] Build search input with debounce filtering
- [ ] Build alphabet index quick-jump A-Z
- [ ] Build `src/components/features/glossary/term-card.tsx` list item
- [ ] Build `src/components/features/glossary/term-definition.tsx` expanded definition view/modal
- [ ] Style term cards and definition view according to design tokens
- [ ] Ensure keyboard navigation and screen reader support

## Dev Notes
- Static data file: define as `GlossaryTerm[]` array exported from `glossary-data.ts`. Structure: `{ id, name, shortDefinition, fullDefinition, example, whyItMatters }`.
- Alphabetical quick-jump: render a row of letter buttons A-Z; clicking scrolls the first term starting with that letter into view using `scrollIntoView()`.
- The definition view can be a shadcn Dialog or an inline expandable section within the card.
- Ensure examples use Indian market context (₹, NSE/BSE, Indian companies).
- Dictionary: "Why it matters" should be practical, not academic — e.g., "A high P/E may indicate overvaluation, but could also mean the market expects high future growth."

## Dev Agent Record
- **Component:** `glossary-browser.tsx`, `term-card.tsx`, `term-definition.tsx`
- **Data Flow:** Static data + search state → filtered list → card/definition rendering
- **Data Source:** `glossary-data.ts` (static, no API dependency)
- **Related Stores:** `useGlossaryStore` (searchTerm, selectedTerm, filteredTerms)
