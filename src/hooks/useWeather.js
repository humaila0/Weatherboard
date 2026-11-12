import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWeather } from '../services/weatherService'
import {
  getWeatherErrorDetail,
  WEATHER_ERROR_MESSAGE,
  WEATHER_ERROR_TITLE,
} from '../utils/validation'
import {
  readLastWeatherCache,
  writeLastCity,
  writeLastWeatherCache,
} from '../utils/weatherCache'

const initialState = {
  status: 'idle',
  data: null,
  error: null,
  isCached: false,
  savedAt: null,
  cityKey: null,
  cacheWriteFailed: false,
}

function networkErrorDetail(error) {
  return getWeatherErrorDetail(error)
}

export function useWeather(city, { isOnline = true } = {}) {
  const [state, setState] = useState(initialState)
  const controllerRef = useRef(null)
  const requestIdRef = useRef(0)

  const load = useCallback(
    async (target) => {
      if (!target) return

      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      const requestId = ++requestIdRef.current

      const cached = readLastWeatherCache()
      const cachedMatch = cached && cached.city.key === target.key ? cached : null

      if (!isOnline) {
        if (cachedMatch) {
          setState({
            status: 'success',
            data: cachedMatch.data,
            error: null,
            isCached: true,
            savedAt: cachedMatch.savedAt,
            cityKey: target.key,
            cacheWriteFailed: false,
          })
        } else {
          setState({
            status: 'error',
            data: null,
            error: {
              title: 'You’re offline',
              message: 'No saved weather is available for this city yet.',
              detail: 'Reconnect to load live weather, or choose a city you have viewed before.',
              code: 'offline',
            },
            isCached: false,
            savedAt: null,
            cityKey: target.key,
            cacheWriteFailed: false,
          })
        }
        return
      }

      setState((previous) => {
        const sameCity = previous.cityKey === target.key && previous.data
        return {
          status: 'loading',
          data: sameCity ? previous.data : (cachedMatch?.data ?? null),
          error: null,
          isCached: sameCity ? previous.isCached : Boolean(cachedMatch),
          savedAt: sameCity ? previous.savedAt : (cachedMatch?.savedAt ?? null),
          cityKey: target.key,
          cacheWriteFailed: false,
        }
      })

      try {
        const data = await fetchWeather(target, { signal: controller.signal })
        if (requestId !== requestIdRef.current) return
        const savedAt = Date.now()
        const cacheResult = writeLastWeatherCache(target, data, savedAt)
        writeLastCity(target)
        setState({
          status: 'success',
          data,
          error: null,
          isCached: false,
          savedAt,
          cityKey: target.key,
          cacheWriteFailed: !cacheResult,
        })
      } catch (error) {
        if (error?.name === 'AbortError' || requestId !== requestIdRef.current) return

        if (cachedMatch) {
          setState({
            status: 'success',
            data: cachedMatch.data,
            error: {
              title: 'Live weather unavailable',
              message: 'Showing the last saved weather instead.',
              detail: networkErrorDetail(error),
              code: error?.code ?? 'unknown',
            },
            isCached: true,
            savedAt: cachedMatch.savedAt,
            cityKey: target.key,
            cacheWriteFailed: false,
          })
        } else {
          setState({
            status: 'error',
            data: null,
            error: {
              title: WEATHER_ERROR_TITLE,
              message: WEATHER_ERROR_MESSAGE,
              detail: networkErrorDetail(error),
              code: error?.code ?? 'unknown',
            },
            isCached: false,
            savedAt: null,
            cityKey: target.key,
            cacheWriteFailed: false,
          })
        }
      }
    },
    [isOnline],
  )

  useEffect(() => {
    if (!city) return undefined
    load(city)
    return () => controllerRef.current?.abort()
  }, [city, load])

  const refresh = useCallback(() => {
    if (city) load(city)
  }, [city, load])

  return { ...state, refresh }
}
