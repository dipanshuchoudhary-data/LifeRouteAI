import { useRef, useState } from 'react'
import { Camera, ScanSearch, Send } from 'lucide-react'
import { PROVIDER_BUSY, sathiExplain } from '../../lib/api'
import { prepareExplainPhoto } from '../../lib/prepareExplainPhoto'
import { sathiContext } from '../../lib/sathiIntent'

export default function ExplainPhoto({ profile, companion, onShare }) {
  const cameraRef = useRef(null)
  const [preview, setPreview] = useState('')
  const [payload, setPayload] = useState(null)
  const [question, setQuestion] = useState('What is this?')
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = async (file) => {
    if (!file) return
    setError('')
    setReply('')
    try {
      const next = await prepareExplainPhoto(file)
      setPayload(next)
      setPreview(next.preview)
    } catch (err) {
      setPayload(null)
      setPreview('')
      setError(err.message || 'Could not read that photo.')
    }
  }

  const explain = async () => {
    if (!payload) {
      setError('Take or choose a photo first.')
      return
    }
    setBusy(true)
    setError('')
    setReply('')
    try {
      const data = await sathiExplain({
        imageBase64: payload.data,
        mime: payload.mime,
        question,
        context: sathiContext(profile, companion),
      })
      setReply(data.reply || PROVIDER_BUSY)
    } catch (err) {
      setError(err.message || PROVIDER_BUSY)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="sathi-page">
      <h1 className="sathi-h"><Camera size={26} /> Show Sathi</h1>
      <p className="sathi-lead">Take a photo of a letter, bill, form, medicine packet, or phone screen.</p>

      {preview && <img className="sathi-photo" src={preview} alt="Photo to explain" />}

      <div className="sathi-actions">
        <button type="button" className="sathi-btn" onClick={() => cameraRef.current?.click()}>
          <Camera size={16} /> Take or choose a photo
        </button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Take or choose a photo"
        hidden
        onChange={(event) => {
          load(event.target.files?.[0])
          event.target.value = ''
        }}
      />

      <label className="sathi-stack" style={{ marginTop: 16 }}>
        <span className="sathi-kicker">Your question</span>
        <input className="sathi-input" value={question} onChange={(event) => setQuestion(event.target.value)} />
      </label>

      <div className="sathi-actions">
        <button type="button" className="sathi-btn" onClick={explain} disabled={busy}>
          <ScanSearch size={16} /> {busy ? 'Looking…' : 'Explain this'}
        </button>
        {reply && onShare && (
          <button type="button" className="sathi-btn-ghost" onClick={() => onShare({ photo: preview, text: reply })}>
            <Send size={15} /> Send to family
          </button>
        )}
      </div>

      {error && <p className="sathi-error">{error}</p>}
      {reply && (
        <article className="sathi-card" style={{ marginTop: 16 }}>
          <h3>Simple explanation</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{reply}</p>
        </article>
      )}
    </section>
  )
}
