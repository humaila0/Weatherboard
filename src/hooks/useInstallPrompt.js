import { useCallback, useEffect, useState } from 'react'

const SYSTEM_QUERY = '(display-mode: standalone)'

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null)
  const [installed, setInstalled] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia?.(SYSTEM_QUERY).matches ||
      window.navigator.standalone === true
    )
  })

  useEffect(() => {
    const handleBeforeInstall = (event) => {
      event.preventDefault()
      setPromptEvent(event)
    }
    const handleInstalled = () => {
      setInstalled(true)
      setPromptEvent(null)
    }
    const media = window.matchMedia?.(SYSTEM_QUERY)
    const handleDisplayChange = (event) => {
      if (event.matches) setInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    media?.addEventListener('change', handleDisplayChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
      media?.removeEventListener('change', handleDisplayChange)
    }
  }, [])

  const install = useCallback(async () => {
    if (!promptEvent) return { outcome: 'unavailable' }
    await promptEvent.prompt()
    const choice = await promptEvent.userChoice
    setPromptEvent(null)
    if (choice.outcome === 'accepted') setInstalled(true)
    return choice
  }, [promptEvent])

  return {
    canInstall: Boolean(promptEvent) && !installed,
    installed,
    install,
  }
}
