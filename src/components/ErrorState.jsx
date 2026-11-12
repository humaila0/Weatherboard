import { RefreshCw, TriangleAlert } from 'lucide-react'

export function ErrorState({
  title = 'Weather unavailable',
  message,
  detail,
  onRetry,
  retryLabel = 'Try again',
  compact = false,
}) {
  return (
    <div className={['error-state', compact ? 'error-state--compact' : ''].filter(Boolean).join(' ')} role="alert">
      <span className="error-state-icon" aria-hidden="true">
        <TriangleAlert size={compact ? 18 : 22} />
      </span>
      <div className="error-state-content">
        <h3>{title}</h3>
        {message ? <p className="error-state-message">{message}</p> : null}
        {detail ? <p className="error-state-detail">{detail}</p> : null}
      </div>
      {onRetry ? (
        <button type="button" className="secondary-button error-state-action" onClick={onRetry}>
          <RefreshCw size={15} aria-hidden="true" />
          {retryLabel}
        </button>
      ) : null}
    </div>
  )
}
