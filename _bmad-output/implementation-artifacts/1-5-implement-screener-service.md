# Story 1.5: Implement ScreenerService for fundamental data scraping

## Story

**As a** user evaluating a stock,
**I want** the app to scrape and cache fundamental data from Screener.in,
**so that** I see valuation ratios, profitability metrics, financial health, and ownership data without manual research.

## Acceptance Criteria

1. `src/services/screener-service.ts` is created exposing:
   - `getFundamentals(symbol: string): Promise<DataEnvelope<FundamentalData>>`
2. `FundamentalData` type contains:
   - `marketCap`, `peRatio`, `pbRatio`, `roe`, `roce`, `debtToEquity`, `operatingMargin`, `netProfitMargin`, `eps`, `dividendYield`, `bookValue`, `promoterHolding`, `freeCashFlow` — all `number | null`
   - `sector: string | null`
3. The service first checks the Dexie `fundamental` table. If cached and fresher than 24 hours, return cache (source = `'cache'`).
4. If cache is stale or absent, construct Screener.in URL using a NSE-to-Screener slug mapping config, fetch the page HTML via `fetch()`, parse with `DOMParser`, and extract metric values from DOM selectors.
5. Parsed data is stored in Dexie `fundamental` table with `fetchedAt` and `source = 'scraper'`.
6. If the scrape fails, fall back to stale cache (if any). If no cache, return `{ data: null, error: message }`.
7. A slug mapping `src/services/screener-slugs.ts` maps NSE symbols to Screener.in URL slugs (e.g. `'RELIANCE' → 'reliance-industries'`). Unknown symbols use a sluggified fallback.
8. All network and parse errors are caught and surfaced — the function never throws.

## Tasks / Subtasks

- [ ] 1.5.1 Define `FundamentalData` interface in `src/types/fundamental.ts`
- [ ] 1.5.2 Create `src/services/screener-slugs.ts` with a `SYMBOL_TO_SLUG: Record<string, string>` map (covering ~200 liquid stocks initially) and a `toSlug(symbol)` fallback function
- [ ] 1.5.3 Implement `fetchScreenerPage(slug)` that fetches `https://www.screener.in/company/{slug}/consolidated/` with 10s timeout
- [ ] 1.5.4 Implement `parseFundamentalPage(html: string): FundamentalData` using `DOMParser` and DOM query selectors
- [ ] 1.5.5 Implement `getFundamentals(symbol)` with cache-before-scrape logic (24h TTL)
- [ ] 1.5.6 Create `src/services/__tests__/screener-service.test.ts` covering: cache hit, scrape success, scrape failure fallback, DOM parsing of sample HTML
- [ ] 1.5.7 Graceful degradation: if `DOMParser` fails or a specific metric's selector is missing, return `null` for that metric rather than failing the whole request

## Dev Notes

### Screener.in URL Pattern

```
https://www.screener.in/company/{slug}/consolidated/
```

Example: `https://www.screener.in/company/reliance-industries/consolidated/`

The slug is the hyphenated lowercase company name as used by Screener.in.

### Slug Mapping Config

```ts
// src/services/screener-slugs.ts
export const SYMBOL_TO_SLUG: Record<string, string> = {
  RELIANCE: 'reliance-industries',
  TCS: 'tata-consultancy-services',
  HDFCBANK: 'hdfc-bank',
  INFY: 'infosys',
  ICICIBANK: 'icici-bank',
  HINDUNILVR: 'hindustan-unilever',
  ITC: 'itc',
  SBIN: 'state-bank-of-india',
  BHARTIARTL: 'bharti-airtel',
  KOTAKBANK: 'kotak-mahindra-bank',
  // ... ~200 entries for NSE 200 stocks
}

export function toSlug(symbol: string): string {
  const known = SYMBOL_TO_SLUG[symbol.toUpperCase()]
  if (known) return known
  // Fallback: split by camelCase, lowercase, join with hyphens
  return symbol
    .toUpperCase()
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
}
```

### DOMParser Approach

```ts
async function parseFundamentalPage(html: string): Promise<FundamentalData> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const getNumber = (selector: string): number | null => {
    const el = doc.querySelector(selector)
    if (!el) return null
    const text = el.textContent?.trim().replace(/[₹,%,\s]/g, '') ?? ''
    const num = parseFloat(text)
    return isNaN(num) ? null : num
  }

  return {
    marketCap: getNumber('[data-cy="market-cap"]') ?? getNumber('li:contains("Market Cap") .number'),
    peRatio: getNumber('[data-cy="pe-ratio"]') ?? getNumber('li:contains("P/E") .number'),
    // ... extract all fields
  }
}
```

Note: Screener.in uses data-cy attributes for testing. These are relatively stable. Fall back to text-content selectors as backup. The actual selectors should be verified against the live Screener.in DOM at implementation time.

### Metrics Extraction Reference

| Metric | Screener.in Label | Expected Selector Strategy |
|--------|------------------|---------------------------|
| Market Cap | Market Cap | `li:has(span:contains("Market Cap")) .number` |
| P/E | P/E | `li:has(span:contains("P/E")) .number` |
| P/B | P/B | `li:has(span:contains("P/B")) .number` |
| ROE | ROE % | `li:has(span:contains("ROE")) .number` |
| ROCE | ROCE % | `li:has(span:contains("ROCE")) .number` |
| Debt/Equity | Debt / Equity | `li:has(span:contains("Debt")) .number` |
| Op Margin | Op. Margin % | `li:has(span:contains("Op. Margin")) .number` |
| Net Margin | Net Margin % | `li:has(span:contains("Net Margin")) .number` |
| EPS | EPS | `li:has(span:contains("EPS")) .number` |
| Div Yield | Div. Yield % | `li:has(span:contains("Div. Yield")) .number` |
| Book Value | Book Value | `li:has(span:contains("Book Value")) .number` |
| Promoter Holding | Promoter Holding % | `li:has(span:contains("Promoter")) .number` |
| Free Cash Flow | Free Cash Flow | `li:has(span:contains("Free Cash Flow")) .number` |
| Sector | Sector | `li:has(span:contains("Sector")) .value` (returns string) |

### Anti-Scraping Resilience

- Set a realistic User-Agent header in fetch requests
- Add a small random delay (1–3s) between consecutive scrapes to avoid rate limiting
- The service should never be called in a tight loop; batch requests go through `screener-service.ts` with a queue/delay
- If a scrape returns HTTP 429 or 403, return the stale cache and set `error: 'Rate limited by Screener.in'`
- Store raw HTML parse results; if Screener.in changes their DOM, only the selectors need updating

```ts
const FETCH_OPTIONS = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
  },
  signal: AbortSignal.timeout(10_000),
}
```

### Cache-Before-Scrape Pattern

Same pattern as quote-service, but with a 24-hour TTL. Reuse `isFresh()` from `src/services/ttl.ts` with `ttlMinutes = 1440`.

### Partial Metric Handling

Never throw for a missing metric. If `doc.querySelector` returns null for a given selector, set that metric to `null`. The consumer (scoring engine) already handles `null` values gracefully.

### Testing Standards

```ts
// src/services/__tests__/screener-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { JSDOM } from 'jsdom' // Already in devDeps

const SAMPLE_HTML = `...` // minimal HTML simulating Screener.in structure

describe('parseFundamentalPage', () => {
  it('extracts all metrics from valid HTML', () => { ... })
  it('returns null for missing metrics', () => { ... })
})

describe('getFundamentals', () => {
  it('returns cached data when fresh', async () => { ... })
  it('scrapes and caches when stale', async () => { ... })
  it('falls back to stale cache on scrape failure', async () => { ... })
})
```

### Library Versions

- `jsdom: ^25.0.0` (already in devDependencies for Vitest)

### Source Tree After Implementation

```
src/
├── services/
│   ├── db.ts
│   ├── ttl.ts
│   ├── screener-service.ts          # getFundamentals, parseFundamentalPage
│   ├── screener-slugs.ts            # SYMBOL_TO_SLUG mapping, toSlug()
│   └── __tests__/
│       ├── screener-service.test.ts # Screener service tests
│       └── screener-slugs.test.ts   # Slug mapping tests
├── types/
│   └── fundamental.ts               # FundamentalData interface
```

### References

- Screener.in company page pattern: `https://www.screener.in/company/{slug}/consolidated/`
- DOMParser MDN: https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
- AbortSignal.timeout: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static

## Dev Agent Record

| Field | Value |
|-------|-------|
| Story | 1-5 |
| Epic | 1 — Foundation & Infrastructure |
| Status | Planned |
| Priority | High |
| Dependencies | 1-3 |
| Estimated Effort | Medium (5–7 hrs) |
| Agent | To be assigned |
