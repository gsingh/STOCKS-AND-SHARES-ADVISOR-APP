## Story
**As a** retail investor,
**I want** to compute the XIRR (Extended Internal Rate of Return) for my investment transactions,
**So that** I can measure the annualised return of my portfolio accounting for irregular cash flows over time.

## Acceptance Criteria
1. **Pure Function**: `calculateXIRR` is implemented as a pure function in `src/features/xirr/xirr-calculator.ts` with no React dependencies, imported as needed.
2. **Function Signature**: `calculateXIRR(transactions: XIRRTransaction[], guess?: number): XIRRResult` where `XIRRTransaction = { date: Date, amount: number }` (buys are negative, current value/sells are positive) and `XIRRResult = { xirr: number | null, iterations: number, converged: boolean }`.
3. **Newton-Raphson Method**: The core algorithm uses the Newton-Raphson numerical method to solve for the rate where NPV = 0. Formula: NPV = Σ(amount_i / (1 + r)^((days_i - days_0) / 365)) = 0.
4. **Convergence Safeguards**: Maximum 100 iterations; if the rate changes by less than 1e-7 between iterations, consider converged. If not converged after max iterations, return `null` with `converged: false`.
5. **Fallback**: If Newton-Raphson fails to converge, attempt a bisection method fallback between -99% and +1000%.
6. **Edge Cases**: Handle empty transaction arrays (return null), single transaction (return null — need at least 2 for a rate), all-zero amounts (return null), dates far in the past/future, and extreme rates (near -100% or very large positive).
7. **Result Format**: Return XIRR to 2 decimal places as a percentage (e.g., 12.34 for 12.34%), or `null` if it cannot be computed.
8. **Unit Tested**: Comprehensive Vitest tests covering normal cases, edge cases, convergence failure, and single-transaction inputs.

## Tasks / Subtasks
- [ ] Create `src/features/xirr/xirr-calculator.ts` with types and pure function
- [ ] Implement Newton-Raphson iteration for XIRR
- [ ] Implement convergence checks (1e-7 tolerance, 100 max iterations)
- [ ] Implement bisection method fallback
- [ ] Handle all edge cases (empty, single transaction, zero amounts, extreme rates)
- [ ] Create comprehensive Vitest tests in `src/features/xirr/xirr-calculator.test.ts`
- [ ] Verify tests pass

## Dev Notes
- Newton-Raphson derivative: d(NPV)/dr = -Σ(amount_i * days_i / (365 * (1+r)^((days_i/365)+1))).
- Initial guess: default to 0.1 (10%) if not provided. For portfolios with known positive returns, passing a better guess speeds convergence.
- Day count convention: actual/365 (not business days). Use `(date.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)` for day difference.
- The function must be a pure computation — no side effects, no async, no React hooks.
- Export the type `XIRRTransaction` and `XIRRResult` for reuse in Story 11.4 and portfolio integration.

## Dev Agent Record
- **Module:** `src/features/xirr/xirr-calculator.ts`
- **Algorithm:** Newton-Raphson with bisection fallback
- **Exports:** `calculateXIRR`, `XIRRTransaction`, `XIRRResult`
- **Test File:** `src/features/xirr/xirr-calculator.test.ts`
