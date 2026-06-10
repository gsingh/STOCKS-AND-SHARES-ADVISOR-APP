# PRD Quality Review — Stocks & Shares Advisor App

## Overall verdict

One of the strongest zero-backend consumer SPA PRDs I've reviewed. It earns its length (733 lines) with testable consequences per FR, explicit scope honesty, and a coherent thesis carried through every feature. The single material risk is external data-source fragility (Screener.in scraping and nse-bse-api availability) — the PRD flags it but doesn't resolve it. The only mechanical defect is a phantom user-journey cross-reference. A decision-maker can confidently greenlight sprint 0 (architecture, UX, story breakdown) with this document.

---

## Decision-readiness — strong

A product lead, engineer, or investor could read this PRD and make a go/no-go call. Trade-offs are surfaced explicitly: zero-backend vs. data-source fragility (§4.17), free scraping vs. maintenance burden (decision-log entry 2026-06-08), MF-app parity vs. adaptation effort (§1). Open Questions (§8) are specific, technical, and actionable — they don't punt on vague unknowns. The MVP scope boundary (§6) is unambiguous. The only thing missing is any costing or timeline signal, but for a build-by-me consumer SPA that's acceptable.

### Findings
- **[high]** **Unresolved data-source strategy** (§4.1 FR-1.1, §8 Q1–Q3) — The PRD commits to Screener.in scraping and nse-bse-api without a confirmed fallback for when either source is unavailable or rate-limited. Yahoo Finance is mentioned as a "potential" fallback but not validated. *Fix:* Add a specific fallback decision (e.g., "if Screener.in fails after 3 retries, the app shows cached data + a manual entry form; nse-bse-api failure degrades to manual price entry") and close Q1–Q3 as resolved or elevated to a spike story.

---

## Substance over theater — strong

No persona padding, no innovation theater, no aspirational NFRs. The "Boss" persona (§2.1) is used sparingly and earns its keep by grounding two key user journeys. The Vision section (§1) is specific (17 parameters, 8-step framework, Screener.in scraping) rather than generic. The glossary (§3) is substantive (32 finance terms, not UX fluff). Every NFR in §4.17 has a testable consequence. This PRD is lean-to-earned throughout.

### Findings
- **[low]** **Single persona limits journey coverage** (§2.1) — Only UJ-1 (research) and UJ-2 (portfolio review) are written. UJ-3 is referenced in FR-17 but has no journey. For a consumer SPA, three journeys covering the main workflows (research, portfolio review, goal-setting) would be the norm. *Fix:* Either write UJ-3 (goal projection) or remove the cross-reference and note that goal-workflow testing is covered by FR-16 through FR-18.

---

## Strategic coherence — strong

The PRD has a clear thesis: "Translate the MF app's proven mental model to stocks, adapting scoring parameters, with all data lives client-side." Every feature (§4.1–§4.16) serves this thesis. The data architecture (IndexedDB + free APIs) is consistent with every feature — there is no feature that accidentally requires a backend. Risk profiling (§4.5) and goals (§4.6) mirror the MF app's structure. The portfolio review cycle (§4.8) ties back to the scoring engine (§4.2). Cross-references (FR-5 → FR-31) show internal consistency. The whole reads as a single product, not a feature list.

### Findings
- **[medium]** **No positioning against investment research alternatives** (§1, §2) — The PRD doesn't say why a user should use this app over Screener.in + a spreadsheet + Tickertape. The implicit thesis (MF-app familiarity + all-in-one) is reasonable but unstated. *Fix:* Add 1–2 sentences in §1 or §2 naming the current fragmented workflow and how SSAA consolidates it.

---

## Done-ness clarity — strong

This is the PRD's strongest dimension. Every functional requirement has a "Consequences (testable)" block that an engineer can implement against. Examples: FR-1 specifies search latency (2s), deduplication behavior, and a "No results" state. FR-4 specifies colour coding, categories, and composite prominence. FR-6 specifies weight normalization. Performance NFRs are concrete (500ms calc, 3s load, §4.17). Out-of-scope markers per feature prevent scope creep.

### Findings
- **[medium]** **FR-13 auto-populate semantics underspecified** (§4.4) — "Linked data updates when scorecard is refreshed" but what triggers a refresh? Manual pull? Auto on navigation? Timer? The engineer needs to know. *Fix:* Define the refresh trigger explicitly (e.g., "auto-populated fields refresh when the user re-opens the scorecard or taps 'Refresh from source'").
- **[low]** **FR-37 XIRR convergence criteria** (§4.15) — "Convergence safeguards (max iterations, fallback)" is vague. What iteration count? What fallback value? *Fix:* Specify max iterations (e.g., 1000) and fallback display (e.g., "show 'could not converge' rather than a misleading number").

---

## Scope honesty — strong

The PRD is refreshingly explicit about what it is not. §5 lists 9 non-goals with no hedging. §6.2 tags each out-of-scope item with the planned version (v2, v3, "never planned"). Assumptions are marked with `[ASSUMPTION]` in the text and indexed in §9 with section back-references. The "Working title — confirm" caveat on line 9 is a small but honest signal.

### Findings
- **[medium]** **Watchlist ambiguity** (§6.2 vs §4.1, §4.7) — The MVP declares watchlist "defer to v2" but the Stock Browser (FR-3) says "long-tap → add to watchlist or compare." The phrase "watchlist" also appears in UJ-1 resolution. A reader can't tell if watchlist exists in v1 or not. *Fix:* Remove "add to watchlist" from FR-3 consequence, or move watchlist into MVP scope and update §6.2.
- **[low]** **Assumption "free npm package reliability" untested** (§4.1, §9) — `[ASSUMPTION]` nse-bse-api provides reliable data is plausible but unevidenced. The decision log mentions no investigation. *Fix:* Either upgrade to a spike requirement ("evaluate nse-bse-api uptime over 7 days") or downgrade the assumption language to "assumed with risk acknowledged."

---

## Downstream usability — adequate

The PRD has strong structural hygiene — globally numbered FRs (FR-1 through FR-41), sub-numbering (FR-1.1), per-feature out-of-scope blocks, and an Assumptions Index (§9) that round-trips to § locations. A downstream architect or UX spec writer can extract cleanly.

However, there is one clear mechanical break: **UJ-3 is referenced in FR-17 but never defined.** Only UJ-1 (research) and UJ-2 (portfolio review) exist in §2.1. This will confuse anyone trying to trace user-journey coverage.

The glossary (§3) is thorough (32 terms) and will serve UX tooltips directly.

### Findings
- **[critical]** **Undefined UJ-3** (§2.1, §4.6 FR-17) — FR-17 ("Goal projection calculator") references "Realises UJ-3," but UJ-3 does not exist. UJ-1 and UJ-2 are fully written in §2.1. *Fix:* Add UJ-3 (goal-setting journey) to §2.1 or change the FR-17 reference to "Realises FR-16/FR-17 goal workflow" and remove the phantom UJ-3.
- **[low]** **FR-5 cross-ref uses prose reference** (§4.2) — "cross-references FR-31" is there but embedded in prose rather than consistently bracketed. Consistent cross-ref formatting would aid extraction. *Fix:* Adopt a consistent `[FR-31]` format throughout.

---

## Shape fit — strong

The PRD is appropriately scoped for a consumer web SPA. No server infrastructure specs, no deployment topology, no database schemas. Feature descriptions focus on UI behavior, states, and user-visible outcomes — exactly what a consumer SPA PRD should specify. NFRs are client-side relevant (load time, offline capability, calculation performance). The assumption that the MF app's tech stack (React, Vite, Dexie, TanStack Router, Tailwind, shadcn/ui, Recharts) carries forward is appropriate for a same-form-factor sibling product.

The only shape concern is the high number of features (16) claimed as MVP — a consumer SPA launching with a stock browser, scorecard, comparison, 8-step framework, risk profiler, goals, portfolio management, reviews, journal, SIP calc, drift calc, sector overlap, dashboard, glossary, XIRR calc, and settings is aggressive. But the PRD doesn't claim otherwise, and the MF app precedent makes it credible.

### Findings
- **[medium]** **MVP breadth is aggressive** (§6.1) — 16 features for a v1 launch, even with library reuse, means thin implementations or long build cycles. *Fix:* Consider ranking features by dependency (e.g., glossary and settings can ship last; scorecard and portfolio are the spine) in a brief build-order note, or acknowledge that v1 depth may vary.

---

## Mechanical notes

- **Glossary drift**: §3 contains 32 terms defined precisely. No drift from domain usage in FRs.
- **ID continuity**: FR-1 through FR-41 are sequential with clean sub-numbering (FR-1.1). No gaps or duplicates.
- **Broken cross-references**: **UJ-3 referenced in FR-17 but never defined** (§2.1). This is the clearest defect in the document.
- **Assumptions Index roundtrip**: §9 lists 8 assumptions with section back-references (§4.1, §4.17, §8). All 8 resolve to inline `[ASSUMPTION]` markers in the body. Round-trip is intact.
- **Status metadata**: Frontmatter shows `status: draft` and `updated: 2026-06-08`. Works as a version marker.
- **Versioning**: No revision history table. For a document of this quality, a changelog would help track what changed across revisions.
