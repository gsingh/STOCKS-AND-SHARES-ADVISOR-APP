## Story
**As a** retail investor using the 8-step framework,  
**I want** steps that overlap with the scorecard to auto-populate with scorecard data,  
**So that** I don't have to re-enter data that the app already knows.

## Acceptance Criteria
1. **Auto-Populated Steps**: Steps 3 (Financials), 4 (Profitability), 5 (Valuation), and 6 (Balance Sheet) auto-populate their fields from the scorecard's fundamental data when the framework page loads.
2. **"From Scorecard" Badge**: Each auto-populated field displays a small badge "from scorecard" next to the value, indicating the data source.
3. **User Override**: The user can edit or override any auto-populated field. Once edited, the "from scorecard" badge changes to "modified" in a different color.
4. **Sync with Scorecard Button**: If the scorecard data has been updated since the framework was last synced, a "Sync with scorecard" button appears at the top of the framework page. Clicking it refreshes all auto-populated fields without overwriting user modifications.
5. **Stale Detection**: On framework page load, compare the `lastUpdated` timestamp of the scorecard data vs. the `lastSynced` timestamp in the framework data. If scorecard is newer, show the sync button.
6. **Conflict Handling**: When syncing, fields the user has modified are NOT overwritten. Only fields that still have "from scorecard" status get updated. This preserves user edits.

## Tasks / Subtasks
- [ ] Implement auto-population logic in `useFrameworkStore` for steps 3, 4, 5, 6
- [ ] Add `fromScorecard` and `modified` field-level status tracking in framework data schema
- [ ] Build "from scorecard" / "modified" badges for auto-populated fields
- [ ] Implement stale detection (compare scorecard `lastUpdated` vs framework `lastSynced`)
- [ ] Build "Sync with scorecard" button with confirmation
- [ ] Implement sync logic that preserves modified fields (only overwrites unchanged ones)
- [ ] Write unit tests for sync logic and stale detection

## Dev Notes
- Field-level tracking: each field in the step data has `{ value, source: 'scorecard' | 'user', lastSyncedAt }`.
- Stale detection threshold: scorecard `lastUpdated > framework.lastSynced` triggers sync button.
- The "Sync with scorecard" button should have a loading state while fetching fresh scorecard data.
- Modified fields show "modified" badge in amber; "from scorecard" fields show badge in green.

## Dev Agent Record
- **Component:** `framework-page.tsx` (integration), `data-source-badge.tsx`
- **Stores:** `useFrameworkStore` (syncWithScorecard, isStale, autoPopulateSteps)
- **Data Flow:** Scorecard data → map to framework steps 3/4/5/6 → status badges
- **Helpers:** `detectStaleData(scorecardUpdatedAt, frameworkLastSynced)`, `mergeScorecardData(existing, scorecardData)`
