# Addendum — Stocks & Shares Advisor App PRD

## A. Full Glossary

Terms used throughout the PRD. All downstream workflows use these definitions verbatim.

### Valuation Ratios
- **P/E ratio (Price-to-Earnings)** — Share price divided by earnings per share. Shows how many years of profit you are buying.
- **P/B ratio (Price-to-Book)** — Share price divided by book value per share. Used for banks and asset-heavy firms.
- **PEG ratio** — P/E divided by earnings growth rate. Adjusts valuation for growth.
- **EV/EBITDA** — Enterprise value divided by EBITDA (earnings before interest, tax, depreciation, amortisation). Cross-sector valuation metric that normalises for debt and capital structure.
- **Enterprise value (EV)** — Market cap plus total debt minus cash and cash equivalents. Reflects the full cost of acquiring a company.

### Profitability Metrics
- **ROE (Return on Equity)** — Net profit as a share of shareholder equity. Threshold: >15% is good.
- **ROCE (Return on Capital Employed)** — EBIT divided by total capital employed. Threshold: >15% suggests strong edge.
- **Operating profit margin** — Operating profit as a share of revenue. Rising margin = better cost control.
- **Net profit margin** — Net profit as a share of revenue. High margin = safety cushion.

### Financial Health
- **Debt-to-equity ratio** — Total debt divided by shareholder equity. Low debt = safer in downturns.
- **Free cash flow (FCF)** — Cash from operations minus capital spending. Positive FCF = true profit quality.
- **Book value** — Net assets minus total liabilities.

### Growth Metrics
- **Revenue growth** — Yearly rise in total sales from the core business. Shows product demand and business health.
- **EPS (Earnings Per Share)** — Net profit divided by total outstanding shares.
- **Diluted EPS** — EPS assuming all convertible securities (stock options, warrants, convertible debt) are exercised. Lower than basic EPS.

### Ownership Indicators
- **Promoter holding** — Stake owned by founders/promoters. High = faith in business.
- **Pledged shares** — Shares used as loan collateral by promoters. High pledge = red flag.
- **Governance quality** — Quality of disclosures, fairness to minority shareholders, board independence.
- **Free float** — The portion of a company's shares available for public trading, excluding promoter, strategic, and government holdings. Low free float can reduce liquidity.

### Market Classification
- **Market capitalisation (market cap)** — Total market value of outstanding equity (price × shares). Segments: Large-cap (top 100), Mid-cap (101-250), Small-cap (251+).
- **Large-cap** — Top 100 companies by market cap. Steady returns, low risk.
- **Mid-cap** — 101st-250th companies. Growth potential, higher risk.
- **Small-cap** — 251st+ companies. High risk/reward.

### Investment Styles
- **Growth stock** — Stock with high expected earnings growth; typically high P/E.
- **Value stock** — Stock trading below intrinsic value; typically low P/E, P/B.
- **Cyclical stock** — Stock whose performance is tied to economic and commodity cycles (auto, metals, real estate). Rises in expansions, falls in contractions.
- **Defensive stock** — Stock with steady demand regardless of economic conditions (utilities, staples, healthcare). Low volatility during downturns.
- **Dividend stock** — Stock that distributes a significant portion of profit as regular dividends. Sought by income investors.

### Market Structure
- **Sector** — Industry grouping (Banking, IT, Pharma, FMCG, Automotive, etc.).
- **Primary market** — The market for new security issuance (IPOs, FPOs, rights issues). Company receives the proceeds.
- **Secondary market** — The market for trading already-issued securities between investors (NSE, BSE exchanges). Company receives no proceeds.
- **Stock (Share)** — A unit of ownership in a company, traded on NSE or BSE.
- **Dividend** — Portion of company profit distributed to shareholders, typically quarterly or annually.
- **Dividend yield** — Yearly dividend per share divided by share price.
- **Capital gain** — Profit realised when a share is sold above its purchase price.
- **Mutual fund** — A pooled investment vehicle managed by an AMC, investing in stocks, bonds, or other securities.
- **ETF (Exchange-Traded Fund)** — A pooled investment vehicle that trades on stock exchanges like a single stock, tracking an index or sector.

### App-Specific
- **Scorecard** — The 17-parameter weighted scoring system that produces a composite stock score out of 100.
- **Drift** — Percentage change between current allocation and target allocation for a stock in the portfolio.
- **SIP (Systematic Investment Plan)** — Periodic fixed-amount investment in a stock or ETF.
- **XIRR (Extended Internal Rate of Return)** — Annualised return calculation for irregular cash flows.
- **Role** — The assigned purpose of a stock in the portfolio (e.g., core hold, growth play, dividend income, tactical).
- **Review** — Periodic portfolio health check covering drift, category exposure, stock role-fit, and parameter re-evaluation.
- **Watchlist** — A list of stocks under observation, not yet purchased.

## B. Stock Classification Details

### By Market Capitalisation
| Category | Rank | Examples | Risk/Return |
|----------|------|----------|-------------|
| Large-cap | Top 100 | Reliance, TCS, HDFC Bank, Infosys, ICICI Bank | Low risk, steady returns |
| Mid-cap | 101-250 | Dixon Technologies, Max Healthcare, Alkem Labs | Moderate risk, growth potential |
| Small-cap | 251+ | Fine Organic, Gravita India, Sunteck Realty | High risk, high reward |

### By Investment Style
| Style | Characteristics | Examples |
|-------|----------------|----------|
| Growth | High earnings growth, high P/E | Bajaj Finance, DMart, TCS |
| Value | Low P/E/P/B, margin of safety | ITC, Coal India, ONGC, SBI, PowerGrid |
| Dividend | Regular income distribution | NTPC, Coal India, Hindustan Zinc, GAIL, PowerGrid |
| Cyclical | Tied to economic cycles | Tata Motors, L&T, Hindalco, Maruti Suzuki, JSW Steel |
| Defensive | Stable demand across cycles | Hindustan Unilever, Nestle India, Britannia, Cipla, Colgate |

## C. Common Mistakes (Reference)

From the Stock Study Guide — not implemented as a feature in v1, but referenced by interplay warnings (FR-5).

1. Not understanding what a share represents
2. Ignoring market cap classification
3. Buying only on tips without research
4. Ignoring promoter pledge levels
5. Confusing P/E ratios across different sectors
6. Neglecting governance quality
7. Ignoring debt-to-equity ratio
8. Chasing past returns
9. Overlooking free cash flow
10. Emotional trading without a plan
