import { create } from 'zustand'

interface UIStore {
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  activeFilters: Record<string, string | number | null>
  toggleTheme: () => void
  toggleSidebar: () => void
  setFilter: (key: string, value: string | number | null) => void
  resetFilters: () => void
}

function getInitialTheme(): 'light' | 'dark' {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
  if (stored === 'dark' || stored === 'light') return stored
  return 'light'
}

export const useUIStore = create<UIStore>((set) => ({
  theme: getInitialTheme(),
  sidebarCollapsed: false,
  activeFilters: {},
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light'
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', next)
        document.documentElement.classList.toggle('dark', next === 'dark')
      }
      return { theme: next }
    }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setFilter: (key, value) =>
    set((state) => ({ activeFilters: { ...state.activeFilters, [key]: value } })),
  resetFilters: () => set({ activeFilters: {} }),
}))
