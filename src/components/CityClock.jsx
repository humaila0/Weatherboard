import { useEffect, useState } from 'react'
import { Clock3 } from 'lucide-react'
import { formatCityShortDate, formatCityTime } from '../utils/dateHelpers'

export function CityClock({ timeZone, utcOffsetSeconds }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="city-clock">
      <Clock3 size={14} aria-hidden="true" />
      <span>{formatCityTime(now, { timeZone, utcOffsetSeconds })} local</span>
      <span className="city-clock-separator" aria-hidden="true">
        ·
      </span>
      <span>{formatCityShortDate(now, { timeZone, utcOffsetSeconds })}</span>
    </span>
  )
}
