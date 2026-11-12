import { readJson, STORAGE_KEYS, writeJson } from './storage'
import { sanitizeCity, toStoredCity } from './city'

const CACHE_VERSION = 1

export function readLastCity() {
  return sanitizeCity(readJson(STORAGE_KEYS.lastCity, null))
}

export function writeLastCity(city) {
  if (!city) return { ok: false }
  return writeJson(STORAGE_KEYS.lastCity, toStoredCity(city))
}

export function readLastWeatherCache() {
  const raw = readJson(STORAGE_KEYS.lastWeather, null)
  if (!raw || raw.version !== CACHE_VERSION) return null

  const city = sanitizeCity(raw.city)
  const data = raw.data
  if (!city || !data?.current || !Array.isArray(data.forecast)) return null
  if (typeof data.current.tempC !== 'number') return null

  return {
    city,
    data,
    savedAt: Number.isFinite(raw.savedAt) ? raw.savedAt : null,
  }
}

export function writeLastWeatherCache(city, data, savedAt = Date.now()) {
  if (!city || !data) return false
  const result = writeJson(STORAGE_KEYS.lastWeather, {
    version: CACHE_VERSION,
    city: toStoredCity(city),
    data,
    savedAt,
  })
  return result.ok
}
