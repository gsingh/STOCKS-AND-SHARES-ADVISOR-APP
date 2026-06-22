import { create } from 'zustand'
import type { ForecastHorizon, ForecastResult } from '../features/forecast/types'

interface ForecastEntry {
  symbol: string
  horizon: ForecastHorizon
  result: ForecastResult | null
  loading: boolean
  error: string | null
}

interface ForecastState {
  forecasts: Record<string, ForecastEntry>
  activeStock: string | null
  activeHorizon: ForecastHorizon

  setActiveStock: (symbol: string | null) => void
  setActiveHorizon: (horizon: ForecastHorizon) => void
  setLoading: (symbol: string, horizon: ForecastHorizon) => void
  setResult: (symbol: string, horizon: ForecastHorizon, result: ForecastResult) => void
  setError: (symbol: string, horizon: ForecastHorizon, error: string) => void
  clearForecast: (symbol: string) => void
  clearAll: () => void
}

function entryKey(symbol: string, horizon: ForecastHorizon): string {
  return `${symbol}__h${horizon}`
}

export const useForecastStore = create<ForecastState>((set) => ({
  forecasts: {},
  activeStock: null,
  activeHorizon: 30,

  setActiveStock: (symbol) => set({ activeStock: symbol }),

  setActiveHorizon: (horizon) => set({ activeHorizon: horizon }),

  setLoading: (symbol, horizon) =>
    set((state) => {
      const key = entryKey(symbol, horizon)
      return {
        forecasts: {
          ...state.forecasts,
          [key]: {
            symbol,
            horizon,
            result: null,
            loading: true,
            error: null,
          },
        },
      }
    }),

  setResult: (symbol, horizon, result) =>
    set((state) => {
      const key = entryKey(symbol, horizon)
      return {
        forecasts: {
          ...state.forecasts,
          [key]: {
            symbol,
            horizon,
            result,
            loading: false,
            error: null,
          },
        },
      }
    }),

  setError: (symbol, horizon, error) =>
    set((state) => {
      const key = entryKey(symbol, horizon)
      return {
        forecasts: {
          ...state.forecasts,
          [key]: {
            symbol,
            horizon,
            result: null,
            loading: false,
            error,
          },
        },
      }
    }),

  clearForecast: (symbol) =>
    set((state) => {
      const next = { ...state.forecasts }
      for (const key of Object.keys(next)) {
        if (next[key].symbol === symbol) delete next[key]
      }
      return { forecasts: next }
    }),

  clearAll: () => set({ forecasts: {} }),
}))
