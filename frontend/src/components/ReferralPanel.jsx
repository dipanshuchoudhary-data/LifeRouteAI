import { useEffect } from 'react'

function MarkdownContent({ content }) {
  if (!content) return null
  const lines = content.split('\n')
  const elements = []

  lines.forEach((line, i) => {
    const t = line.trim()
    if (t.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-xl font-bold text-text-primary mb-3">{t.slice(2)}</h1>)
    } else if (t.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-gradient font-bold text-base mt-5 mb-2">{t.slice(3)}</h2>)
    } else if (t.startsWith('### ')) {
      elements.push(<h3 key={i} className="font-semibold text-text-primary mt-3 mb-1">{t.slice(4)}</h3>)
    } else if (t.startsWith('- ')) {
      elements.push(<li key={i} className="ml-4 list-disc mb-1" style={{ color: 'var(--text-secondary)' }}>{t.slice(2)}</li>)
    } else if (t.startsWith('---')) {
      elements.push(<hr key={i} style={{ borderColor: 'var(--border-subtle)', margin: '16px 0' }} />)
    } else if (t.startsWith('*') && t.endsWith('*')) {
      elements.push(<p key={i} className="italic mt-4" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{t.replace(/\*/g, '')}</p>)
    } else if (t) {
      elements.push(<p key={i} className="mb-2" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t}</p>)
    }
  })

  return <div>{elements}</div>
}

export default function ReferralPanel({ open, onClose, referralDoc, language }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handlePrint = () => {
    const w = window.open('', '_blank')
    w.document.write(`<pre style="font-family:Inter,sans-serif;padding:32px;white-space:pre-wrap">${referralDoc}</pre>`)
    w.document.close()
    w.print()
  }

  const handleWhatsApp = () => {
    const summary = referralDoc.replace(/[#*]/g, '').split('\n').filter(Boolean).slice(0, 12).join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(`LifeRoute AI Referral:\n\n${summary}`)}`, '_blank')
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose} aria-hidden="true" />
      <aside
        className="fixed top-0 right-0 h-full z-50 flex flex-col w-full sm:w-[420px]"
        style={{
          background: 'var(--bg-elevated)',
          borderLeft: '1px solid var(--border-subtle)',
          animation: 'slideIn 0.3s ease-out forwards',
        }}
      >
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h2 className="font-bold text-text-primary">{language === 'hi' ? 'रेफरल दस्तावेज़' : 'Referral Document'}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              {language === 'hi' ? 'अस्पताल के साथ ले जाएं' : 'Take this with you to the hospital'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-xl"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <MarkdownContent content={referralDoc} />
        </div>

        <div className="p-4 flex gap-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button type="button" onClick={handlePrint} className="btn-outline flex-1 py-3 text-sm">
            {language === 'hi' ? 'PDF डाउनलोड' : 'Download PDF'}
          </button>
          <button type="button" onClick={handleWhatsApp} className="btn-whatsapp flex-1 py-3 text-sm">
            WhatsApp
          </button>
        </div>
      </aside>
    </>
  )
}
