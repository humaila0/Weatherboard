import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from 'lucide-react'

const ICONS = {
  clear: { day: Sun, night: Moon },
  'partly-cloudy': { day: CloudSun, night: CloudMoon },
  cloudy: { day: Cloud, night: Cloud },
  fog: { day: CloudFog, night: CloudFog },
  drizzle: { day: CloudDrizzle, night: CloudDrizzle },
  rain: { day: CloudRain, night: CloudRain },
  'heavy-rain': { day: CloudRainWind, night: CloudRainWind },
  snow: { day: CloudSnow, night: CloudSnow },
  thunder: { day: CloudLightning, night: CloudLightning },
  unknown: { day: CloudSun, night: CloudMoon },
}

const TONES = {
  clear: 'warm',
  'partly-cloudy': 'warm',
  cloudy: 'cool',
  fog: 'mist',
  drizzle: 'rain',
  rain: 'rain',
  'heavy-rain': 'rain',
  snow: 'ice',
  thunder: 'storm',
  unknown: 'cool',
}

/**
 * Decorative particle layers. Everything is sized in percentages of the icon
 * box, so the same markup stays proportional from a 26px forecast icon to the
 * 52px hero icon. Pure CSS transforms keep it on the compositor.
 */
const EFFECTS = {
  drizzle: 'drizzle',
  rain: 'rain',
  'heavy-rain': 'rain-heavy',
  snow: 'snow',
  thunder: 'storm',
}

const PARTICLE_COUNTS = {
  drizzle: 2,
  rain: 3,
  'rain-heavy': 4,
  snow: 3,
}

function WeatherEffects({ effect }) {
  if (!effect) return null

  if (effect === 'storm') {
    return <span className="weather-fx weather-fx--storm" aria-hidden="true" />
  }

  const count = PARTICLE_COUNTS[effect] ?? 3
  const className =
    effect === 'snow' ? 'weather-fx weather-fx--snow' : `weather-fx weather-fx--${effect}`

  return (
    <span className={className} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span key={index} />
      ))}
    </span>
  )
}

export function WeatherIcon({ code = 'unknown', isDay = true, size = 32, className = '', label }) {
  const iconSet = ICONS[code] ?? ICONS.unknown
  const Icon = isDay ? iconSet.day : iconSet.night
  const tone = TONES[code] ?? TONES.unknown
  const effect = EFFECTS[code] ?? null
  const classes = [
    'weather-icon',
    `weather-icon--${tone}`,
    `weather-icon--cond-${code}`,
    isDay ? 'weather-icon--day' : 'weather-icon--night',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      className={classes}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' })}
    >
      <Icon className="weather-icon-svg" size={size} strokeWidth={1.6} aria-hidden="true" />
      <WeatherEffects effect={effect} />
    </span>
  )
}
