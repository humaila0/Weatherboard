import { useEffect, useState } from 'react'
import { formatRelativeTime } from '../utils/dateHelpers'

export function UpdatedAt({ timestamp }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!Number.isFinite(timestamp)) return 'Update time unavailable'
  return `Updated ${formatRelativeTime(timestamp, now)}`
}
