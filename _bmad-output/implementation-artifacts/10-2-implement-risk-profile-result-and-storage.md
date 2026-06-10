## Story
**As a** retail investor,
**I want** to see my risk profile result with a clear category and investment style recommendation that I can override,
**So that** I understand my investor personality and can choose a suitable approach even if the assessment doesn't fully capture my preferences.

## Acceptance Criteria
1. **Result Screen**: After completing the questionnaire, the user sees a result screen showing: risk category badge (Conservative / Moderate / Aggressive) with a distinct color (green/amber/red), a numeric score (e.g., "3.4 / 5.0"), and a progress bar visualization from Conservative to Aggressive.
2. **Investment Style Recommendation**: Based on the score, a recommended investment style is shown: Growth / Value / Dividend / Blend, each with a brief 1-2 sentence description.
3. **Category Descriptions**: Each risk category displays a short explanation (e.g., "You prefer stability and are willing to accept lower returns for capital preservation").
4. **Override Option**: A dropdown or radio group allows the user to manually override their risk category to a different one. Selecting an override updates the profile with an `overridden: true` flag.
5. **Style Recommendation Updates on Override**: If the user overrides the risk category, the investment style recommendation updates to match the new category.
6. **Persist to Dexie**: The final profile (including any override) is saved to the Dexie `userPreference` table with fields: `score`, `category`, `investmentStyle`, `overridden`, `overriddenCategory`, `completedAt`.
7. **Continue Button**: A primary "Continue to App" button navigates to the main dashboard/home page.
8. **Redo Option**: A secondary "Retake Assessment" link allows the user to redo the questionnaire, which resets their existing profile.

## Tasks / Subtasks
- [ ] Build `src/components/features/risk/risk-result.tsx` result display component
- [ ] Implement risk category badge with color coding (Conservative = green, Moderate = amber, Aggressive = red)
- [ ] Implement score visualization with progress bar
- [ ] Build investment style recommendation with description text
- [ ] Implement override dropdown with confirmation
- [ ] Update investment style on override
- [ ] Wire persistence to Dexie with override flag
- [ ] Build "Continue to App" navigation action
- [ ] Build "Retake Assessment" reset flow

## Dev Notes
- Color tokens for categories: Conservative: #1E7A45 / #5DAE7D (green), Moderate: #B8860B / #E6B84D (amber), Aggressive: #B22222 / #E86A6A (red).
- Investment style mapping: Conservative → Dividend, Moderate → Blend, Aggressive → Growth/Value.
- Override flow: user selects new category → profile updates → `overridden: true` set → persisted.
- The result screen is the final step in the risk profiling flow; after "Continue" the user never sees it again unless they manually trigger re-assessment from Settings.

## Dev Agent Record
- **Component:** `risk-result.tsx`
- **Data Flow:** Questionnaire scores → result computation → display → override → Dexie persist → navigation
- **Dexie Table:** `userPreference` (riskProfile fields)
- **Related Stores:** `useRiskStore` (resultData, overrideCategory, saveProfile, resetAssessment)
