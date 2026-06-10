## Story
**As a** retail investor,
**I want** to import data from a previously exported JSON file,
**So that** I can restore my portfolio data on a new device or recover from a backup.

## Acceptance Criteria
1. **Import Button**: An "Import Data" button on the Settings page under the "Data Management" section, adjacent to the Export button.
2. **File Picker**: Clicking the button opens a native file picker dialog restricted to `.json` files.
3. **Format Validation**: Before importing, the app validates the file structure: checks for `version` (string), `exportedAt` (ISO string), and `tables` (object with at least one array). If invalid, show an error: "Invalid export file format. Please use a file exported from this app."
4. **Confirmation Dialog**: After validation passes, show a confirmation dialog warning: "This will replace all your current data with data from the export file. This action cannot be undone. Are you sure?" with "Cancel" and "Import" buttons.
5. **Data Replacement**: On confirmation, clear all existing data from each Dexie table, then bulk-insert the imported data using Dexie's `bulkAdd()`.
6. **Transaction Safety**: The entire import operation is wrapped in a Dexie transaction to ensure atomicity — if any table import fails, all changes are rolled back.
7. **Progress Indicator**: A progress bar shows the import progress as each table is processed.
8. **Success Feedback**: A toast notification confirms "Data imported successfully" with the count of records imported per table.
9. **Error Handling**: If the import fails at any stage, show an error toast and roll back all changes. Provide a "Try Again" action.

## Tasks / Subtasks
- [ ] Create `src/features/data/data-import.ts` with pure import logic
- [ ] Implement file picker with .json filter
- [ ] Implement format validation (version, exportedAt, tables structure)
- [ ] Build confirmation dialog with data replacement warning
- [ ] Implement Dexie table clearing + bulkAdd with transaction wrapping
- [ ] Implement progress tracking per table
- [ ] Add success toast with per-table record counts
- [ ] Add error handling with rollback
- [ ] Wire the button to Settings page Data Management section

## Dev Notes
- Use Dexie `db.transaction('rw', table1, table2, ..., async () => { ... })` to wrap the import atomically.
- Clear each table with `table.clear()` before `bulkAdd()`.
- Progress tracking: iterate tables sequentially (not parallel) to show meaningful progress steps; use a state variable for current table index.
- Validation should be thorough but not overly picky about field-level schema (allow for forward compatibility).
- After successful import, refresh any in-memory caches/stores to reflect new data (trigger store re-fetches).

## Dev Agent Record
- **Module:** `src/features/data/data-import.ts`
- **Data Flow:** File picker → validation → confirmation → Dexie transaction (clear + bulkAdd) → success/error
- **Dexie Tables:** portfolio, transactions, goals, journalEntry, scorecard, userPreference (all)
- **Related Stores:** `useSettingsStore` (importTrigger, importState, importProgress)
