## Story
**As a** retail investor,
**I want** to export all my app data (portfolio, transactions, goals, journals, scores, settings) as a JSON file,
**So that** I can back up my data or migrate it to another device.

## Acceptance Criteria
1. **Export Button**: A prominent "Export Data" button on the Settings page under a "Data Management" section.
2. **Data Collection**: Clicking the button collects data from all Dexie tables: `portfolio`, `transactions`, `goals`, `journalEntry`, `scorecard`, `userPreference`, and any other relevant tables.
3. **Export Format**: The data is structured as a JSON object with a `version` field (current app version), `exportedAt` (ISO timestamp), and a `tables` object containing each table's data as an array: `{ version: "1.0.0", exportedAt: "2026-06-08T12:00:00.000Z", tables: { portfolio: [...], transactions: [...], goals: [...], journalEntry: [...], scorecard: [...], userPreference: [...] } }`.
4. **File Download**: The JSON is downloaded as a file named `stocks-advisor-export-YYYY-MM-DD.json` via a Blob URL and programmatic click on an anchor element.
5. **Progress Indicator**: A loading spinner or progress bar is shown while data is being collected (especially relevant for large datasets).
6. **Success Feedback**: A toast notification confirms "Data exported successfully" with the file name.
7. **Error Handling**: If collection fails (e.g., Dexie unavailable), show an error toast with a retry option.
8. **Large Data Warning**: If the estimated data size exceeds 10MB, show a confirmation dialog warning the user before proceeding.

## Tasks / Subtasks
- [ ] Create `src/features/data/data-export.ts` with pure export logic
- [ ] Implement Dexie data collection from all tables
- [ ] Build export format with version and timestamp
- [ ] Implement file download via Blob/URL.createObjectURL
- [ ] Add loading state / spinner during export
- [ ] Add success toast notification
- [ ] Add error handling with retry
- [ ] Add size estimation and large-data warning dialog
- [ ] Wire the button to Settings page Data Management section

## Dev Notes
- Dexie's `table.toArray()` returns all records for a table. Use `Promise.all()` to collect from all tables in parallel.
- File download: `const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })` then `URL.createObjectURL(blob)`.
- Size estimation: `new Blob([JSON.stringify(data)]).size` before download.
- Ensure no sensitive data is inadvertently included — Dexie data is local-only so this is acceptable.
- The exported JSON should be human-readable with 2-space indentation.

## Dev Agent Record
- **Module:** `src/features/data/data-export.ts`
- **Data Flow:** Dexie tables → collect all → format JSON → download via Blob
- **Dexie Tables:** portfolio, transactions, goals, journalEntry, scorecard, userPreference (all)
- **Related Stores:** `useSettingsStore` (exportTrigger, exportState)
