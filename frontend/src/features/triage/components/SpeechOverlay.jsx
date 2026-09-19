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
        <p className="lr-speech-text">{hint?.startsWith('Transcrib') ? 'Transcribing speech…' : 'Listening for symptoms...'}</p>
        <span className="lr-speech-hint">{hint || 'Try saying "severe chest pain" or "child having high fever"'}</span>
      </div>
    </div>
  )
}
