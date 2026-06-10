## Story
**As a** retail investor,  
**I want** to track the composite score of a stock over time,  
**So that** I can see how the stock's fundamental quality is trending.

## Acceptance Criteria
1. **Score History Section**: A "Score History" section on the Stock Detail page, positioned below the scorecard and interplay warnings.
2. **Timeline Chart**: A Recharts line chart showing composite score (Y-axis, 0–100) over time (X-axis, dates). Each data point is a snapshot.
3. **Minimum Snapshots**: The system stores at least 5 historical snapshots per stock (whenever fundamentals are fetched and TTL has passed).
4. **Snapshot Data**: Each snapshot records: composite score, date (ISO string), the weights used at that time.
5. **Empty State**: If no score history exists, display "No score history yet. Score a stock to start tracking." with a chart icon.
6. **Tooltip**: Hovering over a data point shows a tooltip with the date, score, and indicator of which weights were used (custom or default).
7. **Trend Indicator**: A small trend arrow + percentage change shows the score change over the last 30 days (e.g., "↑ +5.2% this month").

## Tasks / Subtasks
- [ ] Create `src/components/features/scorecard/score-history.tsx`
- [ ] Implement snapshot storage in Dexie `scoreHistory` table (keyed by ticker)
- [ ] Create snapshot on each successful fundamental data fetch (if weights changed or 24h+ since last)
- [ ] Build Recharts LineChart with proper en-IN date formatting
- [ ] Add custom tooltip showing snapshot details
- [ ] Implement trend arrow calculation (30-day delta)
- [ ] Build empty state component
- [ ] Prune old snapshots (keep max 50 per stock) to prevent storage bloat

## Dev Notes
- Snapshot schema: `{ id, ticker, compositeScore, categoryScores, weights, date, fundamentalDataVersion }`.
- Use `Intl.DateTimeFormat('en-IN')` for date axis labels.
- Line color uses `chart-color-1` (`#2E8B57`). Area fill with low opacity gradient.
- The chart should respect `prefers-reduced-motion` (disable animation).
- Consider adding an annotation for when custom weights were changed vs. default weights.

## Dev Agent Record
- **Component:** `score-history.tsx`, `score-history-chart.tsx`
- **Data Flow:** Dexie `scoreHistory` → Recharts → timeline chart render
- **Stores:** `useScoreHistoryStore` (snapshots, loading)
- **Persistence:** Dexie table `scoreHistory`
