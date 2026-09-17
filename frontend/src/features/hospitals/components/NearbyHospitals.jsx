import { useState } from 'react'
import { MapPin, Navigation, PhoneCall, Search, Star } from 'lucide-react'
import { CITIES, DEFAULT_TAG_COLOR, SPECIALTIES, TAG_COLOR_MAP } from '../../../data/liferouteData'
import { getCapacityBarColor, getCapacityColor, getCapacityLabel, getWaitColor } from '../../../lib/triageAdapters'
import FacilityMap from '../../maps/FacilityMap'
import useLiveFacilities from '../../../hooks/useLiveFacilities'
import { useLifeRouteStore } from '../../../stores/useLifeRouteStore'

export default function NearbyHospitals() {
  const origin = useLifeRouteStore((s) => s.location)
  const { hospitals, live, updatedAt } = useLiveFacilities(origin)
  const [activeCity, setActiveCity] = useState('All Cities')
  const [activeSpec, setActiveSpec] = useState('All')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const filtered = hospitals.filter((h) => {
    const cityMatch = activeCity === 'All Cities' || h.city === activeCity
    const specMatch = activeSpec === 'All' || (h.tags || []).some((t) => t.includes(activeSpec))
    const textMatch = !query || h.name.toLowerCase().includes(query.toLowerCase())
    return cityMatch && specMatch && textMatch
  })
  const selected = filtered.find((h) => String(h.id) === String(selectedId)) || filtered[0]

  return (
    <section className="lr-section">
      <div className="lr-section-header">
        <div>
          <h2 className="lr-section-title">Hospital network</h2>
          <p className="lr-section-sub">
            {filtered.length} facilities · {live ? 'live telemetry' : 'fallback'} · {updatedAt.toLocaleTimeString()}
          </p>
        </div>
        <label className="ops-intake" style={{ minWidth: 240 }}>
          <Search size={14} color="#5B6B7C" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search hospitals…" aria-label="Search hospitals" style={{ paddingLeft: 8 }} />
        </label>
      </div>
      <div className="lr-ops-map-wrap" style={{ marginBottom: 16 }}>
        <FacilityMap origin={origin} hospitals={filtered} selectedId={selected?.id} heightClass="lr-sat-map" />
      </div>
      <div className="lr-city-tabs">
        {CITIES.map((city) => (
          <button key={city} type="button" className={`lr-city-tab ${activeCity === city ? 'active' : ''}`} onClick={() => setActiveCity(city)}>{city}</button>
        ))}
      </div>
      <div className="lr-spec-chips">
        {SPECIALTIES.map((s) => (
          <button key={s.label} type="button" className={`lr-spec-chip ${activeSpec === s.label ? 'active' : ''}`} onClick={() => setActiveSpec(s.label)}>
            <s.icon size={14} strokeWidth={1.5} /> {s.label}
          </button>
        ))}
      </div>
      {selected && (
        <article className="ops-card" style={{ margin: '12px 0 16px' }}>
          <h3>Selected facility</h3>
          <p style={{ fontWeight: 650, fontSize: 16 }}>{selected.name}</p>
          <p className="ops-muted">{selected.city} · {selected.distance} · last update {updatedAt.toLocaleTimeString()}</p>
          <ul className="ops-check" style={{ marginTop: 10 }}>
            <li><span>ICU free</span><b>{selected.icuFree ?? '—'}</b></li>
            <li><span>Trauma / tags</span><b>{(selected.tags || []).slice(0, 3).join(', ') || '—'}</b></li>
            <li><span>Vent / wait</span><b>{selected.wait}</b></li>
            <li><span>Acceptance</span><b className={selected.divert ? 'ops-bad' : 'ops-ok'}>{selected.divert ? 'Divert' : 'Accepting'}</b></li>
          </ul>
        </article>
      )}
      <div className="lr-card-grid">
        {filtered.length > 0 ? filtered.map((h) => (
          <article key={h.id} className="lr-card" onClick={() => setSelectedId(h.id)} style={{ cursor: 'pointer', outline: selected?.id === h.id ? '2px solid #0F766E' : undefined }}>
            <div className="lr-card-row1">
              <div className="lr-card-name">{h.name}{h.govt && <span className="lr-govt-badge">Govt.</span>}</div>
              <div className="lr-distance-badge"><Navigation size={13} strokeWidth={1.5} /> {h.distance}</div>
            </div>
            <div className="lr-card-row2">
              <span><MapPin size={13} strokeWidth={1.5} /> {h.city}</span>
              <span className="lr-rating"><Star size={12} strokeWidth={1.5} fill="#B45309" /> {h.rating}</span>
              <span>({Number(h.reviews || 0).toLocaleString()} reviews)</span>
            </div>
            <div className="lr-tags">
              {(h.tags || []).map((tag) => {
                const c = TAG_COLOR_MAP[tag] || DEFAULT_TAG_COLOR
                return <span key={tag} className="lr-tag" style={{ background: c.bg, color: c.text, borderColor: c.border }}>{tag}</span>
              })}
            </div>
            <div className="lr-stats-row">
              <div className="lr-stat-block"><div className="lr-stat-num">{h.beds}</div><div className="lr-stat-lbl">Beds</div></div>
              <div className="lr-stat-block"><div className="lr-stat-num" style={{ color: getWaitColor(h.wait) }}>{h.wait}</div><div className="lr-stat-lbl">Est. Wait</div></div>
              <div className="lr-stat-block"><div className="lr-stat-num" style={{ color: getCapacityColor(h.capacity) }}>{h.capacity}%</div><div className="lr-stat-lbl">Capacity</div></div>
            </div>
            <div className="lr-cap-bar-wrap">
              <div className="lr-cap-bar-bg"><div className="lr-cap-bar-fill" style={{ width: `${h.capacity}%`, background: getCapacityBarColor(h.capacity) }} /></div>
              <span className="lr-cap-status" style={{ color: getCapacityColor(h.capacity) }}>{h.capacity}% full · {getCapacityLabel(h.capacity)}</span>
            </div>
            <a className="lr-call-btn" href={h.contact ? `tel:${h.contact}` : 'tel:108'} onClick={(e) => e.stopPropagation()}><PhoneCall size={16} strokeWidth={2} /> Call Hospital</a>
          </article>
        )) : <div className="lr-empty">No hospitals match these filters.</div>}
      </div>
    </section>
  )
}
