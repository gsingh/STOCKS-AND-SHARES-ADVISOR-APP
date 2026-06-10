export interface FrameworkStepData {
  id: number
  title: string
  guidance: string
  completed: boolean
  autoPopulated: boolean
  fields: FrameworkField[]
}

export interface FrameworkField {
  key: string
  label: string
  type: 'text' | 'number' | 'textarea' | 'boolean'
  value: string | number | boolean | null
  autoPopulated: boolean
}

export interface FrameworkState {
  currentStep: number
  steps: FrameworkStepData[]
  startedAt: string | null
  completedAt: string | null
}

export const FRAMEWORK_STEPS = [
  {
    id: 1,
    title: 'Business Model',
    guidance: 'Analyse the company\'s core business model, revenue streams, competitive moat, and industry position. Consider how the company makes money and its key differentiators.',
  },
  {
    id: 2,
    title: 'Peer Comparison',
    guidance: 'Compare the company with its key competitors in the same industry. Evaluate market share, growth rates, and competitive advantages relative to peers.',
  },
  {
    id: 3,
    title: 'Financials',
    guidance: 'Review revenue trends, profit growth, and cash flow generation. Look at historical performance and future growth trajectory.',
  },
  {
    id: 4,
    title: 'Profitability',
    guidance: 'Examine profit margins, return on equity (ROE), and return on capital employed (ROCE). Higher margins and returns indicate competitive strength.',
  },
  {
    id: 5,
    title: 'Valuation',
    guidance: 'Assess current valuation using P/E, P/B, PEG ratios, and dividend yield. Compare with historical averages and industry peers.',
  },
  {
    id: 6,
    title: 'Balance Sheet',
    guidance: 'Analyse debt levels, asset quality, and equity position. A strong balance sheet has manageable debt and sufficient liquidity.',
  },
  {
    id: 7,
    title: 'Governance',
    guidance: 'Evaluate promoter holding, pledged shares, management quality, and corporate governance practices. Strong governance reduces risk.',
  },
  {
    id: 8,
    title: 'Liquidity',
    guidance: 'Check trading volume, bid-ask spread, and market depth. Adequate liquidity ensures ease of entry and exit.',
  },
]

export const FRAMEWORK_FIELDS: Record<number, { key: string; label: string; type: FrameworkField['type'] }[]> = {
  1: [
    { key: 'businessDescription', label: 'Business Description', type: 'textarea' },
    { key: 'revenueStreams', label: 'Revenue Streams', type: 'textarea' },
    { key: 'competitiveMoat', label: 'Competitive Moat', type: 'textarea' },
    { key: 'industryPosition', label: 'Industry Position', type: 'text' },
  ],
  2: [
    { key: 'keyCompetitors', label: 'Key Competitors', type: 'textarea' },
    { key: 'marketShare', label: 'Market Share (%)', type: 'number' },
    { key: 'peerComparisonNotes', label: 'Peer Comparison Notes', type: 'textarea' },
  ],
  3: [
    { key: 'revenueTrend', label: 'Revenue Trend (3yr)', type: 'text' },
    { key: 'profitGrowth', label: 'Profit Growth (3yr)', type: 'text' },
    { key: 'cashFlowHealth', label: 'Cash Flow Health', type: 'textarea' },
  ],
  4: [
    { key: 'operatingMargin', label: 'Operating Margin', type: 'number' },
    { key: 'netMargin', label: 'Net Profit Margin', type: 'number' },
    { key: 'roe', label: 'ROE (%)', type: 'number' },
    { key: 'roce', label: 'ROCE (%)', type: 'number' },
    { key: 'profitabilityNotes', label: 'Profitability Notes', type: 'textarea' },
  ],
  5: [
    { key: 'peRatio', label: 'P/E Ratio', type: 'number' },
    { key: 'pbRatio', label: 'P/B Ratio', type: 'number' },
    { key: 'pegRatio', label: 'PEG Ratio', type: 'number' },
    { key: 'dividendYield', label: 'Dividend Yield (%)', type: 'number' },
    { key: 'valuationNotes', label: 'Valuation Notes', type: 'textarea' },
  ],
  6: [
    { key: 'debtToEquity', label: 'Debt-to-Equity', type: 'number' },
    { key: 'currentRatio', label: 'Current Ratio', type: 'number' },
    { key: 'freeCashFlow', label: 'Free Cash Flow', type: 'number' },
    { key: 'balanceSheetNotes', label: 'Balance Sheet Notes', type: 'textarea' },
  ],
  7: [
    { key: 'promoterHolding', label: 'Promoter Holding (%)', type: 'number' },
    { key: 'pledgedShares', label: 'Pledged Shares (%)', type: 'number' },
    { key: 'governanceRating', label: 'Governance Rating (1-10)', type: 'number' },
    { key: 'governanceNotes', label: 'Governance Notes', type: 'textarea' },
  ],
  8: [
    { key: 'avgVolume', label: 'Avg Daily Volume', type: 'number' },
    { key: 'liquidityAssessment', label: 'Liquidity Assessment', type: 'textarea' },
  ],
}
