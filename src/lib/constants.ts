export const APP_NAME = 'Stocks & Shares Advisor'

export const APP_VERSION = '1.0.0'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export const ROUTES = {
  HOME: '/',
  SCORECARD: '/scorecard',
  COMPARE: '/compare',
  RISK_PROFILE: '/risk-profile',
  OVERLAP: '/overlap',
  XIRR: '/xirr',
} as const

export const CACHE_KEYS = {
  SCORECARD: 'scorecard-cache',
  RISK_PROFILE: 'risk-profile-cache',
  OVERLAP: 'overlap-cache',
  XIRR: 'xirr-cache',
} as const

export const CACHE_DURATION_MS = 5 * 60 * 1000
