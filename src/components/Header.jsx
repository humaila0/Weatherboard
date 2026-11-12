import { Download, Moon, Sun } from 'lucide-react'
import { SearchBar } from './SearchBar'

export function Header({
  onSelectCity,
  isOnline,
  resolvedTheme,
  toggleTheme,
  units,
  toggleUnits,
  canInstall,
  onInstall,
}) {
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-row">
          <a className="brand" href="/">
            <img className="brand-mark" src="/favicon.svg" alt="" width="38" height="38" />
            <span className="brand-copy">
              <span className="brand-name">WeatherBoard</span>
              <span className="brand-tagline">Your day, at a glance</span>
            </span>
            <span className="sr-only"> home</span>
          </a>

          <div className="header-actions">
            {canInstall ? (
              <button type="button" className="ghost-button install-button" onClick={onInstall}>
                <Download size={16} aria-hidden="true" />
                <span>Install</span>
              </button>
            ) : null}

            <div className="unit-toggle" role="group" aria-label="Temperature units">
              <button
                type="button"
                className={units === 'metric' ? 'is-active' : ''}
                onClick={() => units !== 'metric' && toggleUnits()}
                aria-pressed={units === 'metric'}
                aria-label="Show temperatures in Celsius (°C)"
              >
                °C
              </button>
              <button
                type="button"
                className={units === 'imperial' ? 'is-active' : ''}
                onClick={() => units !== 'imperial' && toggleUnits()}
                aria-pressed={units === 'imperial'}
                aria-label="Show temperatures in Fahrenheit (°F)"
              >
                °F
              </button>
            </div>

            <button
              type="button"
              className="icon-button theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${nextTheme} theme`}
              title={`Switch to ${nextTheme} theme`}
            >
              {resolvedTheme === 'dark' ? (
                <Sun size={18} aria-hidden="true" />
              ) : (
                <Moon size={18} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div className="header-search-row">
          <SearchBar onSelectCity={onSelectCity} isOnline={isOnline} />
        </div>
      </div>
    </header>
  )
}
