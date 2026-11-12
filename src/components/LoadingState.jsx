export function LoadingState({ variant = 'weather', label = 'Loading weather…' }) {
  if (variant === 'forecast') {
    return (
      <div className="forecast-skeleton" role="status" aria-live="polite">
        <span className="sr-only">{label}</span>
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="skeleton-card" key={index} aria-hidden="true">
            <div className="skeleton skeleton-line skeleton-line--short" />
            <div className="skeleton skeleton-circle skeleton-circle--small" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line skeleton-line--short" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="weather-skeleton" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        <div className="skeleton-row">
          <div className="skeleton skeleton-line skeleton-line--eyebrow" />
          <div className="skeleton skeleton-pill" />
        </div>
        <div className="skeleton-hero">
          <div className="skeleton skeleton-circle" />
          <div className="skeleton-hero-copy">
            <div className="skeleton skeleton-temp" />
            <div className="skeleton skeleton-line skeleton-line--medium" />
          </div>
        </div>
        <div className="skeleton-stats">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="skeleton skeleton-stat" key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}
