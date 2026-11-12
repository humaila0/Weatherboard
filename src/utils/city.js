export const MAX_FAVORITES = 5

export function normalizeName(value) {
  return String(value ?? '')
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function cityKey({ name, lat, lon }) {
  return `geo:${Number(lat).toFixed(2)},${Number(lon).toFixed(2)}:${normalizeName(name)}`
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function createCity({
  name,
  region = null,
  country = '',
  countryCode = null,
  lat,
  lon,
  timezone = null,
  source = null,
  sourceId = null,
}) {
  const cleanName = cleanText(name)
  const latitude = Number(lat)
  const longitude = Number(lon)

  if (!cleanName || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null

  return {
    key: cityKey({ name: cleanName, lat: latitude, lon: longitude }),
    name: cleanName,
    region: cleanText(region) || null,
    country: cleanText(country) || 'Unknown country',
    countryCode: cleanText(countryCode).toUpperCase() || null,
    lat: latitude,
    lon: longitude,
    timezone: cleanText(timezone) || null,
    source: source || null,
    sourceId: sourceId != null ? String(sourceId) : null,
  }
}

export function sanitizeCity(raw) {
  if (!raw || typeof raw !== 'object') return null
  return createCity({
    name: raw.name,
    region: raw.region,
    country: raw.country,
    countryCode: raw.countryCode,
    lat: raw.lat,
    lon: raw.lon,
    timezone: raw.timezone,
    source: raw.source,
    sourceId: raw.sourceId,
  })
}

export function toStoredCity(city) {
  if (!city) return null
  return {
    key: city.key,
    name: city.name,
    region: city.region,
    country: city.country,
    countryCode: city.countryCode,
    lat: city.lat,
    lon: city.lon,
    timezone: city.timezone,
    source: city.source,
    sourceId: city.sourceId,
  }
}

export function formatCitySubtitle(city) {
  if (!city) return ''
  const parts = [city.region, city.country].filter(Boolean)
  return parts.filter((part, index) => parts.indexOf(part) === index).join(', ')
}

export const DEFAULT_CITY = createCity({
  name: 'Karachi',
  region: 'Sindh',
  country: 'Pakistan',
  countryCode: 'PK',
  lat: 24.8607,
  lon: 67.0011,
  timezone: 'Asia/Karachi',
  source: 'default',
})
