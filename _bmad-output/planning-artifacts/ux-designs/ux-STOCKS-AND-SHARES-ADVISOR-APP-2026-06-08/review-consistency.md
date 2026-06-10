# Consistency Review — STOCKS-AND-SHARES-ADVISOR-APP

## Findings

- **[high]** Score tier mismatch — DESIGN.md defines **4 parameter-score tiers** (green >=15, amber >=10, orange >=5, red <5) with 4 color bands, while EXPERIENCE.md describes only **3 tiers** ("green/amber/red", labels "Strong"/"Average"/"Weak") across the Scorecard panel, Accessibility section, and Score contribution bar. The orange tier and its corresponding text label are missing from EXPERIENCE. *Fix:* Either add the orange tier (>=5, label e.g. "Below Average") to EXPERIENCE, or collapse DESIGN to 3 tiers and realign its score-convention section.

- **[medium]** Naming inconsistency within EXPERIENCE.md — The Market summary component description uses **"DataFreshnessBadge"** (line 62) while the Component Patterns table and DESIGN.md consistently use **"FreshnessBadge"**. Two names for the same component in the same document. *Fix:* Replace "DataFreshnessBadge" with "FreshnessBadge" in the Market summary row.

- **[low]** Composite-score thresholds implicit in EXPERIENCE — DESIGN.md explicitly defines composite thresholds (>=70 green, >=50 amber, <50 red) but EXPERIENCE.md never states them. The score text labels in EXPERIENCE Accessibility ("Strong"/"Average"/"Weak") happen to map to these, but the numeric boundaries that drive rendering are absent from the behavioral spec. *Fix:* Add the three composite thresholds to EXPERIENCE's Scorecard panel behavioral rules row.

- **[low]** Component catalog asymmetry — EXPERIENCE.md defines 12 behavioral components (Stock row, Scorecard panel, Comparison table, Market summary, Watchlist card, Portfolio donut, Goal card, Transaction row, Journal entry, Alert card, FreshnessBadge, TermInfo) but DESIGN.md only lists 8 brand-layer overrides + 16 shadcn-inherited components. The 10 composed components (Stock row, Scorecard panel, etc.) have no DESIGN entry. This is acceptable per DESIGN's "brand-layer deltas only" contract, but a DESIGN note confirming these are compositions of shadcn primitives would improve cross-spine clarity. *Fix:* Optionally add a DESIGN.md sentence: "All composed components (Stock row, Scorecard panel, Comparison table, etc.) assemble from shadcn primitives listed above; no brand-visual overrides."

## Summary

One critical mismatch: the score-tier taxonomy differs between spines (DESIGN's 4‑tier parameter scores vs EXPERIENCE's 3‑tier model), which will produce inconsistent color rendering unless resolved. One medium naming bug (DataFreshnessBadge vs FreshnessBadge) within EXPERIENCE. Two low‑severity gaps (missing composite‑score thresholds, component catalog asymmetry) are documentation‑quality concerns, not runtime bugs. Breakpoint, dark mode, and token references are consistent.
