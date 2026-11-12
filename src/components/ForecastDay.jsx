import { formatForecastDate, formatForecastDayLabel } from '../utils/dateHelpers'
import { formatTemperature } from '../utils/weatherHelpers'
import { WeatherIcon } from './WeatherIcon'

export function ForecastDay({ day, units, todayKey }) {
  const dayLabel = formatForecastDayLabel(day.date, todayKey)
  const dateLabel = formatForecastDate(day.date)
  const high = formatTemperature(day.maxC, units)
  const low = formatTemperature(day.minC, units)

  return (
    <article className="forecast-day">
      <div className="forecast-day-date">
        <span className="forecast-day-name">{dayLabel}</span>
        <span className="forecast-date">{dateLabel}</span>
      </div>
      <WeatherIcon code={day.code} size={26} className="forecast-icon" />
      <p className="forecast-condition">{day.label}</p>
      <div className="forecast-temperatures" aria-label={`High ${high}, low ${low}`}>
        <span className="forecast-high">
          <span className="sr-only">High </span>
          {high}
        </span>
        <span className="forecast-low">
          <span className="sr-only">Low </span>
          {low}
        </span>
      </div>
    </article>
  )
}
