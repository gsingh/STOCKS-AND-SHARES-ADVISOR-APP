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
import { StockBrowserPage } from './routes/stocks'
import { StockDetailPage } from './routes/stocks.$symbol'
import { MarketSummary } from './components/features/dashboard/market-summary'
import { PortfolioSnapshot } from './components/features/dashboard/portfolio-snapshot'
import { ActiveAlerts } from './components/features/dashboard/active-alerts'
import { QuickActions } from './components/features/dashboard/quick-actions'
import ComparePage from './routes/compare'
import PortfolioPage from './routes/portfolio'
import ReviewsPage from './routes/reviews'
import JournalPage from './routes/journal'
import RiskProfilePage from './routes/risk-profile'

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
        <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Portfolio Snapshot</h2>
        <PortfolioSnapshot />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Active Alerts</h2>
        <ActiveAlerts />
      </section>
    </div>
  ),
})

const stocksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stocks',
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

const glossaryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/glossary',
  component: GlossaryPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  stocksRoute,
  stockDetailRoute,
  buffettRoute,
  compareRoute,
  portfolioRoute,
  goalsRoute,
  goalDetailRoute,
  reviewsRoute,
  journalRoute,
  riskProfileRoute,
  xirrRoute,
  glossaryRoute,
  settingsRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
