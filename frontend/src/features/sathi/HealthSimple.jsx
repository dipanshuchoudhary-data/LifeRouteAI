import { AlertTriangle, CalendarClock, Droplet, HeartPulse, Pencil, Pill } from 'lucide-react'

export default function HealthSimple({ profile, tasks, onEdit, onTalk }) {
  const meds = profile.medications || []
  const conditions = profile.conditions || []
  const allergies = profile.allergies || []
  const appointments = (tasks || []).filter((row) => row.kind === 'appointment')
  const vitals = profile.vitals || {}
  const connected = profile.wearable?.status === 'connected'

  return (
    <section className="sathi-page">
      <h1 className="sathi-h"><HeartPulse size={26} /> Health</h1>
      <p className="sathi-lead">The details Sathi uses to help you. This is not a hospital screen.</p>

      <article className="sathi-card">
        <h3><Pill size={16} /> Medicines</h3>
        {meds.length === 0 ? <p className="sathi-muted">No medicines saved.</p> : meds.map((row) => (
          <p key={row.id}>{row.name}{row.dose ? ` · ${row.dose}` : ''}{row.frequency ? ` · ${row.frequency}` : ''}</p>
        ))}
      </article>

      <article className="sathi-card" style={{ marginTop: 12 }}>
        <h3><AlertTriangle size={16} /> Conditions & allergies</h3>
        <p>{conditions.map((row) => row.name).filter(Boolean).join(', ') || 'No conditions saved.'}</p>
        <p className="sathi-muted">Allergies: {allergies.map((row) => row.substance).filter(Boolean).join(', ') || 'none saved'}</p>
        {profile.bloodType && <p><Droplet size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> Blood group: {profile.bloodType}</p>}
      </article>

      <article className="sathi-card" style={{ marginTop: 12 }}>
        <h3><CalendarClock size={16} /> Appointments</h3>
        {appointments.length === 0 ? <p className="sathi-muted">No appointments on My Day.</p> : appointments.map((row) => (
          <p key={row.id}>{row.time} {row.title}</p>
        ))}
      </article>

      {connected && (
        <article className="sathi-card" style={{ marginTop: 12 }}>
          <h3><HeartPulse size={16} /> Recent readings</h3>
          <p className="sathi-muted">From your connected watch. Shown here only because you asked for Health.</p>
          <p>Heart {vitals.heart_rate || '—'} · Oxygen {vitals.oxygen_saturation || '—'}% · Blood pressure {vitals.systolic_bp || '—'}/{vitals.diastolic_bp || '—'}</p>
        </article>
      )}

      <div className="sathi-actions">
        <button type="button" className="sathi-btn" onClick={() => onTalk('I do not feel well')}>
          <HeartPulse size={15} /> I do not feel well
        </button>
        <button type="button" className="sathi-btn-ghost" onClick={onEdit}>
          <Pencil size={15} /> Edit health details
        </button>
      </div>
    </section>
  )
}
