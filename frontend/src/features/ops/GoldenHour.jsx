import { Clock, ShieldCheck, Timer } from 'lucide-react'
import { GOLDEN_HOUR_STEPS } from '../../data/liferouteData'

export default function GoldenHour() {
  return (
    <section className="lr-section" id="golden-hour-section">
      <div className="lr-section-header">
        <div>
          <h2 className="lr-section-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Timer size={22} color="#FAC75A" /> Golden hour
          </h2>
          <p className="lr-section-sub">Same chest-pain case. Two clocks. Judges can see where the hour goes.</p>
        </div>
      </div>
      <div className="lr-hour-grid">
        <article className="lr-hour-col lose">
          <header><Clock size={16} /> Google “nearest hospital”</header>
          <div className="lr-hour-bar"><span style={{ width: '100%' }} /></div>
          <ol>
            {GOLDEN_HOUR_STEPS.google.map((step) => (
              <li key={step.t}><em>{step.t}</em><span>{step.label}</span></li>
            ))}
          </ol>
        </article>
        <article className="lr-hour-col win">
          <header><ShieldCheck size={16} /> LifeRoute routing</header>
          <div className="lr-hour-bar"><span style={{ width: '18%' }} /></div>
          <ol>
            {GOLDEN_HOUR_STEPS.liferoute.map((step) => (
              <li key={step.t}><em>{step.t}</em><span>{step.label}</span></li>
            ))}
          </ol>
        </article>
      </div>
    </section>
  )
}
