import { afterEach, describe, expect, it, vi } from 'vitest'
import { searchOpenMeteoCities } from './openMeteoService'

function jsonResponse(payload) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('searchOpenMeteoCities', () => {
  it('normalises results and orders larger places first', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          results: [
            {
              id: 1,
              name: 'Paris',
              admin1: 'Texas',
              country: 'United States',
              country_code: 'US',
              latitude: 33.66,
              longitude: -95.55,
              timezone: 'America/Chicago',
              population: 25_000,
            },
            {
              id: 2,
              name: 'Paris',
              admin1: 'Île-de-France',
              country: 'France',
              country_code: 'FR',
              latitude: 48.85,
              longitude: 2.35,
              timezone: 'Europe/Paris',
              population: 2_100_000,
            },
            {
              id: 3,
              name: 'Paris',
              admin1: 'Ontario',
              country: 'Canada',
              country_code: 'CA',
              latitude: 43.2,
              longitude: -80.38,
              timezone: 'America/Toronto',
              population: 12_000,
            },
          ],
        }),
      ),
    )

    const results = await searchOpenMeteoCities('Paris')

    expect(results.map((city) => city.region)).toEqual([
      'Île-de-France',
      'Texas',
      'Ontario',
    ])
    expect(results[0]).toMatchObject({
      name: 'Paris',
      country: 'France',
      countryCode: 'FR',
      source: 'open-meteo-geocoding',
      sourceId: '2',
    })
  })

  it('returns an empty list when the provider has no matches', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({})))
    await expect(searchOpenMeteoCities('zzzz')).resolves.toEqual([])
  })

  it('throws a useful error for an unreadable payload', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ results: 'nope' })))
    await expect(searchOpenMeteoCities('Paris')).rejects.toThrow(/unexpected search response/)
  })
})
