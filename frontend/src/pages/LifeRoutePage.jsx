import { useState, useRef, useEffect } from 'react'
import {
  ShieldPlus, Zap, Mic, ArrowRight, HeartPulse, Brain, Ambulance, Thermometer,
  Wind, Baby, MapPin, Star, Navigation, Phone, SlidersHorizontal, LayoutGrid,
  Heart, Bone, Microscope, Stethoscope, Venus, Droplet, PhoneCall, Activity,
  Clock, AlertTriangle, CheckCircle2, Route, X, Siren, Truck, BedDouble,
  Loader2, ChevronRight, Shield, Radio, Gauge, Cross, Waves,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════════════════ */

const NAV_LINKS = [
  { label: 'Hospitals', id: 'hospitals-section' },
  { label: 'Ambulance', id: 'ambulance-section' },
  { label: 'Blood Bank', id: 'blood-bank-section' },
  { label: 'ICU Tracker', id: 'icu-section' },
]

const CHIPS = [
  { label: 'Chest Pain', icon: HeartPulse, query: 'Chest pain / cardiac emergency', color: 'red', severity: 'critical' },
  { label: 'Stroke', icon: Brain, query: 'Stroke symptoms — face drooping, arm weakness', color: 'red', severity: 'critical' },
  { label: 'Accident / Trauma', icon: Ambulance, query: 'Accident or major trauma injury', color: 'red', severity: 'critical' },
  { label: 'High Fever', icon: Thermometer, query: 'High fever above 103°F', color: 'amber', severity: 'urgent' },
  { label: 'Breathing Issues', icon: Wind, query: 'Severe breathing difficulty', color: 'blue', severity: 'critical' },
  { label: 'Child Emergency', icon: Baby, query: 'Child emergency pediatric care', color: 'amber', severity: 'urgent' },
]

const STATS = [
  { val: '15+', label: 'Hospitals Live', accent: false },
  { val: '<30s', label: 'Avg. Routing', accent: true },
  { val: '3', label: 'Cities', accent: false },
  { val: 'AI', label: 'Powered', accent: false },
]

const CITIES = ['All Cities', 'Delhi', 'Gurgaon', 'Noida']

const SPECIALTIES = [
  { label: 'All', icon: LayoutGrid },
  { label: 'Cardiology', icon: Heart },
  { label: 'Neurology', icon: Brain },
  { label: 'Orthopedics', icon: Bone },
  { label: 'Trauma', icon: Ambulance },
  { label: 'Oncology', icon: Microscope },
  { label: 'General', icon: Stethoscope },
  { label: 'Gynecology', icon: Venus },
  { label: 'Nephrology', icon: Droplet },
]

const TAG_COLOR_MAP = {
  'Cardiology': { bg: 'rgba(229,57,53,0.10)', text: '#FF8A9A', border: 'rgba(229,57,53,0.25)' },
  'Cardiac Surgery': { bg: 'rgba(229,57,53,0.10)', text: '#FF8A9A', border: 'rgba(229,57,53,0.25)' },
  'Interventional Cardiology': { bg: 'rgba(229,57,53,0.10)', text: '#FF8A9A', border: 'rgba(229,57,53,0.25)' },
  'Critical Care': { bg: 'rgba(229,57,53,0.10)', text: '#FF8A9A', border: 'rgba(229,57,53,0.25)' },
  'Neurology': { bg: 'rgba(123,69,216,0.12)', text: '#C49EF5', border: 'rgba(123,69,216,0.30)' },
  'Oncology': { bg: 'rgba(245,158,11,0.10)', text: '#FAC75A', border: 'rgba(245,158,11,0.25)' },
  'Orthopedics': { bg: 'rgba(34,197,94,0.10)', text: '#4DD4A0', border: 'rgba(34,197,94,0.25)' },
  'General Medicine': { bg: 'rgba(255,255,255,0.05)', text: '#A0A0A0', border: 'rgba(255,255,255,0.12)' },
  'General Surgery': { bg: 'rgba(255,255,255,0.05)', text: '#A0A0A0', border: 'rgba(255,255,255,0.12)' },
  'Trauma': { bg: 'rgba(245,158,11,0.10)', text: '#FAC75A', border: 'rgba(245,158,11,0.25)' },
  'Gynecology': { bg: 'rgba(232,53,137,0.10)', text: '#F580BC', border: 'rgba(232,53,137,0.25)' },
  'Pediatrics': { bg: 'rgba(53,104,215,0.10)', text: '#7BA5F5', border: 'rgba(53,104,215,0.25)' },
}
const DEFAULT_TAG_COLOR = { bg: 'rgba(255,255,255,0.05)', text: '#888', border: 'rgba(255,255,255,0.10)' }

const HOSPITALS = [
  {
    id: 1, name: 'Fortis Escorts Heart Institute', govt: false, city: 'Delhi',
    rating: 4.6, reviews: 1759, distance: '6.5 km',
    tags: ['Cardiology', 'Cardiac Surgery', 'Interventional Cardiology', 'Critical Care'],
    beds: 55, wait: '~10 min', capacity: 82,
  },
  {
    id: 2, name: 'Max Super Speciality Hospital', govt: false, city: 'Delhi',
    rating: 4.4, reviews: 1896, distance: '7.1 km',
    tags: ['General Medicine', 'Oncology', 'Neurology', 'Orthopedics'],
    beds: 78, wait: '~12 min', capacity: 84,
  },
  {
    id: 3, name: 'AIIMS Trauma Centre', govt: true, city: 'Delhi',
    rating: 4.5, reviews: 1622, distance: '8.2 km',
    tags: ['Trauma', 'Neurology', 'Critical Care', 'General Surgery'],
    beds: 120, wait: '~8 min', capacity: 71,
  },
  {
    id: 4, name: 'Safdarjung Hospital', govt: true, city: 'Delhi',
    rating: 3.8, reviews: 2170, distance: '9 km',
    tags: ['General Medicine', 'Orthopedics', 'Gynecology', 'Pediatrics'],
    beds: 200, wait: '~20 min', capacity: 91,
  },
]

const NEARBY_AMBULANCES = [
  { id: 'AMB-01', type: 'ALS', callSign: 'DELHI-ALS-017', driver: 'Rajesh Kumar', distance: '1.2 km', eta: '3 min', status: 'available', equipment: ['Defibrillator', 'Ventilator', 'Cardiac Monitor'], phone: '+91 98765 43210' },
  { id: 'AMB-02', type: 'BLS', callSign: 'DELHI-BLS-042', driver: 'Amit Sharma', distance: '2.4 km', eta: '5 min', status: 'available', equipment: ['First Aid', 'Oxygen', 'Stretcher'], phone: '+91 98765 43211' },
  { id: 'AMB-03', type: 'ALS', callSign: 'DELHI-ALS-009', driver: 'Sunil Verma', distance: '3.1 km', eta: '7 min', status: 'available', equipment: ['Defibrillator', 'Ventilator', 'IV Setup'], phone: '+91 98765 43212' },
  { id: 'AMB-04', type: 'BLS', callSign: 'NCR-BLS-088', driver: 'Pradeep Singh', distance: '4.5 km', eta: '9 min', status: 'en-route', equipment: ['First Aid', 'Oxygen', 'Stretcher'], phone: '+91 98765 43213' },
  { id: 'AMB-05', type: 'ALS', callSign: 'DELHI-ALS-031', driver: 'Vikram Yadav', distance: '5.8 km', eta: '12 min', status: 'available', equipment: ['Defibrillator', 'Cardiac Monitor', 'Drug Kit'], phone: '+91 98765 43214' },
]

const BLOOD_BANKS = [
  { id: 1, name: 'Indian Red Cross Society', city: 'Delhi', distance: '3.2 km', stocks: { 'A+': 24, 'A-': 8, 'B+': 31, 'B-': 5, 'AB+': 12, 'AB-': 3, 'O+': 45, 'O-': 9 }, lastUpdated: '2 min ago', phone: '+91 11 2371 6441' },
  { id: 2, name: 'Rotary Blood Bank', city: 'Delhi', distance: '5.1 km', stocks: { 'A+': 18, 'A-': 6, 'B+': 22, 'B-': 3, 'AB+': 9, 'AB-': 2, 'O+': 38, 'O-': 7 }, lastUpdated: '5 min ago', phone: '+91 11 2658 8836' },
  { id: 3, name: 'AIIMS Blood Centre', city: 'Delhi', distance: '8.2 km', stocks: { 'A+': 42, 'A-': 14, 'B+': 56, 'B-': 11, 'AB+': 18, 'AB-': 6, 'O+': 67, 'O-': 15 }, lastUpdated: '1 min ago', phone: '+91 11 2659 3371' },
]

const ICU_DATA = [
  { id: 1, hospital: 'Fortis Escorts Heart Institute', totalICU: 30, occupiedICU: 24, ventilators: { total: 15, available: 4 }, type: 'Cardiac ICU', lastUpdated: '30s ago' },
  { id: 2, hospital: 'Max Super Speciality Hospital', totalICU: 45, occupiedICU: 39, ventilators: { total: 20, available: 5 }, type: 'Multi-specialty ICU', lastUpdated: '1 min ago' },
  { id: 3, hospital: 'AIIMS Trauma Centre', totalICU: 60, occupiedICU: 41, ventilators: { total: 30, available: 12 }, type: 'Trauma ICU', lastUpdated: '15s ago' },
  { id: 4, hospital: 'Safdarjung Hospital', totalICU: 40, occupiedICU: 37, ventilators: { total: 18, available: 2 }, type: 'General ICU', lastUpdated: '45s ago' },
  { id: 5, hospital: 'Sir Ganga Ram Hospital', totalICU: 35, occupiedICU: 28, ventilators: { total: 16, available: 6 }, type: 'Neuro ICU', lastUpdated: '2 min ago' },
]

const EMERGENCY_RESULTS = {
  'Chest Pain': {
    triage: 'CRITICAL', triageColor: '#FF4444',
    assessment: 'Possible acute coronary syndrome detected. Immediate cardiac evaluation required. ECG and troponin test recommended within 10 minutes of arrival.',
    matchedHospital: HOSPITALS[0],
    matchReason: 'Best match: Fortis Escorts — Top-rated cardiac center with interventional cardiology, 6.5 km away, 55 beds available.',
    ambulance: NEARBY_AMBULANCES[0],
    route: { distance: '6.5 km', duration: '8 min', traffic: 'Moderate', via: 'Ring Road → Mathura Road → Okhla', alternateVia: 'Lodhi Road → Aurobindo Marg', alternateTime: '11 min' },
    actions: ['Chew 325mg Aspirin if available', 'Loosen tight clothing', 'Sit upright, do not lie flat', 'Stay calm, breathe slowly'],
  },
  'Stroke': {
    triage: 'CRITICAL', triageColor: '#FF4444',
    assessment: 'Suspected cerebrovascular accident (stroke). Time-critical: golden window is 3–4.5 hours for thrombolysis. FAST assessment positive.',
    matchedHospital: HOSPITALS[2],
    matchReason: 'Best match: AIIMS Trauma Centre — Level-1 stroke center with neurology and critical care, 8.2 km, 120 beds.',
    ambulance: NEARBY_AMBULANCES[0],
    route: { distance: '8.2 km', duration: '10 min', traffic: 'Light', via: 'Outer Ring Road → AIIMS Flyover', alternateVia: 'Safdarjung → Ring Road', alternateTime: '14 min' },
    actions: ['Note exact time symptoms started', 'Do NOT give food or water', 'Keep head elevated at 30°', 'Do not administer any medication'],
  },
  'Accident / Trauma': {
    triage: 'CRITICAL', triageColor: '#FF4444',
    assessment: 'Major trauma reported. Multi-system injury evaluation needed. Spine immobilization protocol recommended until cleared.',
    matchedHospital: HOSPITALS[2],
    matchReason: 'Best match: AIIMS Trauma Centre — Dedicated trauma center with surgical team on standby, 8.2 km.',
    ambulance: NEARBY_AMBULANCES[2],
    route: { distance: '8.2 km', duration: '10 min', traffic: 'Light', via: 'Outer Ring Road → AIIMS Flyover', alternateVia: 'INA → Ring Road', alternateTime: '13 min' },
    actions: ['Do NOT move the patient unless in danger', 'Apply pressure to any visible bleeding', 'Stabilize neck and spine', 'Call 112 immediately'],
  },
  'High Fever': {
    triage: 'URGENT', triageColor: '#E8A000',
    assessment: 'High-grade pyrexia (>103°F). Rule out dengue, malaria, typhoid. Blood work recommended. Monitor for signs of dehydration.',
    matchedHospital: HOSPITALS[1],
    matchReason: 'Best match: Max Super Speciality — General medicine with full pathology lab, 7.1 km, rapid testing available.',
    ambulance: NEARBY_AMBULANCES[1],
    route: { distance: '7.1 km', duration: '9 min', traffic: 'Moderate', via: 'Press Enclave Marg → Saket', alternateVia: 'Mehrauli-Badarpur Rd', alternateTime: '12 min' },
    actions: ['Give paracetamol (not aspirin)', 'Keep hydrated with ORS or water', 'Tepid sponging with lukewarm water', 'Wear light clothing'],
  },
  'Breathing Issues': {
    triage: 'CRITICAL', triageColor: '#FF4444',
    assessment: 'Acute respiratory distress. SpO2 monitoring needed immediately. May require supplemental oxygen or nebulization.',
    matchedHospital: HOSPITALS[0],
    matchReason: 'Best match: Fortis Escorts — Critical care unit with ventilator support, 6.5 km, pulmonology team available.',
    ambulance: NEARBY_AMBULANCES[0],
    route: { distance: '6.5 km', duration: '8 min', traffic: 'Moderate', via: 'Ring Road → Mathura Road', alternateVia: 'Lodhi Road → AIIMS Flyover', alternateTime: '11 min' },
    actions: ['Sit upright, lean slightly forward', 'Remove any tight clothing', 'Use inhaler if prescribed', 'Open windows for fresh air'],
  },
  'Child Emergency': {
    triage: 'URGENT', triageColor: '#E8A000',
    assessment: 'Pediatric emergency — age-specific vitals and weight-based dosing required. Pediatric specialist evaluation recommended.',
    matchedHospital: HOSPITALS[3],
    matchReason: 'Best match: Safdarjung Hospital — Large pediatric department with 24/7 emergency, 9 km, 200 beds.',
    ambulance: NEARBY_AMBULANCES[1],
    route: { distance: '9 km', duration: '12 min', traffic: 'Moderate', via: 'Ring Road → Safdarjung', alternateVia: 'Aurobindo Marg → AIIMS Flyover', alternateTime: '15 min' },
    actions: ['Stay calm, reassure the child', 'Note symptoms and duration', 'Check temperature if possible', 'Do not self-medicate'],
  },
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

function getCapacityColor(pct) {
  if (pct > 85) return '#FF6B7A'
  if (pct > 70) return '#FAC75A'
  return '#4DD4A0'
}
function getCapacityBarColor(pct) {
  if (pct > 85) return '#E53935'
  if (pct > 70) return '#E8A000'
  return '#00A86B'
}
function getCapacityLabel(pct) {
  if (pct > 85) return 'Critical demand'
  if (pct > 70) return 'High demand'
  return 'Normal capacity'
}
function getWaitColor(waitStr) {
  const num = parseInt(waitStr.replace(/[^0-9]/g, ''), 10)
  if (num >= 20) return '#FF8A9A'
  if (num >= 12) return '#FAC75A'
  return '#4DD4A0'
}
function getBloodColor(units) {
  if (units <= 5) return '#FF6B7A'
  if (units <= 15) return '#FAC75A'
  return '#4DD4A0'
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function LifeRoutePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [activeCity, setActiveCity] = useState('All Cities')
  const [activeSpec, setActiveSpec] = useState('All')
  const [emergencyResult, setEmergencyResult] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [activeNavLink, setActiveNavLink] = useState(null)
  const [isListening, setIsListening] = useState(false)

  const resultRef = useRef(null)

  // IntersectionObserver to auto-update active navbar link on scroll
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -50% 0px',
      threshold: 0.1,
    }

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveNavLink(entry.target.id)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    NAV_LINKS.forEach((link) => {
      const el = document.getElementById(link.id)
      if (el) observer.observe(el)
    })

    return () => {
      NAV_LINKS.forEach((link) => {
        const el = document.getElementById(link.id)
        if (el) observer.unobserve(el)
      })
    }
  }, [])

  const filtered = HOSPITALS.filter((h) => {
    const cityMatch = activeCity === 'All Cities' || h.city === activeCity
    const specMatch = activeSpec === 'All' || h.tags.some((t) => t.includes(activeSpec))
    return cityMatch && specMatch
  })

  const handleEmergencyTrigger = (chipLabel) => {
    const result = EMERGENCY_RESULTS[chipLabel]
    if (!result) return

    setSearchQuery(CHIPS.find(c => c.label === chipLabel)?.query || chipLabel)
    setIsProcessing(true)
    setProcessingStep(0)
    setEmergencyResult(null)

    const steps = [1, 2, 3, 4]
    let i = 0
    const interval = setInterval(() => {
      setProcessingStep(steps[i])
      i++
      if (i >= steps.length) {
        clearInterval(interval)
        setTimeout(() => {
          setIsProcessing(false)
          setEmergencyResult(result)
          setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        }, 400)
      }
    }, 600)
  }

  const handleMicClick = () => {
    if (isListening || isProcessing) return
    setIsListening(true)
    setSearchQuery('Listening...')
    setTimeout(() => {
      setSearchQuery('severe chest pain and breathing difficulty')
      setTimeout(() => {
        setIsListening(false)
        handleEmergencyTrigger('Chest Pain')
      }, 800)
    }, 1800)
  }

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return
    const matchedChip = CHIPS.find(c =>
      searchQuery.toLowerCase().includes(c.label.toLowerCase()) ||
      c.query.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (matchedChip) {
      handleEmergencyTrigger(matchedChip.label)
    } else {
      handleEmergencyTrigger('High Fever')
    }
  }

  const closeResults = () => {
    setEmergencyResult(null)
    setIsProcessing(false)
    setProcessingStep(0)
  }

  const scrollToSection = (sectionId) => {
    setActiveNavLink(sectionId)
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <style>{CSS_STYLES}</style>

      <div className="lr-page">
        {/* ═══ Sticky Header Wrapper ═══ */}
        <header className="lr-header-sticky">
          {/* ═══ Red accent bar ═══ */}
          <div className="lr-accent-bar" />

          {/* ═══ Navbar ═══ */}
          <nav className="lr-navbar">
            <div className="lr-logo-group">
              <div className="lr-logo-icon">
                <ShieldPlus size={22} strokeWidth={2} />
              </div>
              <div className="lr-logo-text">LifeRoute <span>AI</span></div>
              <div className="lr-live-badge">
                <div className="lr-live-dot" />
                LIVE
              </div>
            </div>
            <div className="lr-nav-right">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  className={`lr-nav-link ${activeNavLink === link.id ? 'active' : ''}`}
                  onClick={() => scrollToSection(link.id)}
                >
                  {link.label}
                </button>
              ))}
              <button className="lr-sos-btn" onClick={() => handleEmergencyTrigger('Chest Pain')}>
                <ShieldPlus size={16} strokeWidth={2} />
                Emergency SOS
              </button>
            </div>
          </nav>
        </header>

        {/* ═══ Hero Section ═══ */}
        <section className="lr-hero">
          <div className="lr-hero-inner">
            <div className="lr-hero-badge">
              <Zap size={15} strokeWidth={2} />
              AI-Powered Emergency Routing · Delhi NCR
            </div>
            <h1>Find the right care,<br /><em>in seconds.</em></h1>
            <p className="lr-hero-subtitle">
              Real-time bed availability, ambulance tracking, and AI-matched
              hospital routing — when every second counts.
            </p>

            {/* Search bar */}
            <div className={`lr-search-wrap ${searchFocused ? 'focused' : ''}`}>
              <button className="lr-search-mic" type="button" onClick={handleMicClick}>
                <Mic size={20} strokeWidth={1.5} />
              </button>
              <input
                className="lr-search-input" type="text" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                placeholder="Describe symptoms… e.g. severe chest pain, stroke, trauma"
              />
              <button className="lr-search-cta" type="button" onClick={handleSearchSubmit}>
                Find Care <ArrowRight size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Quick-select chips */}
            <div className="lr-chips">
              {CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  className={`lr-chip lr-chip-${chip.color}`}
                  type="button"
                  onClick={() => handleEmergencyTrigger(chip.label)}
                >
                  <chip.icon size={16} strokeWidth={1.5} />
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Stats bar */}
            <div className="lr-stats">
              {STATS.map((s) => (
                <div key={s.label} className="lr-stat">
                  <div className={`lr-stat-val ${s.accent ? 'accent' : ''}`}>{s.val}</div>
                  <div className="lr-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Speech Listener Overlay ═══ */}
        {isListening && (
          <div className="lr-speech-overlay">
            <div className="lr-speech-card">
              <div className="lr-speech-waves">
                <div className="lr-speech-wave line-1" />
                <div className="lr-speech-wave line-2" />
                <div className="lr-speech-wave line-3" />
                <div className="lr-speech-wave line-4" />
                <div className="lr-speech-wave line-5" />
              </div>
              <p className="lr-speech-text">Listening for symptoms...</p>
              <span className="lr-speech-hint">Try saying "severe chest pain" or "child having high fever"</span>
            </div>
          </div>
        )}

        {/* ═══ Processing Overlay ═══ */}
        {isProcessing && (
          <div className="lr-processing-overlay">
            <div className="lr-processing-card">
              <Loader2 size={32} className="lr-spinner" />
              <h3>AI Routing Engine Active</h3>
              <div className="lr-proc-steps">
                {['Analyzing symptoms', 'Triaging severity', 'Matching hospitals', 'Calculating routes'].map((step, i) => (
                  <div key={step} className={`lr-proc-step ${processingStep > i ? 'done' : processingStep === i ? 'active' : ''}`}>
                    {processingStep > i ? <CheckCircle2 size={16} /> : processingStep === i ? <Loader2 size={16} className="lr-spinner" /> : <div className="lr-proc-dot" />}
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ Emergency Results Panel ═══ */}
        {emergencyResult && (
          <div className="lr-results-section" ref={resultRef}>
            <div className="lr-results-header">
              <div>
                <h2 className="lr-section-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AlertTriangle size={22} style={{ color: emergencyResult.triageColor }} />
                  Emergency Response Active
                </h2>
                <p className="lr-section-sub">AI-matched routing completed in 2.4 seconds</p>
              </div>
              <button className="lr-close-btn" onClick={closeResults}><X size={20} /></button>
            </div>

            <div className="lr-results-grid">
              {/* Triage Card */}
              <div className="lr-result-card lr-triage-card" style={{ borderColor: emergencyResult.triageColor + '40' }}>
                <div className="lr-result-card-header">
                  <Shield size={18} style={{ color: emergencyResult.triageColor }} />
                  <span>Triage Assessment</span>
                  <span className="lr-triage-badge" style={{ background: emergencyResult.triageColor + '20', color: emergencyResult.triageColor, borderColor: emergencyResult.triageColor + '40' }}>
                    {emergencyResult.triage}
                  </span>
                </div>
                <p className="lr-result-desc">{emergencyResult.assessment}</p>
                <div className="lr-actions-list">
                  <h4>Immediate Actions:</h4>
                  {emergencyResult.actions.map((a, i) => (
                    <div key={i} className="lr-action-item">
                      <CheckCircle2 size={14} style={{ color: '#4DD4A0', flexShrink: 0 }} />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matched Hospital */}
              <div className="lr-result-card">
                <div className="lr-result-card-header">
                  <Activity size={18} style={{ color: '#4DD4A0' }} />
                  <span>Best Matched Hospital</span>
                </div>
                <div className="lr-matched-hospital">
                  <h3>{emergencyResult.matchedHospital.name}
                    {emergencyResult.matchedHospital.govt && <span className="lr-govt-badge">Govt.</span>}
                  </h3>
                  <div className="lr-card-row2">
                    <span><MapPin size={13} strokeWidth={1.5} /> {emergencyResult.matchedHospital.city}</span>
                    <span className="lr-rating"><Star size={12} strokeWidth={1.5} fill="#FAC75A" /> {emergencyResult.matchedHospital.rating}</span>
                    <span><Navigation size={13} /> {emergencyResult.matchedHospital.distance}</span>
                  </div>
                  <p className="lr-match-reason">{emergencyResult.matchReason}</p>
                  <div className="lr-mini-stats">
                    <div><span className="lr-mini-num">{emergencyResult.matchedHospital.beds}</span><span className="lr-mini-lbl">Beds</span></div>
                    <div><span className="lr-mini-num" style={{ color: getWaitColor(emergencyResult.matchedHospital.wait) }}>{emergencyResult.matchedHospital.wait}</span><span className="lr-mini-lbl">Wait</span></div>
                    <div><span className="lr-mini-num" style={{ color: getCapacityColor(emergencyResult.matchedHospital.capacity) }}>{emergencyResult.matchedHospital.capacity}%</span><span className="lr-mini-lbl">Full</span></div>
                  </div>
                </div>
                <button className="lr-call-btn" type="button"><PhoneCall size={16} strokeWidth={2} /> Call Hospital Now</button>
              </div>

              {/* Ambulance Dispatch */}
              <div className="lr-result-card">
                <div className="lr-result-card-header">
                  <Siren size={18} style={{ color: '#FF8A9A' }} />
                  <span>Ambulance Dispatch</span>
                  <span className="lr-triage-badge" style={{ background: 'rgba(0,168,107,0.15)', color: '#4DD4A0', borderColor: 'rgba(0,168,107,0.30)' }}>
                    DISPATCHING
                  </span>
                </div>
                <div className="lr-dispatch-info">
                  <div className="lr-dispatch-row">
                    <Truck size={16} style={{ color: '#7BA5F5' }} />
                    <div>
                      <strong>{emergencyResult.ambulance.callSign}</strong>
                      <span className="lr-dispatch-sub">{emergencyResult.ambulance.type === 'ALS' ? 'Advanced Life Support' : 'Basic Life Support'} · {emergencyResult.ambulance.driver}</span>
                    </div>
                  </div>
                  <div className="lr-dispatch-stats">
                    <div><span className="lr-mini-num" style={{ color: '#4DD4A0' }}>{emergencyResult.ambulance.eta}</span><span className="lr-mini-lbl">ETA</span></div>
                    <div><span className="lr-mini-num">{emergencyResult.ambulance.distance}</span><span className="lr-mini-lbl">Away</span></div>
                    <div><span className="lr-mini-num" style={{ color: '#7BA5F5' }}>{emergencyResult.ambulance.type}</span><span className="lr-mini-lbl">Type</span></div>
                  </div>
                  <div className="lr-equip-tags">
                    {emergencyResult.ambulance.equipment.map((eq) => (
                      <span key={eq} className="lr-equip-tag">{eq}</span>
                    ))}
                  </div>
                </div>
                <button className="lr-call-btn" style={{ background: '#00A86B' }}><Phone size={16} /> Call Ambulance</button>
              </div>

              {/* Route Selection */}
              <div className="lr-result-card">
                <div className="lr-result-card-header">
                  <Route size={18} style={{ color: '#7BA5F5' }} />
                  <span>Route Selection</span>
                </div>
                
                {/* SVG Mini Map Visualization */}
                <div className="lr-svg-map-wrapper">
                  <svg className="lr-svg-map" viewBox="0 0 320 120" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="map-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#map-grid)" rx="10" />
                    
                    <path d="M10,40 L310,40 M10,80 L310,80 M100,10 L100,110 M220,10 L220,110" stroke="rgba(255,255,255,0.08)" strokeWidth="3" strokeLinecap="round" />
                    <path d="M40,10 L280,110" stroke="rgba(255,255,255,0.05)" strokeWidth="2" strokeLinecap="round" />

                    <path d="M 30,80 Q 100,80 100,40 T 220,40 T 290,40" 
                      fill="none" 
                      stroke="rgba(0,168,107,0.3)" 
                      strokeWidth="6" 
                      strokeLinecap="round" 
                    />
                    <path className="lr-map-route-line" d="M 30,80 Q 100,80 100,40 T 220,40 T 290,40" 
                      fill="none" 
                      stroke="#4DD4A0" 
                      strokeWidth="3" 
                      strokeLinecap="round"
                      strokeDasharray="6, 6"
                    />

                    <circle cx="160" cy="40" r="10" fill="rgba(232,160,0,0.2)" />
                    <circle cx="160" cy="40" r="5" fill="#E8A000" />
                    
                    <g transform="translate(30,80)">
                      <circle className="lr-map-pulse" r="12" fill="rgba(53,104,215,0.3)" />
                      <circle r="6" fill="#3568D7" />
                      <circle r="3" fill="white" />
                    </g>
                    <text x="24" y="105" className="lr-map-text">You</text>

                    <g transform="translate(290,40)">
                      <circle className="lr-map-pulse-red" r="14" fill="rgba(229,57,53,0.35)" />
                      <circle r="7" fill="#E53935" />
                      <path d="M-3,-1 L3,-1 M0,-4 L0,2" stroke="white" strokeWidth="2" />
                    </g>
                    <text x="245" y="22" className="lr-map-text hospital">Hospital</text>
                  </svg>
                </div>

                <div className="lr-routes">
                  <div className="lr-route-option lr-route-best">
                    <div className="lr-route-header">
                      <span className="lr-route-badge-best">Fastest</span>
                      <span className="lr-route-time">{emergencyResult.route.duration}</span>
                    </div>
                    <div className="lr-route-detail">
                      <Navigation size={14} style={{ color: '#4DD4A0' }} />
                      <span>{emergencyResult.route.via}</span>
                    </div>
                    <div className="lr-route-meta">
                      <span>{emergencyResult.route.distance}</span>
                      <span>·</span>
                      <span style={{ color: emergencyResult.route.traffic === 'Light' ? '#4DD4A0' : '#FAC75A' }}>
                        {emergencyResult.route.traffic} traffic
                      </span>
                    </div>
                  </div>
                  <div className="lr-route-option">
                    <div className="lr-route-header">
                      <span className="lr-route-badge-alt">Alternate</span>
                      <span className="lr-route-time">{emergencyResult.route.alternateTime}</span>
                    </div>
                    <div className="lr-route-detail">
                      <Navigation size={14} style={{ color: '#8E8D89' }} />
                      <span>{emergencyResult.route.alternateVia}</span>
                    </div>
                  </div>
                </div>
                <button className="lr-call-btn" style={{ background: '#3568D7' }}><Navigation size={16} /> Start Navigation</button>
              </div>
            </div>
          </div>
        )}

        <hr className="lr-divider" />

        {/* ═══ Hospitals Section ═══ */}
        <section className="lr-section" id="hospitals-section">
          <div className="lr-section-header">
            <div>
              <h2 className="lr-section-title">Nearby Hospitals</h2>
              <p className="lr-section-sub">{filtered.length} facilities · nearest first</p>
            </div>
            <div className="lr-section-actions">
              <span className="lr-location-label"><MapPin size={14} strokeWidth={1.5} /> Delhi NCR</span>
              <button className="lr-filter-btn" type="button"><SlidersHorizontal size={15} strokeWidth={1.5} /> Filters</button>
            </div>
          </div>

          <div className="lr-city-tabs">
            {CITIES.map((city) => (
              <button key={city} type="button" className={`lr-city-tab ${activeCity === city ? 'active' : ''}`} onClick={() => setActiveCity(city)}>{city}</button>
            ))}
          </div>

          <div className="lr-spec-chips">
            {SPECIALTIES.map((s) => (
              <button key={s.label} type="button" className={`lr-spec-chip ${activeSpec === s.label ? 'active' : ''}`} onClick={() => setActiveSpec(s.label)}>
                <s.icon size={14} strokeWidth={1.5} /> {s.label}
              </button>
            ))}
          </div>

          <div className="lr-card-grid">
            {filtered.length > 0 ? filtered.map((h) => (
              <article key={h.id} className="lr-card">
                <div className="lr-card-row1">
                  <div className="lr-card-name">{h.name}{h.govt && <span className="lr-govt-badge">Govt.</span>}</div>
                  <div className="lr-distance-badge"><Navigation size={13} strokeWidth={1.5} /> {h.distance}</div>
                </div>
                <div className="lr-card-row2">
                  <span><MapPin size={13} strokeWidth={1.5} /> {h.city}</span>
                  <span className="lr-rating"><Star size={12} strokeWidth={1.5} fill="#FAC75A" /> {h.rating}</span>
                  <span>({h.reviews.toLocaleString()} reviews)</span>
                </div>
                <div className="lr-tags">
                  {h.tags.map((tag) => {
                     const c = TAG_COLOR_MAP[tag] || DEFAULT_TAG_COLOR
                     return <span key={tag} className="lr-tag" style={{ background: c.bg, color: c.text, borderColor: c.border }}>{tag}</span>
                  })}
                </div>
                <div className="lr-stats-row">
                  <div className="lr-stat-block"><div className="lr-stat-num" style={{ color: 'white' }}>{h.beds}</div><div className="lr-stat-lbl">Beds</div></div>
                  <div className="lr-stat-block"><div className="lr-stat-num" style={{ color: getWaitColor(h.wait) }}>{h.wait}</div><div className="lr-stat-lbl">Est. Wait</div></div>
                  <div className="lr-stat-block"><div className="lr-stat-num" style={{ color: getCapacityColor(h.capacity) }}>{h.capacity}%</div><div className="lr-stat-lbl">Capacity</div></div>
                </div>
                <div className="lr-cap-bar-wrap">
                  <div className="lr-cap-bar-bg"><div className="lr-cap-bar-fill" style={{ width: `${h.capacity}%`, background: getCapacityBarColor(h.capacity) }} /></div>
                  <span className="lr-cap-status" style={{ color: getCapacityColor(h.capacity) }}>{h.capacity}% full · {getCapacityLabel(h.capacity)}</span>
                </div>
                <button className="lr-call-btn" type="button"><PhoneCall size={16} strokeWidth={2} /> Call Hospital</button>
              </article>
            )) : <div className="lr-empty">No hospitals match these filters.</div>}
          </div>
        </section>

        <hr className="lr-divider" />

        {/* ═══ Ambulance Section ═══ */}
        <section className="lr-section" id="ambulance-section">
          <div className="lr-section-header">
            <div>
              <h2 className="lr-section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Siren size={22} style={{ color: '#FF8A9A' }} /> Nearby Ambulances
              </h2>
              <p className="lr-section-sub">{NEARBY_AMBULANCES.filter(a => a.status === 'available').length} available · {NEARBY_AMBULANCES.length} total nearby · real-time tracking</p>
            </div>
            <div className="lr-section-actions">
              <div className="lr-live-badge"><div className="lr-live-dot" /> LIVE TRACKING</div>
            </div>
          </div>

          <div className="lr-amb-grid">
            {NEARBY_AMBULANCES.map((amb) => (
              <div key={amb.id} className="lr-amb-card">
                <div className="lr-amb-card-header">
                  <div className="lr-amb-type-badge" style={{ background: amb.type === 'ALS' ? 'rgba(229,57,53,0.12)' : 'rgba(53,104,215,0.12)', color: amb.type === 'ALS' ? '#FF8A9A' : '#7BA5F5', borderColor: amb.type === 'ALS' ? 'rgba(229,57,53,0.25)' : 'rgba(53,104,215,0.25)' }}>
                    {amb.type}
                  </div>
                  <div className={`lr-amb-status ${amb.status}`}>
                    <div className="lr-amb-status-dot" />
                    {amb.status === 'available' ? 'Available' : 'En Route'}
                  </div>
                </div>

                <div className="lr-amb-callsign">{amb.callSign}</div>
                <div className="lr-amb-driver">
                  <Radio size={13} /> {amb.driver}
                </div>

                <div className="lr-amb-card-stats">
                  <div><span className="lr-mini-num" style={{ color: '#4DD4A0' }}>{amb.eta}</span><span className="lr-mini-lbl">ETA</span></div>
                  <div><span className="lr-mini-num">{amb.distance}</span><span className="lr-mini-lbl">Away</span></div>
                </div>

                <div className="lr-equip-tags">
                  {amb.equipment.map((eq) => (
                    <span key={eq} className="lr-equip-tag">{eq}</span>
                  ))}
                </div>

                <button className="lr-call-btn" style={{ background: amb.status === 'available' ? '#E53935' : '#555' }} disabled={amb.status !== 'available'}>
                  <Phone size={16} /> {amb.status === 'available' ? 'Dispatch Now' : 'Currently Busy'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <hr className="lr-divider" />

        {/* ═══ Blood Bank Section ═══ */}
        <section className="lr-section" id="blood-bank-section">
          <div className="lr-section-header">
            <div>
              <h2 className="lr-section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Droplet size={22} style={{ color: '#FF6B7A' }} /> Blood Bank Availability
              </h2>
              <p className="lr-section-sub">{BLOOD_BANKS.length} blood banks · live stock data</p>
            </div>
          </div>

          <div className="lr-blood-grid">
            {BLOOD_BANKS.map((bank) => (
              <div key={bank.id} className="lr-blood-card">
                <div className="lr-blood-card-header">
                  <h3>{bank.name}</h3>
                  <span className="lr-blood-updated"><Clock size={12} /> {bank.lastUpdated}</span>
                </div>
                <div className="lr-card-row2" style={{ marginBottom: '16px' }}>
                  <span><MapPin size={13} /> {bank.city}</span>
                  <span><Navigation size={13} /> {bank.distance}</span>
                </div>
                <div className="lr-blood-stocks">
                  {Object.entries(bank.stocks).map(([type, units]) => (
                    <div key={type} className="lr-blood-type">
                      <span className="lr-blood-type-label">{type}</span>
                      <span className="lr-blood-type-units" style={{ color: getBloodColor(units) }}>{units}</span>
                      <span className="lr-blood-type-unit">units</span>
                    </div>
                  ))}
                </div>
                <button className="lr-call-btn" style={{ background: '#C62828' }}><Phone size={16} /> Contact Blood Bank</button>
              </div>
            ))}
          </div>
        </section>

        <hr className="lr-divider" />

        {/* ═══ ICU Tracker Section ═══ */}
        <section className="lr-section" id="icu-section">
          <div className="lr-section-header">
            <div>
              <h2 className="lr-section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BedDouble size={22} style={{ color: '#7BA5F5' }} /> ICU Bed Tracker
              </h2>
              <p className="lr-section-sub">{ICU_DATA.length} hospitals · ventilator availability</p>
            </div>
            <div className="lr-section-actions">
              <div className="lr-live-badge"><div className="lr-live-dot" /> REAL-TIME</div>
            </div>
          </div>

          <div className="lr-icu-grid">
            {ICU_DATA.map((icu) => {
              const icuPct = Math.round((icu.occupiedICU / icu.totalICU) * 100)
              const availICU = icu.totalICU - icu.occupiedICU
              return (
                <div key={icu.id} className="lr-icu-card">
                  <div className="lr-icu-card-header">
                    <h3>{icu.hospital}</h3>
                    <span className="lr-icu-type">{icu.type}</span>
                  </div>
                  <div className="lr-icu-stats">
                    <div>
                      <span className="lr-mini-num" style={{ color: getCapacityColor(icuPct) }}>{availICU}</span>
                      <span className="lr-mini-lbl">ICU Free</span>
                    </div>
                    <div>
                      <span className="lr-mini-num">{icu.totalICU}</span>
                      <span className="lr-mini-lbl">Total ICU</span>
                    </div>
                    <div>
                      <span className="lr-mini-num" style={{ color: icu.ventilators.available <= 3 ? '#FF6B7A' : '#4DD4A0' }}>{icu.ventilators.available}</span>
                      <span className="lr-mini-lbl">Ventilators</span>
                    </div>
                  </div>
                  <div className="lr-cap-bar-wrap">
                    <div className="lr-cap-bar-bg"><div className="lr-cap-bar-fill" style={{ width: `${icuPct}%`, background: getCapacityBarColor(icuPct) }} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="lr-cap-status" style={{ color: getCapacityColor(icuPct) }}>{icuPct}% occupied</span>
                      <span style={{ fontSize: '11px', color: '#8E8D89' }}><Clock size={11} /> {icu.lastUpdated}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ═══ Footer ═══ */}
        <footer className="lr-footer">
          <p className="lr-footer-text">
            <strong>LifeRoute AI</strong> provides real-time hospital data for informational purposes.
            Always call 112 in life-threatening emergencies. Data refreshed every 30 seconds.
          </p>
          <div className="lr-footer-emergency">
            <Phone size={16} strokeWidth={1.5} />
            Emergency: 112
          </div>
        </footer>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   CSS STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

const CSS_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500;700&display=swap');

:root {
  --bg-base: #0a0a0a;
  --bg-card: #111111;
  --bg-elevated: #181818;
  --red-primary: #E53935;
  --red-dark: #C62828;
  --red-glow: rgba(229, 57, 53, 0.35);
  --green-avail: #00A86B;
  --amber-warn: #E8A000;
  --text-primary: #FFFFFF;
  --text-secondary: #C8C7C3;
  --text-muted: #8E8D89;
  --border-subtle: rgba(255,255,255,0.08);
  --font-heading: 'Syne', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }

.lr-page {
  min-height: 100vh;
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  overflow-x: clip;
}

/* ── Red accent bar ─────────────── */
.lr-accent-bar {
  height: 3px;
  background: linear-gradient(90deg, var(--red-primary), #FF3344, var(--red-primary));
  background-size: 200% 100%;
  animation: lr-gradient-shift 4s ease infinite;
}
@keyframes lr-gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* ── Sticky Header Wrapper ───────── */
.lr-header-sticky {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
}

/* ── Navbar ──────────────────────── */
.lr-navbar {
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  background: rgba(10, 10, 10, 0.82);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  height: 64px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 32px;
}
.lr-logo-group { display: flex; align-items: center; gap: 12px; }
.lr-logo-icon {
  width: 40px; height: 40px; background: var(--red-primary); border-radius: 12px;
  display: flex; align-items: center; justify-content: center; color: white;
  box-shadow: 0 0 20px var(--red-glow);
}
.lr-logo-text { font-family: var(--font-heading); font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: white; }
.lr-logo-text span { color: var(--red-primary); }
.lr-live-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(229,57,53,0.10); border: 1px solid rgba(229,57,53,0.30);
  border-radius: 100px; padding: 3px 10px;
  font-family: var(--font-mono); font-size: 11px; font-weight: 600;
  color: var(--red-primary); text-transform: uppercase; letter-spacing: 0.1em;
}
.lr-live-dot {
  width: 7px; height: 7px; border-radius: 50%; background: var(--red-primary);
  animation: lr-live-pulse 1.4s ease-in-out infinite;
}
@keyframes lr-live-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

.lr-nav-right { display: flex; align-items: center; gap: 4px; }
.lr-nav-link {
  position: relative; padding: 8px 16px; font-size: 14px; font-weight: 500;
  color: var(--text-muted); text-decoration: none; border-radius: 8px;
  transition: color 0.2s; cursor: pointer; background: none; border: none;
  font-family: var(--font-body);
}
.lr-nav-link:hover, .lr-nav-link.active { color: white; }
.lr-nav-link::after {
  content: ''; position: absolute; bottom: 4px; left: 16px; right: 16px; height: 2px;
  background: var(--red-primary); border-radius: 2px;
  transform: scaleX(0); transform-origin: left; transition: transform 0.25s ease;
}
.lr-nav-link:hover::after, .lr-nav-link.active::after { transform: scaleX(1); }

.lr-sos-btn {
  display: flex; align-items: center; gap: 8px; background: var(--red-primary);
  color: white; font-weight: 700; font-size: 13.5px; padding: 10px 20px;
  border-radius: 12px; border: none; cursor: pointer; margin-left: 12px;
  font-family: var(--font-body); transition: background 0.2s, transform 0.15s;
  animation: lr-sos-pulse 1.8s ease-in-out infinite;
}
.lr-sos-btn:hover { background: var(--red-dark); transform: scale(1.03); }
@keyframes lr-sos-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.55); }
  60% { box-shadow: 0 0 0 12px rgba(229, 57, 53, 0); }
}

/* ── Hero ────────────────────────── */
.lr-hero {
  width: 100%; display: flex; flex-direction: column; align-items: center;
  padding: 80px 24px 72px; text-align: center;
}
.lr-hero-inner { max-width: 720px; width: 100%; display: flex; flex-direction: column; align-items: center; }
.lr-hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(229,57,53,0.08); border: 1px solid rgba(229,57,53,0.35);
  border-radius: 100px; padding: 8px 20px; font-size: 14px; font-weight: 600;
  color: #FF6070; text-transform: uppercase; letter-spacing: 0.06em;
  margin-bottom: 32px; animation: lr-badge-glow 2.5s ease-in-out infinite;
}
@keyframes lr-badge-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(229,57,53,0.15); }
  50% { box-shadow: 0 0 24px rgba(229,57,53,0.40); }
}
.lr-hero h1 {
  font-family: var(--font-heading); font-size: clamp(40px, 5.5vw, 56px);
  font-weight: 800; line-height: 1.06; letter-spacing: -0.03em;
  color: white; margin-bottom: 20px;
}
.lr-hero h1 em { font-style: normal; color: var(--red-primary); }
.lr-hero-subtitle {
  font-size: 17px; color: var(--text-muted); max-width: 520px;
  line-height: 1.65; font-weight: 300; margin-bottom: 40px;
}

/* ── Search bar ──────────────────── */
.lr-search-wrap {
  position: relative; width: 100%; max-width: 680px;
  margin-bottom: 24px; border-radius: 18px; transition: box-shadow 0.25s ease;
}
.lr-search-wrap.focused { box-shadow: 0 0 0 2px rgba(229,57,53,0.50), 0 8px 40px rgba(229,57,53,0.12); }
.lr-search-wrap:not(.focused) { box-shadow: 0 0 0 1px rgba(255,255,255,0.10); }
.lr-search-mic {
  position: absolute; left: 20px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: var(--text-muted); cursor: pointer;
  padding: 4px; transition: color 0.2s; z-index: 2;
}
.lr-search-mic:hover { color: #FF6070; }
.lr-search-input {
  width: 100%; background: rgba(255,255,255,0.055); border: 1px solid rgba(255,255,255,0.10);
  border-radius: 18px; padding: 20px 160px 20px 56px;
  font-family: var(--font-body); font-size: 15px; color: white; outline: none;
  transition: background 0.2s, border-color 0.2s;
}
.lr-search-input::placeholder { color: var(--text-muted); }
.lr-search-input:focus { background: rgba(255,255,255,0.075); border-color: rgba(229,57,53,0.45); }
.lr-search-cta {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  display: flex; align-items: center; gap: 8px; background: var(--red-primary);
  border: none; border-radius: 14px; padding: 12px 24px;
  font-family: var(--font-body); font-size: 14px; font-weight: 700; color: white;
  cursor: pointer; transition: background 0.2s, transform 0.15s;
}
.lr-search-cta:hover { background: var(--red-dark); transform: translateY(-50%) scale(1.03); }
.lr-search-cta:active { transform: translateY(-50%) scale(0.97); }

/* ── Quick-select chips ──────────── */
.lr-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; max-width: 700px; width: 100%; margin-bottom: 56px; }
.lr-chip {
  display: flex; align-items: center; gap: 8px; padding: 12px 20px;
  border-radius: 100px; font-family: var(--font-body); font-size: 14px; font-weight: 500;
  cursor: pointer; border: 1px solid; transition: all 0.2s ease; background: none;
}
.lr-chip:hover { transform: scale(1.05); }
.lr-chip-red { background: rgba(229,57,53,0.09); border-color: rgba(229,57,53,0.30); color: #FF8A9A; }
.lr-chip-red:hover { background: rgba(229,57,53,0.16); border-color: rgba(229,57,53,0.50); }
.lr-chip-amber { background: rgba(232,160,0,0.09); border-color: rgba(232,160,0,0.30); color: #FAC75A; }
.lr-chip-amber:hover { background: rgba(232,160,0,0.16); border-color: rgba(232,160,0,0.50); }
.lr-chip-blue { background: rgba(53,104,215,0.09); border-color: rgba(53,104,215,0.30); color: #7BA5F5; }
.lr-chip-blue:hover { background: rgba(53,104,215,0.16); border-color: rgba(53,104,215,0.50); }

/* ── Stats bar ───────────────────── */
.lr-stats { display: flex; width: 100%; max-width: 600px; border: 1px solid rgba(255,255,255,0.09); border-radius: 18px; overflow: hidden; background: rgba(255,255,255,0.025); }
.lr-stat { flex: 1; padding: 20px 16px; text-align: center; }
.lr-stat + .lr-stat { border-left: 1px solid rgba(255,255,255,0.09); }
.lr-stat-val { font-family: var(--font-mono); font-size: 28px; font-weight: 700; letter-spacing: -0.04em; line-height: 1; margin-bottom: 6px; color: white; }
.lr-stat-val.accent { color: var(--red-primary); }
.lr-stat-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; }

/* ── Divider ─────────────────────── */
.lr-divider { width: 100%; height: 1px; background: rgba(255,255,255,0.06); border: none; }

/* ── Shared section ──────────────── */
.lr-section { width: 100%; max-width: 1200px; margin: 0 auto; padding: 40px 24px 48px; scroll-margin-top: 80px; }
.lr-section-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
.lr-section-title { font-family: var(--font-heading); font-size: 22px; font-weight: 700; letter-spacing: -0.025em; color: white; line-height: 1.2; }
.lr-section-sub { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
.lr-section-actions { display: flex; align-items: center; gap: 12px; }
.lr-location-label { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); }
.lr-filter-btn {
  display: flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 12px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10);
  color: var(--text-secondary); font-size: 13px; font-weight: 500; cursor: pointer;
  font-family: var(--font-body); transition: all 0.2s;
}
.lr-filter-btn:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.18); }

/* City tabs */
.lr-city-tabs { display: flex; gap: 4px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 4px; width: fit-content; margin-bottom: 12px; }
.lr-city-tab {
  padding: 8px 16px; border-radius: 9px; font-size: 13px; font-weight: 500;
  cursor: pointer; border: none; transition: all 0.2s; font-family: var(--font-body);
  color: var(--text-muted); background: transparent;
}
.lr-city-tab.active { background: rgba(255,255,255,0.10); color: white; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
.lr-city-tab:not(.active):hover { color: var(--text-secondary); }

/* Specialty chips */
.lr-spec-chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 32px; scrollbar-width: none; }
.lr-spec-chips::-webkit-scrollbar { display: none; }
.lr-spec-chip {
  display: flex; align-items: center; gap: 6px; white-space: nowrap; padding: 9px 16px;
  border-radius: 12px; font-size: 13px; font-weight: 500; cursor: pointer;
  border: 1px solid; flex-shrink: 0; transition: all 0.2s; font-family: var(--font-body);
  background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); color: var(--text-muted);
}
.lr-spec-chip:hover { background: rgba(255,255,255,0.08); color: var(--text-secondary); border-color: rgba(255,255,255,0.14); }
.lr-spec-chip.active { background: rgba(229,57,53,0.10); border-color: rgba(229,57,53,0.35); color: #FF8A9A; box-shadow: 0 0 12px rgba(229,57,53,0.12); }

/* ── Hospital cards ──────────────── */
.lr-card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
@media (max-width: 900px) { .lr-card-grid { grid-template-columns: 1fr; } }
.lr-card {
  background: var(--bg-card); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px; padding: 20px; display: flex; flex-direction: column;
  gap: 16px; transition: all 0.25s ease; cursor: pointer;
}
.lr-card:hover { border-color: rgba(255,255,255,0.16); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
.lr-card-row1 { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.lr-card-name { font-size: 18px; font-weight: 600; color: white; letter-spacing: -0.02em; line-height: 1.3; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.lr-govt-badge {
  display: inline-flex; font-size: 11px; font-weight: 600; color: #818CF8;
  background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.25);
  border-radius: 100px; padding: 2px 10px; white-space: nowrap;
}
.lr-distance-badge {
  display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10); border-radius: 12px; padding: 7px 12px;
  font-family: var(--font-mono); font-size: 12px; font-weight: 500;
  color: var(--text-secondary); white-space: nowrap; flex-shrink: 0;
}
.lr-card-row2 { display: flex; align-items: center; gap: 12px; font-size: 13px; color: var(--text-muted); flex-wrap: wrap; }
.lr-card-row2 > span { display: flex; align-items: center; gap: 4px; }
.lr-rating { color: #FAC75A; font-weight: 600; }
.lr-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.lr-tag { padding: 5px 12px; border-radius: 100px; font-size: 12px; font-weight: 500; border: 1px solid; }
.lr-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; }
.lr-stat-block { padding: 14px 12px; text-align: center; }
.lr-stat-block + .lr-stat-block { border-left: 1px solid rgba(255,255,255,0.08); }
.lr-stat-num { font-family: var(--font-mono); font-size: 22px; font-weight: 700; letter-spacing: -0.03em; line-height: 1; margin-bottom: 4px; }
.lr-stat-lbl { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.07em; }
.lr-cap-bar-wrap { display: flex; flex-direction: column; gap: 6px; }
.lr-cap-bar-bg { height: 6px; width: 100%; background: rgba(255,255,255,0.08); border-radius: 100px; overflow: hidden; }
.lr-cap-bar-fill { height: 100%; border-radius: 100px; transition: width 0.5s ease; }
.lr-cap-status { font-size: 13px; font-weight: 500; line-height: 1; }
.lr-call-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  background: var(--red-primary); border: none; border-radius: 14px; height: 44px;
  font-family: var(--font-body); font-size: 14px; font-weight: 700; color: white;
  cursor: pointer; transition: all 0.2s;
}
.lr-call-btn:hover { filter: brightness(1.1); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
.lr-call-btn:active { transform: scale(0.98); }
.lr-call-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.lr-empty { grid-column: 1 / -1; text-align: center; padding: 64px 24px; color: var(--text-muted); font-size: 15px; }

/* ── Processing Overlay ──────────── */
.lr-processing-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 200;
  background: rgba(0,0,0,0.80); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  animation: lr-fade-in 0.3s ease;
}
@keyframes lr-fade-in { from { opacity: 0; } to { opacity: 1; } }
.lr-processing-card {
  background: var(--bg-card); border: 1px solid rgba(255,255,255,0.10);
  border-radius: 24px; padding: 40px 48px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 24px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6);
  animation: lr-scale-in 0.3s ease;
}
@keyframes lr-scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.lr-processing-card h3 { font-family: var(--font-heading); font-size: 20px; font-weight: 700; color: white; }
.lr-spinner { animation: lr-spin 1s linear infinite; color: var(--red-primary); }
@keyframes lr-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.lr-proc-steps { display: flex; flex-direction: column; gap: 16px; text-align: left; width: 260px; }
.lr-proc-step { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--text-muted); transition: color 0.3s; }
.lr-proc-step.done { color: #4DD4A0; }
.lr-proc-step.active { color: white; }
.lr-proc-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.15); flex-shrink: 0; }

/* ── Emergency Results ───────────── */
.lr-results-section {
  width: 100%; max-width: 1200px; margin: 0 auto; padding: 40px 24px 48px;
  scroll-margin-top: 80px; animation: lr-fade-up 0.5s ease;
}
@keyframes lr-fade-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
.lr-results-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; }
.lr-close-btn {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10);
  border-radius: 10px; padding: 8px; color: var(--text-muted); cursor: pointer;
  transition: all 0.2s;
}
.lr-close-btn:hover { background: rgba(255,255,255,0.12); color: white; }
.lr-results-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
@media (max-width: 900px) { .lr-results-grid { grid-template-columns: 1fr; } }

.lr-result-card {
  background: var(--bg-card); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px; padding: 20px; display: flex; flex-direction: column; gap: 16px;
}
.lr-result-card-header { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; color: var(--text-secondary); }
.lr-triage-badge {
  margin-left: auto; font-size: 11px; font-weight: 700; padding: 3px 12px;
  border-radius: 100px; border: 1px solid; letter-spacing: 0.08em;
  font-family: var(--font-mono);
}
.lr-triage-card { border-width: 1px; }
.lr-result-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.6; }
.lr-actions-list { display: flex; flex-direction: column; gap: 8px; }
.lr-actions-list h4 { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
.lr-action-item { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: var(--text-secondary); }

/* Matched hospital in results */
.lr-matched-hospital h3 { font-size: 17px; font-weight: 600; color: white; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.lr-match-reason { font-size: 13px; color: var(--text-muted); line-height: 1.55; margin: 8px 0; padding: 10px 12px; background: rgba(255,255,255,0.03); border-radius: 10px; border-left: 3px solid #4DD4A0; }
.lr-mini-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 4px; }
.lr-mini-stats > div, .lr-dispatch-stats > div, .lr-amb-card-stats > div { text-align: center; padding: 10px 8px; background: rgba(255,255,255,0.03); border-radius: 10px; }
.lr-mini-num { display: block; font-family: var(--font-mono); font-size: 18px; font-weight: 700; color: white; margin-bottom: 2px; }
.lr-mini-lbl { display: block; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.07em; }

/* Dispatch info */
.lr-dispatch-info { display: flex; flex-direction: column; gap: 12px; }
.lr-dispatch-row { display: flex; align-items: flex-start; gap: 10px; }
.lr-dispatch-row strong { display: block; font-size: 14px; color: white; font-family: var(--font-mono); }
.lr-dispatch-sub { display: block; font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.lr-dispatch-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.lr-equip-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.lr-equip-tag { font-size: 11px; padding: 4px 10px; border-radius: 100px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: var(--text-muted); }

/* Route selection & SVG Map */
.lr-routes { display: flex; flex-direction: column; gap: 10px; }
.lr-route-option {
  padding: 14px 16px; border-radius: 12px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
  transition: all 0.2s; cursor: pointer;
}
.lr-route-option:hover { border-color: rgba(255,255,255,0.16); }
.lr-route-best { border-color: rgba(0,168,107,0.30); background: rgba(0,168,107,0.05); }
.lr-route-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.lr-route-badge-best { font-size: 11px; font-weight: 700; color: #4DD4A0; background: rgba(0,168,107,0.15); border: 1px solid rgba(0,168,107,0.25); border-radius: 100px; padding: 2px 10px; font-family: var(--font-mono); letter-spacing: 0.05em; }
.lr-route-badge-alt { font-size: 11px; font-weight: 600; color: var(--text-muted); background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 100px; padding: 2px 10px; }
.lr-route-time { font-family: var(--font-mono); font-size: 18px; font-weight: 700; color: white; }
.lr-route-detail { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); }
.lr-route-meta { display: flex; gap: 6px; font-size: 12px; color: var(--text-muted); margin-top: 6px; }

.lr-svg-map-wrapper {
  width: 100%;
  height: 120px;
  background: rgba(0,0,0,0.35);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  margin-bottom: 6px;
}
.lr-svg-map {
  width: 100%;
  height: 100%;
  display: block;
}
.lr-map-text {
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 600;
  fill: var(--text-muted);
}
.lr-map-text.hospital {
  fill: #FF8A9A;
}
.lr-map-pulse {
  transform-origin: center;
  animation: lr-map-ping 2s infinite ease-out;
}
.lr-map-pulse-red {
  transform-origin: center;
  animation: lr-map-ping-red 1.6s infinite ease-out;
}
@keyframes lr-map-ping {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(2.2); opacity: 0; }
}
@keyframes lr-map-ping-red {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}
.lr-map-route-line {
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  animation: lr-route-flow 5s linear infinite;
}
@keyframes lr-route-flow {
  to {
    stroke-dashoffset: -40;
  }
}

/* ── Speech listener overlay ─────── */
.lr-speech-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 200;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: center;
  animation: lr-fade-in 0.2s ease;
}
.lr-speech-card {
  background: var(--bg-card); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 24px; padding: 48px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 20px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.7);
  width: 90%; max-width: 440px;
}
.lr-speech-waves {
  display: flex; align-items: center; gap: 6px; height: 60px;
}
.lr-speech-wave {
  width: 4px; height: 16px; background: var(--red-primary); border-radius: 100px;
}
.lr-speech-wave.line-1 { animation: lr-speech-bounce 1.2s ease-in-out infinite; }
.lr-speech-wave.line-2 { animation: lr-speech-bounce 1.2s ease-in-out infinite 0.2s; }
.lr-speech-wave.line-3 { animation: lr-speech-bounce 1.2s ease-in-out infinite 0.4s; }
.lr-speech-wave.line-4 { animation: lr-speech-bounce 1.2s ease-in-out infinite 0.1s; }
.lr-speech-wave.line-5 { animation: lr-speech-bounce 1.2s ease-in-out infinite 0.3s; }
@keyframes lr-speech-bounce {
  0%, 100% { height: 16px; background: var(--red-primary); }
  50% { height: 56px; background: #FF8A9A; }
}
.lr-speech-text { font-family: var(--font-heading); font-size: 18px; font-weight: 700; color: white; }
.lr-speech-hint { font-size: 13px; color: var(--text-muted); }

/* ── Ambulance Section ───────────── */
.lr-amb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.lr-amb-card {
  background: var(--bg-card); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px; padding: 20px; display: flex; flex-direction: column;
  gap: 14px; transition: all 0.25s;
}
.lr-amb-card:hover { border-color: rgba(255,255,255,0.16); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
.lr-amb-card-header { display: flex; align-items: center; justify-content: space-between; }
.lr-amb-type-badge { font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 100px; border: 1px solid; font-family: var(--font-mono); letter-spacing: 0.05em; }
.lr-amb-status { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; }
.lr-amb-status.available { color: #4DD4A0; }
.lr-amb-status.en-route { color: #FAC75A; }
.lr-amb-status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; animation: lr-live-pulse 1.4s ease-in-out infinite; }
.lr-amb-callsign { font-family: var(--font-mono); font-size: 16px; font-weight: 700; color: white; letter-spacing: 0.02em; }
.lr-amb-driver { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); }
.lr-amb-card-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }

/* ── Blood Bank Section ──────────── */
.lr-blood-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
.lr-blood-card {
  background: var(--bg-card); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px; padding: 20px; display: flex; flex-direction: column;
  gap: 12px; transition: all 0.25s;
}
.lr-blood-card:hover { border-color: rgba(255,255,255,0.16); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
.lr-blood-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.lr-blood-card-header h3 { font-size: 17px; font-weight: 600; color: white; }
.lr-blood-updated { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted); white-space: nowrap; flex-shrink: 0; }
.lr-blood-stocks { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 8px; }
.lr-blood-type { text-align: center; padding: 10px 4px; background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); }
.lr-blood-type-label { display: block; font-size: 13px; font-weight: 700; color: #FF6B7A; margin-bottom: 4px; font-family: var(--font-mono); }
.lr-blood-type-units { display: block; font-family: var(--font-mono); font-size: 18px; font-weight: 700; }
.lr-blood-type-unit { display: block; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

/* ── ICU Tracker ─────────────────── */
.lr-icu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.lr-icu-card {
  background: var(--bg-card); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px; padding: 20px; display: flex; flex-direction: column;
  gap: 14px; transition: all 0.25s;
}
.lr-icu-card:hover { border-color: rgba(255,255,255,0.16); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
.lr-icu-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.lr-icu-card-header h3 { font-size: 16px; font-weight: 600; color: white; }
.lr-icu-type { font-size: 11px; font-weight: 600; color: #7BA5F5; background: rgba(53,104,215,0.12); border: 1px solid rgba(53,104,215,0.25); border-radius: 100px; padding: 3px 10px; white-space: nowrap; }
.lr-icu-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }

/* ── Footer ──────────────────────── */
.lr-footer {
  border-top: 1px solid rgba(255,255,255,0.06); padding: 24px 32px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; flex-wrap: wrap;
}
.lr-footer-text { font-size: 12px; color: var(--text-muted); max-width: 440px; line-height: 1.65; }
.lr-footer-text strong { color: white; }
.lr-footer-emergency {
  display: flex; align-items: center; gap: 10px;
  background: rgba(229,57,53,0.08); border: 1px solid rgba(229,57,53,0.20);
  border-radius: 12px; padding: 10px 20px; font-size: 13px; font-weight: 600;
  color: #FF6B7A; cursor: pointer; transition: all 0.2s;
}
.lr-footer-emergency:hover { background: rgba(229,57,53,0.14); border-color: rgba(229,57,53,0.35); }

/* ── Responsive ──────────────────── */
@media (max-width: 768px) {
  .lr-navbar { padding: 0 16px; }
  .lr-nav-right .lr-nav-link { display: none; }
  .lr-hero { padding: 48px 16px 48px; }
  .lr-section { padding: 24px 16px 48px; }
  .lr-stats { flex-wrap: wrap; }
  .lr-stat { flex: 1 1 50%; }
  .lr-footer { padding: 20px 16px; flex-direction: column; text-align: center; }
  .lr-results-grid { grid-template-columns: 1fr; }
  .lr-blood-stocks { grid-template-columns: repeat(4, 1fr); }
}
`
