import BackgroundLayer from './BackgroundLayer'
import Navbar from './Navbar'
import useHospitals from '../hooks/useHospitals'
import HospitalsDirectory from './HospitalsDirectory'

const EMERGENCY_TILES = [
  {
    id: 'chest',
    icon: '❤️',
    label: 'Chest Pain',
    labelHi: 'सीने में दर्द',
    sub: 'Cardiac emergency',
    subHi: 'हृदय आपातकाल',
    text: 'I have severe chest pain and difficulty breathing',
    textHi: 'मुझे तेज़ सीने में दर्द और सांस लेने में तकलीफ है',
  },
  {
    id: 'stroke',
    icon: '🧠',
    label: 'Stroke Symptoms',
    labelHi: 'स्ट्रोक के लक्षण',
    sub: 'Neurological urgent',
    subHi: 'तंत्रिका आपात',
    text: 'Sudden face drooping, slurred speech, and numbness on one side',
    textHi: 'अचानक चेहरे का झुकना, बोलने में कठिनाई और एक तरफ सुन्नता',
  },
  {
    id: 'trauma',
    icon: '🚑',
    label: 'Accident / Trauma',
    labelHi: 'दुर्घटना / आघात',
    sub: 'Major injury',
    subHi: 'गंभीर चोट',
    text: 'Road accident with head injury and bleeding',
    textHi: 'सड़क दुर्घटना, सिर में चोट और खून बह रहा है',
  },
]

const STATS = [
  { num: '15+', label: 'Hospitals' },
  { num: '<30s', label: 'Routing' },
  { num: '3', label: 'Cities' },
  { num: 'AI', label: 'Powered' },
]

export default function IntakeBar({ apiUrl, input, setInput, language, setLanguage, onSubmit, loading }) {
  const { hospitals, loading: hospitalsLoading } = useHospitals(apiUrl)

  const handleTile = (tile) => {
    setInput(language === 'hi' ? tile.textHi : tile.text)
  }

  return (
    <div className="page-wrap min-h-screen flex flex-col">
      <BackgroundLayer />
      <Navbar language={language} setLanguage={setLanguage} />

      {/* Hero — vertically centered block */}
      <div className="flex flex-col items-center justify-center px-6 py-10 w-full">
        <section className="page-center-narrow flex flex-col items-center justify-center text-center w-full">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 animate-fade-up"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#FCA5A5',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            {language === 'hi' ? 'AI-संचालित स्वास्थ्य नेविगेशन' : 'AI-powered healthcare navigation'}
          </div>

          <h1
            className="font-extrabold leading-[1.1] mb-4 animate-fade-up mx-auto"
            style={{ fontSize: 'clamp(32px, 6vw, 48px)', letterSpacing: '-1.5px', maxWidth: '520px' }}
          >
            <span className="text-text-primary block">
              {language === 'hi' ? 'सही अस्पताल।' : 'Right hospital.'}
            </span>
            <span className="text-gradient-animated block">
              {language === 'hi' ? 'सही समय।' : 'Right time.'}
            </span>
            <span className="text-text-primary block">
              {language === 'hi' ? 'हर बार।' : 'Every time.'}
            </span>
          </h1>

          <p
            className="mx-auto mb-10 animate-fade-up max-w-[440px]"
            style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px', lineHeight: 1.6 }}
          >
            {language === 'hi'
              ? 'अपने लक्षण बताएं — हम आपको सबसे सुसज्जित अस्पताल तक पहुंचाएंगे।'
              : 'Describe your symptoms — we route you to the best-equipped hospital.'}
          </p>

          <div className="symptom-input-wrap animate-fade-up w-full">
            <svg
              className="absolute left-[18px] top-1/2 -translate-y-1/2 pointer-events-none"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
            >
              <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <input
              type="text"
              className="symptom-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && input.trim() && onSubmit()}
              placeholder={
                language === 'hi'
                  ? 'अपने लक्षण बताएं...'
                  : 'Describe your symptoms... e.g. severe chest pain'
              }
            />
            <button
              type="button"
              onClick={onSubmit}
              disabled={loading || !input.trim()}
              aria-disabled={loading || !input.trim()}
              className="btn-gradient absolute right-[10px] top-1/2 -translate-y-1/2 px-5 py-2.5 text-sm"
            >
              {language === 'hi' ? 'देखभाल खोजें →' : 'Find Care →'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[600px] mx-auto mb-10 animate-fade-up">
            {EMERGENCY_TILES.map((tile) => (
              <button key={tile.id} type="button" className="emergency-tile" onClick={() => handleTile(tile)}>
                <div className="text-2xl mb-2">{tile.icon}</div>
                <div className="font-semibold text-white text-[13px] mb-0.5">
                  {language === 'hi' ? tile.labelHi : tile.label}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  {language === 'hi' ? tile.subHi : tile.sub}
                </div>
              </button>
            ))}
          </div>

          <div
            className="grid grid-cols-4 gap-4 pt-7 animate-fade-up w-full max-w-[600px] mx-auto section-divider"
          >
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-gradient font-bold text-[22px]">{s.num}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Hospital network — centered below hero */}
      <div className="page-center pb-16 pt-8 mt-4">
        <div className="section-divider mb-12" />
        <HospitalsDirectory
          hospitals={hospitals}
          loading={hospitalsLoading}
          language={language}
        />
      </div>
    </div>
  )
}
