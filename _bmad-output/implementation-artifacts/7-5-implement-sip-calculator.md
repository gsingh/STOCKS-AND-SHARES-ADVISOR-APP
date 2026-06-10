## Story
**As a** retail investor,
**I want** a SIP calculator to estimate my investment returns,
**So that** I can plan my monthly investments and visualise the power of compounding.

## Acceptance Criteria
1. **Input Fields**: Monthly amount (₹), expected return rate (% p.a. with 6/8/10% quick scenario buttons), duration (years).
2. **Quick Scenario Buttons**: Three buttons labelled "Conservative (6%)", "Moderate (8%)", "Optimistic (10%)" that auto-fill the return rate.
3. **Results Display**: Total invested (monthly × months), estimated returns (final corpus - total invested), final corpus (₹).
4. **Breakdown Chart**: Recharts PieChart or BarChart showing principal vs gains breakdown.
5. **Year-wise Growth Chart**: Recharts LineChart or AreaChart showing corpus growth over the investment period.
6. **Real-time Update**: Results update as the user adjusts any input.
7. **Currency Format**: All ₹ values displayed in en-IN locale.

## Tasks / Subtasks
- [ ] Create `src/components/features/goals/sip-calculator.tsx` component
- [ ] Build input form: monthly amount, return rate, duration, quick scenario buttons
- [ ] Implement SIP future value calculation (pure function in `src/features/`)
- [ ] Build results display cards (total invested, returns, corpus)
- [ ] Build principal vs gains PieChart with Recharts
- [ ] Build year-wise growth AreaChart with Recharts
- [ ] Implement real-time update on input change
- [ ] Write co-located tests: `sip-calculator.test.tsx`

## Dev Notes
- SIP formula: FV = P × [((1 + r)^n - 1) / r] × (1 + r) where P = monthly investment, r = monthly return rate, n = months.
- Year-wise data: compute corpus at end of each year for the growth chart.
- Principal = P × n; Gains = FV - Principal.
- Quick scenario buttons use `onClick` to set the return rate input.
- Pure math functions go in `src/features/calculator/sip.ts`.
- Use `useMemo` for derived values to avoid unnecessary recalculations.

## Dev Agent Record
- **Component:** `sip-calculator.tsx`
- **Data Flow:** User inputs → compute FV → compute year-wise data → render results + charts
- **Key States:** input active, results displayed
- **Related Stores:** none (self-contained calculator)
- **Dependencies:** Recharts (PieChart, AreaChart), custom SIP math in `src/features/calculator/`
