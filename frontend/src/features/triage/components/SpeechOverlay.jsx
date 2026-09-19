export default function SpeechOverlay({ visible, hint }) {
  if (!visible) return null
  return (
    <div className="lr-speech-overlay">
      <div className="lr-speech-card">
        <div className="lr-speech-waves">
          <div className="lr-speech-wave line-1" />
          <div className="lr-speech-wave line-2" />
          <div className="lr-speech-wave line-3" />
          <div className="lr-speech-wave line-4" />
          <div className="lr-speech-wave line-5" />
        </div>
        <p className="lr-speech-text">{hint?.startsWith('Transcrib') || hint?.includes('listening') ? hint : 'Listening…'}</p>
        <span className="lr-speech-hint">{hint || 'Try saying “What do I have today?” or “I need help”'}</span>
      </div>
    </div>
  )
}
