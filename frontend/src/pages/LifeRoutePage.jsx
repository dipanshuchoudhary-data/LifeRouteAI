import { useEffect, useRef, useState } from 'react'
import { useLifeRouteStore } from '../stores/useLifeRouteStore'
import { criticalVitalReasons, useProfileStore, vitalsAreCritical } from '../stores/useProfileStore'
import { useAudioCapture } from '../features/triage/hooks/useAudioCapture'
import AppShell from '../features/layout/AppShell'
import OpsHome from '../features/ops/OpsHome'
import ProcessingOverlay from '../features/triage/components/ProcessingOverlay'
import SpeechOverlay from '../features/triage/components/SpeechOverlay'
import TriageResults from '../features/triage/components/TriageResults'
import EmergencyTakeoverModal from '../features/emergency/components/EmergencyTakeoverModal'
import EmergencyTrack from '../features/emergency/EmergencyTrack'
import WearableDispatchModal from '../features/wearable/WearableDispatchModal'
import NearbyHospitals from '../features/hospitals/components/NearbyHospitals'
import AmbulancePanel from '../features/hospitals/components/AmbulancePanel'
import BloodBankPanel from '../features/hospitals/components/BloodBankPanel'
import IcuTracker from '../features/hospitals/components/IcuTracker'
import MedicalProfile from '../features/profile/MedicalProfile'
import LiveCommandCenter from '../features/ops/LiveCommandCenter'
import SettingsPanel from '../features/settings/SettingsPanel'
import AssistantWidget from '../components/AssistantWidget'
import { apiBase } from '../lib/api'
import useLiveFacilities from '../hooks/useLiveFacilities'

export default function LifeRoutePage() {
  const [activeTab, setActiveTab] = useState('home')
  const [takeoverDismissed, setTakeoverDismissed] = useState(false)
  const [wearableAlert, setWearableAlert] = useState(null)
  const [caseOpen, setCaseOpen] = useState(false)
  const [showFullResults, setShowFullResults] = useState(false)
  const [askStage, setAskStage] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const [language, setLanguage] = useState('en')
  const [menuOpen, setMenuOpen] = useState(false)
  const wearableLock = useRef(false)

  const searchQuery = useLifeRouteStore((s) => s.searchQuery)
  const setSearchQuery = useLifeRouteStore((s) => s.setSearchQuery)
  const setLocation = useLifeRouteStore((s) => s.setLocation)
  const submitMessage = useLifeRouteStore((s) => s.submitMessage)
  const triggerSOS = useLifeRouteStore((s) => s.triggerSOS)
  const resetSession = useLifeRouteStore((s) => s.resetSession)
  const status = useLifeRouteStore((s) => s.status)
  const activeNode = useLifeRouteStore((s) => s.activeNode)
  const result = useLifeRouteStore((s) => s.result)
  const rawState = useLifeRouteStore((s) => s.rawState)
  const error = useLifeRouteStore((s) => s.error)
  const isEmergency = useLifeRouteStore((s) => s.isEmergency)
  const esiLevel = useLifeRouteStore((s) => s.esiLevel)
  const location = useLifeRouteStore((s) => s.location)
  const { live } = useLiveFacilities(location)

  const wearable = useProfileStore((s) => s.profile.wearable)
  const vitals = useProfileStore((s) => s.profile.vitals)
  const contacts = useProfileStore((s) => s.profile.emergencyContacts)
  const setWearable = useProfileStore((s) => s.setWearable)

  const { isListening, isTranscribing, level, start, stop } = useAudioCapture({
    language,
    onTranscript: (text) => {
      setVoiceError('')
      setSearchQuery(text)
      setAskStage(true)
      setTakeoverDismissed(true)
      setActiveTab('home')
      setCaseOpen(false)
    },
    onError: setVoiceError,
  })

  useEffect(() => {
    if (!navigator.geolocation) return undefined
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 120000 },
    )
    return undefined
  }, [setLocation])

  useEffect(() => {
    if (wearable?.status !== 'connected' || !vitalsAreCritical(vitals)) {
      wearableLock.current = false
      return undefined
    }
    if (wearableLock.current) return undefined
    if (Date.now() - (wearable.lastAlertAt || 0) < 45000) return undefined
    wearableLock.current = true
    const family = (contacts || []).find((row) => row.phone) || contacts?.[0]
    const reasons = criticalVitalReasons(vitals)
    setWearable({ lastAlertAt: Date.now() })
    setSearchQuery(`Wearable emergency: ${reasons.join(', ') || 'critical vitals'}`)
    setTakeoverDismissed(true)
    setActiveTab('home')
    setWearableAlert({ family, reasons })
    setCaseOpen(true)
    triggerSOS()
    return undefined
  }, [wearable?.status, wearable?.lastAlertAt, vitals, contacts, setWearable, setSearchQuery, triggerSOS])

  const busy = status === 'streaming' || isTranscribing
  const showTakeover = isEmergency && esiLevel === 1 && !takeoverDismissed && !wearableAlert

  const beginCare = (text) => {
    const typed = (text || '').trim()
    if (!typed) return
    setSearchQuery(typed)
    setAskStage(true)
    setCaseOpen(false)
    setTakeoverDismissed(true)
    setActiveTab('home')
  }

  const chooseEsi = (level) => {
    setAskStage(false)
    setActiveTab('home')
    if (level <= 2) {
      setTakeoverDismissed(true)
      setCaseOpen(true)
      setShowFullResults(false)
      if (level === 1) triggerSOS()
      else submitMessage(searchQuery, { esiLevel: level })
      return
    }
    setCaseOpen(false)
    setTakeoverDismissed(true)
    submitMessage(searchQuery, { esiLevel: level })
  }

  const runTriage = (text) => beginCare(text)

  const runSos = () => {
    setTakeoverDismissed(true)
    setAskStage(false)
    setShowFullResults(false)
    setCaseOpen(true)
    setActiveTab('home')
    triggerSOS()
  }

  const closeResults = () => {
    resetSession()
    setCaseOpen(false)
    setShowFullResults(false)
    setAskStage(false)
    setActiveTab('home')
  }

  const intake = {
    searchQuery,
    onQueryChange: setSearchQuery,
    onSubmit: () => runTriage(searchQuery),
    onChip: (chip) => {
      setSearchQuery(chip.query)
      runTriage(chip.query)
    },
    onMic: () => (isListening ? stop() : start()),
    isListening,
    isTranscribing,
    micLevel: level,
    isBusy: busy,
    language,
    hasResult: Boolean(result),
    onNewSearch: closeResults,
    onNavigate: setActiveTab,
    onOpenCase: () => {
      setCaseOpen(true)
      setShowFullResults((result?.esiLevel || esiLevel) > 2)
    },
    askStage,
    onChooseEsi: chooseEsi,
  }

  return (
    <div className="lr-page">
      <AppShell
        activeNavLink={activeTab}
        onNavigate={setActiveTab}
        onSos={runSos}
        live={live}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      >
        {(error || voiceError) && <p className="lr-inline-error">{error || voiceError}</p>}
        <SpeechOverlay
          visible={isListening || isTranscribing}
          hint={isTranscribing ? 'Transcribing speech…' : 'Tap the mic again when you finish speaking'}
        />
        {busy && !caseOpen && <ProcessingOverlay activeNode={activeNode} />}
        <EmergencyTakeoverModal
          open={showTakeover && isEmergency}
          result={result}
          onContinue={() => {
            setTakeoverDismissed(true)
            setCaseOpen(true)
          }}
          onDismiss={() => setTakeoverDismissed(true)}
        />
        <WearableDispatchModal
          open={Boolean(wearableAlert)}
          alert={wearableAlert}
          onDismiss={() => setWearableAlert(null)}
        />

        {activeTab === 'home' && (
          caseOpen ? (
            showFullResults && result ? (
              <div className="ops-case-view">
                <button type="button" className="ops-btn-ghost ops-case-back" onClick={() => setShowFullResults(false)}>
                  ← Live tracking
                </button>
                <TriageResults result={result} rawState={rawState} onClose={closeResults} />
              </div>
            ) : (
              <EmergencyTrack
                result={result}
                onBack={() => { setCaseOpen(false); setShowFullResults(false) }}
                onOpenDetails={() => setShowFullResults(true)}
                onNavigate={setActiveTab}
              />
            )
          ) : (
            <OpsHome {...intake} />
          )
        )}
        {activeTab === 'profile' && <MedicalProfile activeNode={activeNode} />}
        {activeTab === 'ops' && (
          (caseOpen || status === 'emergency' || (result && ((result.esiLevel || esiLevel || 9) <= 2 || isEmergency))) ? (
            <EmergencyTrack
              result={result}
              onBack={() => setActiveTab('home')}
              onOpenDetails={() => { setCaseOpen(true); setShowFullResults(true); setActiveTab('home') }}
              onNavigate={setActiveTab}
            />
          ) : (
            <LiveCommandCenter onNavigate={setActiveTab} />
          )
        )}
        {activeTab === 'hospitals' && <NearbyHospitals />}
        {activeTab === 'ambulance' && <AmbulancePanel />}
        {activeTab === 'blood' && <BloodBankPanel />}
        {activeTab === 'icu' && <IcuTracker />}
        {activeTab === 'settings' && <SettingsPanel language={language} onLanguageChange={setLanguage} />}
      </AppShell>
      <AssistantWidget apiUrl={apiBase()} />
    </div>
  )
}
