import { useState } from 'react'
import { Phone, Radio, Siren } from 'lucide-react'
import FacilityMap from '../../maps/FacilityMap'
import useLiveFacilities from '../../../hooks/useLiveFacilities'
import { useLifeRouteStore } from '../../../stores/useLifeRouteStore'

const STATUSES = ['all', 'available', 'assigned', 'en-route', 'at-scene', 'transporting', 'offline']

export default function AmbulancePanel() {
  const origin = useLifeRouteStore((s) => s.location)
  const { ambulances, hospitals } = useLiveFacilities(origin)
  const [filter, setFilter] = useState('all')
  const visible = filter === 'all' ? ambulances : ambulances.filter((a) => a.status === filter)
  const free = ambulances.filter((a) => a.status === 'available').length

  return (
    <section className="lr-section">
      <div className="lr-section-header">
        <div>
          <h2 className="lr-section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Siren size={20} color="#0F766E" /> Ambulance fleet
          </h2>
          <p className="lr-section-sub">{free} available · {ambulances.length} tracked · telemetry positions</p>
        </div>
        <div className="lr-live-badge"><div className="lr-live-dot" /> LIVE TRACKING</div>
      </div>
      <div className="ops-chips" style={{ marginBottom: 14 }}>
        {STATUSES.map((status) => (
          <button key={status} type="button" className={`ops-chip ${filter === status ? 'active' : ''}`} onClick={() => setFilter(status)}>
            {status}
          </button>
        ))}
      </div>
      <div className="lr-ops-map-wrap" style={{ marginBottom: 18 }}>
        <FacilityMap origin={origin} hospitals={hospitals.slice(0, 6)} ambulances={visible} heightClass="lr-sat-map" />
      </div>
      <div className="lr-amb-grid">
        {visible.map((amb) => (
          <div key={amb.id} className="lr-amb-card">
            <div className="lr-amb-card-header">
              <div className="lr-amb-type-badge" style={{ background: amb.type === 'ALS' ? '#FEF2F2' : '#EFF6FF', color: amb.type === 'ALS' ? '#B91C1C' : '#1D4ED8', borderColor: amb.type === 'ALS' ? '#FECACA' : '#BFDBFE', borderWidth: 1, borderStyle: 'solid', borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                {amb.type}
              </div>
              <div className={`lr-amb-status ${amb.status}`}>
                <div className="lr-amb-status-dot" />
                {amb.status}
              </div>
            </div>
            <div className="lr-amb-callsign">{amb.callSign}</div>
            <div className="lr-amb-driver"><Radio size={13} /> {amb.driver} · {amb.hospital}</div>
            <div className="lr-amb-card-stats">
              <div><span className="lr-mini-num">{amb.eta}</span><span className="lr-mini-lbl">ETA</span></div>
              <div><span className="lr-mini-num">{amb.distance}</span><span className="lr-mini-lbl">Away</span></div>
            </div>
            <div className="lr-equip-tags">
              {amb.equipment.map((eq) => <span key={eq} className="lr-equip-tag">{eq}</span>)}
            </div>
            {amb.status === 'available' ? (
              <a className="lr-call-btn" style={{ background: '#DC2626' }} href="tel:108"><Phone size={16} /> Dispatch 108</a>
            ) : (
              <button className="lr-call-btn" style={{ background: '#94A3B8' }} disabled><Phone size={16} /> {amb.status}</button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
