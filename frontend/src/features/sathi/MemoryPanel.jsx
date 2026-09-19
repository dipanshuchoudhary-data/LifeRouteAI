import { useState } from 'react'
import { Bookmark, Trash2 } from 'lucide-react'
import { formatWhen } from '../../stores/useCompanionStore'

export default function MemoryPanel({ memories, onAdd, onRemove }) {
  const [text, setText] = useState('')

  return (
    <section className="sathi-page">
      <h1 className="sathi-h"><Bookmark size={26} /> Memory</h1>
      <p className="sathi-lead">Tell Sathi what to keep in mind. Birthdays, bills, preferences, or people.</p>

      <form
        className="sathi-stack"
        onSubmit={(event) => {
          event.preventDefault()
          onAdd(text)
          setText('')
        }}
      >
        <label>
          <span className="sathi-kicker">What should I remember?</span>
          <input
            className="sathi-input"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
        <button type="submit" className="sathi-btn"><Bookmark size={15} /> Remember this</button>
      </form>

      <div className="sathi-stack" style={{ marginTop: 24 }}>
        {(memories || []).length === 0 && <p className="sathi-muted">Nothing saved yet.</p>}
        {(memories || []).map((row) => (
          <article key={row.id} className="sathi-card">
            <p>{row.text}</p>
            <p className="sathi-muted">{formatWhen(row.at)}</p>
            <div className="sathi-actions">
              <button type="button" className="sathi-btn-ghost" onClick={() => onRemove(row.id)}>
                <Trash2 size={15} /> Forget this
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
