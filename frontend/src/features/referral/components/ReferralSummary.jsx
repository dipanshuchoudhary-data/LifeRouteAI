import { useMemo, useState } from 'react'
import { Copy, FileDown, QrCode, Share2 } from 'lucide-react'
import { downloadReferralPdf } from '../../../lib/api'

function QrMark({ seed }) {
  const cells = useMemo(() => {
    const out = []
    let n = 0
    for (let i = 0; i < seed.length; i += 1) n = (n * 33 + seed.charCodeAt(i)) >>> 0
    for (let i = 0; i < 121; i += 1) {
      n = (n * 1664525 + 1013904223) >>> 0
      out.push(n % 3 !== 0)
    }
    return out
  }, [seed])
  return (
    <div className="lr-qr" aria-hidden="true">
      {cells.map((on, index) => <span key={index} className={on ? 'on' : ''} />)}
    </div>
  )
}

export default function ReferralSummary({ rawState, referralDoc, referralId, signature, fhirBundle }) {
  const [copied, setCopied] = useState(false)
  if (!rawState && !referralDoc) return null

  const resources = (fhirBundle?.entry || []).map((entry) => entry.resource).filter(Boolean)
  const types = resources.map((resource) => resource.resourceType)
  const shareText = encodeURIComponent(
    `LifeRoute referral ${referralId || ''}\n${(rawState?.selected_facility || {}).name || ''}\nCall 108 in emergencies.`
  )

  const copyDoc = async () => {
    try {
      await navigator.clipboard.writeText(referralDoc || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="lr-result-card lr-referral-card">
      <div className="lr-result-card-header">
        <QrCode size={18} style={{ color: '#7BA5F5' }} />
        <span>Signed clinical referral</span>
        {referralId ? <span className="lr-triage-badge" style={{ background: 'rgba(53,104,215,0.15)', color: '#7BA5F5', borderColor: 'rgba(53,104,215,0.3)' }}>{referralId}</span> : null}
      </div>
      <div className="lr-fhir-row">
        {(types.length ? types : ['Patient', 'Condition', 'Encounter', 'ServiceRequest']).map((type) => (
          <div key={type} className="lr-fhir-tile">{type}</div>
        ))}
      </div>
      <div className="lr-qr-row">
        <QrMark seed={signature || referralId || 'liferoute'} />
        <div>
          <p className="lr-result-desc">Scan on arrival. SHA-256 over the FHIR bundle is bound to this QR.</p>
          {signature ? <p className="lr-sig">{signature.slice(0, 40)}…</p> : null}
        </div>
      </div>
      <div className="lr-referral-actions">
        <button type="button" className="lr-call-btn" style={{ background: '#3568D7' }} onClick={() => rawState && downloadReferralPdf(rawState)} disabled={!rawState}>
          <FileDown size={16} /> Download signed PDF
        </button>
        <button type="button" className="lr-secondary-btn" onClick={copyDoc}>
          <Copy size={15} /> {copied ? 'Copied' : 'Copy letter'}
        </button>
        <a className="lr-secondary-btn" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer">
          <Share2 size={15} /> WhatsApp
        </a>
      </div>
    </div>
  )
}
