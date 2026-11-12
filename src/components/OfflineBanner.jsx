import { WifiOff } from 'lucide-react'

export function OfflineBanner({ isOnline, cityName, hasCachedWeather }) {
  if (isOnline) return null

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <WifiOff size={18} aria-hidden="true" />
      <p>
        <strong>You’re offline.</strong>{' '}
        {hasCachedWeather && cityName
          ? `Showing the last saved weather for ${cityName}.`
          : 'No saved weather is available yet. Reconnect to load live conditions.'}
      </p>
    </div>
  )
}
