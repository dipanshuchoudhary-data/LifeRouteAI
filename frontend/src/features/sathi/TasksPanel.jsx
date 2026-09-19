import { useState } from 'react'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import { todaysTasks } from '../../stores/useCompanionStore'

function todayStamp() {
  return new Date().toISOString().slice(0, 10)
}

export default function TasksPanel({ tasks, onAdd, onToggle, onRemove, onAskToday }) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('18:00')
  const [repeat, setRepeat] = useState('')
  const today = todaysTasks(tasks)

  return (
    <section className="sathi-page">
      <h1 className="sathi-h"><ClipboardList size={26} /> My day</h1>
      <p className="sathi-lead">Appointments, bills, walks, and reminders in one place.</p>

      <button type="button" className="sathi-btn" onClick={onAskToday}>
        <ClipboardList size={15} /> What is important today?
      </button>

      <div className="sathi-list" style={{ marginTop: 16 }}>
        {today.map((row) => (
          <div key={row.id} className={`sathi-row${row.done ? ' done' : ''}`}>
            <time>{row.time || '—'}</time>
            <button type="button" onClick={() => onToggle(row.id)} style={{ background: 'none', border: 0, textAlign: 'left', font: 'inherit', cursor: 'pointer' }}>
              {row.title}
            </button>
            <button type="button" className="sathi-btn-ghost" onClick={() => onRemove(row.id)}>
              <Trash2 size={15} /> Remove
            </button>
          </div>
        ))}
      </div>

      <form
        className="sathi-card sathi-stack"
        style={{ marginTop: 20 }}
        onSubmit={(event) => {
          event.preventDefault()
          onAdd({ title, time, day: todayStamp(), repeat, kind: 'task' })
          setTitle('')
        }}
      >
        <h3><Plus size={16} /> Add a reminder</h3>
        <input className="sathi-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Pay the electricity bill" required />
        <input className="sathi-input" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        <select className="sathi-input" value={repeat} onChange={(event) => setRepeat(event.target.value)}>
          <option value="">Once</option>
          <option value="daily">Every day</option>
          <option value="sunday">Every Sunday</option>
        </select>
        <button type="submit" className="sathi-btn"><Plus size={15} /> Save reminder</button>
      </form>
    </section>
  )
}
