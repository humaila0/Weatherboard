import { describe, expect, it } from 'vitest'
import {
  aggregateOpenWeatherForecast,
  conditionFromOpenWeather,
  conditionFromWmo,
  convertTemperature,
  displayTemperature,
  epochToDateKey,
  formatTemperature,
  formatWind,
  mapOpenMeteoWeather,
  temperatureUnitLabel,
} from '../utils/weatherHelpers'

// Midnight UTC keeps every generated hour inside its intended calendar day.
const REFERENCE = Date.UTC(2023, 10, 14) / 1000

function entry(dayOffset, hour, { min, max, id = 800, description = 'clear sky' }) {
  return {
    dt: REFERENCE + dayOffset * 86_400 + hour * 3_600,
    main: { temp_min: min, temp_max: max },
    weather: [{ id, description, icon: '01d' }],
  }
}

describe('condition mapping', () => {
  it('maps WMO weather codes to readable conditions', () => {
    expect(conditionFromWmo(0)).toMatchObject({ code: 'clear', label: 'Clear sky' })
    expect(conditionFromWmo(63).code).toBe('rain')
    expect(conditionFromWmo(95).code).toBe('thunder')
    expect(conditionFromWmo(999).code).toBe('unknown')
  })

  it('maps OpenWeatherMap ids and day/night icons', () => {
    expect(conditionFromOpenWeather(800, 'clear sky', '01d')).toMatchObject({
      code: 'clear',
      label: 'Clear sky',
      isDay: true,
    })
    expect(conditionFromOpenWeather(803, 'broken clouds', '04n')).toMatchObject({
      code: 'cloudy',
      isDay: false,
    })
    expect(conditionFromOpenWeather(502, 'heavy intensity rain', '10d').code).toBe('heavy-rain')
  })
})

describe('aggregateOpenWeatherForecast', () => {
  it('groups three-hourly entries into five daily summaries', () => {
    const list = []

    for (let day = 0; day < 7; day += 1) {
      for (const hour of [0, 3, 6, 9, 12, 15, 18, 21]) {
        list.push(
          entry(day, hour, {
            min: 10 + day + hour / 10,
            max: 20 + day + hour / 10,
            id: hour === 12 ? 500 : 800,
            description: hour === 12 ? 'light rain' : 'clear sky',
          }),
        )
      }
    }

    const days = aggregateOpenWeatherForecast(list, 0, REFERENCE)

    expect(days).toHaveLength(5)
    expect(days[0].date).toBe(epochToDateKey(REFERENCE, 0))
    expect(days[0].minC).toBeCloseTo(10)
    expect(days[0].maxC).toBeCloseTo(22.1)
    expect(days[0].code).toBe('rain')
    expect(days[0].label).toBe('Light rain')
  })

  it('ignores past entries and invalid rows', () => {
    const list = [
      entry(-1, 12, { min: 1, max: 2 }),
      entry(0, 6, { min: 5, max: 12 }),
      { dt: REFERENCE, main: {} },
      entry(1, 12, { min: 8, max: 18 }),
    ]

    const days = aggregateOpenWeatherForecast(list, 0, REFERENCE)
    expect(days).toHaveLength(2)
    expect(days[0].minC).toBe(5)
    expect(days[1].minC).toBe(8)
  })
})

describe('mapOpenMeteoWeather', () => {
  const payload = {
    timezone: 'Asia/Karachi',
    utc_offset_seconds: 18_000,
    current: {
      temperature_2m: 26.4,
      relative_humidity_2m: 80,
      apparent_temperature: 29.1,
      weather_code: 3,
      wind_speed_10m: 10.2,
      is_day: 1,
    },
    daily: {
      time: ['2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18'],
      weather_code: [3, 61, 0, 2, 95, 71],
      temperature_2m_max: [31, 29, 30, 33, 32, 28],
      temperature_2m_min: [25, 24, 22, 23, 22, 20],
    },
  }

  it('normalises current conditions and five forecast days', () => {
    const weather = mapOpenMeteoWeather(payload, { name: 'Karachi', timezone: null })

    expect(weather.current).toMatchObject({
      tempC: 26.4,
      feelsLikeC: 29.1,
      humidity: 80,
      windKph: 10.2,
      highC: 31,
      lowC: 25,
      isDay: true,
    })
    expect(weather.current.condition.code).toBe('cloudy')
    expect(weather.forecast).toHaveLength(5)
    expect(weather.forecast[4]).toMatchObject({ date: '2026-11-17', code: 'thunder' })
    expect(weather.provider).toBe('open-meteo')
  })

  it('throws a useful error when required data is missing', () => {
    expect(() => mapOpenMeteoWeather({ daily: payload.daily }, {})).toThrow(
      /did not include current conditions/,
    )
  })
})

describe('temperature and wind formatting', () => {
  it('converts Celsius to Fahrenheit without mutating the source', () => {
    expect(convertTemperature(20, 'imperial')).toBe(68)
    expect(convertTemperature(20, 'metric')).toBe(20)
    expect(displayTemperature(20.4, 'metric')).toBe(20)
    expect(displayTemperature(20.6, 'metric')).toBe(21)
    expect(displayTemperature(null)).toBeNull()
  })

  it('formats temperatures and wind speeds for both unit systems', () => {
    expect(formatTemperature(20.4, 'metric')).toBe('20°')
    expect(formatTemperature(20, 'imperial')).toBe('68°')
    expect(formatTemperature(undefined, 'metric')).toBe('—')
    expect(formatWind(10, 'metric')).toBe('10 km/h')
    expect(formatWind(10, 'imperial')).toBe('6 mph')
    expect(formatWind(null)).toBe('—')
    expect(temperatureUnitLabel('imperial')).toBe('°F')
  })
})
