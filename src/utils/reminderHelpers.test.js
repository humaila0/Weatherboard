import { describe, expect, it } from 'vitest'
import { getReminderSchedule, localDateKey, parseReminderTime } from './reminderHelpers'
import { getCityDateKey } from './dateHelpers'

const at = (year, month, day, hours, minutes) => new Date(year, month - 1, day, hours, minutes, 0, 0)

describe('parseReminderTime', () => {
  it('parses valid 24-hour times', () => {
    expect(parseReminderTime('07:30')).toEqual({ hours: 7, minutes: 30 })
    expect(parseReminderTime('23:59')).toEqual({ hours: 23, minutes: 59 })
  })

  it('rejects malformed or out-of-range times', () => {
    expect(parseReminderTime('24:00')).toBeNull()
    expect(parseReminderTime('7:30')).toBeNull()
    expect(parseReminderTime('')).toBeNull()
  })
})

describe('getReminderSchedule', () => {
  const now = at(2026, 11, 13, 8, 0)

  it('is due inside the catch-up window once the target time passes', () => {
    expect(getReminderSchedule({ time: '07:30', now })).toMatchObject({
      due: true,
      reason: 'due',
    })
  })

  it('waits until later today when the target is in the future', () => {
    const schedule = getReminderSchedule({ time: '09:30', now })
    expect(schedule.due).toBe(false)
    expect(schedule.reason).toBe('later-today')
    expect(schedule.nextAt).toEqual(at(2026, 11, 13, 9, 30))
  })

  it('misses the window rather than sending stale reminders late at night', () => {
    const schedule = getReminderSchedule({ time: '05:00', now })
    expect(schedule.due).toBe(false)
    expect(schedule.reason).toBe('missed-window')
    expect(schedule.nextAt).toEqual(at(2026, 11, 14, 5, 0))
  })

  it('does not fire twice on the same day', () => {
    const schedule = getReminderSchedule({
      time: '07:30',
      lastSentDate: localDateKey(now),
      now,
    })
    expect(schedule.due).toBe(false)
    expect(schedule.reason).toBe('already-sent')
    expect(schedule.nextAt).toEqual(at(2026, 11, 14, 7, 30))
  })

  it('returns an invalid state for broken time values', () => {
    expect(getReminderSchedule({ time: 'soon', now })).toMatchObject({
      due: false,
      nextAt: null,
      reason: 'invalid-time',
    })
  })
})

describe('getCityDateKey', () => {
  it('uses the city timezone when it is valid', () => {
    const date = new Date('2026-11-12T22:30:00Z')
    expect(getCityDateKey(date, { timeZone: 'Asia/Karachi' })).toBe('2026-11-13')
    expect(getCityDateKey(date, { timeZone: 'America/New_York' })).toBe('2026-11-12')
  })

  it('falls back to the UTC offset for unknown timezones', () => {
    const date = new Date('2026-11-12T22:30:00Z')
    expect(getCityDateKey(date, { timeZone: 'Not/AZone', utcOffsetSeconds: 18_000 })).toBe(
      '2026-11-13',
    )
  })
})
