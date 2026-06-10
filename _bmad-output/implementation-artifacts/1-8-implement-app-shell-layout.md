# Story 1.8: Implement App Shell layout (sidebar + topbar + content)

Status: ready-for-dev

## Story

As a user,
I want the App Shell layout with sidebar navigation, topbar, and content area,
So that I can navigate between all app surfaces and understand my current location.

## Acceptance Criteria

1. `src/components/shared/layout.tsx` implements the App Shell with sidebar (260px expanded), topbar, and content area
2. Sidebar shows nav items: Dashboard, Stocks, Compare, Portfolio, Goals, Reviews, Journal, Watchlist, Settings, Glossary — in that order
3. Sidebar active item (highlighted via `--sidebar-active` token) matches the current route
4. Sidebar collapses to icon-only (64px) at <1024px viewport width
5. Sidebar becomes a Sheet overlay from the left at <768px (mobile)
6. Topbar displays current page title, hamburger button (mobile), and theme toggle button
7. Clicking a sidebar nav item updates the route via TanStack Router without full page reload
8. Route definitions in `src/routes/` match the IA table from EXPERIENCE.md (stubbed with placeholder components)
9. Keyboard: Escape key closes the Sheet overlay when open
10. Sidebar and topbar are fixed-position, content area scrolls independently

## Tasks / Subtasks

- [ ] Create `src/components/shared/layout.tsx` with AppShell component (AC: #1)
- [ ] Implement sidebar nav items data structure with labels, icons, paths (AC: #2)
- [ ] Wire active-route detection via `useRouter()` from TanStack Router (AC: #3)
- [ ] Implement responsive sidebar: expanded (>=1024px), collapsed icons (768-1023px), Sheet (<768px) (AC: #4, #5)
- [ ] Create topbar with page title, hamburger button, theme toggle (AC: #6)
- [ ] Implement navigation via `<Link>` components (AC: #7)
- [ ] Create stub route files in `src/routes/` matching IA (AC: #8)
- [ ] Add keyboard handling (Escape to close Sheet) (AC: #9)
- [ ] Verify fixed-position layout with independent content scroll (AC: #10)

## Dev Notes

### Architecture Patterns & Constraints

- **Zero-backend mandate:** All computation client-side. No server, no auth, no API keys. [Source: architecture.md#L44-L46]
- **feature-based directory structure:** `src/features/` for pure domain logic (zero React imports), `src/components/features/` for React components, `src/services/` for data access. [Source: architecture.md#L188-L192]
- **Naming conventions:** kebab-case files, PascalCase components, camelCase functions/vars. [Source: architecture.md#L170-L184]
- **Co-located tests:** `layout.test.tsx` next to `layout.tsx`. Never use `__tests__/` directories. [Source: architecture.md#L184]
- **en-IN locale** formatting for all displayed numeric/currency values. [Source: DESIGN.md#L140]
- **dark mode** via `.dark` class + CSS custom properties (not a separate stylesheet). [Source: DESIGN.md#L128]
- **Inter + JetBrains Mono** loaded as custom fonts. `tabular-nums` on all financial figures. [Source: DESIGN.md#L136-L139]
- **No React in `features/`** — pure domain logic only. React components in `components/features/`. [Source: architecture.md#L239-L241]

### TanStack Router Outlet Usage

The AppShell layout wraps the `<Outlet />` from TanStack Router. The `__root.tsx` route renders `AppShell` as the layout wrapper:

```tsx
// src/routes/__root.tsx
import { createRootRoute } from '@tanstack/react-router'
import { AppShell } from '../components/shared/layout'

export const Route = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})
```

The `<Outlet />` renders the matched child route's component inside the content area.

### Sidebar Nav Items Data Structure

Define as a typed constant array for type safety and reusability:

```tsx
export interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',  path: '/',             icon: LayoutDashboard },
  { label: 'Stocks',     path: '/stocks',        icon: TrendingUp },
  { label: 'Compare',    path: '/compare',       icon: GitCompareArrows },
  { label: 'Portfolio',  path: '/portfolio',     icon: Briefcase },
  { label: 'Goals',      path: '/goals',         icon: Target },
  { label: 'Reviews',    path: '/reviews',       icon: ClipboardCheck },
  { label: 'Journal',    path: '/journal',       icon: BookOpen },
  { label: 'Watchlist',  path: '/watchlist',     icon: Eye },
  { label: 'Settings',   path: '/settings',      icon: Settings },
  { label: 'Glossary',   path: '/glossary',      icon: BookMarked },
]
```

Use icons from `lucide-react` (bundled with shadcn/ui).

### Active Route Detection

Use `useRouter()` from TanStack Router to get the current route and match against nav items:

```tsx
import { useRouter } from '@tanstack/react-router'

function SidebarNav() {
  const router = useRouter()
  const currentPath = router.state.location.pathname

  return NAV_ITEMS.map(item => (
    <NavItem
      key={item.path}
      item={item}
      isActive={currentPath === item.path || currentPath.startsWith(item.path + (item.path === '/' ? '' : '/'))}
    />
  ))
}
```

For the Dashboard root path (`/`), exact match only. For `/stocks`, match `/stocks` or `/stocks/*`. For other paths, prefix match.

### Responsive Breakpoints

| Breakpoint | Sidebar behavior | Layout |
|---|---|---|
| >=1024px (lg) | Expanded 260px, visible | Sidebar + content side-by-side |
| 768-1023px (md) | Collapsed 64px icons, visible | Sidebar + content side-by-side, tooltips on icons |
| <768px (sm) | Hidden, Sheet overlay from left | Content full-width, hamburger toggles Sheet |

[Source: EXPERIENCE.md#L156-L162]

Implementation approach using Tailwind responsive classes and React state:

```tsx
const [sheetOpen, setSheetOpen] = useState(false)
const isMobile = useMediaQuery('(max-width: 767px)')
const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
const isDesktop = useMediaQuery('(min-width: 1024px)')
```

For `useMediaQuery`, use a custom hook that listens to window.matchMedia. Alternatively, use CSS classes:

```tsx
// Sidebar always renders, visibility controlled by CSS
<aside className={cn(
  'fixed left-0 top-0 h-full bg-sidebar-bg text-sidebar-fg z-30 transition-all duration-300',
  'lg:w-[260px] lg:translate-x-0',
  'md:w-[64px] md:translate-x-0',
  'sm:w-[260px] sm:-translate-x-full',
  sheetOpen && 'sm:translate-x-0',
)}>
```

### Sheet Component

The Sheet component from shadcn/ui (`src/components/ui/sheet.tsx`) provides the mobile overlay behavior:

```tsx
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

// Mobile: Sheet wraps the sidebar nav content
// Desktop/tablet: inline sidebar (no Sheet)
```

Sheet default props: `side="left"`, closes on click outside and Escape key.

### Topbar Layout

Fixed topbar with height ~48-56px, containing:
- Left: hamburger button (visible only on mobile, `lg:hidden` class)
- Center/Left: page title (dynamic, from route config)
- Right: theme toggle button (sun/moon icons from lucide-react)

```tsx
<header className="fixed top-0 left-0 right-0 h-12 lg:left-[260px] md:left-[64px] sm:left-0 border-b bg-background z-20 flex items-center px-4 gap-3">
  <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSheetOpen(true)}>
    <Menu />
  </Button>
  <h1 className="text-lg font-semibold">{pageTitle}</h1>
  <div className="ml-auto">
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  </div>
</header>
```

The `pageTitle` can be derived from a route-level `title` property or a lookup map keyed by route path.

### Content Area Sizing

Content area is offset by sidebar width (desktop) or full-width (mobile):

```tsx
<main className={cn(
  'pt-12 min-h-screen transition-all duration-300',
  'lg:ml-[260px]',
  'md:ml-[64px]',
  'sm:ml-0',
)}>
  <div className="p-4 lg:p-6">
    {children}
  </div>
</main>
```

### Keyboard Navigation

- Escape key closes Sheet overlay when open (already handled by Sheet component by default)
- Tab order: sidebar nav items → topbar controls → content area
- Enter/Space activates focused nav items (native `<a>` / TanStack `<Link>` behavior)

### Route Definitions (Stubs)

Create the following route files with minimal placeholder components for now (routes will be filled in Story 1.14):

```
src/routes/__root.tsx         # Root layout with AppShell + Outlet
src/routes/index.tsx          # Dashboard
src/routes/stocks.tsx         # Stock Browser
src/routes/stocks.$symbol.tsx # Stock Detail
src/routes/compare.tsx        # Compare
src/routes/portfolio.tsx      # Portfolio
src/routes/goals.tsx          # Goals
src/routes/goals.$goalId.tsx  # Goal Detail
src/routes/reviews.tsx        # Reviews
src/routes/journal.tsx        # Journal
src/routes/watchlist.tsx      # Watchlist
src/routes/settings.tsx       # Settings
src/routes/glossary.tsx       # Glossary
```

Each stub route file exports a single lazy-loaded component:

```tsx
// src/routes/stocks.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/stocks')({
  component: StocksPage,
})

function StocksPage() {
  return <div>Stock Browser</div>
}
```

The root route renders `AppShell` wrapping `<Outlet />`:

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AppShell } from '../components/shared/layout'

export const Route = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})
```

### IA Route Mapping

| Surface | Route | Nav Item |
|---|---|---|
| Dashboard | `/` | Dashboard |
| Stock Browser | `/stocks` | Stocks |
| Stock Detail | `/stocks/$symbol` | Stocks (active) |
| Compare | `/compare` | Compare |
| Portfolio | `/portfolio` | Portfolio |
| Goals | `/goals` | Goals |
| Goal Detail | `/goals/$goalId` | Goals (active) |
| Reviews | `/reviews` | Reviews |
| Journal | `/journal` | Journal |
| Watchlist | `/watchlist` | Watchlist |
| Settings | `/settings` | Settings |
| Glossary | `/glossary` | Glossary |

[Source: EXPERIENCE.md#L22-L36]

### Dependencies

This story depends on:
- Story 1.1: Vite scaffold and dependencies (TanStack Router, shadcn/ui including Sheet and Button)
- Story 1.2: Tailwind CSS 4 with brand tokens (sidebar tokens, primary/accent colors)
- shadcn Sheet component already installed from Story 1.1: `npx shadcn@latest add sheet`
- shadcn Button component already installed from Story 1.1

### Design Tokens Used

Sidebar specific tokens from globals.css:
- `--sidebar-bg`: #1B3A5C (light) / #0F1F30 (dark)
- `--sidebar-fg`: #FFFFFF (both modes)
- `--sidebar-active`: #1E7A45 (both modes)
- Applied via Tailwind utility classes: `bg-sidebar-bg text-sidebar-fg`

### References

- [Source: epics-and-stories.md#L325-L342] — Story 1.8 acceptance criteria
- [Source: EXPERIENCE.md#L22-L36] — Information Architecture (IA) table
- [Source: EXPERIENCE.md#L156-L162] — Responsive breakpoints
- [Source: EXPERIENCE.md#L111-L117] — Keyboard navigation rules
- [Source: DESIGN.md#L118-L130] — Sidebar design tokens
- [Source: architecture.md#L243-L371] — Project structure

## Dev Agent Record

### Agent Model Used

BMad Create-Story workflow (v6.8.1-next.4)

### Debug Log References

### Completion Notes List

### File List
