import { type ReactNode, useState, useEffect, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import {
  LayoutDashboard,
  TrendingUp,
  GitCompare,
  PieChart,
  Target,
  ClipboardCheck,
  BookOpen,
  BookText,
  Settings,
  Menu,
  X,
  Calculator,
  Sun,
  Moon,
  Landmark,
} from 'lucide-react'
import { useUIStore } from '../../stores'
import { ToastContainer } from './toast'

interface NavItem {
  label: string
  icon: ReactNode
  href: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/' },
  { label: 'Stocks', icon: <TrendingUp size={20} />, href: '/stocks' },
  { label: 'Buffett', icon: <Landmark size={20} />, href: '/buffett' },
  { label: 'Compare', icon: <GitCompare size={20} />, href: '/compare' },
  { label: 'Portfolio', icon: <PieChart size={20} />, href: '/portfolio' },
  { label: 'Goals', icon: <Target size={20} />, href: '/goals' },
  { label: 'Reviews', icon: <ClipboardCheck size={20} />, href: '/reviews' },
  { label: 'Journal', icon: <BookOpen size={20} />, href: '/journal' },
  { label: 'XIRR', icon: <Calculator size={20} />, href: '/xirr' },
  { label: 'Glossary', icon: <BookText size={20} />, href: '/glossary' },
  { label: 'Settings', icon: <Settings size={20} />, href: '/settings' },
]

interface LayoutProps {
  children: ReactNode
  title?: string
}

export function Layout({ children, title = 'Dashboard' }: LayoutProps) {
  const { theme, toggleTheme } = useUIStore()
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarExpanded(false)
      } else {
        setSidebarExpanded(true)
      }
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const closeDrawer = useCallback(() => setMobileDrawerOpen(false), [])

  const sidebarContent = (
    <nav className="flex flex-col gap-1 py-4">
      {navItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-[var(--sidebar-fg)] transition-colors hover:bg-white/10"
          activeProps={{ className: 'bg-white/20 text-white', 'aria-current': 'page' }}
          activeOptions={item.href === '/' ? { exact: true } : undefined}
        >
          <span className="shrink-0">{item.icon}</span>
          {sidebarExpanded && (
            <span className="text-sm font-medium">{item.label}</span>
          )}
        </Link>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Desktop sidebar */}
      <aside
        aria-label="Main navigation"
        className={`hidden transition-all duration-300 md:flex md:flex-col ${
          sidebarExpanded ? 'w-[260px]' : 'w-[64px]'
        } fixed left-0 top-0 z-30 h-full bg-[var(--sidebar-bg)]`}
      >
        <div className="flex h-14 items-center border-b border-white/10 px-4">
          {sidebarExpanded && (
            <span className="text-sm font-bold text-[var(--sidebar-fg)]">
              Stocks & Shares
            </span>
          )}
        </div>
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeDrawer}
        >
          <aside
            aria-label="Mobile navigation"
            className="flex h-full w-[260px] flex-col bg-[var(--sidebar-bg)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
              <span className="text-sm font-bold text-[var(--sidebar-fg)]">
                Stocks & Shares
              </span>
              <button
                onClick={closeDrawer}
                aria-label="Close navigation menu"
                className="text-[var(--sidebar-fg)] hover:text-white/80"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-2 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={closeDrawer}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-[var(--sidebar-fg)] transition-colors hover:bg-white/10"
                  activeProps={{ className: 'bg-white/20 text-white' }}
                  activeOptions={item.href === '/' ? { exact: true } : undefined}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main area */}
      <div
        className="flex flex-1 flex-col transition-all duration-300"
        style={{ marginLeft: sidebarExpanded ? '260px' : '64px' }}
      >
        {/* Topbar */}
        <header className="flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--background)] px-4">
          {/* Hamburger: visible on mobile */}
          <button
            aria-label="Open navigation menu"
            className="md:hidden text-[var(--foreground)]"
            onClick={() => setMobileDrawerOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Collapse toggle: visible on tablet/desktop */}
          <button
            aria-label="Toggle sidebar"
            className="hidden md:inline-flex text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            onClick={() => setSidebarExpanded((p) => !p)}
          >
            <Menu size={20} />
          </button>

          <h1 className="text-lg font-semibold text-[var(--foreground)]">
            {title}
          </h1>

          <div className="ml-auto flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-md p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
      <ToastContainer />
    </div>
  )
}
