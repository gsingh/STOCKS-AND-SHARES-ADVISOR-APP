## Story
**As a** power investor,  
**I want** to customize the weight of each scoring parameter and category,  
**So that** the composite score reflects my personal investment philosophy and priorities.

## Acceptance Criteria
1. **Weight Panel**: A side panel or expandable section titled "Customize Weights" accessible from the Stock Detail page.
2. **Category Weights**: Each of the 6 categories has a slider (0–100) and a number input. The 6 category weights must sum to 100 (auto-normalized on blur/change).
3. **Parameter Weights**: Within each category, individual parameter weights are adjustable via slider + number input (0–100). Within a category, parameter weights are normalized to sum to 100%.
4. **Auto-Normalization**: When the user adjusts one weight, the system auto-normalizes others to maintain the subtotal at 100% (or sums to 100 across categories). The adjusted item stays fixed and others scale proportionally.
5. **Persist to IndexedDB**: Weight customizations are saved to a `userPreference` table in Dexie, keyed by `weights-default`. Restored on next app load.
6. **Reset to Defaults**: A "Reset to Defaults" button restores all weights to factory defaults (equal weighting or predefined sensible defaults).
7. **Live Scorecard Update**: The scorecard re-renders immediately with the new weights as the user adjusts sliders.
8. **Disabled State**: While fundamental data is loading, the weight panel shows skeleton placeholders.

## Tasks / Subtasks
- [ ] Create `src/components/features/scorecard/weight-customizer.tsx`
- [ ] Build category weight row with slider + number input
- [ ] Build parameter weight rows within expandable category sections
- [ ] Implement auto-normalization logic (category-level and parameter-level)
- [ ] Persist weights to Dexie `userPreference` table on change (debounced 500ms)
- [ ] Load saved weights on component mount; fall back to defaults
- [ ] Implement "Reset to Defaults" action
- [ ] Wire weight changes to scoring engine for live scorecard update
- [ ] Add loading skeleton for weight panel

## Dev Notes
- Normalization math: When user sets category A to X, remaining categories scale proportionally to make sum = 100. Same within categories for parameters.
- Store weights as `{ categories: { [categoryId]: number }, parameters: { [paramId]: number } }` in Dexie.
- Debounce Dexie writes (500ms) but update the React state immediately for responsive UI.
- Consider extracting normalization into a pure utility function for testability.

## Dev Agent Record
- **Component:** `weight-customizer.tsx`, `weight-slider.tsx`
- **Data Flow:** Slider input → normalize → React state (instant) → scorecard re-render → Dexie persist (debounced)
- **Stores:** `useWeightStore` (weights, setCategoryWeight, setParameterWeight, resetWeights)
- **Persistence:** Dexie `userPreference` table, key `weights-default`
