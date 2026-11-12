import { CalendarDays } from 'lucide-react'
import { getCityDateKey } from '../utils/dateHelpers'
import { ErrorState } from './ErrorState'
import { ForecastDay } from './ForecastDay'
import { LoadingState } from './LoadingState'

export function Forecast({
  city,
  days = [],
  units,
  loading,
  error,
  onRetry,
  timeZone,
  utcOffsetSeconds,
}) {
  const todayKey = getCityDateKey(new Date(), { timeZone, utcOffsetSeconds })

  return (
    <section className="card forecast-card" aria-labelledby="forecast-heading">
      <div className="card-header">
        <div>
          <h2 id="forecast-heading">5-day forecast</h2>
          <p>Daily highs and lows for {city.name}</p>
        </div>
        <span className="card-icon" aria-hidden="true">
          <CalendarDays size={19} />
        </span>
      </div>

      {loading && days.length === 0 ? (
        <LoadingState variant="forecast" label={`Loading the forecast for ${city.name}…`} />
      ) : days.length > 0 ? (
        <div className="forecast-grid">
          {days.slice(0, 5).map((day) => (
            <ForecastDay key={day.date} day={day} units={units} todayKey={todayKey} />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          compact
          title="Forecast unavailable"
          message="The five-day forecast could not be loaded."
          detail={error.detail}
          onRetry={onRetry}
        />
      ) : (
        <p className="forecast-empty">No forecast data is available for this city yet.</p>
      )}
    </section>
  )
}
