# Spine Pair Review — STOCKS-AND-SHARES-ADVISOR-APP

## Overall verdict

The spine pair is structurally sound and follows canonical form, but has two critical gaps (no failure paths in flows, zero visual references) that prevent downstream consumption. The mechanical coverage is strong on tokens and states; the judgment pass reveals real inheritance discipline issues in cross-section linkage between DESIGN.md and EXPERIENCE.md. Address the 2 critical and 3 high findings before this pair can serve as a reliable contract for engineering.

## 1. Flow coverage — FAIL

### Findings
- **critical** Both Key Flows lack failure/error paths (EXPERIENCE.md:125-141). Drift example provides explicit `Failure:` blocks after each flow. Without failure paths, downstream implementation has no spec for error handling. *Fix:* Add `Failure:` subsection to each flow describing save failure, network error, empty data, or user mistake recovery.
- **high** Flow 2 "Quarterly review" climax (Step 4, line 138) is a note-taking beat, not a decision-forcing moment. The true climax (overlap warning dialog) happens in Step 5, making the narrative arc ambiguous. *Fix:* Either move climax label to Step 5 or restructure so the review completion + overlap detection collapse into one climax.

## 2. Token completeness — PASS (with minor issues)

### Findings
- **medium** `badge-warning` foreground is hardcoded `'#1A1208'` instead of a token reference (DESIGN.md:70). Breaks dark-mode inversion — this foreground won't adapt. *Fix:* Use `{colors.warning}` or define `colors.warning-foreground` and reference it.
- **medium** `small` typography missing `fontWeight` (DESIGN.md:49-50). All other typography entries specify it. *Fix:* Add `fontWeight: '400'`.

All 25 color tokens present with hex values. All 7 `{token}` references in YAML components resolve to defined tokens. No orphaned tokens.

## 3. Component coverage — FAIL

### Findings
- **high** `FreshnessBadge` appears in EXPERIENCE.md Component Patterns (row 69) but has no DESIGN.md YAML component definition — only a prose mention (DESIGN.md:151). Missing: color tokens for the 4 dot states (green/yellow/red/gray), radius, sizing. *Fix:* Add `freshness-badge-dot-{green,yellow,red,gray}` to DESIGN.md YAML with hex fills and `rounded/full`.
- **high** `Score contribution bar` (DESIGN.md:148) and `Chart palette` (DESIGN.md:149) specified visually in DESIGN.md but absent from EXPERIENCE.md Component Patterns. No behavioral rules (animations, transitions, responsive collapse, tooltip interaction). *Fix:* Add rows to EXPERIENCE.md Component Patterns for these.
- **medium** `button-success` and `badge-success`/`badge-warning` in DESIGN.md YAML have no corresponding behavioral rows in EXPERIENCE.md Component Patterns. Downstream will need to infer usage contexts (where does success button appear vs primary?). *Fix:* Add brief usage notes or cross-reference in experience component rows that consume them.

## 4. State coverage — FAIL

### Findings
- **high** `Reviews`, `Settings`, and `Glossary` surfaces have zero state rows in State Patterns table (EXPERIENCE.md:74-88). Reviews is a critical workflow (quarterly review checklist) — needs loading (auto-fill computation), empty (no alerts), error (checklist generation failed). *Fix:* Add rows for each.
- **medium** `Goal Detail` surface has no dedicated state pattern. `Empty goals` is covered for the Goals index but not the detail view. *Fix:* Add row: "Empty goal detail" with treatment (perhaps redirect or skeleton).
- **low** `Dashboard` lacks an explicit empty state (no watchlist items, no alerts, index data unfetched). The Cold app load skeleton covers first render but not a scenario where the user has no data configured. *Fix:* Add row with empty treatment matching the pattern from other surfaces.

## 5. Visual reference coverage — FAIL

### Findings
- **critical** Zero visual assets exist. No `mockups/` or `wireframes/` directory; both `.working/` and `imports/` are empty (EXPERIENCE.md directory listing). The Drift example references 3 HTML mockups; this pair has none. *Fix:* Produce at minimum: wireframe for Dashboard layout, Stock Detail scorecard layout, Compare table layout. Add `→ Composition reference:` line to EXPERIENCE.md Foundation section pointing to the files.
- **high** No visual reference leads to ambiguity in critical layouts: Dashboard 2-column arrangement, Stock Detail scorecard+chart+fundamentals stacking order, Compare side-by-side column behavior at <768px. *Fix:* Wireframes or annotated screens for these three surfaces minimum.

## 6. Bloat & overspecification — PASS

### Findings
- No pixel specs where tokens cover. No source restatement beyond readable prose. No decorative narrative. The pair is lean and task-appropriate.
- Score threshold prose (DESIGN.md:107) is dense — a small table would be more glanceable but is not a blocker.

## 7. Inheritance discipline — PASS (with minor issues)

### Findings
- **medium** `sources` paths use `{planning_artifacts}` variable (EXPERIENCE.md:5-7). While conventional for templates, downstream resolution is ambiguous. *Fix:* Either resolve to relative paths or document the variable expansion rule.
- **low** DESIGN.md frontmatter lacks `updated` field (EXPERIENCE.md:8 has it). *Fix:* Add `updated: 2026-06-08` for symmetry.

Component names are consistent across sections where they overlap. EXPERIENCE.md correctly references DESIGN.md as the visual authority.

## 8. Shape fit — PASS

### Findings
- DESIGN.md sections in canonical order (Brand & Style → Colors → Typography → Layout → Elevation → Shapes → Components → Do's/Don'ts). All required sections present.
- EXPERIENCE.md sections in canonical order (Foundation → IA → Voice/Tone → Component Patterns → State Patterns → Interaction Primitives → Accessibility → Key Flows → Responsive → Inspiration/Anti-patterns → Invented Sections). Invented Sections explicitly present and empty — correct.
- Dropped defaults defensible: no unnecessary sections added.

## Mechanical notes

- File type: Both files are `.md` with YAML frontmatter — correct.
- Line counts: DESIGN.md 162 lines, EXPERIENCE.md 162 lines — well-proportioned.
- Decision log: 9 entries, all substantive. No orphaned decisions.
- .working/ and imports/ directories present but empty — benign but suggest artifacts were expected.

### Finding count by severity
- **critical:** 2 (failure paths missing, no visual references)
- **high:** 5 (FreshnessBadge not in DESIGN.md YAML, Score bar/chart palette missing from experience, 3 surfaces with no state coverage, no visual references layout ambiguity, Reviews/Settings/Glossary no states)
- **medium:** 4 (badge-warning hardcoded hex, small missing fontWeight, sources path variable, Goal Detail missing states)
- **low:** 2 (Dashboard empty state, DESIGN.md missing updated field)
