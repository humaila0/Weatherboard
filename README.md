# WeatherBoard

An installable personal weather dashboard built with React and Vite. Search any city, see current
conditions and a five-day forecast, save up to five favourites, install it as a PWA, and keep the
last viewed city available offline. Real data only — mock weather is never shown as live.

**Live app:** <https://weatherboard1-six.vercel.app/>
**Repository:** <https://github.com/humaila0/Weatherboard>

![WeatherBoard social preview](public/og-image.png)

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API integration](#api-integration)
- [PWA and offline](#pwa-and-offline)
- [Daily reminder](#daily-reminder)
- [Responsive design and accessibility](#responsive-design-and-accessibility)
- [Tests and quality](#tests-and-quality)
- [Security](#security)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)

## Features

**City search** — 300 ms debounce, request cancellation, result cache, keyboard navigation
(Arrow keys, Enter, Escape), and visible loading, empty, rate-limit, and error states.

**Weather** — temperature, feels-like, humidity, wind, condition, and icon; local city time and
timezone-aware forecast labels; loading skeletons, retry, and last-saved fallback.

**Favourites** — up to five cities stored in `localStorage`, with duplicate prevention, removal
confirmation, and an in-memory fallback when storage is blocked.

**PWA** — valid manifest, precached app shell, offline banner, cached-data pill, and an update
banner when a new service worker is waiting.

**Daily reminder** — explain-before-prompt permission flow, time picker, test notification, and an
in-app scheduler that fires at most once per day.

**Responsive and accessible** — verified at 375/768/1280 px with no horizontal overflow, 44 px
touch targets, labelled controls, visible focus, and reduced-motion support.

**Optional extras** — dark/light theme with system default, °C/°F toggle, self-hosted Inter font,
and per-condition **CSS-animated** weather icons (sun rotation, drifting clouds, rain/snow
particles, lightning glow). No Lottie or extra dependency; motion scales with icon size and is
disabled under `prefers-reduced-motion`.

## Tech stack

React 19 · Vite 7 · plain CSS · Lucide icons · Vitest · ESLint. No TypeScript, UI kit, backend, or
database.

## Getting started

Requires Node.js 20.19+ or 22+ and npm.

```bash
npm install --legacy-peer-deps
npm run dev        # http://localhost:5173
```

The `--legacy-peer-deps` flag works around stricter peer ranges in the ESLint/React plugins. A
committed `.npmrc` sets it automatically, so plain `npm install` also works.

The app runs immediately on Open-Meteo with no API keys.

```bash
npm run build      # static output in dist/
npm run preview    # serve dist/ locally (best way to test the service worker)
npm run lint
npm test
```

### Project layout

```text
src/
├─ components/   UI: Header, SearchBar, WeatherCard, Forecast, FavoritesPanel, ReminderPanel, …
├─ hooks/        useCitySearch, useWeather, useFavorites, usePreferences, useReminderSettings, …
├─ services/     weatherService, searchService, geoDbService, openMeteoService, http, notifications
├─ utils/        helpers, validation, storage, cache, config, *.test.js
├─ styles/       index.css
└─ App.jsx, main.jsx
public/          manifest, service-worker.js, icons, og-image, robots.txt
```

## Environment variables

Copy the example file and fill in the keys you have:

```bash
cp .env.example .env
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_OPENWEATHER_API_KEY` | Optional | Primary current weather + five-day forecast |
| `VITE_GEODB_RAPIDAPI_KEY` | Optional | Primary city autocomplete |
| `VITE_GEODB_RAPIDAPI_HOST` | Optional | Defaults to `wft-geo-db.p.rapidapi.com` |

Without keys the app uses live Open-Meteo weather and geocoding. With keys, the primary providers
are tried first and the active provider is labelled in the UI.

`.env` and `.env.*.local` are git-ignored; `.env.example` is committed.

## API integration

### OpenWeatherMap (optional)

1. Sign up at <https://home.openweathermap.org/users/sign_up> and copy a key from **API keys**.
2. Add it to `.env` as `VITE_OPENWEATHER_API_KEY`.

Endpoints: `/data/2.5/weather` and `/data/2.5/forecast`, both with `lat`, `lon`, `appid`, and
`units=metric`. The forecast returns three-hourly entries; they are grouped by the city's local
date, min/max are aggregated, and the condition nearest local noon supplies the day icon.

### GeoDB Cities via RapidAPI (optional)

1. Subscribe to the free **GeoDB Cities** plan at
   <https://rapidapi.com/wirefreethought/api/geodb-cities>.
2. Put the `X-RapidAPI-Key` value in `VITE_GEODB_RAPIDAPI_KEY`.

```text
GET https://wft-geo-db.p.rapidapi.com/v1/geo/cities
    ?namePrefix=<query>&limit=8&sort=-population&types=CITY
Headers: X-RapidAPI-Key, X-RapidAPI-Host
```

### Open-Meteo (no key, default fallback)

- Weather: `https://api.open-meteo.com/v1/forecast`
- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`

**Fallback order:** OpenWeatherMap → Open-Meteo → last cached weather for that city. The UI always
names the provider in use. All provider data is normalised to Celsius and km/h before it reaches the
UI, so fallback can never mix units.

**Error handling:** `fetchJson` wraps `fetch` with timeouts, abort forwarding, and the error codes
`invalid_key`, `not_found`, `rate_limit`, `server`, `request`, `timeout`, `network`, and
`missing_data`. Stale requests from newer searches are cancelled and ignored.

**Search:** queries under two characters never hit the network; requests are debounced and cached
(30 entries); GeoDB falls back to Open-Meteo geocoding with a visible warning.

## PWA and offline

`public/manifest.webmanifest` declares name, `id`, `start_url`, scope, standalone display, colours,
language, and 192×192, 512×512, and 512×512 maskable icons (plus Apple touch icon and badge).

`public/service-worker.js` is hand-written for auditable caching:

| Cache | Contents |
| --- | --- |
| `weatherboard-shell-v1` | `index.html`, manifest, icons, hashed JS/CSS |
| `weatherboard-runtime-v1` | Fonts and other same-origin assets |
| `weatherboard-api-v1` | Successful weather/geocoding GETs (max 50) |
| `weatherboard-meta-v1` | Reminder metadata |

- **Navigations:** network-first, cached shell fallback, including on 5xx responses.
- **Static assets:** stale-while-revalidate.
- **API GETs:** network-first, cache used only when the network fails.
- **Updates:** a changed worker enters `waiting`; the update banner posts `SKIP_WAITING` and
  reloads. Old `weatherboard-*` caches are deleted on activation.

After each successful response the last city and normalised weather are saved under
`weatherboard:last-weather:v1`. Offline, the card shows a **CACHED** pill with the saved timestamp,
and a city never fetched before shows an honest "no saved weather" error instead of invented data.

## Daily reminder

The reminder uses the Notifications API plus the service worker:

1. The panel explains what will be sent before permission is requested.
2. The chosen time (default `07:00`) is stored locally and shared with the worker via the Cache API.
3. While the app is open, a once-a-minute check fires at most one notification per local day, with a
   90-minute catch-up window if the tab was backgrounded.
4. Chromium's **Periodic Background Sync** is registered when available (best-effort).
5. **Send test** proves notifications work immediately.

**Honest limitation:** a client-only app cannot guarantee delivery after the browser is fully
closed. Guaranteed Web Push needs a backend with VAPID keys, stored subscriptions, and a scheduled
sender — outside this challenge's scope. Notifications also require `https://` or `localhost`, and
iOS requires 16.4+ with the app installed to the Home Screen.

## Responsive design and accessibility

| Width | Layout |
| --- | --- |
| ≥ 1025 px | Main column + sidebar |
| ≤ 1024 px | Single column; two-column sidebar; 44 px controls |
| ≤ 900 px | Header stacks above a full-width search |
| ≤ 720 px | One-column sidebar |
| ≤ 640 px | 2-column forecast with full-width fifth day; install button hidden |
| ≤ 400 px | Tighter padding, two-column stats |

The install button is hidden below 640 px to keep the header uncluttered; installation remains
available from the browser menu. No horizontal overflow at 375, 768, or 1280 px.

Accessibility: skip link, semantic landmarks, labelled controls, search combobox pattern
(`aria-expanded`, `aria-activedescendant`, `aria-selected`), live regions, `role="alert"` errors with
`aria-invalid` and `aria-describedby`, `:focus-visible` outlines, 4.5:1+ contrast, descriptive names
for icon-only buttons, and reduced-motion support. Lighthouse on the production build: **100** for
Accessibility, Best Practices, and SEO, with zero failed audits.

## Tests and quality

```text
npm test        # 36 tests passed across 6 files
npm run lint    # passes
npm run build   # passes; ~313 kB JS / ~39.9 kB CSS before gzip
```

Coverage includes WMO and OpenWeatherMap condition mapping, three-hourly forecast aggregation,
Open-Meteo normalisation, geocoding order and invalid payloads, unit conversion, reminder
scheduling states, timezone date keys, city validation and sanitisation, favourite dedupe and caps,
error-message mapping, PWA manifest/icons/service-worker hooks, and weather-icon markup.

Manual browser QA covered live weather, search debounce and keyboard flow, validation, favourites,
theme/unit persistence, offline shell and cached weather, PWA registration, responsive layouts, and
Lighthouse.

**Known gaps:** no OpenWeatherMap or GeoDB credentials were available, so their happy paths are
unit-tested only; notification permission was already denied in the test browser, so the
granted flow was verified by implementation rather than end-to-end.

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs lint, tests, and build on every push and
pull request. It does not deploy — Vercel handles that independently.

## Security

- No keys or secrets are committed; `.env*` is ignored and `.env.example` lists only names.
- `VITE_*` values are embedded in the client bundle and are **public**. Use free or restricted
  browser keys, monitor usage, and rotate them if abused. Privileged keys need a backend proxy.
- All production traffic is HTTPS; notifications require a secure context.
- Input is trimmed, length-limited, and validated before any request.
- Stored JSON is parsed defensively, and corrupt or over-limit records are dropped on read.
- No `dangerouslySetInnerHTML`, `eval`, or untrusted HTML injection.
- `vercel.json` and `netlify.toml` set immutable caching for hashed assets and revalidation for
  `service-worker.js`.

## Deployment

Vercel or Netlify, both static Vite builds (`npm run build`, output `dist/`).

**Vercel:** import the repo at <https://vercel.com/new>, framework preset **Vite**, add the `VITE_*`
environment variables for Production and Preview, then deploy.

**Netlify:** add the repo at <https://app.netlify.com/start>; `netlify.toml` already sets the build
command, publish directory, Node 22, and cache headers. Add the same variables.

**Post-deploy checks:** manifest has no installability errors; service worker is activated and
controlling; reload then go offline to confirm the shell and cached weather; check search,
favourites, theme, and units; run a test notification on a real device; run Lighthouse.

## Known limitations

1. **No guaranteed closed-browser notifications** — needs a Web Push backend; local scheduling and
   Periodic Background Sync are best-effort.
2. **API keys are visible in the client bundle** — inherent to client-only Vite apps.
3. **Only the last viewed city is cached** for offline weather.
4. **Search requires a connection** — the result cache is in-memory per session.
5. **Free-tier API limits apply** — Open-Meteo fallback keeps weather working.
6. **PWA install varies by browser** — the in-app button needs `beforeinstallprompt`; iOS Safari
   uses Share → Add to Home Screen.
7. **Notification support varies** — some browsers only support page-level notifications.
8. **Primary providers were not live-tested without keys** — fallback and error paths were.
9. **Timezones can differ from the visitor's date** — forecast days follow the city's local date.
10. **No multi-tab sync for reminder changes** — favourites listen for `storage` events; reminders
    do not.

## Credits

Weather data from [OpenWeatherMap](https://openweathermap.org/) and
[Open-Meteo](https://open-meteo.com/); city data from
[GeoDB Cities](https://rapidapi.com/wirefreethought/api/geodb-cities) and
[Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api); icons from
[Lucide](https://lucide.dev/); typography is [Inter](https://rsms.me/inter/) via Fontsource.

Built for the Edspire Frontend (React) Developer Technical Challenge, November 2026.
