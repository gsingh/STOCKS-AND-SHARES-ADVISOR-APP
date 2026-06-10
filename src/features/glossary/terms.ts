export interface GlossaryTerm {
  name: string
  definition: string
  category: string
  example?: string
  whyMatters?: string
  relatedTerms: string[]
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    name: 'P/E Ratio',
    definition:
      'Price-to-Earnings ratio compares a company\'s share price to its earnings per share. It tells you how much investors are willing to pay for each rupee of profit.',
    category: 'Valuation Metrics',
    example:
      'If a stock trades at ₹500 and its EPS is ₹25, the P/E ratio is 20. That means investors pay ₹20 for every ₹1 of earnings.',
    whyMatters:
      'A high P/E can mean the stock is overvalued or that investors expect high future growth. A low P/E may signal undervaluation or trouble ahead.',
    relatedTerms: ['Earnings Per Share', 'PEG Ratio', 'P/B Ratio'],
  },
  {
    name: 'P/B Ratio',
    definition:
      'Price-to-Book ratio compares a company\'s market value to its book value (assets minus liabilities). It helps identify whether a stock is undervalued relative to its net assets.',
    category: 'Valuation Metrics',
    example:
      'A P/B of 1.5 means the market values the company at 1.5 times its accounting book value.',
    whyMatters:
      'Commonly used for banks and financial companies where assets are marked to market. A P/B below 1 can indicate the stock is trading below its liquidation value.',
    relatedTerms: ['Book Value', 'P/E Ratio'],
  },
  {
    name: 'PEG Ratio',
    definition:
      'Price/Earnings-to-Growth ratio adjusts the P/E ratio by the company\'s earnings growth rate. It provides a more complete picture of valuation.',
    category: 'Valuation Metrics',
    example:
      'A stock with a P/E of 20 and earnings growth of 15% has a PEG of 1.33. A PEG under 1 is often considered undervalued.',
    whyMatters:
      'Unlike P/E alone, PEG accounts for expected growth, making it useful for comparing companies growing at different rates.',
    relatedTerms: ['P/E Ratio', 'EPS Growth'],
  },
  {
    name: 'Dividend Yield',
    definition:
      'Dividend Yield shows the annual dividend payment as a percentage of the stock\'s current price. It measures how much cash return you get from holding a stock.',
    category: 'Valuation Metrics',
    example:
      'If a stock pays ₹10 per share annually and trades at ₹200, the dividend yield is 5%.',
    whyMatters:
      'Important for income-focused investors. A sustainable high yield can provide steady returns, but an unusually high yield may signal a falling stock price.',
    relatedTerms: ['Dividend Investing', 'Payout Ratio'],
  },
  {
    name: 'ROE',
    definition:
      'Return on Equity measures how efficiently a company generates profit from shareholders\' equity. It is net income divided by shareholder equity.',
    category: 'Profitability',
    example:
      'A ROE of 18% means the company generates ₹18 of profit for every ₹100 of equity invested.',
    whyMatters:
      'Consistently high ROE (above 15-20%) signals a competitive advantage and efficient management. It is one of Warren Buffett\'s favourite metrics.',
    relatedTerms: ['ROCE', 'Net Profit Margin', 'Operating Margin'],
  },
  {
    name: 'ROCE',
    definition:
      'Return on Capital Employed measures profitability relative to all capital used (equity + debt). It shows how well a company uses its total capital to generate profits.',
    category: 'Profitability',
    example:
      'A ROCE of 15% means the company generates ₹15 of profit for every ₹100 of capital employed.',
    whyMatters:
      'Better than ROE for comparing capital-intensive businesses because it accounts for debt. A ROCE higher than the cost of capital indicates value creation.',
    relatedTerms: ['ROE', 'Operating Margin'],
  },
  {
    name: 'Operating Margin',
    definition:
      'Operating Margin is operating income divided by revenue. It shows how much profit a company makes from its core operations before interest and taxes.',
    category: 'Profitability',
    example:
      'A company with ₹1,000 Cr revenue and ₹200 Cr operating income has a 20% operating margin.',
    whyMatters:
      'Reveals operational efficiency and pricing power. High and stable margins often indicate a competitive moat.',
    relatedTerms: ['Net Profit Margin', 'EBITDA'],
  },
  {
    name: 'Net Profit Margin',
    definition:
      'Net Profit Margin is net income divided by revenue. It represents the percentage of revenue that remains as profit after all expenses, taxes, and interest.',
    category: 'Profitability',
    example:
      'A net profit margin of 12% means the company keeps ₹12 as profit for every ₹100 of revenue.',
    whyMatters:
      'The bottom-line profitability measure. A company can have high operating margins but low net margins due to high interest or tax costs.',
    relatedTerms: ['Operating Margin', 'EBITDA'],
  },
  {
    name: 'Debt-to-Equity',
    definition:
      'Debt-to-Equity ratio compares a company\'s total liabilities to shareholders\' equity. It measures financial leverage and risk.',
    category: 'Financial Health',
    example:
      'A D/E of 0.8 means the company has ₹0.80 of debt for every ₹1 of equity.',
    whyMatters:
      'High debt increases financial risk, especially during economic downturns. Conservative investors prefer D/E under 1, though norms vary by industry.',
    relatedTerms: ['Free Cash Flow', 'Financial Health'],
  },
  {
    name: 'Free Cash Flow',
    definition:
      'Free Cash Flow is the cash a company generates after accounting for capital expenditures. It is the cash available for dividends, buybacks, or reinvestment.',
    category: 'Financial Health',
    example:
      'A company with operating cash flow of ₹500 Cr and capital expenditure of ₹100 Cr has an FCF of ₹400 Cr.',
    whyMatters:
      'Positive FCF indicates a company can sustain and grow operations. It is harder to manipulate than earnings and signals true financial health.',
    relatedTerms: ['Cash Flow', 'Debt-to-Equity'],
  },
  {
    name: 'Book Value',
    definition:
      'Book Value is a company\'s total assets minus intangible assets and liabilities. On a per-share basis, it represents the theoretical liquidation value per share.',
    category: 'Financial Health',
    example:
      'If a company has assets of ₹1,000 Cr and liabilities of ₹400 Cr, its book value is ₹600 Cr.',
    whyMatters:
      'Used in P/B ratio valuation. Companies with rising book value per share are typically creating shareholder value.',
    relatedTerms: ['P/B Ratio', 'Face Value'],
  },
  {
    name: 'Revenue Growth',
    definition:
      'Revenue Growth measures the increase in a company\'s top-line sales over a period, usually expressed as a percentage year-over-year.',
    category: 'Growth',
    example:
      'A company with revenue of ₹1,000 Cr this year and ₹800 Cr last year has 25% revenue growth.',
    whyMatters:
      'Sustainable revenue growth is the primary driver of long-term shareholder returns. Consistent double-digit growth signals strong demand and execution.',
    relatedTerms: ['EPS Growth', 'Growth Investing'],
  },
  {
    name: 'EPS Growth',
    definition:
      'Earnings Per Share Growth measures the year-over-year increase in a company\'s profit allocated to each outstanding share.',
    category: 'Growth',
    example:
      'A company with EPS of ₹12 this year versus ₹10 last year has 20% EPS growth.',
    whyMatters:
      'EPS growth drives stock prices over the long term. Sustainable growth in EPS indicates improving profitability and shareholder value creation.',
    relatedTerms: ['Revenue Growth', 'PEG Ratio', 'P/E Ratio'],
  },
  {
    name: 'Promoter Holding',
    definition:
      'Promoter Holding is the percentage of shares held by the company\'s founders or promoter group. It reflects their confidence in the business.',
    category: 'Ownership',
    example:
      'If promoters hold 65% of shares, it indicates strong alignment with minority shareholders.',
    whyMatters:
      'High promoter holding (above 50-60%) generally signals confidence. Decreasing promoter holding is a red flag that should be investigated.',
    relatedTerms: ['Pledged Shares', 'Governance Quality'],
  },
  {
    name: 'Pledged Shares',
    definition:
      'Pledged Shares are shares that promoters have pledged as collateral for loans. It measures financial stress on the promoter group.',
    category: 'Ownership',
    example:
      'If promoters own 60% but have pledged 30% of their shares, the effective pledge is 18% of total shares.',
    whyMatters:
      'High pledge levels (above 30-40%) are risky. If the stock price falls, lenders may sell pledged shares, causing further price decline.',
    relatedTerms: ['Promoter Holding', 'Governance Quality'],
  },
  {
    name: 'Market Cap',
    definition:
      'Market Capitalization is the total market value of a company\'s outstanding shares, calculated as share price × total shares outstanding.',
    category: 'Market & Size',
    example:
      'A company with 10 Cr shares at ₹500 each has a market cap of ₹5,000 Cr.',
    whyMatters:
      'Used to classify companies as Large Cap, Mid Cap, or Small Cap. Market cap determines index inclusion and influences liquidity and volatility.',
    relatedTerms: ['Large Cap', 'Mid Cap', 'Small Cap', 'Blue Chip'],
  },
  {
    name: 'EBITDA',
    definition:
      'Earnings Before Interest, Taxes, Depreciation, and Amortization measures a company\'s operating performance independent of capital structure and accounting decisions.',
    category: 'Profitability',
    example:
      'A company with operating profit of ₹500 Cr, depreciation of ₹50 Cr has EBITDA of ₹550 Cr.',
    whyMatters:
      'EBITDA is widely used for valuation (EV/EBITDA) and comparing profitability across companies with different capital structures.',
    relatedTerms: ['Operating Margin', 'EV/EBITDA', 'Net Profit Margin'],
  },
  {
    name: 'EV/EBITDA',
    definition:
      'Enterprise Value to EBITDA is a valuation multiple that compares a company\'s total value (market cap + debt - cash) to its operating earnings.',
    category: 'Valuation Metrics',
    example:
      'A company with EV of ₹10,000 Cr and EBITDA of ₹1,000 Cr has an EV/EBITDA of 10.',
    whyMatters:
      'Considered more comprehensive than P/E because it accounts for debt and cash. Lower multiples generally indicate better value.',
    relatedTerms: ['EBITDA', 'P/E Ratio', 'Market Cap'],
  },
  {
    name: 'Nifty 50',
    definition:
      'The Nifty 50 is the benchmark stock market index of the National Stock Exchange (NSE), comprising the 50 largest and most liquid stocks in India.',
    category: 'Market & Size',
    example:
      'If the Nifty is at 22,000, the index value represents the weighted market cap of its 50 constituent stocks relative to a base value.',
    whyMatters:
      'The most widely tracked Indian equity benchmark. Most passive funds track the Nifty 50, and it reflects the overall health of the Indian stock market.',
    relatedTerms: ['Sensex', 'Index', 'Benchmark'],
  },
  {
    name: 'Sensex',
    definition:
      'The Sensex (Sensitive Index) is the benchmark index of the Bombay Stock Exchange (BSE), comprising 30 well-established and financially sound companies.',
    category: 'Market & Size',
    example:
      'A Sensex level of 73,000 means the index has grown from its base of 100 in 1978-79 to 73,000.',
    whyMatters:
      'India\'s oldest stock index, established in 1986. Along with the Nifty 50, it is the most tracked indicator of Indian equity market performance.',
    relatedTerms: ['Nifty 50', 'Index', 'Benchmark'],
  },
  {
    name: 'SIP',
    definition:
      'Systematic Investment Plan allows investors to invest a fixed amount in a mutual fund at regular intervals (monthly, quarterly) rather than a lump sum.',
    category: 'Investment Concepts',
    example:
      'Investing ₹10,000 monthly in an equity mutual fund through SIP for 20 years.',
    whyMatters:
      'Rupee cost averaging reduces the impact of market volatility. SIPs instil financial discipline and make investing accessible with small amounts.',
    relatedTerms: ['Mutual Fund', 'CAGR', 'XIRR'],
  },
  {
    name: 'XIRR',
    definition:
      'Extended Internal Rate of Return calculates the annualized return for a series of irregular cash flows. It accounts for the exact timing of each investment and withdrawal.',
    category: 'Investment Concepts',
    example:
      'If you invest ₹10,000 monthly via SIP and redeem ₹5 Lakh after 3 years, XIRR gives the true annualized return considering each investment\'s timing.',
    whyMatters:
      'The most accurate way to calculate returns for SIPs or any portfolio with multiple cash flows at different times. More precise than CAGR for irregular investments.',
    relatedTerms: ['CAGR', 'SIP', 'Portfolio'],
  },
  {
    name: 'CAGR',
    definition:
      'Compound Annual Growth Rate is the mean annual growth rate of an investment over a specified period longer than one year. It represents the rate of return that would be required for an investment to grow from its beginning balance to its ending balance.',
    category: 'Investment Concepts',
    example:
      'An investment of ₹1 Lakh growing to ₹2 Lakh in 5 years has a CAGR of 14.87%.',
    whyMatters:
      'CAGR smooths out volatility and provides a clear picture of investment growth. It is the standard metric for comparing returns across different investments.',
    relatedTerms: ['XIRR', 'SIP', 'Absolute Return'],
  },
  {
    name: 'Beta',
    definition:
      'Beta measures a stock\'s volatility relative to the overall market. A beta greater than 1 indicates higher volatility than the market, while less than 1 indicates lower volatility.',
    category: 'Risk Metrics',
    example:
      'A stock with beta of 1.5 tends to rise or fall 50% more than the market. If the Nifty falls 2%, the stock might fall 3%.',
    whyMatters:
      'Helps investors assess systematic risk. Conservative investors prefer low beta stocks, while aggressive investors may seek high beta for greater upside potential.',
    relatedTerms: ['Alpha', 'Standard Deviation', 'Sharpe Ratio'],
  },
  {
    name: 'Alpha',
    definition:
      'Alpha measures a portfolio\'s excess return relative to its benchmark, adjusted for risk. Positive alpha indicates the investment outperformed the market on a risk-adjusted basis.',
    category: 'Risk Metrics',
    example:
      'A mutual fund delivering 15% returns when its benchmark returned 12% has a positive alpha of 3%, suggesting skilled management.',
    whyMatters:
      'Alpha separates skill from luck. Consistently positive alpha indicates a fund manager or strategy adds genuine value beyond market movements.',
    relatedTerms: ['Beta', 'Sharpe Ratio', 'Benchmark'],
  },
  {
    name: 'Sharpe Ratio',
    definition:
      'The Sharpe Ratio measures risk-adjusted returns by dividing excess return (above risk-free rate) by the standard deviation of returns. Higher values indicate better risk-adjusted performance.',
    category: 'Risk Metrics',
    example:
      'A Sharpe ratio of 1.5 means the portfolio generates 1.5 units of excess return per unit of risk. Above 1 is good, above 2 is excellent.',
    whyMatters:
      'Essential for comparing investments with different risk levels. A high-return investment with extreme volatility may have a lower Sharpe ratio than a steadier performer.',
    relatedTerms: ['Alpha', 'Beta', 'Standard Deviation'],
  },
  {
    name: 'Standard Deviation',
    definition:
      'Standard Deviation measures the dispersion of returns around the average. It is the most common measure of investment volatility and risk.',
    category: 'Risk Metrics',
    example:
      'A fund with 12% average return and 15% standard deviation means returns typically range from -3% to +27% (one standard deviation).',
    whyMatters:
      'Higher standard deviation means higher volatility and uncertainty. Used as the denominator in Sharpe ratio and a key input for portfolio optimization.',
    relatedTerms: ['Beta', 'Sharpe Ratio', 'Volatility'],
  },
  {
    name: 'Large Cap',
    definition:
      'Large Cap stocks are companies ranked 1st to 100th by full market capitalization on the stock exchange. SEBI defines them as top 100 companies by market cap.',
    category: 'Market & Size',
    example:
      'Reliance Industries, TCS, and HDFC Bank are examples of Large Cap stocks.',
    whyMatters:
      'Large caps are generally more stable, liquid, and less volatile than smaller companies. They form the core of most conservative portfolios.',
    relatedTerms: ['Mid Cap', 'Small Cap', 'Market Cap', 'Blue Chip'],
  },
  {
    name: 'Mid Cap',
    definition:
      'Mid Cap stocks are companies ranked 101st to 250th by full market capitalization. They represent companies with good growth potential but higher risk than large caps.',
    category: 'Market & Size',
    example:
      'Companies with market caps between ₹20,000 Cr and ₹60,000 Cr typically fall in this category.',
    whyMatters:
      'Mid caps often offer higher growth potential than large caps with less volatility than small caps, making them a sweet spot for growth-oriented investors.',
    relatedTerms: ['Large Cap', 'Small Cap', 'Market Cap'],
  },
  {
    name: 'Small Cap',
    definition:
      'Small Cap stocks are companies ranked 251st and below by full market capitalization. These are smaller, emerging companies with high growth potential but significant risk.',
    category: 'Market & Size',
    example:
      'Small cap mutual funds invest in companies beyond the top 250 by market cap.',
    whyMatters:
      'Small caps can deliver explosive returns but carry higher business risk, lower liquidity, and higher volatility. They suit aggressive investors with a long horizon.',
    relatedTerms: ['Large Cap', 'Mid Cap', 'Market Cap'],
  },
  {
    name: 'Growth Investing',
    definition:
      'Growth Investing focuses on companies expected to grow at above-average rates. Investors prioritise revenue and earnings growth over current valuation.',
    category: 'Investment Strategies',
    example:
      'Investing in a tech startup with 30% revenue growth despite a high P/E of 50.',
    whyMatters:
      'Growth stocks can deliver market-beating returns but are more volatile. Success requires identifying sustainable growth trends and competitive advantages.',
    relatedTerms: ['Value Investing', 'Revenue Growth', 'EPS Growth'],
  },
  {
    name: 'Value Investing',
    definition:
      'Value Investing involves buying stocks that appear undervalued relative to their intrinsic worth. Investors look for low P/E, P/B ratios and strong fundamentals.',
    category: 'Investment Strategies',
    example:
      'A fundamentally sound bank trading at a P/E of 8 when peers trade at 15 might be a value opportunity.',
    whyMatters:
      'Popularised by Benjamin Graham and Warren Buffett. Value investing provides a margin of safety and tends to outperform in certain market cycles.',
    relatedTerms: ['Growth Investing', 'P/E Ratio', 'P/B Ratio', 'Book Value'],
  },
  {
    name: 'Dividend Investing',
    definition:
      'Dividend Investing focuses on stocks that pay regular, sustainable dividends. Investors prioritise dividend yield and growth over capital appreciation.',
    category: 'Investment Strategies',
    example:
      'Building a portfolio of PSU banks and FMCG stocks known for consistent dividend payouts.',
    whyMatters:
      'Provides regular income stream ideal for retired or conservative investors. Dividend-paying companies tend to be mature and financially stable.',
    relatedTerms: ['Dividend Yield', 'Value Investing'],
  },
  {
    name: 'Portfolio',
    definition:
      'A Portfolio is a collection of financial investments including stocks, bonds, mutual funds, ETFs, and cash held by an individual or institution.',
    category: 'Investment Concepts',
    example:
      'A diversified portfolio might hold 15-20 stocks across different sectors along with debt funds and gold.',
    whyMatters:
      'Building and maintaining a well-balanced portfolio is the foundation of successful investing. Diversification within a portfolio reduces risk without sacrificing returns.',
    relatedTerms: ['Asset Allocation', 'Diversification', 'Rebalancing'],
  },
  {
    name: 'Asset Allocation',
    definition:
      'Asset Allocation is the strategy of dividing investments across different asset classes (equity, debt, gold, real estate) based on goals, risk tolerance, and time horizon.',
    category: 'Investment Concepts',
    example:
      'A 60:30:10 split between equity, debt, and gold is a common balanced asset allocation.',
    whyMatters:
      'Asset allocation is the single biggest determinant of portfolio returns and risk. It matters more than individual stock selection.',
    relatedTerms: ['Portfolio', 'Diversification', 'Rebalancing'],
  },
  {
    name: 'Diversification',
    definition:
      'Diversification spreads investments across different assets, sectors, and companies to reduce the impact of any single investment\'s poor performance.',
    category: 'Investment Concepts',
    example:
      'Instead of buying only banking stocks, a diversified portfolio includes banking, IT, pharma, FMCG, and auto stocks.',
    whyMatters:
      'The only free lunch in investing. Proper diversification can reduce portfolio risk significantly without proportionally reducing expected returns.',
    relatedTerms: ['Portfolio', 'Asset Allocation', 'Sector Overlap'],
  },
  {
    name: 'Rebalancing',
    definition:
      'Rebalancing is the process of realigning a portfolio\'s weightings back to the target asset allocation by buying or selling assets periodically.',
    category: 'Investment Concepts',
    example:
      'If equity allocation grows from 60% to 70% due to a bull market, sell some equity and buy debt to restore the 60:40 balance.',
    whyMatters:
      'Enforces discipline to buy low and sell high. Regular rebalancing maintains the intended risk profile and can enhance long-term returns.',
    relatedTerms: ['Portfolio', 'Asset Allocation', 'Drift Analysis'],
  },
  {
    name: 'Drift Analysis',
    definition:
      'Drift Analysis compares the current asset allocation of a portfolio against the target allocation and measures how far each component has deviated.',
    category: 'Portfolio Analysis',
    example:
      'If your equity target is 60% but it has grown to 68%, the drift is +8% requiring rebalancing consideration.',
    whyMatters:
      'Regular drift analysis helps maintain risk discipline and triggers timely rebalancing. It prevents a portfolio from becoming riskier than intended over time.',
    relatedTerms: ['Rebalancing', 'Asset Allocation', 'Portfolio'],
  },
  {
    name: 'Sector Overlap',
    definition:
      'Sector Overlap occurs when multiple holdings in a portfolio invest in the same industry sector, creating unintended concentration risk.',
    category: 'Portfolio Analysis',
    example:
      'Holding four mutual funds that each have 25-30% allocation to banking stocks creates significant sector overlap.',
    whyMatters:
      'High sector overlap undermines diversification. Investors may think they are diversified across funds but actually have concentrated sector exposure.',
    relatedTerms: ['Diversification', 'Portfolio'],
  },
  {
    name: 'Benchmark',
    definition:
      'A Benchmark is a standard index used to measure the performance of a portfolio or fund. Common benchmarks include the Nifty 50 and Sensex.',
    category: 'Market & Size',
    example:
      'A large cap mutual fund might use the Nifty 50 Total Returns Index as its benchmark.',
    whyMatters:
      'Without a benchmark, you cannot evaluate whether your returns are good or bad. All investments should be compared against an appropriate benchmark.',
    relatedTerms: ['Nifty 50', 'Sensex', 'Index', 'Alpha'],
  },
  {
    name: 'Blue Chip',
    definition:
      'Blue Chip stocks are shares of well-established, financially sound companies with a long history of stable earnings, regular dividends, and strong brand recognition.',
    category: 'Market & Size',
    example:
      'Reliance, TCS, HDFC Bank, and Infosys are considered Blue Chip stocks in India.',
    whyMatters:
      'Blue chips form the foundation of conservative portfolios. They offer stability, liquidity, and steady returns, making them suitable for long-term core holdings.',
    relatedTerms: ['Large Cap', 'Market Cap', 'Nifty 50'],
  },
  {
    name: 'Index',
    definition:
      'An Index is a statistical measure of market performance representing a portfolio of stocks chosen by specific criteria. It serves as a benchmark and basis for passive investing.',
    category: 'Market & Size',
    example:
      'The Nifty 50 Index represents the performance of the 50 largest NSE-listed companies.',
    whyMatters:
      'Indices enable passive investing through index funds and ETFs. They provide a transparent, low-cost way to gain market exposure.',
    relatedTerms: ['Nifty 50', 'Sensex', 'Benchmark', 'ETF'],
  },
  {
    name: 'Mutual Fund',
    definition:
      'A Mutual Fund pools money from multiple investors to invest in a diversified portfolio of stocks, bonds, or other securities, managed by a professional fund manager.',
    category: 'Investment Instruments',
    example:
      'An equity mutual fund collects ₹1,000 from thousands of investors to build a portfolio of 30-50 stocks.',
    whyMatters:
      'Mutual funds provide diversification, professional management, and accessibility for small investors. They are the most popular vehicle for retail investors in India.',
    relatedTerms: ['SIP', 'ETF', 'Portfolio', 'Index'],
  },
  {
    name: 'ETF',
    definition:
      'Exchange Traded Fund is a marketable security that tracks an index, commodity, or basket of assets. It trades on stock exchanges like individual stocks.',
    category: 'Investment Instruments',
    example:
      'The Nippon India ETF Nifty 50 Bees tracks the Nifty 50 Index and trades on the NSE like a stock.',
    whyMatters:
      'ETFs combine the diversification of mutual funds with the trading flexibility of stocks. They typically have lower expense ratios than active mutual funds.',
    relatedTerms: ['Mutual Fund', 'Index', 'SIP'],
  },
  {
    name: 'Face Value',
    definition:
      'Face Value (or par value) is the nominal value of a share printed on the stock certificate. It is an accounting value used for calculating dividends and during stock splits.',
    category: 'Corporate Actions',
    example:
      'Most Indian stocks have a face value of ₹10 or ₹2. A company declaring a 500% dividend pays ₹50 per share on a ₹10 face value.',
    whyMatters:
      'Face value matters for dividend calculations and corporate actions. It is different from market value and has no bearing on the stock\'s actual worth.',
    relatedTerms: ['Book Value', 'Bonus Issue', 'Stock Split'],
  },
  {
    name: 'Bonus Issue',
    definition:
      'A Bonus Issue is additional shares given to existing shareholders without any cost, proportional to their current holdings. It capitalises retained earnings into equity.',
    category: 'Corporate Actions',
    example:
      'A 1:1 bonus means for every 1 share held, the shareholder gets 1 additional free share.',
    whyMatters:
      'Bonus issues increase liquidity and make shares more affordable while signalling management confidence. The total investment value remains unchanged as the price adjusts proportionally.',
    relatedTerms: ['Stock Split', 'Face Value', 'Buyback'],
  },
  {
    name: 'Stock Split',
    definition:
      'A Stock Split divides existing shares into multiple shares to reduce the trading price and increase liquidity. The total market capitalisation remains unchanged.',
    category: 'Corporate Actions',
    example:
      'In a 2:1 split, a shareholder with 1 share at ₹2,000 ends up with 2 shares at ₹1,000 each.',
    whyMatters:
      'Stock splits make high-priced shares accessible to small investors. They often generate positive sentiment but do not change fundamental value.',
    relatedTerms: ['Bonus Issue', 'Face Value', 'Buyback'],
  },
  {
    name: 'Buyback',
    definition:
      'A Buyback (share repurchase) is when a company buys its own shares from the market, reducing the number of outstanding shares and increasing shareholder value.',
    category: 'Corporate Actions',
    example:
      'A company with 1 Cr shares buys back 10 Lakh shares. Each remaining shareholder now owns a larger percentage of the company.',
    whyMatters:
      'Buybacks signal management believes the stock is undervalued. They increase EPS and return surplus cash to shareholders in a tax-efficient manner.',
    relatedTerms: ['Bonus Issue', 'Stock Split', 'EPS Growth'],
  },
  {
    name: 'Earnings Per Share',
    definition:
      'EPS is net profit divided by the number of outstanding shares. It measures the profit attributable to each share and is a key driver of stock prices.',
    category: 'Profitability',
    example:
      'A company earning ₹100 Cr net profit with 10 Cr shares has an EPS of ₹10.',
    whyMatters:
      'EPS growth directly influences stock price appreciation. It is the E in the P/E ratio and the most-watched quarterly financial metric.',
    relatedTerms: ['P/E Ratio', 'EPS Growth', 'Net Profit Margin'],
  },
]
