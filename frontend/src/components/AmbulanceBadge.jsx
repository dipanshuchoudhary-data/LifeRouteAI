export default function AmbulanceBadge({ available, total, eta, language, compact = false }) {
  const label = language === 'hi' ? 'एम्बुलेंस' : 'Ambulances'
  const etaLabel = language === 'hi' ? 'ETA' : 'ETA'

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
        style={{
          background: available > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${available > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: available > 0 ? '#86EFAC' : '#FCA5A5',
        }}
      >
        🚑 {available}/{total}
      </span>
    )
  }

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
        style={{ background: 'rgba(239,68,68,0.12)' }}
      >
        🚑
      </div>
      <div className="text-left">
        <p className="text-xs font-semibold text-text-primary">
          {available} / {total} {label}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
          {etaLabel}: ~{eta} min
        </p>
      </div>
      <span
        className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
        style={{
          background: available >= 2 ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
          color: available >= 2 ? '#86EFAC' : '#FDE047',
        }}
      >
        {available >= 2 ? (language === 'hi' ? 'उपलब्ध' : 'Available') : (language === 'hi' ? 'सीमित' : 'Limited')}
      </span>
    </div>
  )
}
