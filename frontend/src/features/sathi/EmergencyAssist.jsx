import { Check, HeartPulse, MapPin, Phone, ShieldAlert, Users } from 'lucide-react'

const STEPS = [
  { id: 'SOS_TRIGGERED', label: 'Help requested' },
  { id: 'ASSESSING', label: 'Preparing details' },
  { id: 'HELP_REQUESTED', label: 'Ready to call 108' },
  { id: 'FAMILY_NOTIFIED', label: 'Family note prepared' },
  { id: 'ASSISTANCE_ACTIVE', label: 'Assistance active' },
  { id: 'RESOLVED', label: 'Resolved' },
]

export default function EmergencyAssist({
  emergency,
  profile,
  result,
  onCall108,
  onResolve,
  onDetails,
  onBack,
}) {
  const passport = emergency?.passport || {}
  const hospital = emergency?.recommended_hospital || result?.matchedHospital?.name
  const state = emergency?.state || 'ASSISTANCE_ACTIVE'
  const contact = passport.emergency_contact

  return (
    <section>
      <p className="sathi-banner" role="status">
        Emergency help is active. Please call 108 now if you need urgent help.
      </p>
      <h1 className="sathi-h"><ShieldAlert size={26} /> Emergency help</h1>
      <p className="sathi-lead">Sathi prepared a short card for helpers. You stay in control.</p>

      <a className="sathi-btn-danger" href="tel:108" onClick={onCall108} style={{ width: '100%', marginBottom: 16 }}>
        <Phone size={18} /> Call 108 now
      </a>

      <article className="sathi-card" style={{ marginBottom: 16 }}>
        <h3><HeartPulse size={16} /> Emergency card</h3>
        <p><strong>{passport.name || profile?.name || 'Name not saved'}</strong></p>
        {passport.blood_group && <p>Blood group: {passport.blood_group}</p>}
        {!!passport.allergies?.length && <p>Allergies: {passport.allergies.join(', ')}</p>}
        {!!passport.important_conditions?.length && <p>Conditions: {passport.important_conditions.join(', ')}</p>}
        {!!passport.current_medications?.length && <p>Medicines: {passport.current_medications.join(', ')}</p>}
        {contact?.name && (
          <p>
            <Users size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
            {contact.name}
            {contact.relation ? ` (${contact.relation})` : ''}
            {contact.phone ? ` · ${contact.phone}` : ''}
          </p>
        )}
        <p className="sathi-muted">Only the details needed for help are shown. This is not a full medical record.</p>
      </article>

      <article className="sathi-card" style={{ marginBottom: 16 }}>
        <h3>What happened</h3>
        <ol className="sathi-steps">
          {STEPS.map((step) => (
            <li key={step.id} className={STEPS.findIndex((row) => row.id === state) >= STEPS.findIndex((row) => row.id === step.id) ? 'done' : ''}>
              {step.label}
            </li>
          ))}
        </ol>
        <p className="sathi-muted">{emergency?.notice}</p>
        {emergency?.family_notification && (
          <p className="sathi-muted">{emergency.family_notification.message}</p>
        )}
      </article>

      {hospital && (
        <article className="sathi-card" style={{ marginBottom: 16 }}>
          <h3><MapPin size={16} /> Nearby hospital suggestion</h3>
          <p>{hospital}</p>
          <p className="sathi-muted">This is a recommended facility based on available information. It has not been booked.</p>
        </article>
      )}

      <div className="sathi-actions">
        <button type="button" className="sathi-btn" onClick={onResolve}>
          <Check size={15} /> I am safe now
        </button>
        {onDetails && (
          <button type="button" className="sathi-btn-ghost" onClick={onDetails}>
            Hospital matching details
          </button>
        )}
        <button type="button" className="sathi-btn-ghost" onClick={onBack}>
          Back home
        </button>
      </div>
    </section>
  )
}
