## Story
**As a** retail investor,
**I want** to view and customize the default weights used for all 17 scorecard parameters,
**So that** I can tailor the stock scoring to reflect what matters most to my investment strategy.

## Acceptance Criteria
1. **Settings Section**: A "Score Weights" section on the Settings page displaying all 17 scorecard parameters with their current weight values.
2. **Parameter List**: Each of the 17 parameters is listed with its name (and a TermInfo tooltip for explanation), current weight (as a percentage or absolute value), and an editable number input.
3. **Editable Weights**: Each weight can be edited via a numeric input (shadcn Input with type="number", min=0, max=100, step=1).
4. **Normalization Hint**: A note below the list: "Weights are normalized to sum to 100 for scoring calculations. Current sum: X."
5. **Save Button**: A "Save Weights" button persists the custom weights to Dexie `userPreference` under a `weightDefaults` field.
6. **Reset to Factory Defaults**: A "Reset to Factory Defaults" link/button restores all weights to the original default values (from the scorecard scoring algorithm).
7. **Unsaved Changes Warning**: If the user modifies weights but navigates away without saving, a confirmation dialog warns about unsaved changes.
8. **Immediate Effect**: Once saved, the new weights are used for all subsequent scorecard calculations across the app (no page reload needed).

## Tasks / Subtasks
- [ ] Define factory default weights for all 17 parameters (const in a shared config)
- [ ] Add `weightDefaults` field to Dexie `userPreference` schema
- [ ] Create `src/features/weights/weights-store.ts` (Zustand store for weight state)
- [ ] Build `src/components/features/settings/score-weights.tsx` settings section
- [ ] Render parameter list with editable number inputs and TermInfo tooltips
- [ ] Implement weight normalization display (current sum)
- [ ] Implement save with Dexie persistence
- [ ] Implement "Reset to Factory Defaults" action
- [ ] Add unsaved changes navigation guard
- [ ] Wire weight defaults to scorecard computation

## Dev Notes
- Factory defaults should match the initial scoring algorithm weights defined in the scorecard feature. These are defined as a const object: `DEFAULT_WEIGHTS: Record<ScoreParam, number>`.
- The 17 parameters include: P/E Ratio, P/B Ratio, ROE, ROCE, Market Cap, Dividend Yield, Debt-to-Equity, Current Ratio, Operating Margin, Net Profit Margin, PEG Ratio, EPS Growth, Sales Growth, Promoter Holding, FII/DII Holding, Beta, and Volatility.
- Store weights as `Record<string, number>` in userPreference where keys match the parameter IDs.
- Scorecard computation should read weights from userPreference if set, else fall back to `DEFAULT_WEIGHTS`.

## Dev Agent Record
- **Component:** `score-weights.tsx` (Settings section)
- **Data Flow:** User edits → local state → save → Dexie persist → scorecard reads updated weights
- **Dexie Table:** `userPreference` (weightDefaults field)
- **Related Stores:** `useWeightsStore` (weights, setWeight, saveWeights, resetDefaults)
- **Shared Config:** `DEFAULT_WEIGHTS` in scorecard config file
