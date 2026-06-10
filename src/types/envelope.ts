export interface DataEnvelope<T> {
  data: T | null
  fetchedAt: string | null
  source: 'cache' | 'api' | 'scraper' | 'user'
  error?: string
  currentPrice?: number
}
