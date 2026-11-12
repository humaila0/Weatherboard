export function StatusPill({ tone = 'neutral', children, className = '', title }) {
  return (
    <span
      className={['status-pill', `status-pill--${tone}`, className].filter(Boolean).join(' ')}
      title={title}
    >
      <span className="status-dot" aria-hidden="true" />
      {children}
    </span>
  )
}
