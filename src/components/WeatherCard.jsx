import { Info, MapPin, RefreshCw, Star } from 'lucide-react'
import { formatCitySubtitle } from '../utils/city'
import {
  displayTemperature,
  temperatureUnitName,
} from '../utils/weatherHelpers'
import { CityClock } from './CityClock'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import { StatusPill } from './StatusPill'
import { UpdatedAt } from './UpdatedAt'
import { WeatherDetails } from './WeatherDetails'
import { WeatherIcon } from './WeatherIcon'

export function WeatherCard({
  city,
  weather,
  units,
  isOnline,
  isFavorite,
  atLimit,
  onAddFavorite,
}) {
  const { data, error, status, isCached, savedAt, cacheWriteFailed, refresh } = weather
  const showingCached = isCached || !isOnline
  const favoriteLabel = isFavorite
    ? 'Saved to favourites'
    : atLimit
      ? 'Favourite limit reached. Remove a city to add another.'
      : `Save ${city.name} to favourites`

  if (!data && status === 'loading') {
    return (
      <section className="card weather-card" aria-label={`Current weather for ${city.name}`} aria-busy="true">
        <LoadingState label={`Loading weather for ${city.name}…`} />
      </section>
    )
  }

  if (!data && error) {
    return (
      <section className="card weather-card" aria-label={`Current weather for ${city.name}`}>
        <div className="weather-state-heading">
          <span className="eyebrow">Current weather</span>
          <span className="weather-state-city">
            {city.name}, {city.country}
          </span>
        </div>
        <ErrorState
          title={error.title}
          message={error.message}
          detail={error.detail}
          onRetry={refresh}
        />
      </section>
    )
  }

  if (!data) return null

  const temperature = displayTemperature(data.current.tempC, units)
  const feelsLike = Number.isFinite(data.current.feelsLikeC)
    ? displayTemperature(data.current.feelsLikeC, units)
    : null
  const statusLabel = status === 'loading' ? 'Updating' : showingCached ? 'Cached' : 'Live'
  const statusTone = status === 'loading' ? 'neutral' : showingCached ? 'warning' : 'success'
  const refreshDisabled = status === 'loading' || !isOnline
  const refreshTitle = !isOnline ? 'Reconnect to refresh weather' : 'Refresh weather'

  return (
    <section
      className="card weather-card"
      aria-labelledby="current-weather-heading"
      aria-busy={status === 'loading'}
    >
      <div className="weather-topline">
        <span className="eyebrow">Current weather</span>
        <div className="weather-actions">
          {data.fallback ? (
            <StatusPill
              tone="neutral"
              title="OpenWeatherMap was unavailable, so Open-Meteo supplied this forecast."
            >
              Backup
            </StatusPill>
          ) : null}
          <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
          <button
            type="button"
            className="icon-button"
            onClick={refresh}
            disabled={refreshDisabled}
            aria-label="Refresh weather"
            title={refreshTitle}
          >
            <RefreshCw size={16} className={status === 'loading' ? 'spin' : ''} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="weather-location">
        <div className="weather-location-text">
          <div className="weather-city-line">
            <MapPin size={16} aria-hidden="true" />
            <h2 id="current-weather-heading" className="weather-city">
              {city.name}
            </h2>
          </div>
          <p className="weather-subtitle">{formatCitySubtitle(city)}</p>
          <CityClock timeZone={data.timezone} utcOffsetSeconds={data.utcOffsetSeconds} />
        </div>
        <button
          type="button"
          className={`favorite-toggle ${isFavorite ? 'is-saved' : ''}`}
          onClick={() => onAddFavorite(city)}
          disabled={isFavorite || atLimit}
          aria-pressed={isFavorite}
          aria-label={favoriteLabel}
          title={favoriteLabel}
        >
          <Star size={19} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </div>

      <div className="weather-hero">
        <div className="weather-icon-shell">
          <WeatherIcon
            code={data.current.condition.code}
            isDay={data.current.isDay}
            size={52}
            className="weather-icon--hero"
          />
        </div>
        <div className="weather-reading">
          <p
            className="weather-temperature"
            aria-label={`${temperature ?? 'Unknown'} degrees ${temperatureUnitName(units)}`}
          >
            {temperature ?? '—'}
            <span className="weather-degree" aria-hidden="true">
              °
            </span>
          </p>
          <p className="weather-condition">{data.current.condition.label}</p>
          {feelsLike !== null ? (
            <p className="weather-feels">Feels like {feelsLike}°</p>
          ) : null}
        </div>
      </div>

      <WeatherDetails current={data.current} units={units} />

      {error ? (
        <div className="inline-notice inline-notice--warning" role="status">
          <Info size={16} aria-hidden="true" />
          <div className="inline-notice-body">
            <strong>{error.title}</strong>
            <p>
              {error.detail}{' '}
              {Number.isFinite(savedAt) ? (
                <>
                  Saved <UpdatedAt timestamp={savedAt} />.
                </>
              ) : null}
            </p>
          </div>
          {isOnline ? (
            <button type="button" className="text-button" onClick={refresh}>
              Retry
            </button>
          ) : null}
        </div>
      ) : showingCached ? (
        <div className="inline-notice" role="status">
          <Info size={16} aria-hidden="true" />
          <div className="inline-notice-body">
            <strong>Showing saved weather</strong>
            <p>
              {isOnline
                ? 'Live data could not be refreshed yet.'
                : 'You’re offline, so live conditions are unavailable.'}{' '}
              {Number.isFinite(savedAt) ? <UpdatedAt timestamp={savedAt} /> : null}
            </p>
          </div>
        </div>
      ) : null}

      <div className="weather-source">
        <span>
          {data.providerLabel}
          {data.fallback ? ' · fallback source' : ''}
        </span>
        <span>{Number.isFinite(savedAt) ? <UpdatedAt timestamp={savedAt} /> : 'Live data'}</span>
        {cacheWriteFailed ? <span className="weather-source-warning">Offline copy not saved</span> : null}
      </div>
    </section>
  )
}
