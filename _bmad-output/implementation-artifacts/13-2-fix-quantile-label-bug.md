## Story
**As a** developer,  
**I want** the quantile labels in the forecast service to correctly map to all returned quantile rows,  
**So that** no quantile data is silently dropped and all confidence bands render correctly.

## Acceptance Criteria
1. **Investigate TimesFM output**: Determine the exact shape of `quantile_forecast` returned by `model.forecast()` when `use_continuous_quantile_head=True`. Document whether it returns 9 or 10 quantile rows.
2. **Fix the label mapping**: In both `POST /forecast` and `POST /forecast/batch` endpoints, ensure labels cover all quantile rows. If the model returns 10 rows, add the missing label (e.g., "p100" or the correct percentile). If the model returns 9 rows, fix the shape check from `== 10` to `== 9`.
3. **Consistent fix**: Apply the same fix to both endpoints (`forecast-service/main.py:112` and `main.py:149`).
4. **Test the fix**: Call `/forecast` with sample data and verify the returned `quantiles` dict has the correct number of keys matching the model output.

## Tasks / Subtasks
- [ ] Investigate `quantile_forecast.ndim` and `q_arr.shape[0]` at runtime to confirm actual output dimensions
- [ ] Fix label list and shape check in `POST /forecast` (line 112-117)
- [ ] Fix label list in `POST /forecast/batch` (line 149-151)
- [ ] Test with a sample series to verify all quantiles are returned

## Dev Notes
- The current code at `main.py:112` checks `q_arr.shape[0] == 10` but only defines 9 labels ("p10" through "p90"). Index 9 (the 10th row) is silently dropped by the `enumerate(labels)` loop.
- TimesFM with `use_continuous_quantile_head=True` typically outputs quantiles at `[0.1, 0.2, ..., 0.9]` — but verify this against the actual model output.
- The bug exists in both `forecast()` and `forecast_batch()` handlers.

### Review Findings
- [x] [Review][Defer] Duplicated quantile unpacking logic in both `/forecast` and `/forecast/batch` endpoints — extract to shared function in future cleanup [main.py]
- [x] [Review][Defer] Missing timeout on model inference — acceptable for single-user dev tool [main.py]

## Dev Agent Record
- **Component:** `forecast-service/main.py`
- **Impact:** Quantile confidence bands (p10-p90) in `ForecastChart.tsx` may be incomplete if the 10th quantile is needed
