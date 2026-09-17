import { useEffect, useRef, useState } from 'react'
import { Hospital, MessageCircle, Mic, Navigation, Phone, Send, Stethoscope, X } from 'lucide-react'
import { useAudioCapture } from '../features/triage/hooks/useAudioCapture'

const TOOLS = [
  { id: 'navigate_care', label: 'Navigate', icon: Navigation },
  { id: 'triage_symptoms', label: 'Triage', icon: Stethoscope },
  { id: 'list_hospitals', label: 'Hospitals', icon: Hospital },
]

const TRIAGE_COLORS = {
  icu: '#EF4444',
  emergency: '#F97316',
  clinic: '#EAB308',
  'self-care': '#22C55E',
}

function facilityName(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.name || ''
}

function Message({ msg }) {
  return (
    <div className={`lr-assistant-row ${msg.isUser ? 'user' : 'bot'}`}>
      <div className="lr-assistant-bubble">
        {!msg.isUser && <p className="lr-assistant-kicker">LifeRoute</p>}
        <p>{msg.text}</p>
        {msg.triageLevel && (
          <p className="lr-assistant-triage" style={{ color: TRIAGE_COLORS[msg.triageLevel] || '#FCA5A5' }}>
            {String(msg.triageLevel).replace('-', ' ')}
            {msg.facility ? ` → ${msg.facility}` : ''}
          </p>
        )}
      </div>
    </div>
  )
}

export default function AssistantWidget({ apiUrl: apiRoot = '' }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [tool, setTool] = useState('navigate_care')
  const [loading, setLoading] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const [messages, setMessages] = useState([
    {
      text: 'Describe symptoms in English or Hindi. I will triage and route you to a capable hospital. Call 108 in an emergency.',
      isUser: false,
    },
  ])
  const endRef = useRef(null)
  const inputRef = useRef(null)

  const sendText = async (raw) => {
    if (loading) return
    const userText = (raw || '').trim() || (tool === 'list_hospitals' ? 'List hospitals' : '')
    if (tool !== 'list_hospitals' && !userText) return

    setInput('')
    setVoiceError('')
    setMessages((current) => [...current, { text: userText, isUser: true }])
    setLoading(true)

    try {
      if (tool === 'navigate_care') {
        const res = await fetch(`${apiRoot}/assistant/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: userText, response_format: 'json' }),
        })
        const data = await res.json()
        setMessages((current) => [
          ...current,
          {
            text: (data.text || 'I could not complete navigation. Please try again or call 108.').replace(/\*\*/g, ''),
            isUser: false,
            triageLevel: data.triage_level,
            facility: facilityName(data.selected_facility),
          },
        ])
      } else {
        const params = tool === 'list_hospitals' ? {} : { symptoms: userText }
        const res = await fetch(`${apiRoot}/assistant/invoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool_name: tool, parameters: params }),
        })
        const data = await res.json()
        const text = tool === 'triage_symptoms'
          ? `${(data.result?.triage_level || 'clinic').toUpperCase()}\n${data.result?.triage_reasoning || ''}`
          : (data.result?.hospitals || []).slice(0, 5).map((hospital) => `• ${hospital.name} (${hospital.city})`).join('\n') || 'No hospitals returned.'
        setMessages((current) => [...current, { text, isUser: false, triageLevel: data.result?.triage_level }])
      }
    } catch {
      setMessages((current) => [...current, { text: 'Connection error. If this is urgent, call 108.', isUser: false }])
    } finally {
      setLoading(false)
    }
  }

  const { isListening, isTranscribing, level, start, stop } = useAudioCapture({
    onTranscript: (text) => {
      setInput(text)
      sendText(text)
    },
    onError: setVoiceError,
  })

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, isTranscribing])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const busy = loading || isTranscribing

  return (
    <div className="lr-assistant">
      {open && (
        <section className="lr-assistant-panel" aria-label="LifeRoute assistant">
          <header className="lr-assistant-head">
            <div className="lr-assistant-identity">
              <span className="lr-assistant-avatar"><MessageCircle size={16} /></span>
              <div>
                <strong>LifeRoute Assistant</strong>
                <em>{isListening ? 'Listening…' : isTranscribing ? 'Transcribing voice…' : 'Voice + text clinical routing'}</em>
              </div>
            </div>
            <div className="lr-assistant-head-actions">
              <a className="lr-assistant-icon-btn lr-assistant-108" href="tel:108" aria-label="Call 108">
                <Phone size={16} />
              </a>
              <button type="button" className="lr-assistant-icon-btn" onClick={() => setOpen(false)} aria-label="Close assistant">
                <X size={16} />
              </button>
            </div>
          </header>

          <div className="lr-assistant-tools" role="tablist" aria-label="Assistant mode">
            {TOOLS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tool === item.id}
                className={tool === item.id ? 'active' : ''}
                onClick={() => setTool(item.id)}
              >
                <item.icon size={13} />
                {item.label}
              </button>
            ))}
          </div>

          <div className="lr-assistant-thread">
            {messages.map((msg, index) => (
              <Message key={`${msg.isUser ? 'u' : 'b'}-${index}`} msg={msg} />
            ))}
            {busy && <p className="lr-assistant-status">{isTranscribing ? 'Transcribing with the voice model…' : 'Finding the right facility…'}</p>}
            {voiceError && <p className="lr-assistant-status error">{voiceError}</p>}
            <div ref={endRef} />
          </div>

          <form
            className="lr-assistant-composer"
            onSubmit={(event) => {
              event.preventDefault()
              sendText(input)
            }}
          >
            <button
              type="button"
              className={`lr-assistant-icon-btn mic ${isListening ? 'live' : ''}`}
              onClick={() => (isListening ? stop() : start())}
              disabled={loading}
              aria-label={isListening ? 'Stop recording' : 'Speak symptoms'}
              style={isListening ? { transform: `scale(${1 + level * 0.12})` } : undefined}
            >
              <Mic size={16} />
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={tool === 'list_hospitals' ? 'Optional city filter…' : 'Describe symptoms…'}
              aria-label="Message"
              disabled={busy}
            />
            <button type="submit" className="lr-assistant-send" disabled={busy} aria-label="Send">
              <Send size={16} />
            </button>
          </form>
        </section>
      )}

      {!open && (
        <div className="lr-float-actions">
          <a className="lr-call-108-fab" href="tel:108">
            <Phone size={16} strokeWidth={2} />
            108
          </a>
          <button type="button" className="lr-assistant-fab" onClick={() => setOpen(true)} aria-label="Open assistant">
            <MessageCircle size={22} />
          </button>
        </div>
      )}
    </div>
  )
}
