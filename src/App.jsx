import { useEffect, useState } from 'react'
import { ConfirmDialog } from './components/ConfirmDialog'
import { FavoritesPanel } from './components/FavoritesPanel'
import { Forecast } from './components/Forecast'
import { Header } from './components/Header'
import { OfflineBanner } from './components/OfflineBanner'
import { ReminderPanel } from './components/ReminderPanel'
import { Toast } from './components/Toast'
import { UpdateBanner } from './components/UpdateBanner'
import { WeatherCard } from './components/WeatherCard'
import { useFavorites } from './hooks/useFavorites'
import { useInstallPrompt } from './hooks/useInstallPrompt'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { usePreferences } from './hooks/usePreferences'
import { useReminderSettings } from './hooks/useReminderSettings'
import { useServiceWorker } from './hooks/useServiceWorker'
import { useWeather } from './hooks/useWeather'
import { DEFAULT_CITY, sanitizeCity } from './utils/city'
import { formatHeaderDate } from './utils/dateHelpers'
import { readLastCity } from './utils/weatherCache'

function readInitialCity() {
  return readLastCity() ?? DEFAULT_CITY
}

export default function App() {
  const [city, setCity] = useState(readInitialCity)
  const [pendingRemoval, setPendingRemoval] = useState(null)
  const [notice, setNotice] = useState(null)
  const isOnline = useOnlineStatus()
  const preferences = usePreferences()
  const favorites = useFavorites()
  const weather = useWeather(city, { isOnline })
  const reminder = useReminderSettings(city?.name)
  const installPrompt = useInstallPrompt()
  const { updateReady, applyUpdate } = useServiceWorker()

  useEffect(() => {
    if (!notice) return undefined
    const id = setTimeout(() => setNotice(null), 4500)
    return () => clearTimeout(id)
  }, [notice])

  const selectCity = (raw) => {
    const next = sanitizeCity(raw)
    if (!next) {
      setNotice({ tone: 'danger', text: 'That city could not be opened. Please search again.' })
      return
    }
    setCity(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddFavorite = (target) => {
    const result = favorites.addFavorite(target)
    if (result.ok) {
      setNotice({ tone: 'success', text: `${target.name} was added to your saved cities.` })
      return
    }
    if (result.reason === 'duplicate') {
      setNotice({ tone: 'info', text: `${target.name} is already in your saved cities.` })
    } else if (result.reason === 'limit') {
      setNotice({
        tone: 'warning',
        text: `You can save up to ${favorites.maxFavorites} cities. Remove one before adding another.`,
      })
    } else {
      setNotice({ tone: 'danger', text: 'That city could not be saved. Please try again.' })
    }
  }

  const confirmRemoval = () => {
    if (!pendingRemoval) return
    const removed = pendingRemoval
    favorites.removeFavorite(removed.key)
    setPendingRemoval(null)
    setNotice({ tone: 'info', text: `${removed.name} was removed from your saved cities.` })
  }

  const handleInstall = async () => {
    const result = await installPrompt.install()
    if (result.outcome === 'accepted') {
      setNotice({
        tone: 'success',
        text: 'WeatherBoard was installed. You can open it from your home screen or app list.',
      })
    } else if (result.outcome === 'dismissed') {
      setNotice({ tone: 'info', text: 'Installation was dismissed. You can install later from your browser menu.' })
    }
  }

  const forecastDays = weather.data?.forecast ?? []

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <Header
        onSelectCity={selectCity}
        isOnline={isOnline}
        resolvedTheme={preferences.resolvedTheme}
        toggleTheme={preferences.toggleTheme}
        units={preferences.units}
        toggleUnits={preferences.toggleUnits}
        canInstall={installPrompt.canInstall}
        onInstall={handleInstall}
      />

      <OfflineBanner
        isOnline={isOnline}
        cityName={city?.name}
        hasCachedWeather={Boolean(weather.data)}
      />
      <UpdateBanner show={updateReady} onRefresh={applyUpdate} />

      <main id="main-content" className="page-shell">
        <div className="page-intro">
          <p className="page-date">{formatHeaderDate(new Date())}</p>
          <p className="page-summary">The forecast, without the noise.</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-main">
            <WeatherCard
              city={city}
              weather={weather}
              units={preferences.units}
              isOnline={isOnline}
              isFavorite={favorites.isFavorite(city.key)}
              atLimit={favorites.atLimit}
              onAddFavorite={handleAddFavorite}
            />

            <Forecast
              city={city}
              days={forecastDays}
              units={preferences.units}
              loading={weather.status === 'loading'}
              error={weather.error}
              onRetry={weather.refresh}
              timeZone={weather.data?.timezone}
              utcOffsetSeconds={weather.data?.utcOffsetSeconds}
            />
          </div>

          <aside className="dashboard-side" aria-label="Saved cities and reminders">
            <FavoritesPanel
              favorites={favorites.favorites}
              currentKey={city.key}
              onSelect={selectCity}
              onRemove={setPendingRemoval}
              storageAvailable={favorites.storageAvailable}
              maxFavorites={favorites.maxFavorites}
            />

            <ReminderPanel
              cityName={city?.name}
              support={reminder.support}
              permission={reminder.permission}
              settings={reminder.settings}
              requesting={reminder.requesting}
              message={reminder.message}
              background={reminder.background}
              nextAt={reminder.nextAt}
              isEnabled={reminder.isEnabled}
              enable={reminder.enable}
              requestAndEnable={reminder.requestAndEnable}
              disable={reminder.disable}
              setTime={reminder.setTime}
              sendTest={reminder.sendTest}
              clearMessage={reminder.clearMessage}
            />
          </aside>
        </div>

        <footer className="app-footer">
          <p>
            Weather from OpenWeatherMap with a live Open-Meteo fallback. City search from GeoDB
            Cities with Open-Meteo geocoding as backup.
          </p>
          <p className="app-footer-meta">
            Built with React and Vite · Installable PWA · Real data only
          </p>
        </footer>
      </main>

      <ConfirmDialog
        open={Boolean(pendingRemoval)}
        title={pendingRemoval ? `Remove ${pendingRemoval.name}?` : 'Remove city?'}
        description="This city will be removed from your saved list. You can add it again at any time."
        confirmLabel="Remove city"
        onConfirm={confirmRemoval}
        onCancel={() => setPendingRemoval(null)}
      />

      <Toast notice={notice} onDismiss={() => setNotice(null)} />
    </>
  )
}
