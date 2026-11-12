/* WeatherBoard service worker — app shell caching, API cache, offline fallback, reminders. */

const VERSION = 'v1'
const SHELL_CACHE = `weatherboard-shell-${VERSION}`
const RUNTIME_CACHE = `weatherboard-runtime-${VERSION}`
const API_CACHE = `weatherboard-api-${VERSION}`
const META_CACHE = `weatherboard-meta-${VERSION}`
const REMINDER_KEY = '/__weatherboard/reminder'
const REMINDER_TAG = 'weatherboard-daily-reminder'

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon-32.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/badge-96.png',
  '/og-image.png',
]

const API_HOSTS = new Set([
  'api.openweathermap.org',
  'api.open-meteo.com',
  'geocoding-api.open-meteo.com',
  'wft-geo-db.p.rapidapi.com',
])

const CURRENT_CACHES = new Set([SHELL_CACHE, RUNTIME_CACHE, API_CACHE, META_CACHE])

async function precacheShell() {
  const cache = await caches.open(SHELL_CACHE)
  await Promise.allSettled(SHELL_ASSETS.map((url) => cache.add(url)))

  // Vite fingerprints the entry JS/CSS, so read index.html and cache those files too.
  try {
    const response = await fetch('/index.html', { cache: 'no-store' })
    if (!response.ok) return
    const html = await response.clone().text()
    await cache.put('/index.html', response)
    const assetUrls = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1])
    await Promise.allSettled([...new Set(assetUrls)].map((url) => cache.add(url)))
  } catch (error) {
    console.warn('[WeatherBoard] Shell asset precache was incomplete.', error)
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key.startsWith('weatherboard-') && !CURRENT_CACHES.has(key))
          .map((key) => caches.delete(key)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE)
      await cache.put(request, response.clone())
      return response
    }

    // A dev proxy or a hosting outage can answer 5xx without a network error.
    // Prefer the precached shell so the app still opens.
    const fallback = (await caches.match(request)) || (await caches.match('/index.html')) || (await caches.match('/'))
    return fallback || response
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) return cached
    const shell = (await caches.match('/index.html')) || (await caches.match('/'))
    if (shell) return shell
    throw error
  }
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length <= maxEntries) return
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)))
}

async function networkFirstApi(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(API_CACHE)
      await cache.put(request, response.clone())
      await trimCache(API_CACHE, 50)
    }
    return response
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) return cached
    throw error
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin && !API_HOSTS.has(url.hostname)) return
  if (url.origin === self.location.origin && url.pathname === '/service-worker.js') return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  if (API_HOSTS.has(url.hostname)) {
    event.respondWith(networkFirstApi(request))
    return
  }

  // Stale-while-revalidate for the app's static assets.
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(RUNTIME_CACHE)
        await cache.put(request, response.clone())
        await trimCache(RUNTIME_CACHE, 80)
      }
      return response
    })
    .catch(() => null)

  event.waitUntil(networkPromise)
  event.respondWith(
    caches
      .match(request)
      .then((cached) => cached || networkPromise)
      .then((response) => response || Response.error()),
  )
})

async function readReminderMetadata() {
  try {
    const cache = await caches.open(META_CACHE)
    const response = await cache.match(REMINDER_KEY)
    if (!response) return null
    return await response.json()
  } catch (error) {
    console.warn('[WeatherBoard] Could not read reminder metadata.', error)
    return null
  }
}

async function writeReminderMetadata(metadata) {
  const cache = await caches.open(META_CACHE)
  await cache.put(
    REMINDER_KEY,
    new Response(JSON.stringify(metadata), {
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function minutesFromTime(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value || '')
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

async function maybeShowDailyReminder() {
  const metadata = await readReminderMetadata()
  if (!metadata?.enabled) return

  const now = new Date()
  const today = localDateKey(now)
  if (metadata.lastSentDate === today) return

  const target = minutesFromTime(metadata.time)
  if (target === null) return
  const current = now.getHours() * 60 + now.getMinutes()

  // Periodic sync is browser-scheduled, so only send inside a morning window.
  if (current < target || current > target + 180) return

  await self.registration.showNotification('Your daily weather reminder', {
    body: metadata.cityName
      ? `Take a quick look at the weather in ${metadata.cityName} before you head out.`
      : 'Take a quick look at today’s weather before you head out.',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: REMINDER_TAG,
    data: { url: '/' },
  })

  await writeReminderMetadata({ ...metadata, lastSentDate: today })
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag !== REMINDER_TAG) return
  event.waitUntil(maybeShowDailyReminder())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of clientList) {
        if ('focus' in client) {
          await client.focus()
          return
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(event.notification.data?.url || '/')
      }
    })(),
  )
})
