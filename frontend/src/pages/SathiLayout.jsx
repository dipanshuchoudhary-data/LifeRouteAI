import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useLifeRouteStore } from '../stores/useLifeRouteStore'
import { criticalVitalReasons, useProfileStore, vitalsAreCritical } from '../stores/useProfileStore'
import { useCompanionStore } from '../stores/useCompanionStore'
import { useUiStore } from '../stores/useUiStore'
import { useAudioCapture } from '../features/triage/hooks/useAudioCapture'
import { runSathiTurn } from '../lib/sathiTalk'
import { ensureSession } from '../lib/api'
import { PATHS, pathFor } from '../lib/paths'
import SathiShell from '../features/sathi/SathiShell'
import SafetyCheckModal from '../features/sathi/SafetyCheckModal'
import SpeechOverlay from '../features/triage/components/SpeechOverlay'

export default function SathiLayout() {
  const navigate = useNavigate()
  const pathname = useLocation().pathname
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [safetyStage, setSafetyStage] = useState('')
  const [safetyReasons, setSafetyReasons] = useState([])
  const wearableLock = useRef(false)
  const familyNotified = useRef(false)

  const textScale = useUiStore((s) => s.textScale)
  const profile = useProfileStore((s) => s.profile)
  const setWearable = useProfileStore((s) => s.setWearable)
  const logSafety = useCompanionStore((s) => s.logSafety)
  const setLocation = useLifeRouteStore((s) => s.setLocation)
  const triggerSOS = useLifeRouteStore((s) => s.triggerSOS)
  const resetSession = useLifeRouteStore((s) => s.resetSession)
  const emergencyError = useLifeRouteStore((s) => s.error)

  const startEmergency = useCallback((options = {}) => {
    setShowDetails(false)
    setSafetyStage('')
    triggerSOS({
      source: options.source || 'senior',
      requestedBy: options.requestedBy || '',
      input: options.input || 'I need help',
    })
    navigate(PATHS.emergency)
  }, [navigate, triggerSOS])

  const handleTalk = useCallback(async (text) => {
    const spoken = (text || '').trim()
    if (!spoken) return
    setBusy(true)
    setError('')
    setDraft('')
    if (pathname === PATHS.home) navigate(PATHS.talk)
    try {
      await runSathiTurn({
        text: spoken,
        profile: useProfileStore.getState().profile,
        companion: useCompanionStore.getState(),
        onHelp: ({ source, input }) => startEmergency({ source: source || 'voice', input }),
        onNavigate: (tab, sub) => navigate(pathFor(tab, sub)),
      })
    } catch (err) {
      setError(err.message || 'Model provider is busy. Please try again later.')
    } finally {
      setBusy(false)
    }
  }, [navigate, pathname, startEmergency])

  const { isListening, isTranscribing, start, stop } = useAudioCapture({
    onTranscript: (text) => handleTalk(text),
    onError: setError,
  })

  useEffect(() => {
    ensureSession().catch(() => {})
  }, [])

  useEffect(() => {
    document.documentElement.dataset.sathiScale = textScale
  }, [textScale])

  useEffect(() => {
    const city = (useProfileStore.getState().profile.city || '').toLowerCase()
    if (city.includes('noida')) {
      setLocation({ lat: 28.6271, lng: 77.3649 }, 'Noida Sector 62')
    } else if (city.includes('gurgaon') || city.includes('gurugram')) {
      setLocation({ lat: 28.4946, lng: 77.0882 }, 'Gurugram Cyber City')
    }
    if (!navigator.geolocation) return undefined
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (useLifeRouteStore.getState().locationLocked) return
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 'Your location')
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 120000 },
    )
    return undefined
  }, [setLocation])

  const wearable = profile.wearable
  const vitals = profile.vitals
  const contacts = profile.emergencyContacts

  useEffect(() => {
    if (wearable?.status !== 'connected' || !vitalsAreCritical(vitals)) {
      wearableLock.current = false
      familyNotified.current = false
      return undefined
    }
    if (wearableLock.current) return undefined
    if (Date.now() - (wearable.lastAlertAt || 0) < 45000) return undefined
    wearableLock.current = true
    const reasons = criticalVitalReasons(vitals)
    setWearable({ lastAlertAt: Date.now() })
    setSafetyReasons(reasons)
    setSafetyStage('ask')
    logSafety({ title: 'Watch noticed something unusual', detail: reasons.join('. ') })
    return undefined
  }, [wearable?.status, wearable?.lastAlertAt, vitals, setWearable, logSafety])

  const trustedFamily = (contacts || []).find((row) => row.canEmergency !== false) || contacts?.[0]

  const notifyFamily = useCallback(() => {
    if (familyNotified.current) {
      setSafetyStage('family')
      return
    }
    familyNotified.current = true
    const person = useProfileStore.getState().profile.emergencyContacts.find((row) => row.canEmergency !== false)
      || useProfileStore.getState().profile.emergencyContacts[0]
    logSafety({
      title: 'Family notified',
      detail: person?.name
        ? `${person.name} has been notified.`
        : 'Add a family phone number in Family.',
    })
    setSafetyStage('family')
  }, [logSafety])

  const closeEmergency = () => {
    resetSession()
    setShowDetails(false)
    navigate(PATHS.home)
  }

  return (
    <SathiShell onHelp={() => startEmergency({ source: 'senior', input: 'I need help' })} wide={pathname.startsWith(PATHS.emergency)}>
      <SpeechOverlay
        visible={isListening || isTranscribing}
        hint={isTranscribing ? 'I am listening…' : 'Tap the microphone again when you finish speaking'}
      />
      {(error || emergencyError) && pathname !== PATHS.talk && pathname !== PATHS.home && pathname !== PATHS.emergency && (
        <p className="sathi-error">{error || emergencyError}</p>
      )}
      <Outlet
        context={{
          handleTalk,
          startEmergency,
          closeEmergency,
          draft,
          setDraft,
          busy: busy || isTranscribing,
          error,
          listening: isListening,
          mic: () => (isListening ? stop() : start()),
          showDetails,
          setShowDetails,
        }}
      />
      <SafetyCheckModal
        open={Boolean(safetyStage)}
        stage={safetyStage}
        reasons={safetyReasons}
        family={trustedFamily}
        onFine={() => {
          logSafety({ title: 'You said you are fine', detail: 'No emergency was started.' })
          setSafetyStage('')
        }}
        onHelp={() => startEmergency({
          source: 'wearable',
          input: `Watch alert: ${(safetyReasons || []).join(', ') || 'unusual readings'}`,
        })}
        onNotifyFamily={notifyFamily}
        onEscalate={() => startEmergency({
          source: 'wearable',
          requestedBy: trustedFamily?.name || 'watch',
          input: `Escalated watch alert after family notice: ${(safetyReasons || []).join(', ')}`,
        })}
        onDismiss={() => setSafetyStage('')}
      />
    </SathiShell>
  )
}
