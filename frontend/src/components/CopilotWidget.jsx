import { useState, useRef, useEffect } from 'react'

const TOOLS = [
  { id: 'navigate_care', label: 'Navigate' },
  { id: 'triage_symptoms', label: 'Triage' },
  { id: 'list_hospitals', label: 'Hospitals' },
]

const TRIAGE_COLORS = {
  icu: '#EF4444',
  emergency: '#F97316',
  clinic: '#EAB308',
  'self-care': '#22C55E',
}

function Message({ msg, isUser }) {
  return (
    <div className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
        style={
          isUser
            ? { background: 'var(--accent-gradient)', color: '#fff', borderBottomRightRadius: 4 }
            : {
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderBottomLeftRadius: 4,
              }
        }
      >
        {!isUser && (
          <p className="text-[10px] font-semibold mb-1" style={{ color: '#FCA5A5' }}>
            Microsoft Copilot
          </p>
        )}
        <div className="whitespace-pre-wrap">{msg.text}</div>
        {msg.triageLevel && (
          <p className="mt-2 pt-2 text-xs font-bold uppercase" style={{ color: TRIAGE_COLORS[msg.triageLevel] || '#FCA5A5', borderTop: '1px solid var(--border-subtle)' }}>
            {msg.triageLevel.replace('-', ' ')}
            {msg.facility && <span className="block font-normal normal-case mt-0.5" style={{ color: 'var(--text-muted)' }}>→ {msg.facility}</span>}
          </p>
        )}
      </div>
    </div>
  )
}

export default function CopilotWidget({ apiUrl }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [tool, setTool] = useState('navigate_care')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      text: 'Hi! I\'m LifeRoute AI via Microsoft Copilot. Describe your symptoms and I\'ll find the right hospital.',
      isUser: false,
    },
  ])
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    if (loading) return
    if (tool !== 'list_hospitals' && !input.trim()) return

    const userText = input.trim() || 'List hospitals'
    setInput('')
    setMessages((m) => [...m, { text: userText, isUser: true }])
    setLoading(true)

    try {
      if (tool === 'navigate_care') {
        const res = await fetch(`${apiUrl}/copilot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: userText, response_format: 'json' }),
        })
        const data = await res.json()
        setMessages((m) => [...m, { text: data.text, isUser: false, triageLevel: data.triage_level, facility: data.selected_facility }])
      } else {
        const params = tool === 'list_hospitals' ? {} : { symptoms: userText }
        const res = await fetch(`${apiUrl}/copilot/invoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool_name: tool, parameters: params }),
        })
        const data = await res.json()
        let text = tool === 'triage_symptoms'
          ? `**${data.result?.triage_level?.toUpperCase()}**\n${data.result?.triage_reasoning}`
          : (data.result?.hospitals || []).slice(0, 5).map((h) => `• ${h.name} (${h.city})`).join('\n')
        setMessages((m) => [...m, { text, isUser: false }])
      }
    } catch {
      setMessages((m) => [...m, { text: 'Connection error. Is the backend running?', isUser: false }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-4 z-50 flex flex-col overflow-hidden sm:w-[360px] w-[calc(100vw-2rem)]"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px 16px 0 0',
            maxHeight: '70vh',
            animation: 'fadeUp 0.25s ease-out forwards',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <p className="font-bold text-sm text-text-primary">LifeRoute Copilot</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Microsoft Copilot Studio</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} style={{ color: 'var(--text-muted)' }}>✕</button>
          </div>

          <div className="flex gap-1 px-3 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            {TOOLS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTool(t.id)}
                className="px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200"
                style={
                  tool === t.id
                    ? { background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5' }
                    : { background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 min-h-[180px] max-h-[320px]">
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} isUser={msg.isUser} />
            ))}
            {loading && (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Analyzing...</p>
            )}
            <div ref={endRef} />
          </div>

          <div className="p-3 flex gap-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Describe symptoms..."
              className="flex-1 rounded-full px-4 py-2 text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fff' }}
            />
            <button type="button" onClick={handleSend} disabled={loading} className="btn-gradient w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50">
              ↑
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50">
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ animation: 'copilotPulse 3s ease-out infinite', border: '2px solid rgba(239,68,68,0.4)' }}
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="relative w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
          style={{ background: 'var(--accent-gradient)', boxShadow: '0 4px 24px rgba(239,68,68,0.35)' }}
          aria-label="Open Copilot"
        >
          💬
        </button>
      </div>
    </>
  )
}
