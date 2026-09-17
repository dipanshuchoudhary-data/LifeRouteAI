import { Phone, ShieldPlus, Siren } from 'lucide-react'

export default function EmergencyTakeoverModal({ open, result, onContinue, onDismiss }) {
  if (!open) return null
  const hospital = result?.matchedHospital?.name || 'the nearest trauma-capable ER'
  return (
    <div className="lr-sos-overlay" role="alertdialog" aria-modal="true" aria-labelledby="lr-sos-title">
      <div className="lr-sos-card">
        <div className="lr-sos-pulse-ring" />
        <Siren size={36} color="#fff" />
        <p className="lr-esi-pill">ESI 1 · RESUSCITATION</p>
        <h2 id="lr-sos-title">Call 108 immediately</h2>
        <p>
          Life-threatening symptoms were intercepted before the AI model ran.
          Do not drive yourself. Stay on the line with emergency services.
        </p>
        <p className="lr-sos-hospital">Nearest capable facility: {hospital}</p>
        <div className="lr-sos-actions">
          <a className="lr-call-btn" href="tel:108">
            <Phone size={16} /> Call 108 now
          </a>
          <button type="button" className="lr-filter-btn" onClick={onContinue}>
            <ShieldPlus size={15} /> View care details
          </button>
          <button type="button" className="lr-close-text" onClick={onDismiss}>Dismiss</button>
        </div>
      </div>
    </div>
  )
}
