export default function HospitalMap({ hospital, hospitals, language }) {
  const list = hospitals?.length ? hospitals : hospital ? [hospital] : []
  const target = hospital || list[0] || null

  if (!target?.embed_maps_url && !target?.lat) {
    return (
      <div
        className="card-surface flex items-center justify-center h-48 rounded-2xl"
        style={{ color: 'var(--text-muted)', fontSize: '13px' }}
      >
        {language === 'hi' ? 'मानचित्र लोड हो रहा है...' : 'Select a hospital to view map'}
      </div>
    )
  }

  const isNetwork = !hospital && list.length > 1
  const embedUrl = isNetwork
    ? 'https://maps.google.com/maps?q=Delhi+NCR+hospitals&z=10&output=embed'
    : target.embed_maps_url || `https://maps.google.com/maps?q=${target.lat},${target.lng}&z=14&output=embed`

  const openUrl = isNetwork
    ? 'https://www.google.com/maps/search/hospitals/@28.6139,77.209,11z'
    : target.maps_url || `https://www.google.com/maps/search/?api=1&query=${target.lat},${target.lng}`

  return (
    <div className="card-surface overflow-hidden rounded-2xl w-full">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="text-left">
          <p className="font-semibold text-sm text-text-primary">
            {isNetwork
              ? (language === 'hi' ? '📍 अस्पताल नेटवर्क' : '📍 Hospital Network Map')
              : (language === 'hi' ? '📍 स्थान' : '📍 Location')}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            {isNetwork
              ? (language === 'hi' ? `${list.length} सुविधाएं · Delhi NCR` : `${list.length} facilities · Delhi NCR`)
              : `${target.name} · ${target.city}`}
          </p>
        </div>
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gradient px-3 py-1.5 text-xs no-underline shrink-0"
        >
          {language === 'hi' ? 'खोलें' : 'Open Maps'}
        </a>
      </div>
      <iframe
        title={isNetwork ? 'Hospital network map' : `Map - ${target.name}`}
        src={embedUrl}
        className="w-full border-0"
        style={{ height: isNetwork ? 280 : 220 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {isNetwork && (
        <div
          className="flex flex-wrap gap-1.5 px-4 py-3"
          style={{ borderTop: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}
        >
          {list.slice(0, 6).map((h) => (
            <span
              key={h.id || h.name}
              className="px-2 py-0.5 rounded-full text-[10px]"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
            >
              {h.name.split(' ')[0]} · {h.city}
            </span>
          ))}
          {list.length > 6 && (
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              +{list.length - 6} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}
