import { useState } from 'react'
import { Bell, Phone, UserRound } from 'lucide-react'
import { useProfileStore } from '../../stores/useProfileStore'

export default function CareCircle({ onOpenProfile }) {
  const contacts = useProfileStore((s) => s.profile.emergencyContacts) || []
  const [sent, setSent] = useState(false)
  return (
    <section className="lr-section">
      <div className="lr-section-header">
        <div>
          <h2 className="lr-section-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserRound size={22} color="#C49EF5" /> Care circle
          </h2>
          <p className="lr-section-sub">Contacts come from the medical chart you edit on Profile.</p>
        </div>
        {contacts.length > 0 && (
          <button
            type="button"
            className="lr-call-btn"
            style={{ width: 'auto', padding: '10px 18px' }}
            onClick={() => setSent(true)}
          >
            <Bell size={16} /> {sent ? 'Alerts sent' : 'Notify circle'}
          </button>
        )}
      </div>
      {contacts.length === 0 ? (
        <p className="lr-muted">
          No contacts yet.{' '}
          <button type="button" className="lr-nav-link" style={{ display: 'inline' }} onClick={onOpenProfile}>Add them on Profile</button>
        </p>
      ) : (
        <div className="lr-care-grid">
          {contacts.map((person) => (
            <article key={person.id} className={`lr-care-card ${sent ? 'pinged' : ''}`}>
              <div className="lr-care-avatar">{(person.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('')}</div>
              <div>
                <h3>{person.name}</h3>
                <p>{person.relation}</p>
              </div>
              {person.phone && (
                <a className="lr-assistant-icon-btn" href={`tel:${person.phone.replace(/\s/g, '')}`} aria-label={`Call ${person.name}`}>
                  <Phone size={16} />
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
