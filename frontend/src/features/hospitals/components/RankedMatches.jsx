import { MapPin, Navigation, Star } from 'lucide-react'
import { getCapacityColor, getWaitColor } from '../../../lib/triageAdapters'

function partsFor(hospital) {
  const waitNum = parseInt(String(hospital.wait || '12').replace(/[^0-9]/g, ''), 10) || 12
  const travel = Math.max(8, Math.min(100, 100 - (hospital.travelMinutes || waitNum) * 3.2))
  const wait = Math.max(8, Math.min(100, 100 - waitNum * 2.4))
  const beds = Math.max(8, Math.min(100, 100 - (hospital.capacity || 70) * 0.7))
  const fit = Math.max(8, Math.min(100, Number(hospital.score) || 72))
  return [
    { label: 'Travel', value: travel },
    { label: 'Wait', value: wait },
    { label: 'Beds', value: beds },
    { label: 'Clinical fit', value: fit },
  ]
}

export default function RankedMatches({ hospitals = [] }) {
  if (!hospitals.length) return null
  return (
    <div className="lr-result-card lr-ranked-card">
      <div className="lr-result-card-header">
        <Navigation size={18} style={{ color: '#4DD4A0' }} />
        <span>Why these three ranked</span>
      </div>
      <ol className="lr-ranked-list">
        {hospitals.slice(0, 3).map((hospital, index) => (
          <li key={hospital.id || hospital.name} className="lr-ranked-block">
            <span className="lr-ranked-pos">{index === 0 ? 'Best' : `#${index + 1}`}</span>
            <div>
              <strong>{hospital.name}</strong>
              <div className="lr-card-row2">
                <span><MapPin size={12} /> {hospital.city}</span>
                <span><Navigation size={12} /> {hospital.distance}</span>
                <span className="lr-rating"><Star size={11} fill="#FAC75A" /> {hospital.rating}</span>
              </div>
              <div className="lr-score-bars">
                {partsFor(hospital).map((part) => (
                  <div key={part.label} className="lr-score-bar">
                    <span>{part.label}</span>
                    <i><b style={{ width: `${part.value}%` }} /></i>
                    <em>{Math.round(part.value)}</em>
                  </div>
                ))}
              </div>
            </div>
            <div className="lr-ranked-meta">
              <span style={{ color: getWaitColor(hospital.wait) }}>{hospital.wait}</span>
              <span style={{ color: getCapacityColor(hospital.capacity) }}>{hospital.capacity}%</span>
              {hospital.score != null && <span className="lr-score">{Number(hospital.score).toFixed(1)}</span>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
