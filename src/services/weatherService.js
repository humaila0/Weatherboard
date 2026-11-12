import {
  HAS_OPENWEATHER_KEY,
  OPENWEATHER_API_KEY,
  WEATHER_REQUEST_TIMEOUT,
} from '../utils/config'
import { mapOpenWeatherWeather } from '../utils/weatherHelpers'
import { ApiError, fetchJson } from './http'
import { fetchOpenMeteoWeather } from './openMeteoService'

const OPENWEATHER_URL = 'https://api.openweathermap.org/data/2.5'

async function fetchOpenWeatherWeather(city, { signal } = {}) {
  if (!HAS_OPENWEATHER_KEY) {
    throw new ApiError('The OpenWeatherMap API key is not configured.', {
      code: 'invalid_key',
      provider: 'openweathermap',
    })
  }

  const params = new URLSearchParams({
    lat: String(city.lat),
    lon: String(city.lon),
    appid: OPENWEATHER_API_KEY,
    units: 'metric',
  })

  const [current, forecast] = await Promise.all([
    fetchJson(`${OPENWEATHER_URL}/weather?${params.toString()}`, {
      signal,
      timeoutMs: WEATHER_REQUEST_TIMEOUT,
      provider: 'openweathermap',
    }),
    fetchJson(`${OPENWEATHER_URL}/forecast?${params.toString()}`, {
      signal,
      timeoutMs: WEATHER_REQUEST_TIMEOUT,
      provider: 'openweathermap',
    }),
  ])

  return mapOpenWeatherWeather(current, forecast, city)
}

/**
 * OpenWeatherMap is the primary provider. If it is not configured or fails,
 * Open-Meteo serves the dashboard so the UI never falls back to mock weather.
 * Values from both providers are normalised to °C and km/h by their mappers.
 */
export async function fetchWeather(city, { signal } = {}) {
  let primaryError = null

  if (HAS_OPENWEATHER_KEY) {
    try {
      return await fetchOpenWeatherWeather(city, { signal })
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      primaryError = error
    }
  }

  try {
    const data = await fetchOpenMeteoWeather(city, { signal })
    return {
      ...data,
      fallback: Boolean(primaryError),
      fallbackReason: primaryError?.code ?? null,
    }
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    if (primaryError && (!error?.code || error.code === 'unknown')) throw primaryError
    throw error
  }
}
