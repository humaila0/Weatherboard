import { useState } from 'react'
import { Bell, BellRing, Info, Send, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react'
import { formatReminderTarget, formatTimeLabel } from '../utils/dateHelpers'
import { validateReminderTime } from '../utils/validation'

export function ReminderPanel({
  cityName,
  support,
  permission,
  settings,
  requesting,
  message,
  background,
  nextAt,
  isEnabled,
  enable,
  requestAndEnable,
  disable,
  setTime,
  sendTest,
  clearMessage,
}) {
  const [explaining, setExplaining] = useState(false)
  const [timeError, setTimeError] = useState('')

  const unsupported = support === 'unsupported'
  const denied = permission === 'denied'
  const pageOnly = support === 'page-only'
  const tone = unsupported ? 'neutral' : isEnabled ? 'success' : 'neutral'

  const handleEnable = async () => {
    if (permission === 'granted') {
      await enable()
      return
    }
    setExplaining(true)
  }

  const handleTimeChange = async (event) => {
    const value = event.target.value
    const error = validateReminderTime(value)
    setTimeError(error ?? '')
    if (error) return
    await setTime(value)
  }

  return (
    <section className="card reminder-card" id="reminder-card" aria-labelledby="reminder-heading">
      <div className="card-header">
        <div>
          <h2 id="reminder-heading">Daily reminder</h2>
          <p>One calm nudge to check the weather</p>
        </div>
        <span className={`card-icon card-icon--${tone}`} aria-hidden="true">
          {isEnabled ? <BellRing size={19} /> : <Bell size={19} />}
        </span>
      </div>

      {unsupported ? (
        <div className="reminder-blocked">
          <TriangleAlert size={18} aria-hidden="true" />
          <div>
            <strong>Notifications aren’t available here</strong>
            <p>
              This browser does not support notifications, or the page is not on a secure
              connection. The rest of WeatherBoard works normally.
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className="reminder-copy">
            Get a short notification each morning with the city you last checked. Pick a time that
            fits your routine.
          </p>

          <div className={isEnabled ? 'reminder-status is-on' : 'reminder-status'}>
            <span className="reminder-status-dot" aria-hidden="true" />
            <span>
              {isEnabled ? (
                <>
                  On{nextAt ? ` · next ${formatReminderTarget(nextAt)}` : ''}
                </>
              ) : (
                'Off'
              )}
            </span>
          </div>

          <div className="field-group reminder-time">
            <label htmlFor="reminder-time">Reminder time</label>
            <input
              id="reminder-time"
              type="time"
              value={settings.time}
              onChange={handleTimeChange}
              aria-invalid={timeError ? 'true' : 'false'}
              aria-describedby={timeError ? 'reminder-time-error' : undefined}
            />
            {timeError ? (
              <p className="field-error" id="reminder-time-error" role="alert">
                <TriangleAlert size={13} aria-hidden="true" />
                <span>{timeError}</span>
              </p>
            ) : (
              <p className="field-hint">
                Notifications arrive at {formatTimeLabel(settings.time)} in your device’s time zone.
              </p>
            )}
          </div>

          {denied ? (
            <div className="reminder-blocked reminder-blocked--warning" role="status">
              <TriangleAlert size={18} aria-hidden="true" />
              <div>
                <strong>Notifications are blocked for this site</strong>
                <p>
                  Update WeatherBoard’s notification permission in your browser’s site settings, then
                  come back and turn the reminder on. Everything else keeps working.
                </p>
              </div>
            </div>
          ) : isEnabled ? (
            <div className="reminder-actions">
              <button type="button" className="secondary-button" onClick={sendTest}>
                <Send size={15} aria-hidden="true" />
                Send test
              </button>
              <button
                type="button"
                className="text-button text-button--muted"
                onClick={disable}
              >
                Turn off
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="primary-button reminder-enable"
              onClick={handleEnable}
              disabled={requesting}
            >
              <Bell size={16} aria-hidden="true" />
              {requesting ? 'Asking for permission…' : 'Enable daily reminder'}
            </button>
          )}

          {explaining && !isEnabled ? (
            <div className="permission-explainer" role="group" aria-labelledby="permission-why">
              <span className="permission-icon" aria-hidden="true">
                <ShieldCheck size={18} />
              </span>
              <div className="permission-copy">
                <strong id="permission-why">Why we need notification permission</strong>
                <p>
                  WeatherBoard will show one local notification a day at your chosen time, naming the
                  city you last checked. It is never used for marketing, and you can revoke permission
                  in your browser at any time.
                </p>
                <div className="permission-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={async () => {
                      setExplaining(false)
                      await requestAndEnable()
                    }}
                    disabled={requesting}
                  >
                    {requesting ? 'Waiting for permission…' : 'Allow notifications'}
                  </button>
                  <button
                    type="button"
                    className="text-button text-button--muted"
                    onClick={() => setExplaining(false)}
                    disabled={requesting}
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {pageOnly ? (
            <p className="panel-notice" role="note">
              This browser has no service-worker notifications, so reminders can only appear while
              this tab stays open.
            </p>
          ) : null}

          <details className="reminder-details">
            <summary>
              <Info size={14} aria-hidden="true" />
              How delivery works
            </summary>
            <p>
              WeatherBoard schedules the reminder locally. Browsers only run it while the app is open
              or, in some Chromium browsers, during a background sync. No website can guarantee a
              notification after the browser is fully closed without a push server. This app has no
              backend, so closed-browser delivery is best-effort, not promised.
            </p>
            {isEnabled ? (
              <p className="reminder-background">
                <Sparkles size={13} aria-hidden="true" />
                {background.supported && background.scheduled
                  ? 'Background checks are registered with your browser.'
                  : 'The in-app scheduler is active while WeatherBoard is open.'}
              </p>
            ) : null}
          </details>
        </>
      )}

      {message ? (
        <div className={`panel-message panel-message--${message.tone ?? 'info'}`} role="status">
          <p>{message.text}</p>
          <button type="button" className="text-button text-button--muted" onClick={clearMessage}>
            Dismiss
          </button>
        </div>
      ) : null}

      <p className="reminder-city">
        Reminder city: <strong>{cityName ?? 'Not selected'}</strong>
      </p>
    </section>
  )
}
