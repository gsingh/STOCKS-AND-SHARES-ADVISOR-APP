## Story
**As a** retail investor,
**I want** to check my portfolio's sector exposure against configurable limits,
**So that** I can avoid over-concentration in any single sector.

## Acceptance Criteria
1. **Sector Exposure Calculation**: Auto-calculates current % exposure for each sector from holdings.
2. **Configurable Cap**: Default sector cap is 35%, configurable in Settings (range 20-50%).
3. **Exceeds Cap Flag**: When a sector's exposure exceeds the cap, it is flagged with a red "Exceeds Cap" badge and the overage percentage.
4. **Approaching Limit Warning**: When exposure reaches 80% of the cap, show an amber "Approaching Limit" warning.
5. **Sector List**: Complete list of all sectors present in the portfolio, each showing: sector name, current %, cap %, status (within / approaching / exceeded).
6. **Progress Bar per Sector**: Visual bar showing current % relative to cap %; bar turns amber at 80% and red at 100%.
7. **Standalone Access**: Exposure check available outside review flow from portfolio page.

## Tasks / Subtasks
- [ ] Create `src/features/portfolio/exposure-check.ts` — pure function for exposure computation
- [ ] Create `src/components/features/reviews/exposure-check-view.tsx` component
- [ ] Implement sector grouping and % calculation from holdings
- [ ] Implement cap comparison logic with 80% warning threshold
- [ ] Build sector list with progress bars and status badges
- [ ] Wire configurable cap from Settings store
- [ ] Build standalone access link from portfolio page
- [ ] Write co-located tests: `exposure-check.test.ts` and `exposure-check-view.test.tsx`

## Dev Notes
- Sector % = (sum of current values for sector / total portfolio value) × 100.
- Cap threshold from `useSettingsStore.sectorCap` (default 0.35).
- 80% warning threshold = cap × 0.8.
- Exposure statuses: `within` (green), `approaching` (amber, >= 80% cap), `exceeded` (red, >= 100% cap).
- Pure exposure computation in `src/features/portfolio/exposure-check.ts`.
- Each sector needs a colour from a consistent palette (same as allocation charts).

## Dev Agent Record
- **Component:** `exposure-check-view.tsx`
- **Data Flow:** Load holdings → group by sector → compute % → compare against cap → render with status
- **Key States:** loading, computed, empty (no holdings)
- **Related Stores:** `usePortfolioStore`, `useSettingsStore`
- **Related Services:** `src/features/portfolio/exposure-check.ts`
