import { MapPin, ShieldAlert, ShieldCheck, Watch } from 'lucide-react'
import WearableConnect from '../wearable/WearableConnect'
import { formatWhen } from '../../stores/useCompanionStore'
import { DEMO_ORIGINS } from '../maps/coords'
import { useLifeRouteStore } from '../../stores/useLifeRouteStore'

export default function SafetyPanel({ profile, events, onHelp }) {
  const watchOn = profile.wearable?.status === 'connected'
  const contacts = (profile.emergencyContacts || []).filter((row) => row.canEmergency !== false && row.phone)
  const setLocation = useLifeRouteStore((s) => s.setLocation)
  const locationLabel = useLifeRouteStore((s) => s.locationLabel)

  return (
    <section className="sathi-page">
      <h1 className="sathi-h"><ShieldCheck size={26} /> Safety</h1>
      <p className="sathi-lead">Sathi stays ready in the background. Everyday life stays calm.</p>

      <article className="sathi-card" style={{ marginBottom: 16 }}>
        <h3><MapPin size={16} /> Your area</h3>
        <p className="sathi-muted">Nearby hospitals and ambulances use this location.</p>
        <p style={{ margin: '8px 0' }}>Now: {locationLabel || 'Noida Sector 62'}</p>
        <div className="sathi-actions">
          {DEMO_ORIGINS.filter((place) => place.id !== 'delhi').map((place) => (
            <button
              key={place.id}
              type="button"
              className="sathi-btn-ghost"
              onClick={() => setLocation({ lat: place.lat, lng: place.lng }, place.label)}
            >
              <MapPin size={15} /> {place.label}
            </button>
          ))}
        </div>
      </article>

      <article className="sathi-safe">
        <div>
          <strong>
            <Watch size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
            {watchOn ? 'Watch connected' : 'Watch not connected'}
          </strong>
          <p>{contacts.length ? `${contacts.length} trusted people can be reached` : 'Add a family phone number'}</p>
        </div>
        <button type="button" className="sathi-btn-danger" onClick={onHelp} aria-label="Start emergency help">
          <ShieldAlert size={15} /> Emergency help
        </button>
      </article>

      <div style={{ marginTop: 20 }}>
        <p className="sathi-kicker">Your watch</p>
        <p className="sathi-muted">Connect a watch. Unusual readings first ask if you are okay, then notify family if needed.</p>
        <WearableConnect />
      </div>

      <section className="sathi-section">
        <p className="sathi-kicker">Safety notes</p>
        {(events || []).length === 0 && <p className="sathi-muted">No recent safety checks.</p>}
        {(events || []).slice(0, 6).map((row) => (
          <article key={row.id} className="sathi-card">
            <strong>{row.title}</strong>
            <p>{row.detail}</p>
            <p className="sathi-muted">{formatWhen(row.at)}</p>
          </article>
        ))}
      </section>
    </section>
  )
}
