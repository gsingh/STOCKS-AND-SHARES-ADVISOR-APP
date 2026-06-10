## Story
**As a** retail investor,
**I want** to see concise definitions of financial terms by hovering over or clicking parameter names throughout the app,
**So that** I can understand scorecard metrics and table headers without navigating away to a separate glossary.

## Acceptance Criteria
1. **TermInfo Popover**: A popover component displays when the user hovers over (desktop) or taps (mobile) a term-trigger element, showing the term name (bold), short definition, and a "Read more →" link to the full glossary page.
2. **Wire Up Scorecard Parameters**: All parameter names on the stock scorecard (e.g., P/E, ROE, ROCE, Market Cap, Dividend Yield) are wrapped with the TermInfo popover trigger.
3. **Wire Up Table Headers**: Comparison table headers that correspond to glossary terms are wrapped with the TermInfo popover trigger.
4. **Data Source**: The popover content is loaded from the same glossary data source (`glossary-data.ts`) by matching the term name.
5. **Fallback Handling**: If a term label doesn't match any glossary entry, the popover gracefully degrades — either shows nothing or displays "Definition coming soon."
6. **Dismiss Behavior**: The popover dismisses when the user clicks outside, presses Escape, or moves the cursor away (with a 300ms delay to avoid flickering on accidental mouse movements).
7. **Accessibility**: Popovers are triggered on focus as well as hover for keyboard users. `aria-describedby` is wired appropriately.
8. **Reusable Component**: The `TermInfo` component is built as a reusable wrapper that accepts a `term` (string) prop and renders its children with the popover trigger behavior. It should already exist in shared components — this story wires it up to actual usage locations.

## Tasks / Subtasks
- [ ] Locate or create the shared `TermInfo` popover component (in `src/components/shared/` or similar)
- [ ] Ensure TermInfo accepts `term: string` prop and looks up glossary data
- [ ] Build the popover content layout (term name, short definition, "Read more" link)
- [ ] Implement hover/click/focus trigger behavior with appropriate dismiss
- [ ] Wire TermInfo to all scorecard parameter labels in Scorecard component
- [ ] Wire TermInfo to comparison table header cells
- [ ] Handle fallback for unmatched term names
- [ ] Ensure keyboard accessibility (focus trigger, Escape dismiss, aria attributes)

## Dev Notes
- The TermInfo component should already exist as a placeholder in shared components per the architecture. If found, use it; if not, create it at `src/components/shared/terminfo.tsx`.
- Trigger behavior: `<span className="cursor-help border-b border-dotted ...">` around the term text signals it's interactive.
- Popover uses shadcn Popover component. Position: top or bottom depending on available viewport space.
- "Read more →" navigates to `/glossary?term=PE%20Ratio` to scroll to that term in the glossary.
- Performance: glossary data is a static import — no async loading needed. The lookup is a simple `Map.get(termName)`.

## Dev Agent Record
- **Component:** `terminfo.tsx` (shared), Scorecard modification, ComparisonTable modification
- **Data Flow:** Term prop → glossary Map lookup → popover content render
- **Data Source:** `glossary-data.ts` (shared static data)
- **Accessibility:** Keyboard focus trigger, aria-describedby, Escape dismiss
