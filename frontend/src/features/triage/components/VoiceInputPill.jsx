import { Mic } from 'lucide-react'

export default function VoiceInputPill({ active, transcribing, level = 0, onClick, disabled }) {
  return (
    <button
      className={`lr-search-mic ${active ? 'listening' : ''} ${transcribing ? 'transcribing' : ''}`}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={active ? 'Stop listening' : transcribing ? 'Transcribing speech' : 'Speak symptoms'}
      style={active ? { color: '#FF6070', transform: `translateY(-50%) scale(${1 + level * 0.25})` } : undefined}
    >
      <Mic size={20} strokeWidth={1.5} />
    </button>
  )
}
