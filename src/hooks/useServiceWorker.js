import { useCallback, useEffect, useRef, useState } from 'react'

export function useServiceWorker() {
  const [updateReady, setUpdateReady] = useState(false)
  const [registrationError, setRegistrationError] = useState(null)
  const registrationRef = useRef(null)
  const reloadRequestedRef = useRef(false)

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return undefined

    let cancelled = false

    const handleControllerChange = () => {
      if (!reloadRequestedRef.current) return
      reloadRequestedRef.current = false
      window.location.reload()
    }

    const trackWorker = (worker) => {
      if (!worker) return
      const handleStateChange = () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          setUpdateReady(true)
        }
      }
      worker.addEventListener('statechange', handleStateChange)
      return () => worker.removeEventListener('statechange', handleStateChange)
    }

    let removeWorkerListener = null

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/', updateViaCache: 'none' })
      .then((registration) => {
        if (cancelled) return
        registrationRef.current = registration
        setRegistrationError(null)

        if (registration.waiting && navigator.serviceWorker.controller) {
          setUpdateReady(true)
        }

        removeWorkerListener = trackWorker(registration.installing)
        registration.addEventListener('updatefound', () => {
          removeWorkerListener?.()
          removeWorkerListener = trackWorker(registration.installing)
        })
      })
      .catch((error) => {
        console.warn('[WeatherBoard] Service worker registration failed.', error)
        if (!cancelled) setRegistrationError(error)
      })

    const handleFocus = () => {
      registrationRef.current?.update().catch(() => {
        // A failed update check is non-fatal; the active worker keeps serving the app.
      })
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      cancelled = true
      removeWorkerListener?.()
      window.removeEventListener('focus', handleFocus)
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  const applyUpdate = useCallback(() => {
    const waiting = registrationRef.current?.waiting
    if (!waiting) {
      window.location.reload()
      return
    }
    reloadRequestedRef.current = true
    waiting.postMessage({ type: 'SKIP_WAITING' })
  }, [])

  return { updateReady, applyUpdate, registrationError }
}
