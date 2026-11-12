import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_FAVORITES, sanitizeCity, toStoredCity } from '../utils/city'
import { sanitizeFavoriteList } from '../utils/favorites'
import {
  isStorageAvailable,
  readJson,
  STORAGE_KEYS,
  writeJson,
} from '../utils/storage'

export function useFavorites() {
  const [favorites, setFavorites] = useState(() =>
    sanitizeFavoriteList(readJson(STORAGE_KEYS.favorites, [])),
  )
  const [storageAvailable, setStorageAvailable] = useState(() => isStorageAvailable())
  const favoritesRef = useRef(favorites)

  const commit = useCallback((next) => {
    favoritesRef.current = next
    setFavorites(next)
    const result = writeJson(STORAGE_KEYS.favorites, next)
    if (!result.ok) setStorageAvailable(false)
    return result
  }, [])

  useEffect(() => {
    favoritesRef.current = favorites
  }, [favorites])

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEYS.favorites && event.key !== null) return
      const next = sanitizeFavoriteList(readJson(STORAGE_KEYS.favorites, []))
      favoritesRef.current = next
      setFavorites(next)
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const addFavorite = useCallback(
    (city) => {
      const candidate = sanitizeCity(city)
      if (!candidate) return { ok: false, reason: 'invalid' }
      const current = favoritesRef.current
      if (current.some((favorite) => favorite.key === candidate.key)) {
        return { ok: false, reason: 'duplicate' }
      }
      if (current.length >= MAX_FAVORITES) {
        return { ok: false, reason: 'limit' }
      }
      commit([...current, toStoredCity(candidate)])
      return { ok: true, reason: null }
    },
    [commit],
  )

  const removeFavorite = useCallback(
    (key) => {
      const current = favoritesRef.current
      if (!current.some((favorite) => favorite.key === key)) {
        return { ok: false, reason: 'not-found' }
      }
      commit(current.filter((favorite) => favorite.key !== key))
      return { ok: true }
    },
    [commit],
  )

  const isFavorite = useCallback(
    (key) => favorites.some((favorite) => favorite.key === key),
    [favorites],
  )

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    storageAvailable,
    atLimit: favorites.length >= MAX_FAVORITES,
    maxFavorites: MAX_FAVORITES,
  }
}
