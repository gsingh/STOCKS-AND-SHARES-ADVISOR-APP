const NSE_TO_YAHOO: Record<string, string> = {
  TATAMOTORS: 'TMCV',
}

const YAHOO_TO_NSE: Record<string, string> = Object.fromEntries(
  Object.entries(NSE_TO_YAHOO).map(([nse, yahoo]) => [yahoo.toLowerCase(), nse])
)

export function toYahooSymbol(symbol: string): string {
  const yahooTicker = NSE_TO_YAHOO[symbol] ?? symbol
  return `${yahooTicker}.NS`
}

export function fromYahooSymbol(yahooSymbol: string): string {
  const base = yahooSymbol.replace(/\.(NS|BO)$/i, '')
  return YAHOO_TO_NSE[base.toLowerCase()] ?? base
}
