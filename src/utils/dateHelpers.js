const headerDateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const timeFormatters = new Map()

function getTimeFormatter(timeZone) {
  const key = timeZone || '__local__'
  if (!timeFormatters.has(key)) {
    timeFormatters.set(
      key,
      new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        ...(timeZone ? { timeZone } : {}),
      }),
    )
  }
  return timeFormatters.get(key)
}

function getShiftedDate(date, utcOffsetSeconds) {
  if (!Number.isFinite(utcOffsetSeconds)) return date
  return new Date(date.getTime() + utcOffsetSeconds * 1000 + date.getTimezoneOffset() * 60_000)
}

export function formatHeaderDate(date = new Date()) {
  return headerDateFormatter.format(date)
}

export function formatCityTime(date, { timeZone, utcOffsetSeconds } = {}) {
  try {
    if (timeZone) return getTimeFormatter(timeZone).format(date)
  } catch {
    // Fall through to the UTC offset or the browser clock.
  }
  return getTimeFormatter(null).format(getShiftedDate(date, utcOffsetSeconds))
}

export function formatCityShortDate(date, { timeZone, utcOffsetSeconds } = {}) {
  try {
    if (timeZone) {
      return new Intl.DateTimeFormat('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        timeZone,
      }).format(date)
    }
  } catch {
    // Fall through to the UTC offset or the browser clock.
  }
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(getShiftedDate(date, utcOffsetSeconds))
}

function localDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getCityDateKey(date = new Date(), { timeZone, utcOffsetSeconds } = {}) {
  try {
    if (timeZone) {
      const parts = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone,
      }).formatToParts(date)
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
      if (values.year && values.month && values.day) {
        return `${values.year}-${values.month}-${values.day}`
      }
    }
  } catch {
    // Fall through to the offset or browser clock.
  }
  return localDateKey(getShiftedDate(date, utcOffsetSeconds))
}

export function parseDateKey(dateKey) {
  const [year, month, day] = String(dateKey ?? '')
    .split('-')
    .map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

export function formatForecastDayLabel(dateKey, todayKey) {
  if (dateKey === todayKey) return 'Today'
  const date = parseDateKey(dateKey)
  if (!date) return dateKey
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(date)
}

export function formatForecastDate(dateKey) {
  const date = parseDateKey(dateKey)
  if (!date) return dateKey
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date)
}

export function formatRelativeTime(timestamp, now = Date.now()) {
  if (!Number.isFinite(timestamp)) return ''
  const diffSeconds = Math.max(0, Math.round((now - timestamp) / 1000))
  if (diffSeconds < 60) return 'just now'
  const diffMinutes = Math.round(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hr ago`
  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(
    new Date(timestamp),
  )
}

export function formatTimeLabel(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value ?? ''))
  if (!match) return value || ''
  const date = new Date(2000, 0, 1, Number(match[1]), Number(match[2]))
  return new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function formatReminderTarget(date, now = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  const nowKey = localDateKey(now)
  const targetKey = localDateKey(date)
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const tomorrowKey = localDateKey(tomorrow)
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)

  if (targetKey === nowKey) return `Today, ${time}`
  if (targetKey === tomorrowKey) return `Tomorrow, ${time}`
  return `${new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(date)}, ${time}`
}
