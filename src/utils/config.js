const env = import.meta.env ?? {}

export const OPENWEATHER_API_KEY = String(env.VITE_OPENWEATHER_API_KEY ?? '').trim()
export const GEODB_API_KEY = String(env.VITE_GEODB_RAPIDAPI_KEY ?? '').trim()
export const GEODB_HOST = String(env.VITE_GEODB_RAPIDAPI_HOST ?? 'wft-geo-db.p.rapidapi.com').trim()

export const HAS_OPENWEATHER_KEY = OPENWEATHER_API_KEY.length > 0
export const HAS_GEODB_KEY = GEODB_API_KEY.length > 0

export const WEATHER_REQUEST_TIMEOUT = 10_000
export const SEARCH_REQUEST_TIMEOUT = 9_000
export const SEARCH_DEBOUNCE_MS = 300
