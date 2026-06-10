export interface ParameterMeta {
  key: string
  name: string
  category: string
  scorer: (value: number) => number
  description: string
  unit?: string
}

export interface CategoryDefinition {
  id: string
  name: string
  weight: number
  parameterKeys: string[]
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'valuation',
    name: 'Valuation',
    weight: 0.20,
    parameterKeys: ['peRatio', 'pbRatio', 'peg', 'dividendYield'],
  },
  {
    id: 'quality',
    name: 'Quality',
    weight: 0.25,
    parameterKeys: ['roe', 'roce', 'operatingMargin', 'netProfitMargin'],
  },
  {
    id: 'financialHealth',
    name: 'Financial Health',
    weight: 0.20,
    parameterKeys: ['debtToEquity', 'freeCashFlow', 'bookValue'],
  },
  {
    id: 'growth',
    name: 'Growth',
    weight: 0.15,
    parameterKeys: ['revenueGrowth', 'epsGrowth'],
  },
  {
    id: 'ownership',
    name: 'Ownership',
    weight: 0.10,
    parameterKeys: ['promoterHolding', 'pledgedShares', 'governanceQuality'],
  },
  {
    id: 'size',
    name: 'Size',
    weight: 0.10,
    parameterKeys: ['marketCap'],
  },
]

const scorePeRatio = (pe: number): number => {
  if (pe <= 10) return 20
  if (pe <= 15) return 16
  if (pe <= 20) return 12
  if (pe <= 25) return 8
  if (pe <= 30) return 4
  return 2
}

const scorePbRatio = (pb: number): number => Math.max(0, Math.min(20, 20 - pb / 2))

const scorePeg = (peg: number): number => Math.max(0, Math.min(20, 20 - peg * 5))

const scoreDividendYield = (yield_: number): number => Math.max(0, Math.min(20, yield_ * 10))

const scoreRoe = (roe: number): number => Math.max(0, Math.min(20, (roe / 3) * 4))

const scoreRoce = (roce: number): number => Math.max(0, Math.min(20, (roce / 3) * 4))

const scoreOperatingMargin = (margin: number): number => Math.max(0, Math.min(20, margin / 5))

const scoreNetProfitMargin = (margin: number): number => Math.max(0, Math.min(20, margin / 5))

const scoreDebtToEquity = (de: number): number => Math.max(0, Math.min(20, 20 - de * 5))

const scoreFreeCashFlow = (fcf: number): number => {
  if (fcf > 0) return 15
  return 5
}

const scoreBookValue = (bv: number): number => Math.max(0, Math.min(20, bv / 50))

const scoreRevenueGrowth = (growth: number): number => Math.max(0, Math.min(20, growth * 2))

const scoreEpsGrowth = (growth: number): number => Math.max(0, Math.min(20, growth * 2))

const scorePromoterHolding = (holding: number): number => Math.max(0, Math.min(20, holding / 5))

const scorePledgedShares = (pledged: number): number => {
  if (!Number.isFinite(pledged) || pledged < 0) return 0
  if (pledged === 0) return 20
  if (pledged < 10) return 15
  if (pledged < 25) return 10
  if (pledged < 50) return 5
  return 0
}

const scoreGovernanceQuality = (quality: number): number => Math.max(0, Math.min(20, quality * 2))

const scoreMarketCap = (cap: number): number => {
  if (cap > 20000) return 20
  if (cap > 5000) return 12
  return 6
}

export const PARAMETER_META: Record<string, ParameterMeta> = {
  peRatio: {
    key: 'peRatio',
    name: 'P/E Ratio',
    category: 'valuation',
    scorer: scorePeRatio,
    description: 'Price-to-Earnings ratio',
  },
  pbRatio: {
    key: 'pbRatio',
    name: 'P/B Ratio',
    category: 'valuation',
    scorer: scorePbRatio,
    description: 'Price-to-Book ratio',
  },
  peg: {
    key: 'peg',
    name: 'PEG Ratio',
    category: 'valuation',
    scorer: scorePeg,
    description: 'Price/Earnings-to-Growth ratio',
  },
  dividendYield: {
    key: 'dividendYield',
    name: 'Dividend Yield',
    category: 'valuation',
    scorer: scoreDividendYield,
    description: 'Dividend yield percentage',
    unit: '%',
  },
  roe: {
    key: 'roe',
    name: 'ROE',
    category: 'quality',
    scorer: scoreRoe,
    description: 'Return on Equity',
    unit: '%',
  },
  roce: {
    key: 'roce',
    name: 'ROCE',
    category: 'quality',
    scorer: scoreRoce,
    description: 'Return on Capital Employed',
    unit: '%',
  },
  operatingMargin: {
    key: 'operatingMargin',
    name: 'Operating Margin',
    category: 'quality',
    scorer: scoreOperatingMargin,
    description: 'Operating profit margin',
    unit: '%',
  },
  netProfitMargin: {
    key: 'netProfitMargin',
    name: 'Net Profit Margin',
    category: 'quality',
    scorer: scoreNetProfitMargin,
    description: 'Net profit margin',
    unit: '%',
  },
  debtToEquity: {
    key: 'debtToEquity',
    name: 'Debt-to-Equity',
    category: 'financialHealth',
    scorer: scoreDebtToEquity,
    description: 'Debt-to-Equity ratio',
  },
  freeCashFlow: {
    key: 'freeCashFlow',
    name: 'Free Cash Flow',
    category: 'financialHealth',
    scorer: scoreFreeCashFlow,
    description: 'Free cash flow',
    unit: 'INR',
  },
  bookValue: {
    key: 'bookValue',
    name: 'Book Value',
    category: 'financialHealth',
    scorer: scoreBookValue,
    description: 'Book value per share',
    unit: 'INR',
  },
  revenueGrowth: {
    key: 'revenueGrowth',
    name: 'Revenue Growth',
    category: 'growth',
    scorer: scoreRevenueGrowth,
    description: 'Revenue growth rate',
    unit: '%',
  },
  epsGrowth: {
    key: 'epsGrowth',
    name: 'EPS Growth',
    category: 'growth',
    scorer: scoreEpsGrowth,
    description: 'EPS growth rate',
    unit: '%',
  },
  promoterHolding: {
    key: 'promoterHolding',
    name: 'Promoter Holding',
    category: 'ownership',
    scorer: scorePromoterHolding,
    description: 'Promoter holding percentage',
    unit: '%',
  },
  pledgedShares: {
    key: 'pledgedShares',
    name: 'Pledged Shares',
    category: 'ownership',
    scorer: scorePledgedShares,
    description: 'Pledged shares percentage',
    unit: '%',
  },
  governanceQuality: {
    key: 'governanceQuality',
    name: 'Governance Quality',
    category: 'ownership',
    scorer: scoreGovernanceQuality,
    description: 'Corporate governance rating (1-10)',
  },
  marketCap: {
    key: 'marketCap',
    name: 'Market Cap',
    category: 'size',
    scorer: scoreMarketCap,
    description: 'Market capitalization',
    unit: 'INR Cr',
  },
}
