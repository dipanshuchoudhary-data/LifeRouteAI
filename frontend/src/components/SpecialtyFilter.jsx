const SPECIALTY_ICONS = {
  cardiology: '❤️',
  trauma: '🚑',
  neurology: '🧠',
  oncology: '🎗️',
  orthopedics: '🦴',
  'general medicine': '🩺',
  'emergency medicine': '⚡',
  'critical care': '🏥',
  default: '⚕️',
}

export default function SpecialtyFilter({ specialties, active, onChange, language }) {
  return (
    <div className="w-full">
      <p
        className="text-center mb-3 font-semibold text-sm text-text-primary"
      >
        {language === 'hi' ? 'विशेषज्ञता के अनुसार खोजें' : 'Browse by Specialty'}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => onChange('all')}
          className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
          style={
            active === 'all'
              ? { background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5' }
              : { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }
          }
        >
          {language === 'hi' ? 'सभी' : 'All'}
        </button>
        {specialties.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-200"
            style={
              active === s
                ? { background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5' }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }
            }
          >
            {SPECIALTY_ICONS[s.toLowerCase()] || SPECIALTY_ICONS.default}{' '}
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export function extractSpecialties(hospitals) {
  const set = new Set()
  hospitals.forEach((h) => (h.specialties || []).forEach((s) => set.add(s)))
  return [...set].sort().slice(0, 12)
}
