import { useCallback, useEffect, useRef, useState } from 'react'
import { searchCities } from '../services/searchService'
import { SEARCH_DEBOUNCE_MS } from '../utils/config'
import { getSearchErrorMessage } from '../utils/validation'

const idleState = {
  status: 'idle',
  results: [],
  error: null,
  warning: null,
  provider: null,
  providerLabel: null,
}

const OFFLINE_MESSAGE =
  'City search needs an internet connection. Reconnect, or switch between your saved cities.'

const CACHE_LIMIT = 30

export function useCitySearch({ isOnline = true } = {}) {
  const [query, setQuery] = useState('')
  const [state, setState] = useState(idleState)
  const controllerRef = useRef(null)
  const timerRef = useRef(null)
  const cacheRef = useRef(new Map())

  const runSearch = useCallback(
    async (term, { force = false } = {}) => {
      const trimmed = term.trim()
      const normalized = trimmed.toLowerCase()
      if (normalized.length < 2) return

      if (!isOnline) {
        setState({ ...idleState, status: 'error', error: OFFLINE_MESSAGE })
        return
      }

      if (!force && cacheRef.current.has(normalized)) {
        const cached = cacheRef.current.get(normalized)
        setState({
          status: 'success',
          results: cached.cities,
          error: null,
          warning: cached.warning,
          provider: cached.provider,
          providerLabel: cached.providerLabel,
        })
        return
      }

      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      setState((previous) => ({
        status: 'loading',
        results: [],
        error: null,
        warning: previous.warning,
        provider: null,
        providerLabel: null,
      }))

      try {
        const result = await searchCities(trimmed, { signal: controller.signal })
        if (controller.signal.aborted) return
        cacheRef.current.set(normalized, result)
        if (cacheRef.current.size > CACHE_LIMIT) {
          const oldestKey = cacheRef.current.keys().next().value
          cacheRef.current.delete(oldestKey)
        }
        setState({
          status: 'success',
          results: result.cities,
          error: null,
          warning: result.warning,
          provider: result.provider,
          providerLabel: result.providerLabel,
        })
      } catch (error) {
        if (error?.name === 'AbortError') return
        setState({
          status: 'error',
          results: [],
          error: getSearchErrorMessage(error),
          warning: null,
          provider: null,
          providerLabel: null,
        })
      }
    },
    [isOnline],
  )

  useEffect(() => {
    const trimmed = query.trim()
    controllerRef.current?.abort()
    clearTimeout(timerRef.current)

    if (trimmed.length < 2) {
      setState(idleState)
      return undefined
    }

    if (!isOnline) {
      setState({ ...idleState, status: 'error', error: OFFLINE_MESSAGE })
      return undefined
    }

    const normalized = trimmed.toLowerCase()
    if (cacheRef.current.has(normalized)) {
      const cached = cacheRef.current.get(normalized)
      setState({
        status: 'success',
        results: cached.cities,
        error: null,
        warning: cached.warning,
        provider: cached.provider,
        providerLabel: cached.providerLabel,
      })
      return undefined
    }

    setState((previous) => ({
      status: 'loading',
      results: [],
      error: null,
      warning: previous.warning,
      provider: null,
      providerLabel: null,
    }))

    timerRef.current = setTimeout(() => {
      runSearch(trimmed)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      clearTimeout(timerRef.current)
      controllerRef.current?.abort()
    }
  }, [query, isOnline, runSearch])

  useEffect(
    () => () => {
      clearTimeout(timerRef.current)
      controllerRef.current?.abort()
    },
    [],
  )

  const retry = useCallback(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) return
    clearTimeout(timerRef.current)
    cacheRef.current.delete(trimmed.toLowerCase())
    runSearch(trimmed, { force: true })
  }, [query, runSearch])

  const reset = useCallback(() => {
    clearTimeout(timerRef.current)
    controllerRef.current?.abort()
    setQuery('')
    setState(idleState)
  }, [])

  return {
    query,
    setQuery,
    results: state.results,
    status: state.status,
    error: state.error,
    warning: state.warning,
    provider: state.provider,
    providerLabel: state.providerLabel,
    retry,
    reset,
  }
}
