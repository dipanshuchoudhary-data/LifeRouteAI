import { useState, useCallback } from 'react'
import BackgroundLayer from '../components/BackgroundLayer'
import Navbar from '../components/Navbar'
import IntakeBar from '../components/IntakeBar'
import ProcessingSteps from '../components/ProcessingSteps'
import TriageCard from '../components/TriageCard'
import HospitalCardList from '../components/HospitalCard'
import ReferralPanel from '../components/ReferralPanel'
import HospitalsDirectory from '../components/HospitalsDirectory'
import useHospitals from '../hooks/useHospitals'

const DEFAULT_LOCATION = { lat: 28.6139, lng: 77.2090 }

export default function Home({ apiUrl }) {
  const [screen, setScreen] = useState('idle')
  const [input, setInput] = useState('')
  const [language, setLanguage] = useState('en')
  const [processingStep, setProcessingStep] = useState(1)
  const [result, setResult] = useState(null)
  const [referralOpen, setReferralOpen] = useState(false)
  const [error, setError] = useState(null)
  const { hospitals, loading: hospitalsLoading } = useHospitals(apiUrl)

  const simulateSteps = useCallback(async (fetchPromise) => {
    setProcessingStep(1)
    const stepInterval = setInterval(() => {
      setProcessingStep((prev) => (prev < 4 ? prev + 1 : prev))
    }, 1200)
    try {
      const data = await fetchPromise
      clearInterval(stepInterval)
      setProcessingStep(4)
      await new Promise((r) => setTimeout(r, 400))
      return data
    } catch (err) {
      clearInterval(stepInterval)
      throw err
    }
  }, [])

  const handleSubmit = async () => {
    if (!input.trim()) return
    setScreen('loading')
    setProcessingStep(1)
    setError(null)
    try {
      const data = await simulateSteps(
        fetch(`${apiUrl}/navigate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: input.trim(), location: DEFAULT_LOCATION }),
        }).then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.detail || `Request failed (${res.status})`)
          }
          return res.json()
        })
      )
      setResult(data)
      setScreen('results')
    } catch (err) {
      setError(err.message)
      setScreen('idle')
    }
  }

  const handleReset = () => {
    setScreen('idle')
    setResult(null)
    setInput('')
    setError(null)
  }

  if (screen === 'idle') {
    return (
      <>
        <IntakeBar
          apiUrl={apiUrl}
          input={input}
          setInput={setInput}
          language={language}
          setLanguage={setLanguage}
          onSubmit={handleSubmit}
          loading={false}
        />
        {error && (
          <div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 px-4 py-3 rounded-xl text-sm max-w-md text-center"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#FCA5A5' }}
          >
            {error}
            <button type="button" onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
          </div>
        )}
      </>
    )
  }

  if (screen === 'loading') {
    return <ProcessingSteps currentStep={processingStep} language={language} />
  }

  return (
    <div className="page-wrap min-h-screen flex flex-col">
      <BackgroundLayer />
      <Navbar
        language={language}
        setLanguage={setLanguage}
        rightSlot={
          <button type="button" onClick={handleReset} className="btn-outline px-4 py-2 text-xs">
            {language === 'hi' ? '← नया खोज' : '← New Search'}
          </button>
        }
      />

      <main className="page-center flex-1 py-6 space-y-8 pb-16">
        <TriageCard
          triageLevel={result.triage_level}
          reasoning={result.triage_reasoning}
          disclaimer={result.disclaimer}
          language={language}
        />

        <HospitalCardList
          facilities={result.matched_facilities}
          routingReason={result.routing_reason}
          language={language}
        />

        <div className="flex justify-center">
          <button type="button" onClick={() => setReferralOpen(true)} className="btn-gradient px-8 py-3.5 text-sm">
            {language === 'hi' ? '📄 रेफरल दस्तावेज़' : '📄 View Referral Document'}
          </button>
        </div>

        <div className="section-divider pt-10 mt-4">
          <HospitalsDirectory
            hospitals={hospitals.length ? hospitals : result.matched_facilities}
            loading={hospitalsLoading}
            language={language}
            highlightId={result.selected_facility?.id || result.selected_facility?.name}
          />
        </div>
      </main>

      <ReferralPanel
        open={referralOpen}
        onClose={() => setReferralOpen(false)}
        referralDoc={result.referral_doc}
        language={language}
      />
    </div>
  )
}
