import { Activity, Languages, Radio, ShieldCheck, Siren, Stethoscope } from 'lucide-react'
import { ESI_LEGEND, PRODUCT_FEATURES } from '../../data/liferouteData'

const ICONS = [ShieldCheck, Stethoscope, Radio, Languages, Activity, Siren]

export default function FeatureShowcase() {
  return (
    <section className="lr-section" id="capabilities-section">
      <div className="lr-section-header">
        <div>
          <h2 className="lr-section-title">Built for the moment care has to be right</h2>
          <p className="lr-section-sub">Safety interception, live hospital telemetry, and a referral the receiving ER can actually use.</p>
        </div>
      </div>

      <div className="lr-esi-legend" aria-label="ESI levels">
        {ESI_LEGEND.map((item) => (
          <span key={item.level} className="lr-esi-chip" style={{ borderColor: `${item.color}55`, color: item.color }}>
            ESI {item.level} · {item.label}
          </span>
        ))}
      </div>

      <div className="lr-product-grid">
        {PRODUCT_FEATURES.map((item, index) => {
          const Icon = ICONS[index] || ShieldCheck
          return (
            <article key={item.title} className="lr-feature-col">
              <div className="lr-feature-col-head">
                <Icon size={18} color="#4DD4A0" />
                <h3>{item.title}</h3>
                {item.metric ? <span className="lr-feature-metric">{item.metric}</span> : null}
              </div>
              <p className="lr-feature-body">{item.body}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
