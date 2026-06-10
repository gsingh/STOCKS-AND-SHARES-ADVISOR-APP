import { db, withErrorHandling, type StockRow } from './db'
import type { DataEnvelope } from '../types/envelope'

const fallbackStocks: StockRow[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Oil & Gas' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', sector: 'IT' },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG' },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'Finance' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', sector: 'Banking' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Construction' },
  { symbol: 'WIPRO', name: 'Wipro Ltd', sector: 'IT' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', sector: 'Automobile' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd', sector: 'Pharma' },
  { symbol: 'TITAN', name: 'Titan Company Ltd', sector: 'Consumer Durables' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', sector: 'Consumer Durables' },
  { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Power' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp Ltd', sector: 'Oil & Gas' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp of India Ltd', sector: 'Power' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', sector: 'Cement' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', sector: 'IT' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ Ltd', sector: 'Infrastructure' },
  { symbol: 'GRASIM', name: 'Grasim Industries Ltd', sector: 'Cement' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', sector: 'Metals' },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd', sector: 'IT' },
  { symbol: 'BRITANNIA', name: 'Britannia Industries Ltd', sector: 'FMCG' },
  { symbol: 'DRREDDY', name: "Dr Reddy's Laboratories Ltd", sector: 'Pharma' },
  { symbol: 'CIPLA', name: 'Cipla Ltd', sector: 'Pharma' },
  { symbol: 'NESTLEIND', name: 'Nestlé India Ltd', sector: 'FMCG' },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd', sector: 'Automobile' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', sector: 'Finance' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Automobile' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Metals' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', sector: 'Automobile' },
  { symbol: 'PNB', name: 'Punjab National Bank', sector: 'Banking' },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Co Ltd', sector: 'Insurance' },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Co Ltd', sector: 'Insurance' },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd', sector: 'Automobile' },
  { symbol: 'COALINDIA', name: 'Coal India Ltd', sector: 'Metals' },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corp Ltd', sector: 'Oil & Gas' },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd', sector: 'Metals' },
  { symbol: 'DABUR', name: 'Dabur India Ltd', sector: 'FMCG' },
  { symbol: 'MARICO', name: 'Marico Ltd', sector: 'FMCG' },
  { symbol: 'TORNTPHARMA', name: 'Torrent Pharmaceuticals Ltd', sector: 'Pharma' },
  { symbol: 'DIVISLAB', name: "Divi's Laboratories Ltd", sector: 'Pharma' },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Ltd', sector: 'Healthcare' },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd', sector: 'Banking' },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', sector: 'Automobile' },
  { symbol: 'OFSS', name: 'Oracle Financial Services Software Ltd', sector: 'IT' },
  { symbol: 'CASTROLIND', name: 'Castrol India Ltd', sector: 'Oil & Gas' },
  { symbol: 'ABSLAMC', name: 'Aditya Birla Sun Life AMC Ltd', sector: 'Finance' },
  { symbol: 'LICI', name: 'Life Insurance Corporation of India', sector: 'Insurance' },
  { symbol: 'NMDC', name: 'NMDC Ltd', sector: 'Metals' },
]

const PROXY_URL = 'http://localhost:3001'

function inferSector(name: string): string {
  const lower = name.toLowerCase()
  const rules: [string, string][] = [
    ['bank', 'Banking'],
    ['finance', 'Finance'],
    ['insurance', 'Insurance'],
    ['hospital', 'Healthcare'],
    ['health', 'Healthcare'],
    ['pharma', 'Pharma'],
    ['drug', 'Pharma'],
    ['laboratories', 'Pharma'],
    ['medic', 'Pharma'],
    ['biotech', 'Pharma'],
    ['life sciences', 'Pharma'],
    ['cement', 'Cement'],
    ['steel', 'Metals'],
    ['metal', 'Metals'],
    ['iron', 'Metals'],
    ['alumin', 'Metals'],
    ['copper', 'Metals'],
    ['mining', 'Metals'],
    ['coal', 'Metals'],
    ['oil', 'Oil & Gas'],
    ['gas', 'Oil & Gas'],
    ['petroleum', 'Oil & Gas'],
    ['power', 'Power'],
    ['energy', 'Power'],
    ['electric', 'Power'],
    ['solar', 'Power'],
    ['renewable', 'Power'],
    ['software', 'IT'],
    ['technology', 'IT'],
    ['tech', 'IT'],
    ['infosys', 'IT'],
    ['consultancy', 'IT'],
    ['auto', 'Automobile'],
    ['motor', 'Automobile'],
    ['vehicle', 'Automobile'],
    ['car', 'Automobile'],
    ['tyre', 'Automobile'],
    ['telecom', 'Telecom'],
    ['communications', 'Telecom'],
    ['airtel', 'Telecom'],
    ['fmcg', 'FMCG'],
    ['food', 'FMCG'],
    ['consumer', 'FMCG'],
    ['retail', 'FMCG'],
    ['sugar', 'FMCG'],
    ['dairy', 'FMCG'],
    ['beverage', 'FMCG'],
    ['realty', 'Real Estate'],
    ['real estate', 'Real Estate'],
    ['housing', 'Real Estate'],
    ['construction', 'Construction'],
    ['infra', 'Infrastructure'],
    ['infrastructure', 'Infrastructure'],
    ['ports', 'Infrastructure'],
    ['logistics', 'Infrastructure'],
    ['transport', 'Infrastructure'],
    ['chemical', 'Chemicals'],
    ['paint', 'Chemicals'],
    ['fertilizer', 'Chemicals'],
    ['plastic', 'Chemicals'],
    ['textile', 'Textiles'],
    ['apparel', 'Textiles'],
    ['fashion', 'Textiles'],
    ['electronics', 'Electronics'],
    ['electrical', 'Electronics'],
    ['media', 'Media'],
    ['entertainment', 'Media'],
    ['hotel', 'Hospitality'],
    ['tourism', 'Hospitality'],
    ['aviation', 'Aviation'],
    ['airlines', 'Aviation'],
    ['shipping', 'Shipping'],
    ['agro', 'Agriculture'],
    ['agriculture', 'Agriculture'],
    ['paper', 'Paper'],
    ['glass', 'Glass'],
    ['ceramic', 'Ceramics'],
    ['rubber', 'Rubber'],
    ['wood', 'Wood'],
    ['leather', 'Leather'],
    ['jute', 'Textiles'],
    ['diamond', 'Diamond'],
    ['jewellery', 'Jewellery'],
    ['gold', 'Jewellery'],
  ]
  for (const [keyword, sector] of rules) {
    if (lower.includes(keyword)) return sector
  }
  return 'Equity'
}

async function fetchNseSymbolsFromProxy(): Promise<StockRow[] | null> {
  try {
    const res = await fetch(`${PROXY_URL}/api/nse-symbols`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) {
      console.warn('NSE symbols fetch failed:', res.status, await res.text())
      return null
    }
    const stocks: Array<{ symbol: string; name: string; series: string; isin?: string }> = await res.json()
    return stocks.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      sector: inferSector(s.name),
    }))
  } catch (err) {
    console.warn('NSE symbols fetch error:', err)
    return null
  }
}

export async function fetchStockUniverse(): Promise<DataEnvelope<StockRow[]>> {
  const now = new Date().toISOString()

  // Try to fetch the full NSE equity list from the proxy
  const nseStocks = await fetchNseSymbolsFromProxy()

  if (nseStocks && nseStocks.length > 0) {
    const enriched = nseStocks.map((s) => ({ ...s, fetchedAt: now }))
    await withErrorHandling(async () => {
      await db.stock.bulkPut(enriched)
    }, undefined)
    return {
      data: enriched,
      fetchedAt: now,
      source: 'api',
    }
  }

  // Fallback to hardcoded list
  const fallback = fallbackStocks.map((s) => ({ ...s, fetchedAt: now }))
  await withErrorHandling(async () => {
    await db.stock.bulkPut(fallback)
  }, undefined)
  return {
    data: fallback,
    fetchedAt: now,
    source: 'scraper',
  }
}

export async function isSeeded(): Promise<boolean> {
  const count = await withErrorHandling(() => db.stock.count(), 0)
  return count > 0
}

export async function ensureSeeded(): Promise<DataEnvelope<StockRow[]>> {
  const seeded = await isSeeded()
  if (seeded) {
    await withErrorHandling(async () => {
      await db.stock.bulkPut(fallbackStocks.map((s) => ({ ...s, fetchedAt: new Date().toISOString() })))
    }, undefined)
    const stocks = await withErrorHandling(() => db.stock.toArray(), [])
    // If the universe looks stale (fewer than 100 stocks), refresh from the proxy
    if (stocks.length < 100) {
      return fetchStockUniverse()
    }
    return {
      data: stocks,
      fetchedAt: stocks.length > 0 ? (stocks[0].fetchedAt ?? null) : null,
      source: 'cache',
    }
  }
  return fetchStockUniverse()
}
