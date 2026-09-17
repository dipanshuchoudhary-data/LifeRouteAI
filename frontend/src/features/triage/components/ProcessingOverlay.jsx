import { CheckCircle2, Loader2 } from 'lucide-react'
import { NODE_LABELS } from '../../../data/liferouteData'

const STEPS = ['safety_sentinel', 'triage', 'ranking', 'referral']

export default function ProcessingOverlay({ activeNode }) {
  const current = STEPS.indexOf(activeNode)
  const idx = current === -1 ? 1 : current
  return (
    <div className="lr-processing-overlay">
      <div className="lr-processing-card">
        <Loader2 size={32} className="lr-spinner" />
        <h3>Clinical navigation engine</h3>
        <div className="lr-proc-steps">
          {STEPS.map((step, i) => (
            <div key={step} className={`lr-proc-step ${idx > i ? 'done' : idx === i ? 'active' : ''}`}>
              {idx > i ? <CheckCircle2 size={16} /> : idx === i ? <Loader2 size={16} className="lr-spinner" /> : <div className="lr-proc-dot" />}
              <span>{NODE_LABELS[step] || step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
