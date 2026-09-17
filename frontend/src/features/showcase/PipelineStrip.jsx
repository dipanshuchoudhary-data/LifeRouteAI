import { PIPELINE_STEPS } from '../../data/liferouteData'

export default function PipelineStrip({ activeNode, compact = false }) {
  const activeIndex = {
    safety_sentinel: 0,
    emergency_fast_track: 0,
    intake: 1,
    triage: 2,
    geo_router: 3,
    hospital_capacity: 3,
    ranking: 4,
    referral: 5,
    disclaimer: 5,
  }[activeNode] ?? -1

  return (
    <section className={compact ? 'lr-how-embed' : 'lr-section'} id="pipeline-section">
      <div className="lr-section-header">
        <div>
          <h2 className="lr-section-title">How routing works</h2>
          <p className="lr-section-sub">Safety check first. Generative AI only if the patient is stable. Travel time and bed telemetry run together.</p>
        </div>
      </div>
      <ol className="lr-pipeline">
        {PIPELINE_STEPS.map((step, index) => (
          <li key={step.id} className={`lr-pipeline-step ${index === activeIndex ? 'active' : ''} ${index < activeIndex ? 'done' : ''}`}>
            <span className="lr-pipeline-index">{index + 1}</span>
            <strong>{step.label}</strong>
            <em>{step.hint}</em>
          </li>
        ))}
      </ol>
    </section>
  )
}
