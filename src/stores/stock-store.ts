import { create } from 'zustand'

interface CompareItem {
  symbol: string
  name: string
}

interface StockStore {
  selectedStock: string | null
  compareList: CompareItem[]
  selectStock: (symbol: string | null) => void
  addToCompare: (item: CompareItem) => void
  removeFromCompare: (symbol: string) => void
  clearCompare: () => void
  isInCompare: (symbol: string) => boolean
}

export const useStockStore = create<StockStore>((set, get) => ({
  selectedStock: null,
  compareList: [],
  selectStock: (symbol) => set({ selectedStock: symbol }),
  addToCompare: (item) =>
    set((state) => {
      if (state.compareList.length >= 4) return {}
      if (state.compareList.some((c) => c.symbol === item.symbol)) return {}
      return { compareList: [...state.compareList, item] }
    }),
  removeFromCompare: (symbol) =>
    set((state) => ({
      compareList: state.compareList.filter((c) => c.symbol !== symbol),
    })),
  clearCompare: () => set({ compareList: [] }),
  isInCompare: (symbol) => get().compareList.some((c) => c.symbol === symbol),
}))
