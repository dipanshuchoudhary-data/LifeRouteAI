import { useEffect, useRef, useState } from 'react'
import { Check, ShieldAlert, Users, X } from 'lucide-react'

export default function SafetyCheckModal({
  open,
  reasons,
  family,
  stage,
  onFine,
  onHelp,
  onNotifyFamily,
  onEscalate,
  onDismiss,
}) {
  const notifyRef = useRef(onNotifyFamily)
  notifyRef.current = onNotifyFamily
  const [seconds, setSeconds] = useState(25)

  useEffect(() => {
    if (!open || stage !== 'ask') {
      setSeconds(25)
      return undefined
    }
    const timer = setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          clearInterval(timer)
          notifyRef.current?.()
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [open, stage])

  if (!open) return null

  return (
    <div className="sathi-modal" role="alertdialog" aria-modal="true" aria-labelledby="sathi-safety-title">
      <div className="sathi-dialog">
        {stage === 'ask' && (
          <>
            <h2 id="sathi-safety-title">Are you okay?</h2>
            <p>Your watch noticed something unusual. {(reasons || []).join('. ')}.</p>
            <p className="sathi-muted">If you do not answer in {seconds} seconds, Sathi will tell a trusted family member. This is not an ambulance yet.</p>
            <div className="sathi-actions">
              <button type="button" className="sathi-btn" onClick={onFine}><Check size={15} /> I am fine</button>
              <button type="button" className="sathi-btn-danger" onClick={onHelp}><ShieldAlert size={15} /> I need help</button>
            </div>
          </>
        )}
        {stage === 'family' && (
          <>
            <h2 id="sathi-safety-title"><Users size={22} style={{ marginRight: 8, verticalAlign: -4 }} />Family note prepared</h2>
            <p>
              {family?.name || 'A trusted person'}
              {family?.canEmergency !== false ? ' can receive this safety alert.' : ' was noted.'}
              {' '}
              Emergency help starts only if you or they ask.
            </p>
            <div className="sathi-actions">
              <button type="button" className="sathi-btn" onClick={onFine}><Check size={15} /> I am fine now</button>
              <button type="button" className="sathi-btn-danger" onClick={onEscalate}><ShieldAlert size={15} /> Start emergency help</button>
              <button type="button" className="sathi-btn-ghost" onClick={onDismiss}><X size={15} /> Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
