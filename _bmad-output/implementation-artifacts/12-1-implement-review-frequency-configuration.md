## Story
**As a** retail investor,
**I want** to configure how often the app reminds me to review my portfolio holdings,
**So that** the review schedule matches my preferred cadence and I don't miss important check-ins.

## Acceptance Criteria
1. **Settings Section**: A "Review Schedule" section on the Settings page with radio buttons for Monthly and Quarterly frequency options.
2. **Monthly Option**: Selecting "Monthly" sets the review frequency to 30 days; the next review date is auto-calculated as `today + 30 days`.
3. **Quarterly Option**: Selecting "Quarterly" sets the review frequency to 90 days; the next review date is auto-calculated as `today + 90 days`.
4. **Next Review Date Display**: The next review date is displayed prominently (e.g., "Next review: 15 Jul 2026") with a calendar icon.
5. **Manual Override**: The user can manually override the next review date using a date picker. When overridden, a small "Reset to auto" link appears to revert to the calculated date based on current frequency.
6. **Persistence**: The review frequency and next review date are persisted in the Dexie `userPreference` table.
7. **Banner/Dashboard Integration**: If today is on or after the next review date, a dismissible banner appears on the dashboard: "Time to review your portfolio. Your next review was due on [date]."
8. **Default**: The default frequency is Monthly with next review date = `today + 30 days` for new users.

## Tasks / Subtasks
- [ ] Add `reviewFrequency` and `nextReviewDate` fields to Dexie `userPreference` schema
- [ ] Build review frequency radio group component (Monthly / Quarterly)
- [ ] Implement auto-calculation of next review date on frequency change
- [ ] Implement manual date override with date picker
- [ ] Add "Reset to auto" link for manual overrides
- [ ] Wire persistence to Dexie on any change
- [ ] Build dashboard review-due banner
- [ ] Implement dismissible banner with session storage to avoid re-show on same session

## Dev Notes
- Store `reviewFrequency` as `'monthly' | 'quarterly'` string.
- Store `nextReviewDate` as ISO date string.
- Auto-calculation: `nextReviewDate = new Date(Date.now() + frequencyInDays * 86400000).toISOString().split('T')[0]`.
- Banner visibility: check `new Date() >= new Date(nextReviewDate)` on dashboard mount.
- The banner should be dismissible for the current session only (use sessionStorage flag).

## Dev Agent Record
- **Component:** `settings-review-frequency.tsx`, `review-due-banner.tsx`
- **Data Flow:** User selection → auto-calc → Dexie persist → dashboard check → banner render
- **Dexie Table:** `userPreference` (reviewFrequency, nextReviewDate)
- **Related Stores:** `useSettingsStore` (frequency, nextReviewDate, setFrequency, setNextReviewDate)
