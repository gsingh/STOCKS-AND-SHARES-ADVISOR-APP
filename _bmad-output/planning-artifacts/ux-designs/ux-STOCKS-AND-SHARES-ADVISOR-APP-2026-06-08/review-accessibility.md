# Accessibility Review — STOCKS-AND-SHARES-ADVISOR-APP

## Findings

- **[critical]** Score color `#2E8B57` (forest green) on white background yields **4.24:1 contrast** — fails WCAG AA 4.5:1 for normal text (14px body). *Fix:* Darken green to `#1E7A45` (~5.1:1) or use green only on ≥18pt bold text where 3:1 threshold applies.
- **[critical]** Dark mode primary `#4A7FB5` on background `#0F1F30` yields **3.97:1 contrast** — fails WCAG AA for normal text. *Fix:* Lighten primary-dark to `#5A8FC5` or darken background. Ensure all dark mode interactive text meets 4.5:1.
- **[high]** Amber `#F59E0B` on white (used for FreshnessBadge dot, warning accents) yields **2.15:1 contrast** — invisible to low-vision users. Badge-warning text uses dark `#1A1208` which passes at 8.62:1, but the amber dot itself has no luminous contrast against white. *Fix:* Add a dark border or darker fill to the dot; never rely on amber alone on white for meaning.
- **[high]** No landmark regions or ARIA roles specified (`<nav>`, `<main>`, `role="search"`, `role="region"`). *Fix:* Document landmark structure (App Shell: `banner` topbar, `navigation` sidebar, `main` content area, `complementary` for widgets).
- **[high]** No skip-to-content link documented. *Fix:* First focusable element on every page must be "Skip to content" linking to `<main id="main-content">`.
- **[high]** No heading hierarchy documented. *Fix:* Enforce `h1` (page title) → `h2` (card titles, section heads) → `h3` (card subsections) with no gaps. Required for screen reader navigation.
- **[medium]** No focus trap or escape documentation for modals/dialogs (EXPERIENCE.md mentions Escape closes but not focus trap). *Fix:* When a Dialog opens, focus must move to first interactive element; Tab must cycle within the dialog; closing returns focus to the trigger.
- **[medium]** Dynamic content (score changes, alerts, watchlist updates) has no documented `aria-live` region. *Fix:* Use `aria-live="polite"` on alert containers and score displays that update without page navigation.
- **[medium]** No accessible names specified for icon-only controls (sidebar collapse hamburger, watchlist toggle star, compare checkbox). *Fix:* Every icon button needs `aria-label="Collapse sidebar"` or similar.
- **[medium]** Comparison table and data tables lack accessibility specifications (no `<th scope>`, `caption`, or `aria-sort` for sortable columns). *Fix:* All data tables must have `<caption>`, proper `<th scope="col/row">`, and `aria-sort` on sortable headers.
- **[medium]** No touch target size specification. WCAG 2.2 AA requires 24x24px minimum (target size 2.2) for pointer targets. *Fix:* Document minimum tap target of 24x24px.
- **[medium]** No `prefers-reduced-motion` consideration. *Fix:* Wrap any transitions/animations in `@media (prefers-reduced-motion: no-preference)`.
- **[medium]** No zoom/reflow documentation. Content must be functional at 400% zoom without horizontal scrolling (WCAG 1.4.10). *Fix:* Verify `p-6` layout, tables, and comparison surface survive 400% zoom with no data loss.
- **[low]** No `lang` attribute guidance on `<html>` element. *Fix:* Document `<html lang="en">`.
- **[low]** Body text at 12px (small) is underspecified for contrast verification and risks being too small for low-vision users at default zoom. *Fix:* Ensure `small` (12px) is used only for non-essential metadata; consider minimum 14px for body content.
- **[low]** Form errors specify `aria-live` regions but no explicit `aria-describedby` linking error messages to inputs. *Fix:* Each invalid input should have `aria-describedby="error-{fieldId}"` pointing to the error message.
- **[low]** Donut chart interactive slice click (filters holdings) has no keyboard alternative documented. *Fix:* Ensure keyboard users can navigate slices and activate filtering.

## Summary

2 critical, 2 high, 7 medium, 4 low findings. The design documents score well on color-only communication (text labels specified) and basic keyboard navigation, but the `#2E8B57` green-on-white and `#4A7FB5` on dark background both fail AA normal-text contrast, and major screen reader structures (landmarks, headings, skip-link, focus traps, live regions) are entirely absent from the spec. These are not implementation oversights — they are specification gaps that must be resolved before development.
