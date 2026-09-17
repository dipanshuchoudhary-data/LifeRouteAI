import { useMemo, useState } from 'react'
import {
  Ambulance, ArrowRight, MapPin, Phone, ShieldCheck, UserRound, Wifi,
} from 'lucide-react'
import { CHIPS, ESI_STAGES } from '../../data/liferouteData'
import VoiceInputPill from '../triage/components/VoiceInputPill'
import useLiveFacilities from '../../hooks/useLiveFacilities'
import { useLifeRouteStore } from '../../stores/useLifeRouteStore'
import { useProfileStore } from '../../stores/useProfileStore'

const HOME_CHIPS = [
  CHIPS[0],
  CHIPS[1],
  CHIPS[2],
  { ...CHIPS[4], label: 'Breathing Difficulty' },
]

function chartGaps(profile) {
  const gaps = []
  if (!profile?.name?.trim()) gaps.push('Name')
  if (!profile?.age) gaps.push('Age')
  if (!profile?.bloodType) gaps.push('Blood type')
  if (!(profile?.emergencyContacts || []).some((row) => row.phone)) gaps.push('Emergency contact')
  if (!(profile?.allergies || []).length) gaps.push('Allergies')
  if (!(profile?.conditions || []).length) gaps.push('Conditions')
  if (!(profile?.medications || []).length) gaps.push('Medications')
  return gaps
}

function distanceValue(hospital) {
  const minutes = Number(hospital?.travelMinutes)
  if (Number.isFinite(minutes)) return minutes
  const parsed = parseFloat(String(hospital?.distance || '').replace(/[^\d.]/g, ''))
  return Number.isFinite(parsed) ? parsed : 999
}

function relativeTime(date) {
  if (!date) return 'just now'
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000))
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds} sec ago`
  const minutes = Math.round(seconds / 60)
  return `${minutes} min ago`
}

function incidentTitle(result, query) {
  const text = (query || result?.assessment || '').trim()
  if (!text) return result?.isEmergency ? 'Critical emergency' : 'Active case'
  return text.length > 52 ? `${text.slice(0, 52)}…` : text
}

function incidentStatus(result) {
  const esi = result?.esiLevel
  if (esi === 1) return 'Ambulance en route'
  if (esi === 2) return 'Emergency ER match'
  if (esi === 3) return 'Urgent hospital match'
  if (esi === 4) return 'Clinic match ready'
  if (esi === 5) return 'Self-care plan'
  return result?.isEmergency ? 'Ambulance en route' : 'Care match ready'
}

export default function OpsHome({
  searchQuery,
  onQueryChange,
  onSubmit,
  onChip,
  onMic,
  isListening,
  isTranscribing,
  micLevel,
  isBusy,
  language,
  onNavigate,
  onOpenCase,
  askStage,
  onChooseEsi,
}) {
  const hindi = language === 'hi'
  const [focused, setFocused] = useState(false)
  const origin = useLifeRouteStore((s) => s.location)
  const result = useLifeRouteStore((s) => s.result)
  const status = useLifeRouteStore((s) => s.status)
  const { hospitals, ambulances, live, updatedAt, tick } = useLiveFacilities(origin)
  const profile = useProfileStore((s) => s.profile)
  const wearable = profile.wearable
  const city = profile.city
  const updatedLabel = useMemo(() => relativeTime(updatedAt), [updatedAt, tick])
  const gaps = useMemo(() => chartGaps(profile), [profile])
  const nearestHospital = useMemo(
    () => [...hospitals].sort((a, b) => distanceValue(a) - distanceValue(b))[0],
    [hospitals],
  )
  const nearestUnit = useMemo(
    () => ambulances.find((row) => row.status === 'available' && row.type === 'ALS')
      || ambulances.find((row) => row.status === 'available')
      || ambulances[0],
    [ambulances],
  )
  const family = (profile.emergencyContacts || []).find((row) => row.phone) || profile.emergencyContacts?.[0]

  const matching = status === 'streaming' || (status === 'emergency' && !result)
  const hospital = result?.matchedHospital
  const place = hospital?.city || city || 'Delhi NCR'
  const eta = result?.route?.duration || result?.ambulance?.eta || '—'
  const accepted = hospital ? !hospital.divert : false
  const critical = Boolean(result?.isEmergency) || result?.esiLevel === 1
  const queryText = searchQuery || ''
  const activeCount = result ? 1 : matching ? 1 : 0

  const statusLines = useMemo(() => ([
    { ok: live, label: live ? 'Emergency network connected' : 'Emergency network reconnecting' },
    { ok: hospitals.length > 0, label: hospitals.length ? 'Hospital network online' : 'Hospital network unavailable' },
    { ok: live, label: live ? 'Ambulance telemetry live' : 'Ambulance telemetry cached' },
    wearable?.status === 'connected' ? { ok: true, label: `Wearable connected · ${wearable.deviceName}` } : null,
  ].filter(Boolean)), [live, hospitals.length, wearable?.status, wearable?.deviceName])

  return (
    <div className="ops-home">
      <section className="ops-home-hero ops-card">
        <h2>{hindi ? 'हम कैसे मदद करें?' : 'How can we help?'}</h2>
        <p className="ops-muted">
          {hindi
            ? 'आपातकाल बताएं। LifeRoute सही एम्बुलेंस और अस्पताल ढूँढेगा।'
            : 'Describe the emergency and LifeRoute will identify the appropriate ambulance and hospital.'}
        </p>

        <div className={`ops-intake-wrap lr-search-wrap ${focused ? 'focused' : ''}`}>
          <VoiceInputPill active={isListening} transcribing={isTranscribing} level={micLevel} onClick={onMic} disabled={isBusy && !isListening} />
          <div className="ops-intake">
            <input
              value={queryText}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              placeholder={hindi ? 'आपातकाल बताएं… छाती दर्द, एक्सीडेंट, बेहोशी' : 'Describe the emergency… e.g. chest pain, accident, unconscious'}
              aria-label="Describe the emergency"
            />
            <button className="ops-btn" type="button" onClick={onSubmit} disabled={isBusy || !queryText.trim()}>
              Find care <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {(isListening || isTranscribing) && (
          <p className="ops-muted" style={{ marginTop: 8 }}>
            {isListening ? 'Listening — tap the mic when you finish' : 'Transcribing…'}
          </p>
        )}

        <div className="ops-chips ops-home-chips">
          {HOME_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              className="ops-chip"
              onClick={() => onChip({ ...chip, query: hindi && chip.hiQuery ? chip.hiQuery : chip.query })}
            >
              <chip.icon size={14} /> {hindi ? chip.hiLabel : chip.label}
            </button>
          ))}
        </div>

        {askStage && (
          <div className="ops-esi-ask">
            <h3>How serious is this?</h3>
            <p className="ops-muted">E1 and E2 open live maps, family calling, and route status. E3–E5 stay here with a care match.</p>
            <div className="ops-esi-grid">
              {ESI_STAGES.map((stage) => (
                <button
                  key={stage.level}
                  type="button"
                  className={`ops-esi-option esi-${stage.level}`}
                  onClick={() => onChooseEsi(stage.level)}
                  disabled={isBusy}
                >
                  <strong>{stage.code}</strong>
                  <span>{stage.label}</span>
                  <em>{stage.hint}</em>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="ops-card ops-home-incidents">
        <div className="ops-home-card-head">
          <h3>Active emergencies</h3>
          <div className="ops-home-counts">
            <span className="ops-pill info">{activeCount} Active</span>
            {critical && <span className="ops-pill crit">1 Critical</span>}
          </div>
        </div>

        {matching && !result && (
          <button type="button" className="ops-incident" disabled>
            <strong>Matching in progress</strong>
            <span>{place}</span>
            <span>Hospital matching</span>
            <span>ETA —</span>
          </button>
        )}

        {result ? (
          <button type="button" className={`ops-incident ${critical ? 'crit' : ''}`} onClick={onOpenCase}>
            <strong>{incidentTitle(result, searchQuery)}</strong>
            <span>{place}</span>
            <span>{incidentStatus(result)}</span>
            {result.esiLevel ? <span>ESI {result.esiLevel}</span> : null}
            <span>ETA {eta}</span>
            <span className={accepted ? 'ops-ok' : 'ops-bad'}>
              {result.esiLevel <= 2
                ? (accepted ? 'Hospital accepted' : 'Hospital divert — alternate ready')
                : result.esiLevel === 5
                  ? 'Home care first · clinic if needed'
                  : 'Facility match ready'}
            </span>
          </button>
        ) : !matching && (
          <div className="ops-home-empty">
            <ShieldCheck size={22} />
            <p>No active emergencies</p>
            <span>LifeRoute is ready when you need it.</span>
          </div>
        )}

        <button type="button" className="ops-home-link" onClick={() => onNavigate('ops')}>
          View all emergencies <ArrowRight size={14} />
        </button>
      </section>

      <section className="ops-card ops-home-status">
        <h3>LifeRoute status</h3>
        <ul>
          {statusLines.map((line) => (
            <li key={line.label}>
              <i className={line.ok ? 'ok' : 'warn'} />
              {line.label}
            </li>
          ))}
        </ul>
        <p className="ops-muted ops-home-updated">
          <Wifi size={12} /> Last updated {updatedLabel}
        </p>
      </section>

      <section className="ops-home-quick">
        <h3>{hindi ? 'आपात तैयारी' : 'Ready for emergency'}</h3>
        <div className="ops-home-quick-grid">
          <button
            type="button"
            className={`ops-card ops-quick-link ${gaps.length ? 'warn' : 'ok'}`}
            onClick={() => onNavigate('profile')}
          >
            <UserRound size={18} />
            <strong>
              {gaps.length
                ? (hindi ? `${gaps.length} फ़ील्ड अधूरी` : `${gaps.length} chart fields missing`)
                : (hindi ? 'मेडिकल चार्ट तैयार' : 'Medical chart ready')}
            </strong>
            <span>
              {gaps.length
                ? gaps.slice(0, 4).join(' · ')
                : (hindi ? 'ब्लड ग्रुप, संपर्क और एलर्जी दर्ज हैं' : 'Blood type, contacts, and allergies are on file')}
            </span>
          </button>

          <button type="button" className="ops-card ops-quick-link" onClick={() => onNavigate('hospitals')}>
            <MapPin size={18} />
            <strong>{nearestHospital?.name || (hindi ? 'निकटतम अस्पताल' : 'Nearest hospital')}</strong>
            <span>
              {nearestHospital
                ? `${nearestHospital.distance || nearestHospital.city} · wait ${nearestHospital.wait || '—'}`
                : (hindi ? 'आसपास के अस्पताल देखें' : 'Open nearby hospitals')}
            </span>
          </button>

          <a className="ops-card ops-quick-link" href="tel:108">
            <Ambulance size={18} />
            <strong>
              {nearestUnit
                ? `${nearestUnit.callSign} · ${nearestUnit.eta}`
                : (hindi ? '108 कॉल करें' : 'Call 108')}
            </strong>
            <span>
              {nearestUnit
                ? `${nearestUnit.type === 'ALS' ? 'Advanced Life Support' : 'Basic Life Support'} · ${hindi ? '108 डायल करें' : 'National ambulance line'}`
                : (hindi ? 'राष्ट्रीय एम्बुलेंस' : 'National ambulance dispatch')}
            </span>
          </a>

          {family?.phone ? (
            <a className="ops-card ops-quick-link ok" href={`tel:${String(family.phone).replace(/\s/g, '')}`}>
              <Phone size={18} />
              <strong>{family.name || (hindi ? 'परिवार' : 'Family contact')}</strong>
              <span>{[family.relation, family.phone].filter(Boolean).join(' · ')}</span>
            </a>
          ) : (
            <button type="button" className="ops-card ops-quick-link warn" onClick={() => onNavigate('profile')}>
              <Phone size={18} />
              <strong>{hindi ? 'आपातकालीन संपर्क जोड़ें' : 'Add emergency contact'}</strong>
              <span>{hindi ? 'परिवार को कॉल करने के लिए नंबर चाहिए' : 'Needed so LifeRoute can call family during an emergency'}</span>
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
