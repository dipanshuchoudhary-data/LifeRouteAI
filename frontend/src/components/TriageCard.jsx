const TRIAGE_CONFIG = {
  icu: {
    label: 'Critical / ICU',
    labelHi: 'गंभीर / ICU',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.15)',
    border: 'rgba(239,68,68,0.3)',
    text: '#FCA5A5',
  },
  emergency: {
    label: 'Emergency',
    labelHi: 'आपातकाल',
    color: '#F97316',
    bg: 'rgba(249,115,22,0.15)',
    border: 'rgba(249,115,22,0.3)',
    text: '#FDBA74',
  },
  clinic: {
    label: 'Clinic Visit',
    labelHi: 'क्लिनिक विज़िट',
    color: '#EAB308',
    bg: 'rgba(234,179,8,0.15)',
    border: 'rgba(234,179,8,0.3)',
    text: '#FDE047',
  },
  'self-care': {
    label: 'Self-Care',
    labelHi: 'घर पर देखभाल',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.15)',
    border: 'rgba(34,197,94,0.3)',
    text: '#86EFAC',
  },
}

export default function TriageCard({ triageLevel, reasoning, disclaimer, language }) {
  const config = TRIAGE_CONFIG[triageLevel] || TRIAGE_CONFIG.clinic

  return (
    <article
      className="card-surface overflow-hidden animate-fade-up"
      style={{ animation: 'fadeUp 0.3s ease-out forwards' }}
    >
      {/* Urgency strip */}
      <div style={{ height: 8, background: config.color, width: '100%' }} />

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {language === 'hi' ? 'तात्कालिकता' : 'Urgency Level'}
            </p>
            <p className="font-bold text-lg text-text-primary mt-0.5">
              {language === 'hi' ? config.labelHi : config.label}
            </p>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold uppercase"
            style={{ background: config.bg, color: config.text, border: `1px solid ${config.border}` }}
          >
            {triageLevel.replace('-', ' ')}
          </span>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.65 }}>
          {reasoning}
        </p>

        {disclaimer && (
          <p
            className="mt-4 pt-4 italic"
            style={{
              color: 'var(--text-muted)',
              fontSize: '11px',
              borderTop: '1px solid var(--border-subtle)',
              lineHeight: 1.5,
            }}
          >
            {disclaimer}
          </p>
        )}
      </div>
    </article>
  )
}
