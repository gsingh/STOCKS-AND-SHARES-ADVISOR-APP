## Story
**As a** keyboard-only or screen reader user,  
**I want** the Stock Browser to be fully navigable via keyboard and accessible to assistive technology,  
**So that** I can browse, filter, and select stocks without a mouse.

## Acceptance Criteria
1. **Logical Tab Order**: Tab order flows: search input → filter panel (tab through each filter) → stock table (rows) → pagination controls. No focus traps.
2. **Enter/Space Activation**: Pressing Enter or Space on a table row navigates to Stock Detail. Enter/Space on "+" compare toggles add/remove.
3. **Arrow Key Dropdowns**: Within dropdowns (sector select, pagination), Arrow Up/Down navigates options, Enter selects, Escape closes.
4. **Escape to Clear**: Pressing Escape in the search input clears it; pressing Escape on the filter panel collapses it; pressing Escape on the table returns focus to search.
5. **Skip to Content**: A "Skip to content" link is the first focusable element, skipping navigation to jump to the stock table.
6. **ARIA Labels**: All interactive elements have meaningful `aria-label` attributes: "Search stocks by name or ticker", "Sort by [column] ascending", "Page [number]", "Add [ticker] to compare".
7. **Live Regions**: Search results and filter updates use `aria-live="polite"` regions so screen readers announce count changes.
8. **Focus Management**: When filters change and the table re-renders, focus stays on the active element. When paginating, focus moves to the first row or the pagination control. When the compare tray opens, focus moves to the first item.
9. **Reduced Motion**: Animation and CSS transitions respect `prefers-reduced-motion`.

## Tasks / Subtasks
- [ ] Audit all interactive elements for proper tab order and ARIA labels
- [ ] Implement "Skip to content" link at page top
- [ ] Add keyboard event handlers for Enter/Space on table rows
- [ ] Implement arrow key navigation for custom dropdowns
- [ ] Add Escape key handlers for search clear, filter collapse, focus return
- [ ] Add `aria-live="polite"` regions for dynamic content updates
- [ ] Implement focus management hooks for pagination, filter changes, tray open
- [ ] Add `prefers-reduced-motion` media query to CSS transitions
- [ ] Test with VoiceOver (macOS) and keyboard-only navigation
- [ ] Add `role="region"` and `aria-label` to major sections

## Dev Notes
- Use `useFocusTrap` from `@headlessui/react` or a custom hook for modals/dropdowns.
- Use `aria-sort` on sortable column headers with values `none`/`ascending`/`descending`.
- The compare tray (Story 4.1) should be testable with keyboard: Tab enters the tray, Escape closes it.
- Run axe-core devtools or `@axe-core/react` to audit after implementation.

## Dev Agent Record
- **Component:** `stock-browser.tsx` (integration), `skip-to-content.tsx`
- **Hooks:** `useKeyboardNavigation`, `useFocusManagement`, `useLiveRegion`
- **Testing:** axe-core audit, VoiceOver manual test
- **Pattern:** Keyboard event delegation at section level, not per-element
