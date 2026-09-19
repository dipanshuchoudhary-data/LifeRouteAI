import { Link } from 'react-router-dom'
import { Settings, Type } from 'lucide-react'
import { PATHS } from '../../lib/paths'

export default function SeniorSettings({ profile, onPatch, textScale, onTextScale }) {
  return (
    <section>
      <h1 className="sathi-h"><Settings size={26} /> Settings</h1>
      <p className="sathi-lead">Simple details Sathi uses to talk with you.</p>

      <form className="sathi-card sathi-stack" onSubmit={(event) => event.preventDefault()}>
        <label>
          <span className="sathi-kicker">Your name</span>
          <input
            className="sathi-input"
            value={profile.name || ''}
            onChange={(event) => onPatch({ name: event.target.value })}
          />
        </label>
        <label>
          <span className="sathi-kicker">City</span>
          <input
            className="sathi-input"
            value={profile.city || ''}
            onChange={(event) => onPatch({ city: event.target.value })}
          />
        </label>
        <label>
          <span className="sathi-kicker">Blood group (optional)</span>
          <input
            className="sathi-input"
            value={profile.bloodType || ''}
            onChange={(event) => onPatch({ bloodType: event.target.value })}
          />
        </label>
      </form>

      <article className="sathi-card" style={{ marginTop: 16 }}>
        <h3><Type size={16} /> Text size</h3>
        <div className="sathi-actions">
          {['normal', 'large', 'xlarge'].map((size) => (
            <button
              key={size}
              type="button"
              className={textScale === size ? 'sathi-btn' : 'sathi-btn-ghost'}
              onClick={() => onTextScale(size)}
              aria-pressed={textScale === size}
            >
              {size === 'normal' ? 'Normal' : size === 'large' ? 'Large' : 'Extra large'}
            </button>
          ))}
        </div>
      </article>

      <p className="sathi-muted" style={{ marginTop: 16 }}>
        Medicines and allergies stay on the Health page.
        {' '}
        <Link to={PATHS.chart}>Open the full health chart</Link>
      </p>
    </section>
  )
}
