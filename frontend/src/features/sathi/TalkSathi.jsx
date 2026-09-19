import { Mic, Send } from 'lucide-react'
import { useEffect, useRef } from 'react'

function visibleMessages(messages) {
  return (messages || []).filter((row) => {
    if (row.pending) return true
    const text = (row.text || '').trim()
    if (!text) return false
            return !/tell me what you need, or tap the microphone|i heard:|tell me a little more|everyday food idea|according to the instructions|we are given a user message|never diagnose or prescribe|known facts \(from the app\)/i.test(text)
  })
}

export default function TalkSathi({
  messages,
  value,
  onChange,
  onSend,
  onMic,
  listening,
  busy,
  error,
}) {
  const scroller = useRef(null)
  const rows = visibleMessages(messages)

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [rows, busy])

  return (
    <section className="sathi-talk" aria-busy={busy || undefined}>
      <div className="sathi-thread" ref={scroller} aria-live="polite" aria-relevant="additions">
        {rows.length === 0 && (
          <div className="sathi-thread-empty">
            <h1>Talk to Sathi</h1>
            <p>First your message appears. Then Sathi talks about what you said.</p>
          </div>
        )}
        {rows.map((row) => (
          <article key={row.id} className={`sathi-turn ${row.role === 'me' ? 'me' : 'sathi'}`}>
            {row.role !== 'me' && <div className="sathi-turn-mark" aria-hidden="true">S</div>}
            <div className={`sathi-turn-bubble${row.pending ? ' pending' : ''}`}>
              {row.text}
              {row.pending && <span className="sathi-caret" aria-hidden="true" />}
            </div>
          </article>
        ))}
      </div>
      {error && <p className="sathi-error">{error}</p>}
      <form
        className="sathi-composer"
        aria-label="Send a message to Sathi"
        onSubmit={(event) => {
          event.preventDefault()
          onSend(value)
        }}
      >
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Message Sathi"
          aria-label="Message to Sathi"
          disabled={busy}
        />
        <button
          type="button"
          className={listening ? 'listening' : ''}
          onClick={onMic}
          aria-pressed={listening}
          aria-label={listening ? 'Stop voice input' : 'Start voice input'}
        >
          <Mic size={16} />
          <span>{listening ? 'Stop' : 'Voice'}</span>
        </button>
        <button type="submit" disabled={busy || !(value || '').trim()} aria-label="Send message">
          <Send size={15} />
          <span>Send</span>
        </button>
      </form>
    </section>
  )
}
