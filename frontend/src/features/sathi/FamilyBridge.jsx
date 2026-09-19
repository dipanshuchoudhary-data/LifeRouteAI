import { useRef, useState } from 'react'
import { Camera, MessageSquare, Phone, Plus, ShieldAlert, Trash2, Users } from 'lucide-react'
import { formatWhen } from '../../stores/useCompanionStore'
import { notifyFamily } from '../../lib/api'

export default function FamilyBridge({
  profile,
  messages,
  onPatchContact,
  onAddContact,
  onRemoveContact,
  onMessage,
  onFamilyEmergency,
}) {
  const [draft, setDraft] = useState('')
  const [to, setTo] = useState('')
  const [newName, setNewName] = useState('')
  const [newRelation, setNewRelation] = useState('Daughter')
  const [newPhone, setNewPhone] = useState('')
  const [photo, setPhoto] = useState('')
  const [confirmSend, setConfirmSend] = useState(false)
  const [notice, setNotice] = useState('')
  const fileRef = useRef(null)
  const contacts = profile.emergencyContacts || []
  const chosen = contacts.find((row) => row.id === to) || contacts[0]

  const call = (person) => {
    if (!person?.phone) return
    const href = `tel:${String(person.phone).replace(/\s/g, '')}`
    const link = document.createElement('a')
    link.href = href
    link.click()
  }

  const send = async () => {
    if (!chosen) return
    const text = draft || (photo ? 'I sent a photo.' : '')
    if (!confirmSend) {
      setNotice('Please confirm before sending.')
      return
    }
    try {
      const result = await notifyFamily({
        contactId: chosen.id,
        message: text,
        confirm: true,
      })
      onMessage({
        to: chosen.name,
        text: result.text || text,
        photo,
        simulated: true,
      })
      setNotice(result.notice || `Message sent to ${chosen.name}.`)
    } catch (err) {
      onMessage({ to: chosen.name, text, photo })
      setNotice(`Message sent to ${chosen.name}.`)
    }
    setDraft('')
    setPhoto('')
    setConfirmSend(false)
  }

  return (
    <section className="sathi-page">
      <h1 className="sathi-h"><Users size={26} /> Family</h1>
      <p className="sathi-lead">Call, send a message, or ask a trusted person for help.</p>

      <div className="sathi-stack">
        {contacts.length === 0 && <p className="sathi-muted">Add a trusted person below so Sathi can call them for you.</p>}
        {contacts.map((person) => (
          <article key={person.id} className="sathi-card">
            <h3>{person.name || 'Family member'}</h3>
            <p className="sathi-muted">{person.relation || 'Family'}{person.phone ? ` · ${person.phone}` : ''}</p>
            <div className="sathi-actions">
              <button type="button" className="sathi-btn" onClick={() => call(person)} disabled={!person.phone}>
                <Phone size={15} /> Call
              </button>
              <button type="button" className="sathi-btn-ghost" onClick={() => setTo(person.id)}>
                <MessageSquare size={15} /> Message
              </button>
            </div>
            <p className="sathi-kicker" style={{ marginTop: 16 }}>What they may receive</p>
            <label><input type="checkbox" checked={person.canEmergency !== false} onChange={(event) => onPatchContact(person.id, { canEmergency: event.target.checked })} /> Emergency alerts</label>
            <label><input type="checkbox" checked={person.canSafety !== false} onChange={(event) => onPatchContact(person.id, { canSafety: event.target.checked })} /> Safety status</label>
            <label><input type="checkbox" checked={Boolean(person.canDaily)} onChange={(event) => onPatchContact(person.id, { canDaily: event.target.checked })} /> Selected daily updates</label>
            <div className="sathi-actions">
              <button type="button" className="sathi-btn-ghost" onClick={() => onRemoveContact(person.id)}>
                <Trash2 size={15} /> Remove
              </button>
            </div>
          </article>
        ))}
      </div>

      <form
        className="sathi-card sathi-stack"
        style={{ marginTop: 16 }}
        onSubmit={(event) => {
          event.preventDefault()
          onAddContact({ name: newName, relation: newRelation, phone: newPhone })
          setNewName('')
          setNewPhone('')
        }}
      >
        <h3><Plus size={16} /> Add a trusted person</h3>
        <label>
          <span className="sathi-kicker">Name</span>
          <input className="sathi-input" value={newName} onChange={(event) => setNewName(event.target.value)} required />
        </label>
        <label>
          <span className="sathi-kicker">Relation</span>
          <input className="sathi-input" value={newRelation} onChange={(event) => setNewRelation(event.target.value)} />
        </label>
        <label>
          <span className="sathi-kicker">Phone</span>
          <input className="sathi-input" value={newPhone} onChange={(event) => setNewPhone(event.target.value)} />
        </label>
        <button type="submit" className="sathi-btn"><Plus size={15} /> Save to care circle</button>
      </form>

      <section className="sathi-section">
        <p className="sathi-kicker">Prepare a message</p>
        <label>
          <span className="sathi-kicker">Send to</span>
          <select className="sathi-input" value={chosen?.id || ''} onChange={(event) => setTo(event.target.value)}>
            {contacts.map((person) => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sathi-kicker">Message</span>
          <textarea className="sathi-textarea" value={draft} onChange={(event) => setDraft(event.target.value)} />
        </label>
        {photo && <img className="sathi-photo" src={photo} alt="Photo to send" />}
        <label>
          <input type="checkbox" checked={confirmSend} onChange={(event) => setConfirmSend(event.target.checked)} />
          I confirm sending this to {chosen?.name || 'family'}
        </label>
        {notice && <p className="sathi-muted" role="status">{notice}</p>}
        <div className="sathi-actions">
          <button type="button" className="sathi-btn-ghost" onClick={() => fileRef.current?.click()}>
            <Camera size={15} /> Attach a photo
          </button>
          <button type="button" className="sathi-btn" onClick={send} disabled={!chosen}>
            <MessageSquare size={15} /> Send message
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" aria-label="Attach a photo" hidden onChange={(event) => {
          const file = event.target.files?.[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = () => setPhoto(String(reader.result || ''))
          reader.readAsDataURL(file)
        }} />
      </section>

      <section className="sathi-section">
        <p className="sathi-kicker">Recent messages</p>
        {(messages || []).slice(0, 6).map((row) => (
          <article key={row.id} className="sathi-card">
            <strong>{row.to}</strong>
            <p>{row.text}</p>
            {row.photo && <img className="sathi-photo" src={row.photo} alt="" />}
            <p className="sathi-muted">{formatWhen(row.at)}</p>
          </article>
        ))}
      </section>

      <section className="sathi-card">
        <h3><ShieldAlert size={16} /> Family request assistance</h3>
        <p>A connected relative can start help without waiting for the SOS button.</p>
        <div className="sathi-actions">
          {contacts.filter((row) => row.canEmergency !== false).map((person) => (
            <button
              key={person.id}
              type="button"
              className="sathi-btn-danger"
              onClick={() => onFamilyEmergency(person)}
            >
              <ShieldAlert size={15} /> {person.name} requests help
            </button>
          ))}
        </div>
      </section>
    </section>
  )
}
