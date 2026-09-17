import {
  Activity, AlertTriangle, CheckCircle2, MapPin, Navigation, Phone, PhoneCall,
  Shield, Siren, Star, Truck, X,
} from 'lucide-react'
import { ESI_LEGEND } from '../../../data/liferouteData'
import { getWaitColor, getCapacityColor } from '../../../lib/triageAdapters'
import UrgencyBadge from './UrgencyBadge'
import RankedMatches from '../../hospitals/components/RankedMatches'
import ReferralSummary from '../../referral/components/ReferralSummary'
import RouteFinderMap from '../../maps/RouteFinderMap'
import { useLifeRouteStore } from '../../../stores/useLifeRouteStore'

export default function TriageResults({ result, rawState, onClose, resultRef }) {
  const origin = useLifeRouteStore((s) => s.location)
  if (!result) return null
  const hospital = result.matchedHospital
  const alternate = result.rankedHospitals?.find((row) => row.id !== hospital.id) || result.rankedHospitals?.[1]
  return (
    <div className="lr-results-section" ref={resultRef}>
      <div className="lr-results-header">
        <div>
          <h2 className="lr-section-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={22} style={{ color: result.triageColor }} />
            {result.isEmergency ? 'Emergency Response Active' : 'Care routing complete'}
          </h2>
          <p className="lr-section-sub">
            {result.isEmergency
              ? `Tier-0 sentinel intercepted before the LLM${result.sentinelMs != null ? ` (${Number(result.sentinelMs).toFixed(2)} ms)` : ''}. Call 108.`
              : `ESI-grounded match · language ${result.language === 'hi' ? 'Hindi' : 'English'} · live telemetry.`}
          </p>
        </div>
        <button className="lr-close-btn" onClick={onClose} type="button" aria-label="Close results"><X size={20} /></button>
      </div>

      <RouteFinderMap origin={origin} hospital={hospital} alternate={alternate} visible />

      <div className="ops-grid-2" style={{ margin: '16px 0' }}>
        <article className="ops-card">
          <h3>AI routing decision</h3>
          <p style={{ fontSize: 16, fontWeight: 650, marginBottom: 8 }}>{hospital.name}</p>
          <ul className="ops-check">
            <li><span>Trauma / specialty fit</span><b className="ops-ok">Matched</b></li>
            <li><span>ICU available</span><b className={(hospital.icuFree ?? hospital.beds) > 0 ? 'ops-ok' : 'ops-bad'}>{(hospital.icuFree ?? hospital.beds) > 0 ? 'Yes' : 'Check'}</b></li>
            <li><span>Hospital acceptance</span><b className={hospital.divert ? 'ops-bad' : 'ops-ok'}>{hospital.divert ? 'Divert' : 'Confirmed open'}</b></li>
            <li><span>Estimated arrival</span><b>{result.route.duration}</b></li>
            <li><span>Traffic</span><b>{result.route.traffic || 'Live'}</b></li>
          </ul>
          <p className="ops-muted" style={{ marginTop: 10 }}>{result.matchReason}</p>
        </article>
        <div className="lr-routes">
          <div className="lr-route-option lr-route-best">
            <div className="lr-route-header">
              <span className="lr-route-badge-best">Recommended</span>
              <span className="lr-route-time">{result.route.duration}</span>
            </div>
            <div className="lr-route-detail"><Navigation size={14} /><span>{result.route.via}</span></div>
          </div>
          <div className="lr-route-option">
            <div className="lr-route-header">
              <span className="lr-route-badge-alt">Alternate</span>
              <span className="lr-route-time">{result.route.alternateTime}</span>
            </div>
            <div className="lr-route-detail"><Navigation size={14} /><span>{result.route.alternateVia}</span></div>
          </div>
          <a
            className="lr-call-btn"
            style={{ width: 'auto' }}
            href={hospital.mapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            <Navigation size={16} /> Start Navigation
          </a>
        </div>
      </div>

      <div className="lr-esi-ladder" aria-label="ESI level">
        {ESI_LEGEND.map((item) => (
          <div
            key={item.level}
            className={`lr-esi-step ${result.esiLevel === item.level ? 'active' : ''}`}
            style={{ borderColor: `${item.color}55`, color: item.color }}
          >
            <strong>ESI {item.level}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="lr-results-grid">
        <div className="lr-result-card lr-triage-card" style={{ borderColor: `${result.triageColor}40` }}>
          <div className="lr-result-card-header">
            <Shield size={18} style={{ color: result.triageColor }} />
            <span>Triage Assessment</span>
            <UrgencyBadge esiLevel={result.esiLevel} urgency={result.urgency} color={result.triageColor} label={result.triage} />
          </div>
          <p className="lr-result-desc">{result.assessment}</p>
          {result.vitals && Object.keys(result.vitals).length > 0 && (
            <div className="lr-mini-stats" style={{ marginTop: 12 }}>
              {result.vitals.heart_rate != null && <div><span className="lr-mini-num">{result.vitals.heart_rate}</span><span className="lr-mini-lbl">HR</span></div>}
              {result.vitals.oxygen_saturation != null && <div><span className="lr-mini-num">{result.vitals.oxygen_saturation}</span><span className="lr-mini-lbl">SpO₂</span></div>}
              {result.vitals.systolic_bp != null && <div><span className="lr-mini-num">{result.vitals.systolic_bp}/{result.vitals.diastolic_bp || '—'}</span><span className="lr-mini-lbl">BP</span></div>}
            </div>
          )}
          <div className="lr-actions-list">
            <h4>Immediate Actions:</h4>
            {result.actions.map((action) => (
              <div key={action} className="lr-action-item">
                <CheckCircle2 size={14} style={{ color: '#4DD4A0', flexShrink: 0 }} />
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lr-result-card">
          <div className="lr-result-card-header">
            <Activity size={18} style={{ color: '#4DD4A0' }} />
            <span>Best Matched Hospital</span>
          </div>
          <div className="lr-matched-hospital">
            <h3>
              {hospital.name}
              {hospital.govt && <span className="lr-govt-badge">Govt.</span>}
            </h3>
            <div className="lr-card-row2">
              <span><MapPin size={13} strokeWidth={1.5} /> {hospital.city}</span>
              <span className="lr-rating"><Star size={12} strokeWidth={1.5} fill="#FAC75A" /> {hospital.rating}</span>
              <span><Navigation size={13} /> {hospital.distance}</span>
            </div>
            <p className="lr-match-reason">{result.matchReason}</p>
            <div className="lr-mini-stats">
              <div><span className="lr-mini-num">{hospital.beds}</span><span className="lr-mini-lbl">Beds</span></div>
              <div><span className="lr-mini-num" style={{ color: getWaitColor(hospital.wait) }}>{hospital.wait}</span><span className="lr-mini-lbl">Wait</span></div>
              <div><span className="lr-mini-num" style={{ color: getCapacityColor(hospital.capacity) }}>{hospital.capacity}%</span><span className="lr-mini-lbl">Full</span></div>
            </div>
          </div>
          <a className="lr-call-btn" href={hospital.contact ? `tel:${hospital.contact}` : 'tel:108'}>
            <PhoneCall size={16} strokeWidth={2} /> Call Hospital Now
          </a>
        </div>

        <div className="lr-result-card">
          <div className="lr-result-card-header">
            <Siren size={18} style={{ color: '#FF8A9A' }} />
            <span>Ambulance Dispatch</span>
            <span className="lr-triage-badge" style={{ background: 'rgba(0,168,107,0.15)', color: '#4DD4A0', borderColor: 'rgba(0,168,107,0.30)' }}>
              {result.isEmergency ? 'DISPATCHING' : 'STANDBY'}
            </span>
          </div>
          <div className="lr-dispatch-info">
            <div className="lr-dispatch-row">
              <Truck size={16} style={{ color: '#7BA5F5' }} />
              <div>
                <strong>{result.ambulance.callSign}</strong>
                <span className="lr-dispatch-sub">{result.ambulance.type === 'ALS' ? 'Advanced Life Support' : 'Basic Life Support'} · {result.ambulance.driver}</span>
              </div>
            </div>
            <div className="lr-dispatch-stats">
              <div><span className="lr-mini-num" style={{ color: '#4DD4A0' }}>{result.ambulance.eta}</span><span className="lr-mini-lbl">ETA</span></div>
              <div><span className="lr-mini-num">{result.ambulance.distance}</span><span className="lr-mini-lbl">Away</span></div>
              <div><span className="lr-mini-num" style={{ color: '#7BA5F5' }}>{result.ambulance.type}</span><span className="lr-mini-lbl">Type</span></div>
            </div>
          </div>
          <a className="lr-call-btn" style={{ background: '#00A86B' }} href={`tel:${result.ambulance.phone || '108'}`}>
            <Phone size={16} /> Call Ambulance
          </a>
        </div>

        <ReferralSummary
          rawState={rawState}
          referralDoc={result.referralDoc}
          referralId={result.referralId}
          signature={result.signature}
          fhirBundle={result.fhirBundle}
        />
        <RankedMatches hospitals={result.rankedHospitals} />
      </div>
      {result.disclaimer ? <p className="lr-disclaimer">{result.disclaimer}</p> : null}
    </div>
  )
}
