## Story
**As a** first-time user,
**I want** to be automatically guided to the risk profiling questionnaire on first app launch,
**So that** I can establish my investor profile before using portfolio analysis features, ensuring the app tailors recommendations to my risk tolerance.

## Acceptance Criteria
1. **First-Run Detection**: On app initialization, check the Dexie `userPreference` table for an existing `riskProfile`. If `riskProfile` is undefined or empty, this is a first run.
2. **Automatic Redirect**: If no risk profile exists, the user is automatically redirected to the risk profiling route (`/risk-profiling` or similar) regardless of the URL they initially requested.
3. **Route Guard**: A route guard or layout component wraps protected routes. Any route other than `/risk-profiling` checks for existing profile and redirects if missing.
4. **Skip Option**: The intro screen of the questionnaire includes a visible "Skip for now" link that navigates to the home page without completing the assessment.
5. **Skip Flag**: When skipped, set a `riskProfileSkipped: true` flag in `userPreference` with a timestamp, so the redirect does not fire again on every page load.
6. **Delayed Reminder**: If skipped, the app shows an in-app banner or toast on the dashboard after 3 launches or 7 days (whichever comes first) suggesting the user complete the profiling.
7. **Re-trigger from Settings**: Even after completing or skipping, the user can manually re-trigger the risk profiling from the Settings page to update their profile.
8. **No Loop on Skip**: The skip flag ensures the user can navigate the app freely; the redirect only fires if both `riskProfile` and `riskProfileSkipped` are absent.
9. **Same Pattern as MF App**: This implementation mirrors the first-run redirect pattern used in the existing mutual fund app.

## Tasks / Subtasks
- [ ] Implement first-run check on app initialization (route level or layout level)
- [ ] Create route guard component `RequireRiskProfile` or similar
- [ ] Wire redirect logic in TanStack Router (beforeLoad or router redirect)
- [ ] Implement skip flag storage in Dexie `userPreference`
- [ ] Build delayed reminder banner/toast after skip
- [ ] Add risk profiling re-trigger button in Settings page
- [ ] Test lifecycle: first run → redirect → skip → no redirect → reminder → complete → no redirect
- [ ] Test lifecycle: first run → complete → no redirect

## Dev Notes
- The route guard checks should happen in TanStack Router's `beforeLoad` or within a root layout's `useEffect` to avoid flash of wrong content.
- Use `useEffect` on app mount to check `userPreference` for `riskProfile`; if not found and not skipped, use router `navigate()` to redirect.
- The delayed reminder: store `skipCount` and `skippedAt` in userPreference; on dashboard mount, check if `skipCount >= 3` or `daysSince(skippedAt) >= 7` and show a dismissible banner.
- This is intentionally the same pattern as the MF app to maintain consistency — refer to existing MF app implementation for reference.

## Dev Agent Record
- **Component:** `RequireRiskProfile` (route guard), Dashboard banner
- **Data Flow:** App init → Dexie check → redirect or render → skip/complete → no further redirect
- **Dexie Table:** `userPreference` (riskProfile, riskProfileSkipped, skipCount, skippedAt)
- **Route Integration:** TanStack Router `beforeLoad` guard on protected routes
