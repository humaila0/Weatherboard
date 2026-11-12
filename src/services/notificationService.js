import { readJson, STORAGE_KEYS, writeJson } from '../utils/storage'
import { localDateKey } from '../utils/reminderHelpers'

const META_CACHE = 'weatherboard-meta-v1'
const META_URL = '/__weatherboard/reminder'
const PERIODIC_TAG = 'weatherboard-daily-reminder'
const DEFAULT_TIME = '07:00'

export const DEFAULT_REMINDER_SETTINGS = Object.freeze({
  enabled: false,
  time: DEFAULT_TIME,
  lastSentDate: null,
  updatedAt: null,
})

export function getNotificationSupport() {
  if (typeof window === 'undefined') return 'unsupported'
  if (!window.isSecureContext) return 'unsupported'
  if (!('Notification' in window)) return 'unsupported'
  if (!('serviceWorker' in navigator)) return 'page-only'
  return 'supported'
}

export function getNotificationPermission() {
  if (getNotificationSupport() === 'unsupported') return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission() {
  if (getNotificationSupport() === 'unsupported') {
    throw new Error('Notifications are not supported in this browser.')
  }
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

export function readReminderSettings() {
  const raw = readJson(STORAGE_KEYS.reminder, null)
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_REMINDER_SETTINGS }

  const time = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(raw.time)) ? raw.time : DEFAULT_TIME
  const lastSentDate = /^\d{4}-\d{2}-\d{2}$/.test(String(raw.lastSentDate))
    ? raw.lastSentDate
    : null

  return {
    enabled: raw.enabled === true,
    time,
    lastSentDate,
    updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : null,
  }
}

async function writeReminderMetadata(settings, cityName) {
  if (typeof window === 'undefined' || !('caches' in window)) return
  try {
    const cache = await window.caches.open(META_CACHE)
    await cache.put(
      META_URL,
      new Response(
        JSON.stringify({
          enabled: settings.enabled,
          time: settings.time,
          lastSentDate: settings.lastSentDate,
          cityName: cityName ?? null,
          updatedAt: Date.now(),
        }),
        { headers: { 'Content-Type': 'application/json' } },
      ),
    )
  } catch (error) {
    console.warn('[WeatherBoard] Could not share reminder settings with the service worker.', error)
  }
}

export async function saveReminderSettings(settings, cityName) {
  const next = { ...settings, updatedAt: Date.now() }
  const result = writeJson(STORAGE_KEYS.reminder, next)
  await writeReminderMetadata(next, cityName)
  return result
}

function readServiceWorkerRegistration(timeoutMs = 3500) {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null)

  return new Promise((resolve) => {
    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      clearTimeout(timerId)
      resolve(value)
    }
    const timerId = setTimeout(() => finish(null), timeoutMs)

    navigator.serviceWorker
      .getRegistration()
      .then((registration) => {
        if (!registration) return finish(null)
        navigator.serviceWorker.ready.then(finish).catch(() => finish(null))
      })
      .catch(() => finish(null))
  })
}

/**
 * Periodic Background Sync is best-effort and only available in some Chromium
 * installations. The browser decides if and when the worker runs; it is not a
 * guaranteed closed-browser scheduler. A real Web Push schedule requires a server.
 */
export async function updatePeriodicSync(settings, cityName) {
  await writeReminderMetadata(settings, cityName)

  const support = getNotificationSupport()
  if (support !== 'supported') {
    return { supported: false, scheduled: false, reason: 'unsupported' }
  }

  const registration = await readServiceWorkerRegistration()
  if (!registration) {
    return { supported: false, scheduled: false, reason: 'no-registration' }
  }
  if (!('periodicSync' in registration)) {
    return { supported: false, scheduled: false, reason: 'not-available' }
  }

  if (!settings.enabled) {
    try {
      await registration.periodicSync.unregister(PERIODIC_TAG)
    } catch {
      // Nothing to unregister.
    }
    return { supported: true, scheduled: false, reason: 'disabled' }
  }

  try {
    if (navigator.permissions?.query) {
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' })
      if (status.state === 'denied') {
        return { supported: true, scheduled: false, reason: 'permission-denied' }
      }
    }
    await registration.periodicSync.register(PERIODIC_TAG, {
      minInterval: 12 * 60 * 60 * 1000,
    })
    return { supported: true, scheduled: true, reason: 'registered' }
  } catch (error) {
    console.warn('[WeatherBoard] Periodic background sync is unavailable.', error)
    return { supported: true, scheduled: false, reason: error?.name || 'unavailable' }
  }
}

export async function showWeatherReminder({ cityName, isTest = false } = {}) {
  if (getNotificationPermission() !== 'granted') {
    throw new Error('Notifications are not allowed for this site.')
  }

  const title = isTest ? 'WeatherBoard test reminder' : 'Your daily weather reminder'
  const body = isTest
    ? 'Reminders are working. You can change the time or turn them off in WeatherBoard.'
    : cityName
      ? `Take a quick look at the weather in ${cityName} before you head out.`
      : 'Take a quick look at today’s weather before you head out.'

  const options = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: isTest ? 'weatherboard-test-reminder' : PERIODIC_TAG,
    data: { url: '/' },
  }

  const registration = await readServiceWorkerRegistration()
  if (registration) {
    await registration.showNotification(title, options)
    return 'service-worker'
  }

  if (!('Notification' in window)) {
    throw new Error('Notifications are not supported in this browser.')
  }

  const notification = new Notification(title, options)
  notification.onclick = () => {
    window.focus()
    notification.close()
  }
  return 'page'
}

export function markReminderSent(settings) {
  return { ...settings, lastSentDate: localDateKey(), updatedAt: Date.now() }
}

export function reminderSettingsStorageKey() {
  return STORAGE_KEYS.reminder
}
