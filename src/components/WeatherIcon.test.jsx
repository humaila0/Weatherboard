import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { WeatherIcon } from './WeatherIcon'

function particleCount(html) {
  return (html.match(/<span><\/span>/g) ?? []).length
}

describe('WeatherIcon', () => {
  it('renders three falling drops for rain and exposes it as decorative', () => {
    const html = renderToStaticMarkup(<WeatherIcon code="rain" />)

    expect(html).toContain('weather-icon--cond-rain')
    expect(html).toContain('weather-fx--rain')
    expect(particleCount(html)).toBe(3)
    expect(html).toContain('aria-hidden="true"')
  })

  it('renders more, faster drops for heavy rain', () => {
    const html = renderToStaticMarkup(<WeatherIcon code="heavy-rain" />)

    expect(html).toContain('weather-icon--cond-heavy-rain')
    expect(html).toContain('weather-fx--rain-heavy')
    expect(particleCount(html)).toBe(4)
  })

  it('renders snowflakes for snow', () => {
    const html = renderToStaticMarkup(<WeatherIcon code="snow" />)

    expect(html).toContain('weather-fx--snow')
    expect(particleCount(html)).toBe(3)
  })

  it('keeps clear and cloudy icons free of particle layers', () => {
    const clear = renderToStaticMarkup(<WeatherIcon code="clear" />)
    const cloudy = renderToStaticMarkup(<WeatherIcon code="cloudy" />)

    expect(clear).not.toContain('weather-fx')
    expect(cloudy).not.toContain('weather-fx')
    expect(clear).toContain('weather-icon--day')
  })

  it('exposes a labelled icon and marks night variants', () => {
    const html = renderToStaticMarkup(
      <WeatherIcon code="clear" isDay={false} label="Clear night" />,
    )

    expect(html).toContain('role="img"')
    expect(html).toContain('aria-label="Clear night"')
    expect(html).toContain('weather-icon--night')
  })
})
