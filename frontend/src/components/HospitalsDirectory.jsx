import { useMemo, useState } from 'react'
import RatingStars from './RatingStars'
import AmbulanceBadge from './AmbulanceBadge'
import SpecialtyFilter, { extractSpecialties } from './SpecialtyFilter'

const INITIAL_LIMIT = 6

export default function HospitalsDirectory({
  hospitals,
  loading,
  language,
  highlightId,
  compact = false,
  initialLimit = INITIAL_LIMIT,
}) {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('all')
  const [specialty, setSpecialty] = useState('all')
  const [showAll, setShowAll] = useState(false)

  const specialties = useMemo(() => extractSpecialties(hospitals), [hospitals])
  const cities = useMemo(() => [...new Set(hospitals.map((h) => h.city))].sort(), [hospitals])

  const filtered = useMemo(() => {
    return hospitals
      .filter((h) => {
        if (city !== 'all' && h.city !== city) return false
        if (specialty !== 'all' && !(h.specialties || []).includes(specialty)) return false
        if (search && !h.name.toLowerCase().includes(search.toLowerCase())) return false
        return true
      })
      .sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999))
  }, [hospitals, city, specialty, search])

  const visible = showAll ? filtered : filtered.slice(0, initialLimit)
  const hasMore = filtered.length > initialLimit

  if (loading) {
    return (
      <div className="card-surface p-8 text-center" style={{ color: 'var(--text-muted)' }}>
        {language === 'hi' ? 'अस्पताल लोड हो रहे हैं...' : 'Loading hospitals...'}
      </div>
    )
  }

  return (
    <section className="w-full">
      <div className="text-center mb-10">
        <h2 className="font-bold text-xl text-text-primary mb-1">
          {language === 'hi' ? '🏥 नज़दीकी अस्पताल' : '🏥 Nearby Hospitals'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          {language === 'hi'
            ? `${filtered.length} सुविधाएं · सबसे नज़दीक पहले`
            : `${filtered.length} facilities · nearest first`}
        </p>
      </div>

      {!compact && (
        <>
          <div className="max-w-md mx-auto mb-6">
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowAll(false) }}
              placeholder={language === 'hi' ? 'अस्पताल खोजें...' : 'Search hospitals...'}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
              }}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {['all', ...cities].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setCity(c); setShowAll(false) }}
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={
                  city === c
                    ? { background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.4)', color: '#FDBA74' }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }
                }
              >
                {c === 'all' ? (language === 'hi' ? 'सभी शहर' : 'All Cities') : c}
              </button>
            ))}
          </div>

          <div className="mb-10">
            <SpecialtyFilter
              specialties={specialties}
              active={specialty}
              onChange={(s) => { setSpecialty(s); setShowAll(false) }}
              language={language}
            />
          </div>
        </>
      )}

      <div className={`grid gap-6 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {visible.map((h) => {
          const isHighlight = highlightId && (h.id === highlightId || h.name === highlightId)
          return (
            <article
              key={h.id || h.name}
              className={`card-surface p-5 text-left transition-all duration-200 ${isHighlight ? 'card-best' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-semibold text-[15px] text-text-primary">{h.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{h.city} · {h.distance_km} km</p>
                </div>
                {isHighlight && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--accent-gradient)' }}>
                    Match
                  </span>
                )}
              </div>

              <div className="mb-4">
                <RatingStars rating={h.rating} reviewCount={h.review_count} size="sm" />
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {(h.specialties || []).slice(0, 4).map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded-full text-[10px] capitalize"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4 text-center text-xs">
                <div className="py-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="font-bold text-text-primary">{h.available_beds}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{language === 'hi' ? 'बेड' : 'Beds'}</div>
                </div>
                <div className="py-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="font-bold text-text-primary">{h.emergency_wait_minutes}m</div>
                  <div style={{ color: 'var(--text-muted)' }}>{language === 'hi' ? 'प्रतीक्षा' : 'Wait'}</div>
                </div>
                <div className="py-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="font-bold text-text-primary">{h.current_capacity_percent}%</div>
                  <div style={{ color: 'var(--text-muted)' }}>{language === 'hi' ? 'भरा' : 'Full'}</div>
                </div>
              </div>

              <AmbulanceBadge
                available={h.ambulances_available ?? 2}
                total={h.ambulances_total ?? 4}
                eta={h.ambulance_eta_minutes ?? 8}
                language={language}
              />

              <div className="mt-4">
                <a
                  href={`tel:${(h.contact || '').replace(/\s/g, '')}`}
                  className="btn-gradient w-full py-2.5 text-center text-xs no-underline block"
                >
                  {language === 'hi' ? '📞 कॉल करें' : '📞 Call Hospital'}
                </a>
              </div>
            </article>
          )
        })}
      </div>

      {hasMore && !showAll && (
        <div className="flex justify-center mt-10">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="btn-outline px-8 py-3 text-sm"
          >
            {language === 'hi'
              ? `और देखें (${filtered.length - initialLimit} और)`
              : `See more (${filtered.length - initialLimit} more)`}
          </button>
        </div>
      )}

      {showAll && hasMore && (
        <div className="flex justify-center mt-10">
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="btn-outline px-8 py-3 text-sm"
          >
            {language === 'hi' ? 'कम दिखाएं' : 'Show less'}
          </button>
        </div>
      )}
    </section>
  )
}
