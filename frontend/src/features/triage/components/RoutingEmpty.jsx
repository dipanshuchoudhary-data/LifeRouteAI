import { ArrowRight } from 'lucide-react'
import { CHIPS } from '../../../data/liferouteData'
import VoiceInputPill from './VoiceInputPill'
import FacilityMap from '../../maps/FacilityMap'
import useLiveFacilities from '../../../hooks/useLiveFacilities'
import { useLifeRouteStore } from '../../../stores/useLifeRouteStore'

export default function RoutingEmpty({
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
}) {
  const origin = useLifeRouteStore((s) => s.location)
  const { hospitals, ambulances } = useLiveFacilities(origin)
  const hindi = language === 'hi'

  return (
    <div className="ops-stack">
      <article className="ops-card">
        <h3>Start routing</h3>
        <p className="ops-muted" style={{ marginBottom: 10 }}>Map shows live units and facilities. Enter a complaint to generate an AI-selected corridor.</p>
        <div className="ops-intake-wrap lr-search-wrap" style={{ position: 'relative' }}>
          <VoiceInputPill active={isListening} transcribing={isTranscribing} level={micLevel} onClick={onMic} disabled={isBusy && !isListening} />
          <div className="ops-intake">
            <input
              value={searchQuery}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              placeholder={hindi ? 'लक्षण…' : 'Chief complaint or scene notes…'}
              aria-label="Routing complaint"
            />
            <button className="ops-btn" type="button" onClick={onSubmit} disabled={isBusy}>
              Run match <ArrowRight size={14} />
            </button>
          </div>
        </div>
        <div className="ops-chips" style={{ marginTop: 10 }}>
          {CHIPS.map((chip) => (
            <button key={chip.label} type="button" className="ops-chip" onClick={() => onChip({ ...chip, query: hindi && chip.hiQuery ? chip.hiQuery : chip.query })}>
              <chip.icon size={13} /> {hindi ? chip.hiLabel : chip.label}
            </button>
          ))}
        </div>
      </article>
      <article className="ops-card" style={{ padding: 8 }}>
        <FacilityMap origin={origin} hospitals={hospitals} ambulances={ambulances} heightClass="lr-sat-map lr-sat-map-tall" />
      </article>
    </div>
  )
}
