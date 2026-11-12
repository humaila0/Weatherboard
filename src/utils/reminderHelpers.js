export function parseReminderTime(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value ?? ''))
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return { hours, minutes }
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function targetForDay(date, hours, minutes, dayOffset = 0) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayOffset, hours, minutes, 0, 0)
}

/**
 * Works out whether the reminder is due now (within a short catch-up window) and
 * when the next scheduled reminder should run. Browsers throttle long timers, so
 * the UI checks this on an interval rather than relying on a single timeout.
 */
export function getReminderSchedule({
  time,
  lastSentDate,
  now = new Date(),
  graceMinutes = 90,
}) {
  const parsed = parseReminderTime(time)
  if (!parsed) {
    return { due: false, nextAt: null, reason: 'invalid-time' }
  }

  const { hours, minutes } = parsed
  const todayKey = localDateKey(now)
  const targetToday = targetForDay(now, hours, minutes)
  const targetTomorrow = targetForDay(now, hours, minutes, 1)

  if (lastSentDate === todayKey) {
    return { due: false, nextAt: targetTomorrow, reason: 'already-sent' }
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const targetMinutes = hours * 60 + minutes
  const withinWindow =
    nowMinutes >= targetMinutes && nowMinutes <= targetMinutes + graceMinutes

  if (withinWindow) {
    return { due: true, nextAt: targetTomorrow, reason: 'due' }
  }

  if (nowMinutes < targetMinutes) {
    return { due: false, nextAt: targetToday, reason: 'later-today' }
  }

  return { due: false, nextAt: targetTomorrow, reason: 'missed-window' }
}

export function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}
