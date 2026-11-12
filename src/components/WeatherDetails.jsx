import { Droplets, Thermometer, Wind } from 'lucide-react'
import { formatTemperature, formatWind } from '../utils/weatherHelpers'

export function WeatherDetails({ current, units }) {
  const humidity = Number.isFinite(current.humidity) ? `${Math.round(current.humidity)}%` : '—'
  const wind = formatWind(current.windKph, units)
  const high = formatTemperature(current.highC, units)
  const low = formatTemperature(current.lowC, units)

  return (
    <dl className="weather-stats">
      <div className="stat">
        <dt className="stat-label">
          <Droplets size={14} aria-hidden="true" />
          Humidity
        </dt>
        <dd className="stat-value">{humidity}</dd>
      </div>
      <div className="stat">
        <dt className="stat-label">
          <Wind size={14} aria-hidden="true" />
          Wind
        </dt>
        <dd className="stat-value">{wind}</dd>
      </div>
      <div className="stat">
        <dt className="stat-label">
          <Thermometer size={14} aria-hidden="true" />
          High / Low
        </dt>
        <dd
          className="stat-value"
          aria-label={`High ${high}, low ${low}`}
        >
          <span>{high}</span>
          <span className="stat-divider" aria-hidden="true">
            /
          </span>
          <span className="stat-low">{low}</span>
        </dd>
      </div>
    </dl>
  )
}
