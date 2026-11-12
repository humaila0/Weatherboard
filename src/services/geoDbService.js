import { GEODB_API_KEY, GEODB_HOST, SEARCH_REQUEST_TIMEOUT } from '../utils/config'
import { createCity } from '../utils/city'
import { ApiError, fetchJson } from './http'

export async function searchGeoDbCities(query, { signal } = {}) {
  if (!GEODB_API_KEY) {
    throw new ApiError('The GeoDB API key is not configured.', {
      code: 'invalid_key',
      provider: 'geodb',
    })
  }

  const params = new URLSearchParams({
    namePrefix: query,
    limit: '8',
    sort: '-population',
    types: 'CITY',
  })

  const data = await fetchJson(`https://${GEODB_HOST}/v1/geo/cities?${params.toString()}`, {
    signal,
    timeoutMs: SEARCH_REQUEST_TIMEOUT,
    provider: 'geodb',
    headers: {
      'X-RapidAPI-Key': GEODB_API_KEY,
      'X-RapidAPI-Host': GEODB_HOST,
    },
  })

  if (!Array.isArray(data?.data)) {
    throw new ApiError('GeoDB returned an unexpected response.', {
      code: 'missing_data',
      provider: 'geodb',
    })
  }

  const seen = new Set()
  return data.data
    .map((item) =>
      createCity({
        name: item.name,
        region: item.region,
        country: item.country,
        countryCode: item.countryCode,
        lat: item.latitude,
        lon: item.longitude,
        timezone: item.timezone ?? null,
        source: 'geodb',
        sourceId: item.id,
      }),
    )
    .filter((city) => {
      if (!city || seen.has(city.key)) return false
      seen.add(city.key)
      return true
    })
}
