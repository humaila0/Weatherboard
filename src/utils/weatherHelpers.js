export class WeatherDataError extends Error {
  constructor(message) {
    super(message)
    this.name = 'WeatherDataError'
    this.code = 'missing_data'
  }
}

const WMO_CONDITIONS = {
  0: { code: 'clear', label: 'Clear sky' },
  1: { code: 'clear', label: 'Mainly clear' },
  2: { code: 'partly-cloudy', label: 'Partly cloudy' },
  3: { code: 'cloudy', label: 'Overcast' },
  45: { code: 'fog', label: 'Fog' },
  48: { code: 'fog', label: 'Rime fog' },
  51: { code: 'drizzle', label: 'Light drizzle' },
  53: { code: 'drizzle', label: 'Drizzle' },
  55: { code: 'drizzle', label: 'Heavy drizzle' },
  56: { code: 'drizzle', label: 'Freezing drizzle' },
  57: { code: 'drizzle', label: 'Freezing drizzle' },
  61: { code: 'rain', label: 'Light rain' },
  63: { code: 'rain', label: 'Rain' },
  65: { code: 'heavy-rain', label: 'Heavy rain' },
  66: { code: 'rain', label: 'Freezing rain' },
  67: { code: 'heavy-rain', label: 'Freezing rain' },
  71: { code: 'snow', label: 'Light snow' },
  73: { code: 'snow', label: 'Snow' },
  75: { code: 'snow', label: 'Heavy snow' },
  77: { code: 'snow', label: 'Snow grains' },
  80: { code: 'rain', label: 'Light showers' },
  81: { code: 'rain', label: 'Showers' },
  82: { code: 'heavy-rain', label: 'Heavy showers' },
  85: { code: 'snow', label: 'Snow showers' },
  86: { code: 'snow', label: 'Heavy snow showers' },
  95: { code: 'thunder', label: 'Thunderstorm' },
  96: { code: 'thunder', label: 'Thunderstorm with hail' },
  99: { code: 'thunder', label: 'Thunderstorm with hail' },
}

const CATEGORY_LABELS = {
  clear: 'Clear',
  'partly-cloudy': 'Partly cloudy',
  cloudy: 'Cloudy',
  fog: 'Fog',
  drizzle: 'Drizzle',
  rain: 'Rain',
  'heavy-rain': 'Heavy rain',
  snow: 'Snow',
  thunder: 'Thunderstorm',
  unknown: 'Unsettled weather',
}

export function conditionFromWmo(code) {
  const condition = WMO_CONDITIONS[Number(code)]
  if (condition) return { ...condition }
  return { code: 'unknown', label: CATEGORY_LABELS.unknown }
}

function titleCase(value) {
  const text = String(value ?? '').trim()
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function categoryFromOpenWeatherId(id) {
  const code = Number(id)
  if (!Number.isFinite(code)) return 'unknown'
  if (code >= 200 && code < 300) return 'thunder'
  if (code >= 300 && code < 400) return 'drizzle'
  if (code >= 500 && code < 600) {
    return [502, 503, 504, 522].includes(code) ? 'heavy-rain' : 'rain'
  }
  if (code >= 600 && code < 700) return 'snow'
  if (code >= 700 && code < 800) {
    return [701, 721, 741].includes(code) ? 'fog' : 'cloudy'
  }
  if (code === 800) return 'clear'
  if (code === 801 || code === 802) return 'partly-cloudy'
  if (code >= 803 && code < 900) return 'cloudy'
  return 'unknown'
}

export function conditionFromOpenWeather(id, description, icon = '') {
  const code = categoryFromOpenWeatherId(id)
  return {
    code,
    label: titleCase(description) || CATEGORY_LABELS[code],
    isDay: !String(icon).endsWith('n'),
  }
}

function requireFinite(value, field) {
  const number = Number(value)
  if (!Number.isFinite(number)) throw new WeatherDataError(`Missing weather field: ${field}`)
  return number
}

function optionalFinite(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function epochToDateKey(epochSeconds, utcOffsetSeconds = 0) {
  return new Date((epochSeconds + utcOffsetSeconds) * 1000).toISOString().slice(0, 10)
}

export function aggregateOpenWeatherForecast(
  list,
  utcOffsetSeconds = 0,
  referenceEpochSeconds = Math.floor(Date.now() / 1000),
) {
  if (!Array.isArray(list) || list.length === 0) {
    throw new WeatherDataError('The forecast response did not contain any entries.')
  }

  const todayKey = epochToDateKey(referenceEpochSeconds, utcOffsetSeconds)
  const days = new Map()

  for (const entry of list) {
    const epoch = Number(entry?.dt)
    if (!Number.isFinite(epoch)) continue

    const date = epochToDateKey(epoch, utcOffsetSeconds)
    if (date < todayKey) continue

    const min = optionalFinite(entry.main?.temp_min ?? entry.main?.temp)
    const max = optionalFinite(entry.main?.temp_max ?? entry.main?.temp)
    if (min === null || max === null) continue

    const shifted = new Date((epoch + utcOffsetSeconds) * 1000)
    const localHour = shifted.getUTCHours()
    const distanceFromNoon = Math.abs(localHour - 12)
    const weather = entry.weather?.[0] ?? {}

    const existing = days.get(date)
    if (!existing) {
      days.set(date, {
        date,
        minC: min,
        maxC: max,
        sample: { distanceFromNoon, weather },
      })
      continue
    }

    existing.minC = Math.min(existing.minC, min)
    existing.maxC = Math.max(existing.maxC, max)
    if (distanceFromNoon < existing.sample.distanceFromNoon) {
      existing.sample = { distanceFromNoon, weather }
    }
  }

  return [...days.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)
    .map((day) => {
      const condition = conditionFromOpenWeather(
        day.sample.weather.id,
        day.sample.weather.description,
        day.sample.weather.icon,
      )
      return {
        date: day.date,
        code: condition.code,
        label: condition.label,
        minC: day.minC,
        maxC: day.maxC,
      }
    })
}

export function mapOpenMeteoWeather(payload, city) {
  const current = payload?.current
  if (!current) throw new WeatherDataError('The weather response did not include current conditions.')

  const temperature = requireFinite(current.temperature_2m, 'temperature_2m')
  const weatherCode = requireFinite(current.weather_code, 'weather_code')
  const condition = conditionFromWmo(weatherCode)
  const daily = payload.daily
  const days = []

  if (daily && Array.isArray(daily.time)) {
    for (let index = 0; index < Math.min(daily.time.length, 5); index += 1) {
      const min = optionalFinite(daily.temperature_2m_min?.[index])
      const max = optionalFinite(daily.temperature_2m_max?.[index])
      if (min === null || max === null) continue
      const dailyCondition = conditionFromWmo(daily.weather_code?.[index])
      days.push({
        date: daily.time[index],
        code: dailyCondition.code,
        label: dailyCondition.label,
        minC: min,
        maxC: max,
      })
    }
  }

  if (days.length === 0) {
    throw new WeatherDataError('The weather response did not include a daily forecast.')
  }

  const today = days[0]

  return {
    current: {
      tempC: temperature,
      feelsLikeC: optionalFinite(current.apparent_temperature),
      humidity: optionalFinite(current.relative_humidity_2m),
      windKph: optionalFinite(current.wind_speed_10m),
      highC: today.maxC,
      lowC: today.minC,
      condition,
      isDay: current.is_day === 1 || current.is_day === true,
    },
    forecast: days,
    timezone: payload.timezone || city.timezone || null,
    utcOffsetSeconds: optionalFinite(payload.utc_offset_seconds),
    observedAt: Date.now(),
    provider: 'open-meteo',
    providerLabel: 'Open-Meteo',
    fallback: false,
    fallbackReason: null,
  }
}

export function mapOpenWeatherWeather(current, forecast, city) {
  if (!current?.main || !current?.weather?.[0]) {
    throw new WeatherDataError('The current conditions response was incomplete.')
  }

  const utcOffsetSeconds = optionalFinite(current.timezone ?? forecast?.city?.timezone) ?? 0
  const temperature = requireFinite(current.main.temp, 'main.temp')
  const condition = conditionFromOpenWeather(
    current.weather[0].id,
    current.weather[0].description,
    current.weather[0].icon,
  )
  const referenceEpoch = optionalFinite(current.dt) ?? Math.floor(Date.now() / 1000)
  const days = aggregateOpenWeatherForecast(forecast?.list, utcOffsetSeconds, referenceEpoch)

  if (days.length === 0) {
    throw new WeatherDataError('The forecast response did not include usable daily data.')
  }

  const todayKey = epochToDateKey(referenceEpoch, utcOffsetSeconds)
  const today = days.find((day) => day.date === todayKey) ?? days[0]
  const windSpeed = optionalFinite(current.wind?.speed)

  return {
    current: {
      tempC: temperature,
      feelsLikeC: optionalFinite(current.main.feels_like),
      humidity: optionalFinite(current.main.humidity),
      windKph: windSpeed === null ? null : windSpeed * 3.6,
      highC: today.maxC,
      lowC: today.minC,
      condition,
      isDay: condition.isDay,
    },
    forecast: days,
    timezone: city.timezone || null,
    utcOffsetSeconds,
    observedAt: referenceEpoch * 1000,
    provider: 'openweathermap',
    providerLabel: 'OpenWeatherMap',
    fallback: false,
    fallbackReason: null,
  }
}

export function convertTemperature(celsius, units = 'metric') {
  if (!Number.isFinite(celsius)) return null
  return units === 'imperial' ? (celsius * 9) / 5 + 32 : celsius
}

export function displayTemperature(celsius, units = 'metric') {
  const converted = convertTemperature(celsius, units)
  return converted === null ? null : Math.round(converted)
}

export function formatTemperature(celsius, units = 'metric') {
  const value = displayTemperature(celsius, units)
  return value === null ? '—' : `${value}°`
}

export function formatWind(kph, units = 'metric') {
  if (!Number.isFinite(kph)) return '—'
  const value = units === 'imperial' ? kph * 0.621371 : kph
  return `${Math.round(value)} ${units === 'imperial' ? 'mph' : 'km/h'}`
}

export function temperatureUnitLabel(units = 'metric') {
  return units === 'imperial' ? '°F' : '°C'
}

export function temperatureUnitName(units = 'metric') {
  return units === 'imperial' ? 'Fahrenheit' : 'Celsius'
}
