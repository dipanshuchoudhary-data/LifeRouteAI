import { useEffect } from 'react'
import { Ambulance, Phone, ShieldPlus, Siren, Users } from 'lucide-react'

export default function WearableDispatchModal({ open, alert, onDismiss }) {
  const family = alert?.family
  const familyTel = family?.phone ? `tel:${String(family.phone).replace(/\s/g, '')}` : null

  useEffect(() => {
    if (!open || !familyTel) return undefined
    const id = setTimeout(() => document.getElementById('lr-family-call')?.click(), 500)
    return () => clearTimeout(id)
  }, [open, familyTel])

  if (!open || !alert) return null
  return (
    <div className="lr-sos-overlay" role="alertdialog" aria-modal="true" aria-labelledby="lr-wear-title">
      <div className="lr-sos-card">
        <div className="lr-sos-pulse-ring" />
        <Siren size={36} color="#fff" />
        <p className="lr-esi-pill">WEARABLE ALERT</p>
        <h2 id="lr-wear-title">Abnormal vitals detected</h2>
        <p>{(alert.reasons || []).join(' · ') || 'Critical readings from the connected wearable.'}</p>
        <ul className="lr-wearable-dispatch">
          <li><ShieldPlus size={14} /> Agents activated — matching hospital and unit</li>
          <li><Users size={14} /> Family {family?.name ? `(${family.name})` : 'contact'} {familyTel ? 'is being called' : 'is not on file'}</li>
          <li><Ambulance size={14} /> Nearby ambulance dispatched · call 108</li>
        </ul>
        <div className="lr-sos-actions">
          {familyTel && (
            <a id="lr-family-call" className="lr-call-btn" href={familyTel}>
              <Phone size={16} /> Call {family.name || 'family'}
            </a>
          )}
          <a id="lr-ambulance-call" className="lr-call-btn" href="tel:108">
            <Ambulance size={16} /> Call 108 ambulance
          </a>
          <button type="button" className="lr-close-text" onClick={onDismiss}>Keep following on Home</button>
        </div>
      </div>
    </div>
  )
}
