## Story
**As a** retail investor,
**I want** a quick actions bar on my dashboard with one-click access to key features,
**So that** I can navigate to Add Stock, New Journal Entry, Start Review, or New Comparison without digging through menus.

## Acceptance Criteria
1. **Four Action Buttons**: "Add Stock" → navigates to Stock Browser, "New Journal Entry" → navigates to Journal, "Start Review" → navigates to Reviews, "New Comparison" → navigates to Compare.
2. **Button Styling**: Outlined primary buttons with consistent sizing, icons on the left, label text on the right.
3. **Icons**: Each button has a distinct icon (PlusCircle, Edit3, ClipboardCheck, BarChart3 from lucide-react).
4. **Horizontal Row Layout**: Buttons displayed in a horizontal flex row, wrapping to 2x2 grid on smaller screens.
5. **Keyboard Shortcuts**: Tooltip on hover shows keyboard shortcut (if available) for each action.
6. **Accessibility**: Each button has an `aria-label` matching its action.

## Tasks / Subtasks
- [ ] Create `src/components/features/dashboard/quick-actions.tsx` component
- [ ] Define 4 action items with icon, label, route path, optional keyboard shortcut
- [ ] Build horizontal button bar with responsive wrapping
- [ ] Wire navigation via TanStack Router `useNavigate`
- [ ] Add hover tooltips with shortcut hints
- [ ] Ensure proper aria labels for accessibility
- [ ] Write co-located tests: `quick-actions.test.tsx`

## Dev Notes
- Routes: Add Stock → `/browser`, New Journal Entry → `/journal`, Start Review → `/reviews`, New Comparison → `/compare`.
- Use `Button` variant="outline" from shadcn with icon+label children.
- Responsive: `flex-row flex-wrap gap-2` on desktop, `grid grid-cols-2` on mobile.
- Future: customizable quick actions via Settings.

## Dev Agent Record
- **Component:** `quick-actions.tsx`
- **Data Flow:** Static action definitions → render buttons → navigate on click
- **Key States:** N/A (static list, no loading/error)
- **Related Stores:** none
- **Router:** TanStack Router `useNavigate`
