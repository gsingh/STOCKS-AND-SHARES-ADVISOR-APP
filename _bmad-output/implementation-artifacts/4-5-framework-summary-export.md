## Story
**As a** retail investor completing the 8-step framework,  
**I want** to generate a summary report of my analysis and export it,  
**So that** I can save, share, or print my research.

## Acceptance Criteria
1. **Summary Page**: After completing all 8 steps, a "View Summary" button appears. Clicking navigates to `/framework/:ticker/summary`.
2. **Single-Page Report**: The summary compiles all 8 steps into a single printable page showing:
   - Stock ticker and name at top
   - Composite score from scorecard
   - Each step's header with user notes and data
   - Any warnings/alerts from the interplay checks
   - Date of analysis
3. **Print-Friendly CSS**: The summary page uses `@media print` CSS that hides the sidebar, navigation, header, and compare tray. Page uses white background, black text, no shadows or rounded corners.
4. **Export as Markdown**: A button "Export as Markdown" generates a `.md` file with the full analysis content and triggers a browser download. The `.md` file is named `<ticker>-analysis-<YYYY-MM-DD>.md`.
5. **Export as PDF (print)**: The browser's native print dialog (Ctrl+P / Cmd+P) is supported via the print-friendly CSS, allowing the user to "Save as PDF".
6. **Incomplete Summary**: If the user navigates to the summary URL without completing all steps, show a warning "Framework incomplete. Complete all 8 steps to view the full summary." with links to incomplete steps.

## Tasks / Subtasks
- [ ] Create summary page component `src/components/features/framework/framework-summary.tsx`
- [ ] Build single-page report layout with all 8 steps compiled
- [ ] Implement print-friendly CSS in `@media print` block
- [ ] Build Markdown generation utility `src/features/framework/generate-markdown.ts`
- [ ] Implement Markdown download using `URL.createObjectURL(new Blob([md], { type: 'text/markdown' }))`
- [ ] Build incomplete-state warning with navigation links
- [ ] Wire route `/framework/:ticker/summary` in TanStack Router
- [ ] Add "View Summary" / "Export" button to framework completion UI

## Dev Notes
- Markdown generation is a pure function that takes `frameworkData` and returns a string with front matter (`#`, `##`, tables, lists).
- The Markdown file download uses a temporary `<a>` element with `download` attribute.
- Print CSS: `nav, header, .sidebar, .compare-tray { display: none; }`, `body { background: white; color: black; }`.
- Summary report includes a disclaimer at the bottom: "This analysis is generated for educational purposes and does not constitute financial advice."

## Dev Agent Record
- **Component:** `framework-summary.tsx`
- **Helpers:** `generateMarkdownReport(frameworkData)` in `src/features/framework/generate-markdown.ts`
- **Route:** `/framework/:ticker/summary`
- **Data Flow:** Dexie `frameworkData` → compile → summary render / markdown download
- **CSS:** `@media print` rules in `framework-summary.css`
