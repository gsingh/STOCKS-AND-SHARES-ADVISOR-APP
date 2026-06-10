## Story
**As a** retail investor,
**I want** to complete a risk assessment questionnaire with at least 10 questions about my financial situation and risk tolerance,
**So that** the app can determine my investor profile and recommend suitable investment strategies.

## Acceptance Criteria
1. **Questionnaire Start**: A welcome/intro screen explains the purpose of the risk profiling exercise with a "Start Assessment" button.
2. **Minimum 10 Questions**: The questionnaire contains at least 10 questions covering: financial situation (income, net worth, dependents), investment horizon (short/medium/long term), loss tolerance (how would you react to a 20% drop?), stock-specific risk comfort (volatility, sector concentration, penny stocks, derivatives), investment experience, and primary goal (wealth creation / income / preservation).
3. **Question Format**: Each question uses appropriate form controls: radio buttons (Likert scale: Strongly Agree to Strongly Disagree), multiple choice, or numeric input as applicable.
4. **One-at-a-time Flow (optional)**: Questions can be presented one at a time with "Next" / "Previous" navigation showing progress indicator (Question 3 of 12) and a progress bar, OR as a single scrollable form.
5. **Responses Storage**: All question responses are temporarily stored in Zustand state during the flow.
6. **Immediate Scoring**: When the user submits, responses are scored immediately using a weighted scoring algorithm (see Dev Notes).
7. **Persistence**: The computed risk profile (score and category) is stored in the Dexie `userPreference` table immediately on completion.
8. **Navigation Guard**: If the user attempts to navigate away mid-questionnaire, a confirmation dialog warns about losing progress.
9. **Skip Option**: A subtle "Skip" link is available on the intro screen (not during the quiz) to bypass the questionnaire entirely.

## Tasks / Subtasks
- [ ] Define question bank (minimum 10 questions) with scoring weights per answer
- [ ] Create `src/features/risk/risk-questions.ts` with question data and scoring logic
- [ ] Build `src/features/risk/risk-store.ts` (Zustand store for questionnaire state)
- [ ] Build `src/components/features/risk/risk-intro-screen.tsx`
- [ ] Build `src/components/features/risk/risk-questionnaire.tsx` (one-at-a-time or scrollable)
- [ ] Build `src/components/features/risk/question-renderer.tsx` for various question types
- [ ] Implement progress indicator / progress bar
- [ ] Implement weighted scoring computation on submit
- [ ] Wire persistence to Dexie `userPreference` table
- [ ] Add navigation guard with confirmation dialog
- [ ] Add skip option on intro screen

## Dev Notes
- Scoring algorithm: each answer has a numeric score (e.g., 1-5). Weighted average across all questions determines the final score. Thresholds: Conservative (1.0-2.5), Moderate (2.5-3.5), Aggressive (3.5-5.0).
- Questions about investment horizon and loss tolerance should carry higher weight in the scoring.
- Store raw question responses alongside the computed profile for future review.
- The `userPreference` schema extension: `riskProfile: { score, category, investmentStyle, overridden, completedAt }`.
- Progress percentage = (currentQuestion / totalQuestions) * 100.

## Dev Agent Record
- **Component:** `risk-intro-screen.tsx`, `risk-questionnaire.tsx`, `question-renderer.tsx`
- **Data Flow:** Question responses → Zustand store → scoring function → Dexie userPreference
- **Dexie Table:** `userPreference` (riskProfile sub-object)
- **Related Stores:** `useRiskStore` (responses, currentStep, score, category, submitQuestionnaire)
