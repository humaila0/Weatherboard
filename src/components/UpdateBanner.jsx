import { RefreshCw } from 'lucide-react'

export function UpdateBanner({ show, onRefresh }) {
  if (!show) return null

  return (
    <div className="update-banner" role="status" aria-live="polite">
      <RefreshCw size={16} aria-hidden="true" />
      <p>A new version of WeatherBoard is ready.</p>
      <button type="button" className="text-button" onClick={onRefresh}>
        Refresh
      </button>
    </div>
  )
}
