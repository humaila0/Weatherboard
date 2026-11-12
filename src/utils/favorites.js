import { MAX_FAVORITES, sanitizeCity, toStoredCity } from './city'

export function sanitizeFavoriteList(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const favorites = []

  for (const item of value) {
    const city = sanitizeCity(item)
    if (!city || seen.has(city.key)) continue
    seen.add(city.key)
    favorites.push(toStoredCity(city))
    if (favorites.length >= MAX_FAVORITES) break
  }

  return favorites
}
