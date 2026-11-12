import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getNotificationPermission,
  getNotificationSupport,
  markReminderSent,
  readReminderSettings,
  requestNotificationPermission,
  saveReminderSettings,
  showWeatherReminder,
  updatePeriodicSync,
} from '../services/notificationService'
import { formatTimeLabel } from '../utils/dateHelpers'
import { getReminderSchedule } from '../utils/reminderHelpers'
import { isStorageAvailable } from '../utils/storage'
import { validateReminderTime } from '../utils/validation'

export function useReminderSettings(cityName) {
  const support = useMemo(() => getNotificationSupport(), [])
  const [permission, setPermission] = useState(() => getNotificationPermission())
  const [settings, setSettings] = useState(() => readReminderSettings())
  const [requesting, setRequesting] = useState(false)
  const [message, setMessage] = useState(null)
  const [background, setBackground] = useState({
    supported: false,
    scheduled: false,
    reason: null,
  })
  const [storageAvailable, setStorageAvailable] = useState(() => isStorageAvailable())
  const [now, setNow] = useState(() => new Date())

  const settingsRef = useRef(settings)
  const cityRef = useRef(cityName)
  const firingRef = useRef(false)
  const initialSyncDoneRef = useRef(false)

  useEffect(() => {
    cityRef.current = cityName
  }, [cityName])

  const persist = useCallback(async (next) => {
    const result = await saveReminderSettings(next, cityRef.current)
    if (!result.ok) setStorageAvailable(false)
    return result
  }, [])

  const applySettings = useCallback(
    async (next) => {
      settingsRef.current = next
      setSettings(next)
      return persist(next)
    },
    [persist],
  )

  const syncBackground = useCallback(async (next) => {
    const result = await updatePeriodicSync(next, cityRef.current)
    setBackground(result)
    return result
  }, [])

  useEffect(() => {
    const updatePermission = () => setPermission(getNotificationPermission())
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') updatePermission()
    }
    window.addEventListener('focus', updatePermission)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('focus', updatePermission)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  // Keep the UI honest if notification permission is revoked outside the app.
  useEffect(() => {
    if (!settings.enabled || permission === 'granted') return
    const next = { ...settingsRef.current, enabled: false }
    settingsRef.current = next
    setSettings(next)
    saveReminderSettings(next, cityRef.current).then((result) => {
      if (!result.ok) setStorageAvailable(false)
    })
    setBackground({
      supported: support === 'supported',
      scheduled: false,
      reason: 'permission',
    })
    setMessage({
      tone: 'info',
      text:
        permission === 'denied'
          ? 'Notifications are blocked in this browser, so the daily reminder was turned off.'
          : 'Notification permission is not granted, so the daily reminder is off.',
    })
  }, [permission, settings.enabled, support])

  useEffect(() => {
    if (initialSyncDoneRef.current) return
    if (!settings.enabled || permission !== 'granted') return
    initialSyncDoneRef.current = true
    syncBackground(settingsRef.current)
  }, [permission, settings.enabled, syncBackground])

  useEffect(() => {
    if (!settings.enabled) return undefined
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [settings.enabled])

  useEffect(() => {
    if (!settings.enabled || permission !== 'granted') return undefined

    let disposed = false

    const check = async () => {
      if (disposed || firingRef.current) return
      const current = settingsRef.current
      const schedule = getReminderSchedule({
        time: current.time,
        lastSentDate: current.lastSentDate,
        now: new Date(),
      })
      if (!schedule.due) return

      firingRef.current = true
      try {
        await showWeatherReminder({ cityName: cityRef.current })
        const next = markReminderSent(current)
        settingsRef.current = next
        setSettings(next)
        const result = await saveReminderSettings(next, cityRef.current)
        if (!result.ok) setStorageAvailable(false)
        setNow(new Date())
      } catch (error) {
        console.warn('[WeatherBoard] The daily reminder could not be shown.', error)
        setMessage({
          tone: 'danger',
          text: 'The daily reminder could not be shown. Check your browser notification settings.',
        })
      } finally {
        firingRef.current = false
      }
    }

    check()
    const id = setInterval(check, 60_000)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      disposed = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [settings.enabled, settings.time, permission])

  const enable = useCallback(async () => {
    if (support === 'unsupported') {
      setMessage({
        tone: 'danger',
        text: 'This browser does not support notifications. Try the latest Chrome, Edge, Firefox, or Safari.',
      })
      return { ok: false, reason: 'unsupported' }
    }

    const currentPermission = getNotificationPermission()
    setPermission(currentPermission)
    if (currentPermission !== 'granted') {
      return {
        ok: false,
        reason: currentPermission === 'denied' ? 'denied' : 'permission-required',
      }
    }

    const next = { ...settingsRef.current, enabled: true }
    await applySettings(next)
    setNow(new Date())
    const result = await syncBackground(next)
    setMessage({
      tone: 'success',
      text: result.scheduled
        ? `Daily reminder set for ${formatTimeLabel(next.time)}. Background checks are registered with your browser.`
        : `Daily reminder set for ${formatTimeLabel(next.time)}. It will appear while WeatherBoard is open.`,
    })
    return { ok: true }
  }, [applySettings, support, syncBackground])

  const requestAndEnable = useCallback(async () => {
    setRequesting(true)
    setMessage(null)
    try {
      const outcome = await requestNotificationPermission()
      setPermission(outcome)

      if (outcome === 'granted') {
        const next = { ...settingsRef.current, enabled: true }
        await applySettings(next)
        setNow(new Date())
        const result = await syncBackground(next)
        setMessage({
          tone: 'success',
          text: result.scheduled
            ? `Daily reminder set for ${formatTimeLabel(next.time)}. Background checks are registered with your browser.`
            : `Daily reminder set for ${formatTimeLabel(next.time)}. It will appear while WeatherBoard is open.`,
        })
        return { ok: true }
      }

      setMessage({
        tone: outcome === 'denied' ? 'danger' : 'info',
        text:
          outcome === 'denied'
            ? 'Notifications are blocked. You can re-enable them for this site in your browser settings; the reminder stays off for now.'
            : 'Notification permission was not granted. The reminder stays off.',
      })
      return { ok: false, reason: outcome }
    } catch (error) {
      console.warn('[WeatherBoard] Notification permission request failed.', error)
      setMessage({
        tone: 'danger',
        text: 'The notification permission prompt could not be shown. Check your browser settings and try again.',
      })
      return { ok: false, reason: 'error' }
    } finally {
      setRequesting(false)
    }
  }, [applySettings, syncBackground])

  const disable = useCallback(async () => {
    const next = { ...settingsRef.current, enabled: false }
    await applySettings(next)
    await syncBackground(next)
    setMessage({ tone: 'info', text: 'Daily reminder turned off.' })
    return { ok: true }
  }, [applySettings, syncBackground])

  const setTime = useCallback(
    async (time) => {
      const error = validateReminderTime(time)
      if (error) return { ok: false, error }
      const next = { ...settingsRef.current, time }
      await applySettings(next)
      if (next.enabled && permission === 'granted') {
        await syncBackground(next)
      }
      setNow(new Date())
      return { ok: true, error: null }
    },
    [applySettings, permission, syncBackground],
  )

  const sendTest = useCallback(async () => {
    if (permission !== 'granted') {
      setMessage({
        tone: 'danger',
        text: 'Allow notifications first, then send a test reminder.',
      })
      return { ok: false }
    }
    try {
      await showWeatherReminder({ cityName: cityRef.current, isTest: true })
      setMessage({ tone: 'success', text: 'Test notification sent.' })
      return { ok: true }
    } catch (error) {
      console.warn('[WeatherBoard] Test notification failed.', error)
      setMessage({
        tone: 'danger',
        text: 'The test notification could not be shown. Check your browser notification settings.',
      })
      return { ok: false }
    }
  }, [permission])

  const nextAt = useMemo(() => {
    if (!settings.enabled) return null
    return getReminderSchedule({
      time: settings.time,
      lastSentDate: settings.lastSentDate,
      now,
    }).nextAt
  }, [settings.enabled, settings.time, settings.lastSentDate, now])

  const clearMessage = useCallback(() => setMessage(null), [])

  return {
    support,
    permission,
    settings,
    requesting,
    message,
    background,
    nextAt,
    storageAvailable,
    isEnabled: settings.enabled && permission === 'granted',
    enable,
    requestAndEnable,
    disable,
    setTime,
    sendTest,
    clearMessage,
  }
}
