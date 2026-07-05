import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'
import { Layout } from './components/shared'
import GlossaryPage from './routes/glossary'
import SettingsPage from './routes/settings'
import XirrPage from './routes/xirr'
import { BuffettPage } from './routes/buffett'
import { JhunjhunwalaPage } from './routes/jhunjhunwala'
import { GrahamPage } from './routes/graham'
import { EnterprisingPage } from './routes/enterprising'
import { WatchlistPage } from './routes/watchlist'
import { BargainsPage } from './routes/bargains'
import { StockBrowserPage } from './routes/stocks'
import { StockDetailPage } from './routes/stocks.$symbol'
import { MarketSummary } from './components/features/dashboard/market-summary'
import { PortfolioSnapshot } from './components/features/dashboard/portfolio-snapshot'
import { ActiveAlerts } from './components/features/dashboard/active-alerts'
import { QuickActions } from './components/features/dashboard/quick-actions'
import { MarketForecastPreview } from './features/forecast/MarketForecastPreview'
import { TopPicksPanel } from './components/features/dashboard/top-picks-panel'
import { YieldSnapshotCard } from './components/features/dashboard/yield-snapshot-card'
import { BondPortfolioSummaryCard } from './components/features/dashboard/bond-portfolio-summary'
import ComparePage from './routes/compare'
import PortfolioPage from './routes/portfolio'
import ReviewsPage from './routes/reviews'
import JournalPage from './routes/journal'
import RiskProfilePage from './routes/risk-profile'
import CalculatorsPage from './routes/calculators'
import BondsPage from './routes/bonds'
import BondDetailPage from './routes/bonds.$isin'
import BondComparePage from './routes/bonds.compare'

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>
      <QuickActions />
      <section>
        <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Market Summary</h2>
        <MarketSummary />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Market Forecast</h2>
        <MarketForecastPreview />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Top Picks</h2>
        <TopPicksPanel />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Portfolio Snapshot</h2>
        <PortfolioSnapshot />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Active Alerts</h2>
        <ActiveAlerts />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Bond Market</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <YieldSnapshotCard />
          <BondPortfolioSummaryCard />
        </div>
      </section>
    </div>
  ),
})

export interface StocksSearchParams {
  q: string
  page: number
  marketCap: string
  sector: string
  peMin: number
  peMax: number
  roeMin: number
  roeMax: number
  roceMin: number
  roceMax: number
  deMin: number
  deMax: number
  dividendYieldMin: number
  dividendYieldMax: number
  revenueCagrMin: number
  revenueCagrMax: number
  profitCagrMin: number
  profitCagrMax: number
  scoreMin: number
  scoreMax: number
  showAll: boolean
  showBuffettOnly: boolean
  showModifiedBuffettOnly: boolean
  showJhunjhunwalaOnly: boolean
  showJhunjhunwalaModifiedOnly: boolean
  showGrahamOnly: boolean
  showModifiedGrahamOnly: boolean
  showEnterprisingOnly: boolean
  sort: string
  forecastHorizon: number
}

const stocksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stocks',
  validateSearch: (input: Record<string, string | undefined>): StocksSearchParams => ({
    q: input.q ?? '',
    page: Number(input.page) || 1,
    marketCap: input.marketCap ?? '',
    sector: input.sector ?? '',
    peMin: Number(input.peMin) || 0,
    peMax: Number(input.peMax) || 100,
    roeMin: Number(input.roeMin) || 0,
    roeMax: Number(input.roeMax) || 60,
    roceMin: Number(input.roceMin) || 0,
    roceMax: Number(input.roceMax) || 60,
    deMin: Number(input.deMin) || 0,
    deMax: Number(input.deMax) || 5,
    dividendYieldMin: Number(input.dividendYieldMin) || 0,
    dividendYieldMax: Number(input.dividendYieldMax) || 20,
    revenueCagrMin: Number(input.revenueCagrMin) || -50,
    revenueCagrMax: Number(input.revenueCagrMax) || 200,
    profitCagrMin: Number(input.profitCagrMin) || -50,
    profitCagrMax: Number(input.profitCagrMax) || 200,
    scoreMin: Number(input.scoreMin) || 0,
    scoreMax: Number(input.scoreMax) || 100,
    showAll: String(input.showAll) !== 'false',
    showBuffettOnly: String(input.showBuffettOnly) === 'true',
    showModifiedBuffettOnly: String(input.showModifiedBuffettOnly) === 'true',
    showJhunjhunwalaOnly: String(input.showJhunjhunwalaOnly) === 'true',
    showJhunjhunwalaModifiedOnly: String(input.showJhunjhunwalaModifiedOnly) === 'true',
    showGrahamOnly: String(input.showGrahamOnly) === 'true',
    showModifiedGrahamOnly: String(input.showModifiedGrahamOnly) === 'true',
    showEnterprisingOnly: String(input.showEnterprisingOnly) === 'true',
    sort: input.sort ?? '',
    forecastHorizon: Number(input.forecastHorizon) || 90,
  }),
  component: StockBrowserPage,
})

const stockDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stocks/$symbol',
  component: StockDetailPage,
})

const buffettRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/buffett',
  component: BuffettPage,
})

const jhunjhunwalaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/jhunjhunwala',
  component: JhunjhunwalaPage,
})

const grahamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/graham',
  component: GrahamPage,
})

const enterprisingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/enterprising',
  component: EnterprisingPage,
})

export interface WatchlistSearchParams {
  sector: string
}

const watchlistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/watchlist',
  validateSearch: (input: Record<string, string | undefined>): WatchlistSearchParams => ({
    sector: input.sector ?? '',
  }),
  component: WatchlistPage,
})

export interface BargainsSearchParams {
  q: string
  sector: string
  zone: string
  cap: string
  strategy: string
  sortBy: string
  page: number
}

const bargainsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bargains',
  validateSearch: (input: Record<string, string | undefined>): BargainsSearchParams => ({
    q: input.q ?? '',
    sector: input.sector ?? '',
    zone: input.zone ?? 'all',
    cap: input.cap ?? 'all',
    strategy: input.strategy ?? 'all',
    sortBy: input.sortBy ?? 'bargainScore',
    page: Number(input.page) || 1,
  }),
  component: BargainsPage,
})

const compareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/compare',
  component: ComparePage,
})

const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/portfolio',
  component: PortfolioPage,
})

const goalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/goals',
  component: () => (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Investment Goals</h1>
    </div>
  ),
})

const goalDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/goals/$goalId',
  component: () => (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Goal Detail</h1>
    </div>
  ),
})

const reviewsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reviews',
  component: ReviewsPage,
})

const journalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/journal',
  component: JournalPage,
})

const riskProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/risk-profile',
  component: RiskProfilePage,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})

const xirrRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/xirr',
  component: XirrPage,
})

const calculatorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calculators',
  validateSearch: (input: Record<string, string | undefined>) => ({
    tool: input.tool ?? '',
  }),
  component: CalculatorsPage,
})

const glossaryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/glossary',
  component: GlossaryPage,
})

const bondsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bonds',
  component: () => <Outlet />,
})

const bondsIndexRoute = createRoute({
  getParentRoute: () => bondsRoute,
  path: '/',
  component: BondsPage,
})

const bondDetailRoute = createRoute({
  getParentRoute: () => bondsRoute,
  path: '/$isin',
  component: BondDetailPage,
})

const bondCompareRoute = createRoute({
  getParentRoute: () => bondsRoute,
  path: '/compare',
  component: BondComparePage,
})

const bondsRouteTree = bondsRoute.addChildren([
  bondsIndexRoute,
  bondDetailRoute,
  bondCompareRoute,
])

const routeTree = rootRoute.addChildren([
  indexRoute,
  stocksRoute,
  stockDetailRoute,
  buffettRoute,
  jhunjhunwalaRoute,
  grahamRoute,
  enterprisingRoute,
  watchlistRoute,
  bargainsRoute,
  compareRoute,
  portfolioRoute,
  goalsRoute,
  goalDetailRoute,
  reviewsRoute,
  journalRoute,
  riskProfileRoute,
  xirrRoute,
  calculatorsRoute,
  glossaryRoute,
  bondsRouteTree,
  settingsRoute,
])

export const router = createRouter({ routeTree, scrollRestoration: true })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
