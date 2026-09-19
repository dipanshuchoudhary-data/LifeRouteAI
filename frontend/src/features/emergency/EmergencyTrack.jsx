import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Navigation, Phone } from 'lucide-react'
import FacilityMap from '../maps/FacilityMap'
import { useLifeRouteStore } from '../../stores/useLifeRouteStore'
import { useProfileStore } from '../../stores/useProfileStore'
import useLiveFacilities from '../../hooks/useLiveFacilities'
import { INCIDENT_STAGES, STAGE_MS, incidentClock } from '../../lib/incidentProgress'

function callState(index, tick) {
  if (tick < 1 + index) return 'Queued'
  if (tick < 3 + index) return 'Calling'
  if (tick < 5 + index) return 'Ringing'
  return 'Connected'
}

function clock(base, plusMs) {
  return new Date(base + plusMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function placeLabel(origin, city) {
  if (city) return city
  const lat = Number(origin?.lat)
  const lng = Number(origin?.lng)
  if (Number.isFinite(lat) && Math.abs(lat - 28.6139) < 0.02 && Math.abs(lng - 77.209) < 0.02) {
    return 'Connaught Place, New Delhi'
  }
  if (Number.isFinite(lat) && Number.isFinite(lng)) return `${lat.toFixed(3)}° N, ${lng.toFixed(3)}° E`
  return 'Delhi NCR'
}

function Flag({ tone = '', children }) {
  return <span className={`ops-live-flag ${tone}`}>{children}</span>
}

export default function EmergencyTrack({ result, onBack, onOpenDetails, onNavigate }) {
  const origin = useLifeRouteStore((s) => s.location)
  const searchQuery = useLifeRouteStore((s) => s.searchQuery)
  const esiLevel = useLifeRouteStore((s) => s.esiLevel)
  const sessionId = useLifeRouteStore((s) => s.sessionId)
  const profile = useProfileStore((s) => s.profile)
  const contacts = profile.emergencyContacts || []
  const { hospitals, ambulances } = useLiveFacilities(origin)
  const [elapsed, setElapsed] = useState(0)
  const [tick, setTick] = useState(0)
  const startedAt = useRef(0)

  useEffect(() => {
    startedAt.current = Date.now()
    const doneAt = STAGE_MS * INCIDENT_STAGES.length + 200
    const clockId = setInterval(() => {
      const next = Date.now() - startedAt.current
      setElapsed(next)
      if (next >= doneAt) clearInterval(clockId)
    }, 200)
    const callId = setInterval(() => setTick((n) => n + 1), 1400)
    return () => {
      clearInterval(clockId)
      clearInterval(callId)
    }
  }, [])

  const progress = incidentClock(elapsed)
  const hospital = result?.matchedHospital
  const unit = result?.ambulance || ambulances.find((row) => row.status === 'en-route' || row.status === 'assigned') || ambulances[0]
  const esi = result?.esiLevel || esiLevel || 1
  const critical = esi <= 2
  const family = useMemo(
    () => contacts.filter((row) => row.name || row.phone),
    [contacts],
  )
  const diverted = Boolean(hospital?.divert)
  const assigned = progress.assigned && Boolean(unit)
  const hospitalReady = progress.hospitalReady && Boolean(hospital)
  const accepted = hospitalReady && !diverted
  const routing = progress.routing
  const routeReady = progress.routeProgress >= 1
  const patientName = profile.name?.trim() || 'Unknown identity'
  const patientMeta = [profile.sex, profile.age ? `~${profile.age} years` : null].filter(Boolean).join(' · ') || 'Identity not on file'
  const location = placeLabel(origin, profile.city)
  const facilityEta = routeReady
    ? (result?.route?.duration || (hospital?.travelMinutes ? `${hospital.travelMinutes} min` : '—'))
    : routing
      ? 'Calculating'
      : '—'
  const ambStatus = routeReady ? 'En route' : assigned ? 'Assigned' : 'Matching'
  const caseId = sessionId ? `ESI-${esi} · ${sessionId.slice(0, 8).toUpperCase()}` : `ESI-${esi}`
  const tags = (hospital?.tags || []).join(' ').toLowerCase()
  const traumaOk = /trauma|emergency|er/.test(tags) || esi <= 2
  const icuOk = (hospital?.icuFree ?? hospital?.beds ?? 0) > 0
  const liveHospitals = (result?.rankedHospitals?.length ? result.rankedHospitals : hospitals).slice(0, 10)

  return (
    <div className={`ops-live${critical ? ' is-critical' : ''}`}>
      <header className="ops-live-head">
        {onBack ? (
          <button type="button" className="ops-btn-ghost" onClick={onBack}>← Home</button>
        ) : null}
        <div className="ops-live-head-main">
          <div className="ops-live-head-meta">
            <span className="ops-live-kicker">{esi <= 1 ? 'Critical emergency' : esi === 2 ? 'Emergency' : 'Active incident'}</span>
            <span className="ops-live-pulse"><i /> LIVE</span>
            <span className="ops-live-id">{caseId}</span>
          </div>
          <h1>{searchQuery || result?.assessment || 'Emergency case'}</h1>
        </div>
        <a className="ops-sos ops-live-sos" href="tel:108"><Phone size={14} /> Call 108</a>
      </header>

      {diverted && hospitalReady && (
        <div className="ops-live-alert" role="status">
          Hospital divert — alternate facility is ready.
        </div>
      )}

      <section className="ops-live-map-frame" aria-label="Live route map">
        <FacilityMap
          origin={origin}
          hospitals={liveHospitals}
          ambulances={ambulances.slice(0, 6)}
          selectedId={hospitalReady ? hospital?.id : undefined}
          heightClass="ops-live-map-canvas"
          basemap="roads"
          originLabel="Patient"
          destination={hospitalReady ? hospital : null}
          routeProgress={progress.routeProgress}
        />
        <div className="ops-live-legend">
          <span><i className="pt" /> Patient</span>
          <span><i className="amb" /> Ambulance</span>
          <span><i className="er" /> Hospital</span>
        </div>
        <div className="ops-live-hud">
          <span>
            {routeReady
              ? 'Live route ready'
              : routing
                ? 'Calculating live route…'
                : hospitalReady
                  ? 'Matching corridor'
                  : 'Locating nearby hospitals'}
          </span>
          {routeReady ? <strong>{result?.route?.duration || facilityEta}</strong> : null}
        </div>
      </section>

      <aside className="ops-live-summary">
        <p className="ops-live-panel-kicker">Emergency</p>
        <div className="ops-live-row">
          <span className="ops-live-label">Patient</span>
          <strong>{patientName}</strong>
          <p className="ops-live-meta">{patientMeta}</p>
        </div>
        <div className="ops-live-row">
          <span className="ops-live-label">Location</span>
          <strong>{location}</strong>
        </div>
        <div className="ops-live-row">
          <span className="ops-live-label">Ambulance</span>
          <strong>{assigned ? (unit?.callSign || 'Matching unit') : 'Matching unit'}</strong>
          <p className="ops-live-meta">{assigned ? `${ambStatus} · ETA ${unit?.eta || '—'}` : 'Nearest ALS being assigned'}</p>
          <Flag tone={assigned ? 'ok' : 'warn'}>{ambStatus}</Flag>
        </div>
        <div className="ops-live-row">
          <span className="ops-live-label">Hospital</span>
          <strong>{hospitalReady ? hospital.name : 'Matching facility'}</strong>
          <p className="ops-live-meta">{hospitalReady ? hospital.city : 'Trauma-capable ER'}</p>
          <Flag tone={accepted ? 'ok' : diverted && hospitalReady ? 'warn' : 'muted'}>
            {accepted ? 'Accepted' : diverted && hospitalReady ? 'Divert' : 'Matching'}
          </Flag>
        </div>
        <div className="ops-live-row ops-live-row-eta">
          <span className="ops-live-label">Facility ETA</span>
          <strong className="ops-live-eta">{facilityEta}</strong>
          <p className="ops-live-meta">{progress.hint}</p>
        </div>
      </aside>

      <section className="ops-live-progress" aria-label="Incident progress">
        <div className="ops-live-progress-head">
          <p className="ops-live-panel-kicker">Incident progress</p>
          <span>{progress.hint}</span>
        </div>
        <ol className="ops-live-steps">
          {INCIDENT_STAGES.map((stage, index) => {
            const state = index < progress.index ? 'done' : index === progress.index ? 'active' : ''
            const stamp = index < progress.index || (index === progress.index && index < INCIDENT_STAGES.length - 1)
              ? clock(startedAt.current, index * STAGE_MS)
              : index === progress.index
                ? 'Now'
                : '—'
            return (
              <li key={stage.id} className={state}>
                <i>{state === 'done' ? <Check size={11} /> : null}</i>
                <strong>{stage.label}</strong>
                <span>{stamp}</span>
              </li>
            )
          })}
        </ol>
      </section>

      <article className="ops-live-panel ops-live-amb">
        <p className="ops-live-panel-kicker">Ambulance</p>
        {assigned ? (
          <>
            <h2>{unit.callSign}</h2>
            <p className="ops-live-meta">{unit.type === 'ALS' ? 'Advanced Life Support' : 'Basic Life Support'}</p>
            <Flag tone={routeReady ? 'ok' : 'warn'}>{ambStatus}</Flag>
            <div className="ops-live-metrics">
              <div>
                <span>ETA to patient</span>
                <b>{unit.eta}</b>
              </div>
              <div>
                <span>Distance</span>
                <b>{unit.distance}</b>
              </div>
            </div>
            <p className="ops-live-soft">{unit.driver ? `Paramedic ${unit.driver}` : 'Crew assigned'}</p>
            {unit.phone && unit.phone !== '108' && (
              <a className="ops-live-link" href={`tel:${unit.phone}`}>Call unit</a>
            )}
          </>
        ) : (
          <p className="ops-live-meta">Matching the nearest ALS unit.</p>
        )}
      </article>

      <article className="ops-live-panel ops-live-dest">
        <p className="ops-live-panel-kicker">Destination</p>
        {hospitalReady ? (
          <>
            <h2>{hospital.name}</h2>
            <Flag tone={accepted ? 'ok' : 'warn'}>{accepted ? 'Hospital accepted' : diverted ? 'Divert — alternate ready' : 'Confirming'}</Flag>
            <div className="ops-live-metrics">
              <div>
                <span>ETA</span>
                <b>{facilityEta}</b>
              </div>
              <div>
                <span>Distance</span>
                <b>{routeReady ? (result?.route?.distance || hospital.distance || '—') : '—'}</b>
              </div>
              <div>
                <span>Traffic</span>
                <b>{routeReady ? (result?.route?.traffic || 'Live') : 'Reading'}</b>
              </div>
            </div>
            <p className="ops-live-soft">{routeReady ? (result?.route?.via || 'Fastest live corridor') : 'Building the driving path'}</p>
            <div className="ops-live-match">
              <span className={traumaOk ? 'ok' : ''}>Trauma {traumaOk ? '✓' : '—'}</span>
              <span className={icuOk ? 'ok' : ''}>ICU {icuOk ? '✓' : '—'}</span>
              <span className={accepted ? 'ok' : ''}>Acceptance {accepted ? '✓' : '—'}</span>
            </div>
            <div className="ops-live-links">
              {hospital.mapsUrl || hospital.lat ? (
                <a
                  className="ops-live-link"
                  href={hospital.mapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation size={12} /> Open maps
                </a>
              ) : null}
              {hospital.contact ? <a className="ops-live-link" href={`tel:${hospital.contact}`}>Call facility</a> : null}
              {onOpenDetails && routeReady ? (
                <button type="button" className="ops-live-link" onClick={onOpenDetails}>Full referral</button>
              ) : null}
            </div>
          </>
        ) : (
          <p className="ops-live-meta">Finding a capable facility for this ESI.</p>
        )}
      </article>

      <article className="ops-live-panel ops-live-coord">
        <p className="ops-live-panel-kicker">Coordination</p>
        <ul className="ops-live-calls">
          <li>
            <div>
              <strong>108 Emergency</strong>
              <span>National ambulance</span>
            </div>
            <Flag tone={tick >= 5 ? 'ok' : 'warn'}>{callState(0, tick)}</Flag>
          </li>
          {family.length ? family.slice(0, 2).map((person, index) => (
            <li key={person.id || person.phone || person.name}>
              <div>
                <strong>{person.name || 'Family member'}</strong>
                <span>{person.relation || 'Contact'}</span>
              </div>
              {person.phone ? (
                <a className="ops-live-flag warn" href={`tel:${String(person.phone).replace(/\s/g, '')}`}>
                  {callState(index + 1, tick)}
                </a>
              ) : (
                <Flag>No number</Flag>
              )}
            </li>
          )) : (
            <li>
              <div>
                <strong>Family contact</strong>
                <span>Not configured</span>
              </div>
            </li>
          )}
        </ul>
        {onNavigate ? (
          <button type="button" className="ops-live-link" onClick={() => onNavigate('profile')}>
            Manage contacts
          </button>
        ) : null}
      </article>
    </div>
  )
}
