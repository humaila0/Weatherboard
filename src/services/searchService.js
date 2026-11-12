import { HAS_GEODB_KEY } from '../utils/config'
import { searchGeoDbCities } from './geoDbService'
import { searchOpenMeteoCities } from './openMeteoService'

/**
 * GeoDB is the preferred city search provider. Open-Meteo geocoding keeps search
 * functional when the RapidAPI key is absent, rate-limited, or temporarily down.
 */
export async function searchCities(query, { signal } = {}) {
  let primaryError = null
  let warning = null

  if (HAS_GEODB_KEY) {
    try {
      const cities = await searchGeoDbCities(query, { signal })
      if (cities.length > 0) {
        return { cities, provider: 'geodb', providerLabel: 'GeoDB Cities', warning: null }
      }
      warning = 'GeoDB returned no matches here, so these results come from Open-Meteo.'
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      primaryError = error
    }
  }

  try {
    const cities = await searchOpenMeteoCities(query, { signal })
    return {
      cities,
      provider: 'open-meteo',
      providerLabel: 'Open-Meteo Geocoding',
      warning:
        warning ??
        (primaryError
          ? 'GeoDB is unavailable right now, so these live results come from Open-Meteo.'
          : null),
    }
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    if (primaryError && error?.code === 'unknown') throw primaryError
    throw error
  }
}
