import { describe, expect, it } from 'vitest'
import { createCity, formatCitySubtitle, sanitizeCity } from './city'
import { sanitizeFavoriteList } from './favorites'
import {
  getSearchErrorMessage,
  getWeatherErrorDetail,
  validateCityQuery,
  validateReminderTime,
} from './validation'

describe('createCity', () => {
  it('creates a stable key and cleans optional fields', () => {
    const city = createCity({
      name: '  Karachi ',
      region: ' Sindh ',
      country: 'Pakistan',
      countryCode: 'pk',
      lat: 24.8607,
      lon: 67.0011,
      source: 'open-meteo-geocoding',
      sourceId: 1174872,
    })

    expect(city).toMatchObject({
      name: 'Karachi',
      region: 'Sindh',
      country: 'Pakistan',
      countryCode: 'PK',
      lat: 24.8607,
      lon: 67.0011,
      sourceId: '1174872',
    })
    expect(city.key).toBe('geo:24.86,67.00:karachi')
    expect(formatCitySubtitle(city)).toBe('Sindh, Pakistan')
  })

  it('rejects invalid coordinates and empty names', () => {
    expect(createCity({ name: '', lat: 1, lon: 1 })).toBeNull()
    expect(createCity({ name: 'Nowhere', lat: 200, lon: 1 })).toBeNull()
    expect(sanitizeCity(null)).toBeNull()
    expect(sanitizeCity({ name: 'Lahore', lat: '31.5', lon: '74.3' })).toMatchObject({
      name: 'Lahore',
      lat: 31.5,
      lon: 74.3,
    })
  })
})

describe('sanitizeFavoriteList', () => {
  const makeCity = (name, lat) => ({
    name,
    country: 'Testland',
    lat,
    lon: lat,
  })

  it('removes duplicates, invalid rows, and caps the list at five', () => {
    const list = [
      makeCity('One', 1),
      makeCity('Two', 2),
      { name: 'Broken' },
      makeCity('One', 1),
      makeCity('Three', 3),
      makeCity('Four', 4),
      makeCity('Five', 5),
      makeCity('Six', 6),
    ]

    const sanitized = sanitizeFavoriteList(list)

    expect(sanitized).toHaveLength(5)
    expect(sanitized.map((city) => city.name)).toEqual(['One', 'Two', 'Three', 'Four', 'Five'])
  })

  it('returns an empty list for non-array input', () => {
    expect(sanitizeFavoriteList(null)).toEqual([])
    expect(sanitizeFavoriteList('Karachi')).toEqual([])
  })
})

describe('validation messages', () => {
  it('validates city queries', () => {
    expect(validateCityQuery('')).toBe('Please enter a city name.')
    expect(validateCityQuery(' A ')).toMatch(/at least 2 characters/)
    expect(validateCityQuery('Karachi')).toBeNull()
    expect(validateCityQuery('a'.repeat(81))).toMatch(/80 characters/)
  })

  it('validates reminder times', () => {
    expect(validateReminderTime('')).toMatch(/Choose a time/)
    expect(validateReminderTime('25:00')).toMatch(/valid time/)
    expect(validateReminderTime('07:30')).toBeNull()
  })

  it('maps API error codes to actionable copy', () => {
    expect(getSearchErrorMessage({ code: 'rate_limit' })).toMatch(/too many requests/)
    expect(getSearchErrorMessage({ code: 'invalid_key' })).toMatch(/API key/)
    expect(getWeatherErrorDetail({ code: 'offline' })).toMatch(/Reconnect/)
    expect(getWeatherErrorDetail({ code: 'timeout' })).toMatch(/did not respond/)
  })
})
