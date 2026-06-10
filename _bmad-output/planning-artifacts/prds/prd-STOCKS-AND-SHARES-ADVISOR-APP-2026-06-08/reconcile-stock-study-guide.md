# Reconciliation Report: PRD vs Stock Study Guide

**Input name:** Stock Study Guide

**Source:** `/Users/gurmeetsingh/STOCKS-AND-SHARES-STUDY/stock-shares-study/guide/`

**Target:** `/Users/gurmeetsingh/Documents/STOCKS-AND-SHARES-ADVISOR-APP/_bmad-output/planning-artifacts/prds/prd-STOCKS-AND-SHARES-ADVISOR-APP-2026-06-08/prd.md`

---

## 1. Parameters (17-Parameter Scorecard)

All 17 parameters from the study guide are covered in the PRD scorecard. The PRD groups them into 6 categories (Valuation, Quality, Financial Health, Growth, Ownership, Size) which is a reasonable superset of the study guide's flat list.

**Minor naming discrepancy:** Study guide parameter #16 is called **"Valuation-vs-growth"** (using PEG ratio as the measure); the PRD lists **"PEG"** as a standalone parameter name. Conceptually equivalent.

No gaps.

---

## 2. 8-Step Comparison Framework

All 8 steps from the study guide map to FR-11/FR-12/FR-13. However:

- **Step 5 (Valuation)** in the study guide explicitly names **EV/EBITDA** alongside P/E and P/B. The PRD framework description (§4.4) omits EV/EBITDA entirely.
- **Step 8 (Liquidity & Price)** in the study guide details **free float**, **bid-ask spread**, and **daily trading volume** thresholds. The PRD summarises this as just "Liquidity" with no specifics.

---

## 3. Concepts from the Study Material NOT Covered in the PRD

| # | Concept | Source Section | Details |
|---|---------|---------------|---------|
| 1 | **Four shareholder rights** | 00-introduction | Voting rights, dividends, capital gains/losses, residual claim — foundational knowledge missing from PRD |
| 2 | **Shares vs Bonds vs MFs vs ETFs comparison** | 00-introduction | Comparative table across structure, risk, return, trading, diversification — not in PRD |
| 3 | **Primary market vs Secondary market** | 00-introduction | IPO/FPO issuance vs exchange trading — not covered |
| 4 | **Cyclical stocks** (as a classification) | 01-types-of-shares | Stocks tied to economic/commodity cycles — PRD only covers Growth and Value styles |
| 5 | **Defensive stocks** (as a classification) | 01-types-of-shares | Stocks with steady demand (utilities, staples) — absent from PRD |
| 6 | **Dividend stocks** (as income-method classification) | 01-types-of-shares | Shares classified by how they return value (dividend vs non-dividend/growth) |
| 7 | **Direct stock investing vs pooled vehicles** | 05-comparison-framework | Pros/cons of direct equity vs MFs/ETFs |
| 8 | **Style classification pros/cons** | 05-comparison-framework | Detailed advantages/disadvantages per cap and style class |
| 9 | **10 Common Mistakes** | 06-common-mistakes | Entire educational section absent — buying on tips, ignoring market cap, emotional trading, confusing P/E across sectors, chasing past returns, etc. (Some overlap with FR-5 interplay warnings but not addressed as explicit educational content.) |
| 10 | **EV/EBITDA** (valuation metric) | 03-parameters, 05-comparison-framework, 07-glossary | Mentioned in study guide Step 5 and glossary; not in PRD glossary or framework detail |
| 11 | **Free float** concept | 05-comparison-framework, 07-glossary | Tradable share liquidity metric — not in PRD |
| 12 | **Deprecation / data freshness notice** | 08-appendices | Concept of marking stale data — PRD has cache timestamps but no explicit deprecation warning pattern |

---

## 4. Glossary Terms Missing from PRD Glossary

The PRD glossary (30 terms) is missing the following terms that appear in the study guide glossary (34 terms):

| Missing Term | Study Guide Definition |
|-------------|----------------------|
| Capital gain | Profit when a share is sold above purchase price |
| Cyclical stock | Stock tied to economic/commodity cycles |
| Defensive stock | Stock with stable demand for non-discretionary needs |
| Dividend | Portion of profit distributed to shareholders |
| Diluted EPS | EPS assuming all convertible securities exercised |
| Enterprise value (EV) | Market cap + debt - cash |
| EV/EBITDA | Enterprise value divided by EBITDA |
| Exchange-traded fund (ETF) | Pooled vehicle trading on exchanges |
| Free float | Shares available for public trading (excl. promoter/strategic) |
| Mutual fund | Pooled vehicle managed by AMC |
| Primary market | Market for new issuance (IPOs, FPOs, rights) |
| Secondary market | Market for trading already-issued securities |
| Revenue growth | Yearly rise in total sales (parameter #2 in the 17-parameter set — not in glossary either) |

**Total: 13 terms from the study guide glossary not present in the PRD glossary.**

---

## 5. Key Findings (2–5)

### Finding 1: Missing Classification Types (Cyclical, Defensive, Dividend)
The study guide classifies stocks into **7 investment styles** (Growth, Value, Dividend, Cyclical, Defensive, plus income-method split), but the PRD only covers Growth and Value. Cyclical stocks and Defensive stocks are meaningful concepts for portfolio construction and sector-exposure decisions — both of which are PRD features.

### Finding 2: 13 Glossary Terms Missing
The PRD targets "at minimum 37 terms" (FR-35) but currently defines only ~30. Adding the 13 missing study guide terms (especially Capital gain, EV/EBITDA, Free float, Cyclical/Defensive stock, Primary/Secondary market) would bring the count to ~43 and close the coverage gap.

### Finding 3: Common Mistakes Not Addressed as Educational Content
The study guide's 10 common mistakes are a valuable educational layer that the PRD does not address. While FR-5 (interplay warnings) covers some scenarios (e.g., high pledge + falling promoter holding), most mistakes (buying on tips, ignoring market cap, confusing P/E across sectors, emotional trading) are absent. An in-app "common mistakes" or "watch out for" feature could surface these contextually.

### Finding 4: Foundational Equity Concepts Omitted
The study guide introduction (shareholder rights, shares-vs-other-instruments, primary vs secondary market) provides essential context for new investors. The PRD assumes this knowledge. If the target user includes newer investors, adding these concepts to the glossary or a "basics" section would improve onboarding.

### Finding 5: EV/EBITDA Not Referenced
EV/EBITDA appears in the study guide's Step 5 and glossary as a key cross-sector valuation metric. The PRD mentions P/E and P/B for valuation but omits EV/EBITDA entirely — both in the 8-step framework description and in the glossary.
