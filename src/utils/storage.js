const memoryStore = new Map()

export const STORAGE_KEYS = {
  theme: 'weatherboard:theme:v1',
  units: 'weatherboard:units:v1',
  favorites: 'weatherboard:favorites:v1',
  lastCity: 'weatherboard:last-city:v1',
  lastWeather: 'weatherboard:last-weather:v1',
  reminder: 'weatherboard:reminder:v1',
}

function getLocalStorage() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function isStorageAvailable() {
  const storage = getLocalStorage()
  if (!storage) return false
  try {
    const key = '__weatherboard_probe__'
    storage.setItem(key, '1')
    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function readString(key) {
  const storage = getLocalStorage()
  if (storage) {
    try {
      const value = storage.getItem(key)
      if (value !== null) return value
    } catch (error) {
      console.warn(`[WeatherBoard] Could not read ${key} from local storage.`, error)
    }
  }
  return memoryStore.has(key) ? memoryStore.get(key) : null
}

export function writeString(key, value) {
  memoryStore.set(key, value)
  const storage = getLocalStorage()
  if (!storage) return { ok: false, error: new Error('Local storage is unavailable.') }
  try {
    storage.setItem(key, value)
    return { ok: true }
  } catch (error) {
    console.warn(`[WeatherBoard] Could not save ${key} to local storage.`, error)
    return { ok: false, error }
  }
}

export function removeKey(key) {
  memoryStore.delete(key)
  const storage = getLocalStorage()
  if (!storage) return { ok: false }
  try {
    storage.removeItem(key)
    return { ok: true }
  } catch (error) {
    console.warn(`[WeatherBoard] Could not remove ${key} from local storage.`, error)
    return { ok: false, error }
  }
}

export function readJson(key, fallback = null) {
  const raw = readString(key)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw)
  } catch (error) {
    console.warn(`[WeatherBoard] Stored value for ${key} was not valid JSON.`, error)
    removeKey(key)
    return fallback
  }
}

export function writeJson(key, value) {
  try {
    return writeString(key, JSON.stringify(value))
  } catch (error) {
    console.warn(`[WeatherBoard] Could not serialise ${key}.`, error)
    return { ok: false, error }
  }
}
