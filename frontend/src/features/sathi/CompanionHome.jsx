import { CalendarClock, Camera, Heart, HeartPulse, Image, MessageCircle, Mic, Phone, Pill, ShieldCheck, Stethoscope, Users } from 'lucide-react'
import { greetingClock, displayName } from '../../lib/sathiIntent'
import { todaysTasks } from '../../stores/useCompanionStore'
import { profileInitials } from '../../stores/useProfileStore'

function timeLabel(value) {
  if (!value) return ''
  const [h, m] = String(value).split(':')
  const hour = Number(h)
  if (!Number.isFinite(hour)) return value
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const shown = hour % 12 || 12
  return `${shown}:${(m || '00').padStart(2, '0')} ${suffix}`
}

const DOT = ['', 'blue', 'gold']

export default function CompanionHome({
  profile,
  tasks,
  wearable,
  contacts,
  onTalk,
  onMic,
  listening,
  onOpen,
  draft,
  onDraft,
}) {
  const today = todaysTasks(tasks)
  const name = displayName(profile) || 'there'
  const conditions = (profile.conditions || []).map((row) => row.name).filter(Boolean)
  const meds = profile.medications || []
  const allergies = (profile.allergies || []).map((row) => row.substance).filter(Boolean)
  const family = (contacts || []).slice(0, 3)

  return (
    <div className="sathi-home">
      <div>
        <section className="sathi-hero">
          <h1>{greetingClock()},<br />{name}</h1>
          <p>I’m Sathi, here to help you live a healthier, safer and more connected life.</p>
          <form
            className="sathi-ask"
            onSubmit={(event) => {
              event.preventDefault()
              onTalk(draft)
            }}
          >
            <Mic size={18} color="#1F6B57" />
            <input
              value={draft || ''}
              onChange={(event) => onDraft?.(event.target.value)}
              placeholder="Ask Sathi anything..."
              aria-label="Ask Sathi"
            />
            <button type="button" className={listening ? 'listening' : ''} onClick={onMic} aria-pressed={listening} aria-label={listening ? 'Stop listening' : 'Talk to Sathi'}>
              <Mic size={16} /> {listening ? 'Tap to stop' : 'Talk to Sathi'}
            </button>
          </form>
          <p className="sathi-hint">You can speak or type. Try asking about your health, appointments, or show me a photo.</p>
        </section>

        <div className="sathi-actions-row">
          <button type="button" className="sathi-action mint" onClick={() => onOpen('more', 'explain')}>
            <Image size={18} />
            <strong>Explain something</strong>
            <span>Show a photo or document</span>
          </button>
          <button type="button" className="sathi-action blue" onClick={() => onOpen('health')}>
            <Heart size={18} />
            <strong>Check my health</strong>
            <span>Medications, reports, advice</span>
          </button>
          <button type="button" className="sathi-action gold" onClick={() => onOpen('more', 'tasks')}>
            <CalendarClock size={18} />
            <strong>My appointments</strong>
            <span>View or book appointments</span>
          </button>
          <button type="button" className="sathi-action rose" onClick={() => onOpen('family')}>
            <Users size={18} />
            <strong>Contact family</strong>
            <span>Call or send a message</span>
          </button>
        </div>

        <section className="sathi-panel">
          <div className="sathi-panel-head">
            <h2><CalendarClock size={18} /> Today’s plan</h2>
            <button type="button" className="sathi-btn-ghost" onClick={() => onOpen('more', 'tasks')}>View details</button>
          </div>
          <div className="sathi-plan">
            {today.length === 0 && <p className="sathi-muted">Nothing saved for today yet.</p>}
            {today.map((row, index) => (
              <div key={row.id} className="sathi-plan-item">
                <span className={`sathi-dot ${DOT[index] || ''}`} />
                <span className="sathi-time">{timeLabel(row.time) || '—'}</span>
                <div>
                  <strong>{row.title}</strong>
                  <p className="sathi-muted">{row.kind === 'medicine' ? 'Mark as taken when done' : row.kind === 'family' ? 'Quick check-in' : 'Today'}</p>
                </div>
                {row.kind === 'family' ? (
                  <button type="button" className="sathi-btn-ghost" onClick={() => onTalk('Call my daughter')}><Phone size={14} /> Call</button>
                ) : (
                  <button type="button" className="sathi-btn-ghost" onClick={() => onOpen('more', 'tasks')}>Open</button>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="sathi-footer-cards">
          <article className="sathi-quote">“Small steps every day make a big difference.”<br /><span className="sathi-muted">— Sathi</span></article>
          <article className="sathi-sunrise">Take care today.<br />A brighter tomorrow is always possible.</article>
        </div>
      </div>

      <aside className="sathi-side">
        <section className="sathi-panel">
          <div className="sathi-panel-head">
            <h2>Your health at a glance</h2>
            <button type="button" className="sathi-btn-ghost" onClick={() => onOpen('health')}>View all</button>
          </div>
          <div className="sathi-glance">
            <div className="sathi-glance-row">
              <span className="sathi-glance-ico"><HeartPulse size={16} /></span>
              <div><strong>Conditions</strong><p className="sathi-muted">{conditions.join(', ') || 'None saved'}</p></div>
            </div>
            <div className="sathi-glance-row">
              <span className="sathi-glance-ico"><Pill size={16} /></span>
              <div><strong>Medications</strong><p className="sathi-muted">{meds.length ? `${meds.length} active medications` : 'None saved'}</p></div>
            </div>
            <div className="sathi-glance-row">
              <span className="sathi-glance-ico"><Stethoscope size={16} /></span>
              <div><strong>Allergies</strong><p className="sathi-muted">{allergies.join(', ') || 'None noted'}</p></div>
            </div>
            <div className="sathi-glance-row">
              <span className="sathi-glance-ico"><Camera size={16} /></span>
              <div><strong>Watch</strong><p className="sathi-muted">{wearable?.status === 'connected' ? wearable.deviceName || 'Connected' : 'Not connected'}</p></div>
            </div>
          </div>
        </section>

        <section className="sathi-panel">
          <div className="sathi-panel-head">
            <h2>Quick family contact</h2>
            <button type="button" className="sathi-btn-ghost" onClick={() => onOpen('family')}>View all</button>
          </div>
          {family.length === 0 && <p className="sathi-muted">Add a trusted person in Family.</p>}
          {family.map((person) => (
            <div key={person.id} className="sathi-family-row">
              <span className="sathi-avatar">{profileInitials({ name: person.name })}</span>
              <div>
                <strong>{person.name}</strong>
                <p>{person.relation || 'Family'}</p>
              </div>
              <div className="sathi-family-actions">
                {person.phone && (
                  <a className="sathi-icon-btn" href={`tel:${String(person.phone).replace(/\s/g, '')}`} aria-label={`Call ${person.name}`}>
                    <Phone size={14} />
                  </a>
                )}
                <button type="button" className="sathi-icon-btn" onClick={() => onTalk(`Call ${person.name}`)} aria-label={`Message ${person.name}`}>
                  <MessageCircle size={14} />
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="sathi-safe-card">
          <h2 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={18} /> You’re safe with Sathi</h2>
          <p className="sathi-muted">In an emergency, Sathi prepares hospital matching and a family note. This demo does not dispatch an ambulance. Call 108 if you need urgent help.</p>
          <button type="button" className="sathi-btn-ghost" style={{ marginTop: 12 }} onClick={() => onOpen('safety')}>Learn more</button>
        </section>
      </aside>
    </div>
  )
}
