import { useState } from 'react'
import { BedDouble, Clock } from 'lucide-react'
import { getCapacityBarColor, getCapacityColor } from '../../../lib/triageAdapters'
import { conditionNames, useProfileStore } from '../../../stores/useProfileStore'
import useLiveFacilities from '../../../hooks/useLiveFacilities'
import { useLifeRouteStore } from '../../../stores/useLifeRouteStore'

export default function IcuTracker() {
  const origin = useLifeRouteStore((s) => s.location)
  const { icu } = useLiveFacilities(origin)
  const [query, setQuery] = useState('')
  const conditions = conditionNames(useProfileStore((s) => s.profile))
  const preferCardiac = conditions.some((item) => /hyper|cardiac|heart|diabet/i.test(item))
  const rows = icu.filter((row) => !query || row.hospital.toLowerCase().includes(query.toLowerCase()) || row.type.toLowerCase().includes(query.toLowerCase()))
  const critical = rows.filter((row) => row.totalICU - row.occupiedICU <= 2)

  return (
    <section className="lr-section">
      <div className="lr-section-header">
        <div>
          <h2 className="lr-section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BedDouble size={20} color="#0F766E" /> ICU capacity
          </h2>
          <p className="lr-section-sub">{rows.length} hospitals · ventilators from occupancy telemetry</p>
        </div>
        <input className="ops-btn-ghost" style={{ width: 220 }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter hospital or ICU type" />
      </div>
      {critical.length > 0 && (
        <p className="ops-pill crit" style={{ marginBottom: 12 }}>{critical.length} facilities at critical ICU capacity</p>
      )}
      <div className="lr-icu-grid">
        {rows.map((row) => {
          const icuPct = Math.round((row.occupiedICU / Math.max(1, row.totalICU)) * 100)
          const availICU = row.totalICU - row.occupiedICU
          return (
            <div key={row.id} className={`lr-icu-card ${preferCardiac && /cardiac/i.test(row.type) ? 'match' : ''}`}>
              <div className="lr-icu-card-header">
                <h3>{row.hospital}</h3>
                <span className="lr-icu-type">{row.type}</span>
              </div>
              <div className="lr-icu-stats">
                <div>
                  <span className="lr-mini-num" style={{ color: getCapacityColor(icuPct) }}>{availICU}</span>
                  <span className="lr-mini-lbl">Available</span>
                </div>
                <div>
                  <span className="lr-mini-num">{row.totalICU}</span>
                  <span className="lr-mini-lbl">Total</span>
                </div>
                <div>
                  <span className="lr-mini-num" style={{ color: row.ventilators.available <= 3 ? '#DC2626' : '#15803D' }}>{row.ventilators.available}</span>
                  <span className="lr-mini-lbl">Ventilators</span>
                </div>
              </div>
              <div className="lr-cap-bar-wrap">
                <div className="lr-cap-bar-bg"><div className="lr-cap-bar-fill" style={{ width: `${icuPct}%`, background: getCapacityBarColor(icuPct) }} /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="lr-cap-status" style={{ color: getCapacityColor(icuPct) }}>{icuPct}% occupied</span>
                  <span className="ops-muted"><Clock size={11} /> {row.lastUpdated}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
