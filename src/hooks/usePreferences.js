import { useCallback, useEffect, useState } from 'react'
import { readString, STORAGE_KEYS, writeString } from '../utils/storage'

const THEME_QUERY = '(prefers-color-scheme: light)'

function readStoredTheme() {
  const stored = readString(STORAGE_KEYS.theme)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

function readSystemTheme() {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia?.(THEME_QUERY).matches ? 'light' : 'dark'
}

function readStoredUnits() {
  return readString(STORAGE_KEYS.units) === 'imperial' ? 'imperial' : 'metric'
}

export function usePreferences() {
  const [theme, setTheme] = useState(readStoredTheme)
  const [systemTheme, setSystemTheme] = useState(readSystemTheme)
  const [units, setUnits] = useState(readStoredUnits)
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    const media = window.matchMedia?.(THEME_QUERY)
    if (!media) return
    const handleChange = (event) => setSystemTheme(event.matches ? 'light' : 'dark')
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', resolvedTheme === 'light' ? '#f3f6fa' : '#0a111d')
  }, [resolvedTheme])

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === STORAGE_KEYS.theme) setTheme(readStoredTheme())
      if (event.key === STORAGE_KEYS.units) setUnits(readStoredUnits())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    writeString(STORAGE_KEYS.theme, next)
  }, [resolvedTheme])

  const toggleUnits = useCallback(() => {
    setUnits((current) => {
      const next = current === 'metric' ? 'imperial' : 'metric'
      writeString(STORAGE_KEYS.units, next)
      return next
    })
  }, [])

  return { theme, resolvedTheme, toggleTheme, units, toggleUnits }
}
