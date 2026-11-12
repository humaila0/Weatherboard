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

export function WeatherIcon({ code = 'unknown', isDay = true, size = 32, className = '', label }) {
  const iconSet = ICONS[code] ?? ICONS.unknown
  const Icon = isDay ? iconSet.day : iconSet.night
  const tone = TONES[code] ?? TONES.unknown
  const classes = ['weather-icon', `weather-icon--${tone}`, className].filter(Boolean).join(' ')

  return (
    <span
      className={classes}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' })}
    >
      <Icon size={size} strokeWidth={1.6} aria-hidden="true" />
    </span>
  )
}
