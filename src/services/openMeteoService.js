import {
  SEARCH_REQUEST_TIMEOUT,
  WEATHER_REQUEST_TIMEOUT,
} from '../utils/config'
import { createCity } from '../utils/city'
import { mapOpenMeteoWeather } from '../utils/weatherHelpers'
import { fetchJson } from './http'

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

export async function searchOpenMeteoCities(query, { signal } = {}) {
  const params = new URLSearchParams({
    name: query,
    count: '8',
    language: 'en',
    format: 'json',
  })

  const data = await fetchJson(`${GEOCODING_URL}?${params.toString()}`, {
    signal,
    timeoutMs: SEARCH_REQUEST_TIMEOUT,
    provider: 'open-meteo-geocoding',
  })

  if (!data || typeof data !== 'object') {
    throw new Error('Open-Meteo returned an unexpected search response.')
  }

  if (data.results === undefined) return []
  if (!Array.isArray(data.results)) {
    throw new Error('Open-Meteo returned an unexpected search response.')
  }

  const seen = new Set()
  return [...data.results]
    .sort((a, b) => Number(b.population ?? 0) - Number(a.population ?? 0))
    .map((item) =>
      createCity({
        name: item.name,
        region: item.admin1,
        country: item.country,
        countryCode: item.country_code,
        lat: item.latitude,
        lon: item.longitude,
        timezone: item.timezone,
        source: 'open-meteo-geocoding',
        sourceId: item.id,
      }),
    )
    .filter((city) => {
      if (!city || seen.has(city.key)) return false
      seen.add(city.key)
      return true
    })
}

export async function fetchOpenMeteoWeather(city, { signal } = {}) {
  const params = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '7',
    wind_speed_unit: 'kmh',
  })

  const data = await fetchJson(`${FORECAST_URL}?${params.toString()}`, {
    signal,
    timeoutMs: WEATHER_REQUEST_TIMEOUT,
    provider: 'open-meteo',
  })

  return mapOpenMeteoWeather(data, city)
}
