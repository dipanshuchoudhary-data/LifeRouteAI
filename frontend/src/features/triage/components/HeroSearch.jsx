import { useState } from 'react'
import { ArrowRight, Zap } from 'lucide-react'
import { CHIPS, STATS } from '../../../data/liferouteData'
import VoiceInputPill from './VoiceInputPill'
import { useProfileStore } from '../../../stores/useProfileStore'

export default function HeroSearch({
  searchQuery,
  onQueryChange,
  onSubmit,
  onChip,
  onMic,
  isListening,
  micLevel,
  isBusy,
  language = 'en',
  onLanguageChange,
  onOpenProfile,
  isTranscribing,
}) {
  const [searchFocused, setSearchFocused] = useState(false)
  const hindi = language === 'hi'
  const profile = useProfileStore((s) => s.profile)

  return (
    <section className="lr-hero">
      <div className="lr-hero-inner">
        <div className="lr-hero-badge">
          <Zap size={15} strokeWidth={2} />
          {hindi ? 'एआई आपातकालीन रूटिंग · दिल्ली NCR · Sentinel <20ms' : 'AI-Powered Emergency Routing · Delhi NCR · Sentinel <20ms'}
        </div>
        <h1>{hindi ? <>सही अस्पताल,<br /><em>सेकंडों में.</em></> : <>Find the right care,<br /><em>in seconds.</em></>}</h1>
        <p className="lr-hero-subtitle">
          {hindi
            ? 'जीवन-घातक लक्षण LLM से पहले रुकते हैं। लाइव बेड, ESI ट्राइएज, FHIR रेफरल — जब हर सेकंड मायने रखता है।'
            : 'Life-threatening symptoms never wait on a model. We intercept them instantly, then match live beds, travel time, and a signed referral the hospital can ingest.'}
        </p>

        <div className="lr-lang-toggle" role="group" aria-label="Language">
          <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => onLanguageChange?.('en')}>EN</button>
          <button type="button" className={language === 'hi' ? 'active' : ''} onClick={() => onLanguageChange?.('hi')}>हिं</button>
        </div>

        <button type="button" className="lr-profile-pill" onClick={onOpenProfile}>
          <span>{profile.name ? profile.name.split(' ').map((p) => p[0]).slice(0, 2).join('') : '+'}</span>
          {profile.name
            ? `${profile.name}${profile.bloodType ? ` · ${profile.bloodType}` : ''}${profile.conditions[0]?.name ? ` · ${profile.conditions[0].name}` : ''}`
            : 'Add medical chart'}
        </button>

        <div className={`lr-search-wrap ${searchFocused ? 'focused' : ''}`}>
          <VoiceInputPill active={isListening} transcribing={isTranscribing} level={micLevel} onClick={onMic} disabled={isBusy && !isListening} />
          <input
            className="lr-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            placeholder={hindi ? 'लक्षण बताएं… जैसे तेज़ छाती दर्द, स्ट्रोक, एक्सीडेंट' : 'Describe symptoms… e.g. severe chest pain, stroke, trauma'}
            aria-label="Describe symptoms"
          />
          <button className="lr-search-cta" type="button" onClick={onSubmit} disabled={isBusy}>
            {hindi ? 'देखभाल खोजें' : 'Find Care'} <ArrowRight size={16} strokeWidth={2} />
          </button>
        </div>
        {(isListening || isTranscribing) && (
          <p className="lr-voice-status">
            {isListening ? (hindi ? 'सुन रहा हूँ — माइक दबाकर रोकें' : 'Listening — tap the mic to stop') : (hindi ? 'आवाज़ लिखा जा रही है…' : 'Transcribing speech…')}
          </p>
        )}

        <div className="lr-chips">
          {CHIPS.map((chip) => (
            <button
              key={chip.label}
              className={`lr-chip lr-chip-${chip.color}`}
              type="button"
              onClick={() => onChip({ ...chip, query: hindi && chip.hiQuery ? chip.hiQuery : chip.query })}
            >
              <chip.icon size={16} strokeWidth={1.5} />
              {hindi ? chip.hiLabel : chip.label}
            </button>
          ))}
        </div>

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
  )
}
