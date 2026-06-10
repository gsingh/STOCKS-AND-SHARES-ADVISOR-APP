import { create } from 'zustand'

interface DashboardStore {
  watchlistOrder: string[]
  setWatchlistOrder: (order: string[]) => void
  addToWatchlist: (symbol: string) => void
  removeFromWatchlist: (symbol: string) => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  watchlistOrder: [],
  setWatchlistOrder: (order) => set({ watchlistOrder: order }),
  addToWatchlist: (symbol) =>
    set((state) => {
      if (state.watchlistOrder.includes(symbol)) return {}
      return { watchlistOrder: [...state.watchlistOrder, symbol] }
    }),
  removeFromWatchlist: (symbol) =>
    set((state) => ({
      watchlistOrder: state.watchlistOrder.filter((s) => s !== symbol),
    })),
}))
