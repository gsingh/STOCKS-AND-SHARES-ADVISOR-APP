## Story
**As a** developer,  
**I want** the forecasting feature formally documented in the project's planning artifacts,  
**So that** the architecture, data flow, and deployment requirements for the TimesFM forecast microservice are captured alongside the existing 12 epics.

## Acceptance Criteria
1. **PRD Addendum**: Add a new section to `_bmad-output/planning-artifacts/prds/prd-STOCKS-AND-SHARES-ADVISOR-APP-2026-06-08/addendum.md` documenting the Price Forecasting feature:
   - Feature description and scope (zero-shot timesfm inference on NSE stocks)
   - FR entry: "FR-42: Generate price forecasts for any NSE stock with 30/90/365-day horizons"
   - Glossary entries for TimesFM, Zero-shot forecasting, Quantile forecast
2. **Architecture Update**: Add a new section to `_bmad-output/planning-artifacts/architecture.md`:
   - Forecast microservice architecture (Python FastAPI + TimesFM 2.5)
   - Data flow: Frontend → `/api/forecast/*` → nginx proxy → `localhost:8000` → model inference
   - Model details: TimesFM 2.5 200M, max_context=1024, max_horizon=256
   - Caching strategy: localStorage with 24h TTL (frontend), stateless (service)
   - Deployment: `npm run forecast` starts the Python service; nginx proxies in production
   - Architecture decision: Why a separate Python microservice instead of in-browser inference (model size, runtime, GPU optional)
3. **Epics & Stories Update**: Add Epic 13 entry to `_bmad-output/planning-artifacts/epics-and-stories.md`:
   - Epic row in the Epic List table
   - FR coverage map entry
   - Full epic description with stories 13.1-13.5

## Tasks / Subtasks
- [ ] Read existing `addendum.md` to understand format and find appropriate insertion points
- [ ] Read existing `architecture.md` to understand format and find appropriate insertion points
- [ ] Read existing `epics-and-stories.md` to understand where to add Epic 13
- [ ] Add Price Forecasting section to addendum.md with feature description, FR, and glossary terms
- [ ] Add Forecast Microservice section to architecture.md covering all AC items
- [ ] Add Epic 13 entry to epics-and-stories.md (epic list table, FR map, story breakdown)
- [ ] Verify all cross-references and formatting are consistent

## Dev Notes
- The forecasting feature was implemented as an unplanned addition after Epics 1-12 were completed. It was never documented in the PRD, architecture, or epics-and-stories.
- Existing implementation locations to reference:
  - Microservice: `forecast-service/main.py` (Python FastAPI + TimesFM 2.5)
  - Frontend service: `src/services/forecast-service.ts`
  - State management: `src/stores/forecast-store.ts`
  - Price history source: `src/services/price-history-service.ts` (Yahoo Finance proxy)
  - UI components: `src/features/forecast/` (ForecastPanel, ForecastChart, CompareForecast, MarketForecastPreview)
  - Proxy config: `vite.config.ts` (dev), `nginx/default.conf` (production)
  - Startup: `package.json` → `"forecast": "bash forecast-service/run.sh"`

## Dev Agent Record
- **Documents:** `addendum.md`, `architecture.md`, `epics-and-stories.md`
- **Impact:** Brings planning artifacts in sync with implemented codebase. Enables future forecasting work to be planned, tracked, and documented properly.
