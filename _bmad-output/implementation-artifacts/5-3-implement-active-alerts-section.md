## Story
**As a** retail investor,
**I want** to see all active alerts in a dedicated dashboard section,
**So that** I can stay informed about drift warnings, sector cap breaches, and review due dates.

## Acceptance Criteria
1. **Alert Cards**: Each alert displays: severity icon (critical = red triangle, warning = amber circle, info = blue info), title, description, and an actionable link.
2. **Priority Ordering**: Alerts are sorted by severity (critical → warning → info), then by recency (newest first within severity).
3. **Dismissible**: Each alert card has an "×" dismiss button that removes the alert locally and persists the dismissal in Dexie.
4. **Empty State**: When no active alerts exist, display "All clear. No outstanding alerts." with a checkmark icon in muted styling.
5. **Loading State**: Skeleton placeholders for alert cards while loading.
6. **Alert Types Shown**: Review due alerts, drift flagged alerts, sector cap exceeded alerts, role mismatch alerts, benchmark underperformance alerts.
7. **Actionable Links**: Each alert card links to the relevant page (e.g., Review, Portfolio, Settings) via TanStack Router link.

## Tasks / Subtasks
- [ ] Create `src/components/features/dashboard/alerts-section.tsx` component
- [ ] Define alert data model (severity, title, description, link, timestamp, id)
- [ ] Build alert generation logic from portfolio/review/drift state
- [ ] Build alert card UI with severity icons and conditional coloring
- [ ] Implement priority sort (critical → warning → info, newest first)
- [ ] Implement dismiss functionality with Dexie persistence
- [ ] Build empty state component
- [ ] Build skeleton loading state
- [ ] Write co-located tests: `alerts-section.test.tsx`

## Dev Notes
- Alert data model stored in Dexie `alerts` table with `dismissed` boolean field.
- Dismissed alerts are filtered out on load but retained in DB for history.
- Alerts regenerate on portfolio changes, review creation, and drift computation.
- Use `lucide-react` icons: `AlertTriangle` (critical), `AlertCircle` (warning), `Info` (info).

## Dev Agent Record
- **Component:** `alerts-section.tsx`
- **Data Flow:** Load alerts from Dexie → filter dismissed → sort → render cards → dismiss updates DB
- **Key States:** loading (skeleton), loaded (with alerts), empty (no alerts), error
- **Related Stores:** `ui-store` (alert visibility), `useAlertStore`
- **Related Services:** `db.ts` (alerts table)
