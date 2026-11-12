import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

const ICONS = {
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: TriangleAlert,
  info: Info,
}

export function Toast({ notice, onDismiss }) {
  if (!notice) return null
  const Icon = ICONS[notice.tone] ?? Info

  return (
    <div
      className={`toast toast--${notice.tone ?? 'info'}`}
      role={notice.tone === 'danger' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <Icon size={18} aria-hidden="true" />
      <p>{notice.text}</p>
      <button type="button" className="toast-close" onClick={onDismiss} aria-label="Dismiss message">
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  )
}
