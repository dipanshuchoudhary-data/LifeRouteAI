import BackgroundLayer from './BackgroundLayer'
import Navbar from './Navbar'

const STEPS = [
  { id: 1, en: 'Analyzing symptoms', hi: 'लक्षणों का विश्लेषण', delayClass: 'animate-step-1' },
  { id: 2, en: 'Assessing urgency', hi: 'तात्कालिकता का आकलन', delayClass: 'animate-step-2' },
  { id: 3, en: 'Searching facilities', hi: 'सुविधाएं खोज रहे हैं', delayClass: 'animate-step-3' },
  { id: 4, en: 'Preparing your guide', hi: 'मार्गदर्शन तैयार कर रहे हैं', delayClass: 'animate-step-4' },
]

function MedicalCross() {
  return (
    <div
      className="relative w-16 h-16 mx-auto mb-10 flex items-center justify-center rounded-full"
      style={{ animation: 'crossPulse 2s ease-in-out infinite' }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <rect x="10" y="2" width="4" height="20" rx="1" fill="#EF4444" />
        <rect x="2" y="10" width="20" height="4" rx="1" fill="#EF4444" />
      </svg>
    </div>
  )
}

function StepIcon({ done, active }) {
  if (done) {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#22C55E"
          strokeWidth="2.5"
          style={{ animation: 'checkIn 0.3s ease-out forwards' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }
  if (active) {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ border: '2px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.1)' }}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ background: '#EF4444', animation: 'crossPulse 1.5s ease infinite' }}
        />
      </div>
    )
  }
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
    >
      ·
    </div>
  )
}

export default function ProcessingSteps({ currentStep, language }) {
  return (
    <div className="page-wrap min-h-screen flex flex-col">
      <BackgroundLayer />
      <Navbar language={language} />

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 w-full">
        <div className="page-center-narrow w-full flex flex-col items-center">
        <MedicalCross />

        <h2 className="font-bold text-xl text-text-primary mb-2 text-center">
          {language === 'hi' ? 'सही देखभाल खोज रहे हैं' : 'Finding the right care for you'}
        </h2>
        <p className="mb-12 text-center" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {language === 'hi' ? 'कृपया प्रतीक्षा करें...' : 'Please wait while we analyze and route...'}
        </p>

        <div className="w-full max-w-md space-y-3">
          {STEPS.map((step) => {
            const done = currentStep > step.id
            const active = currentStep === step.id
            const pending = currentStep < step.id

            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-2xl ${step.delayClass}`}
                style={{
                  background: done || active ? 'var(--bg-surface)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(239,68,68,0.35)' : 'var(--border-subtle)'}`,
                  opacity: pending ? 0.5 : 1,
                }}
              >
                <StepIcon done={done} active={active} />
                <span
                  className="font-medium text-[14px]"
                  style={{ color: done || active ? 'var(--text-primary)' : 'var(--text-muted)' }}
                >
                  {language === 'hi' ? step.hi : step.en}
                </span>
              </div>
            )
          })}
        </div>
        </div>
      </section>
    </div>
  )
}
