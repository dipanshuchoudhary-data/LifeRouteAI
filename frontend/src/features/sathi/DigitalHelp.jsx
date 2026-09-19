import { useState } from 'react'
import { Camera, FileText, HelpCircle, ListOrdered, Mail, MousePointerClick } from 'lucide-react'
import { sathiTask } from '../../lib/api'
import { sathiContext } from '../../lib/sathiIntent'

const PROMPTS = [
  { text: 'Where do I click?', Icon: MousePointerClick },
  { text: 'What does this message mean?', Icon: Mail },
  { text: 'How do I fill this form?', Icon: FileText },
  { text: 'Is this asking for my password?', Icon: HelpCircle },
  { text: 'Explain this bill.', Icon: FileText },
]

export default function DigitalHelp({ profile, companion, onExplain }) {
  const [question, setQuestion] = useState('What does this message mean?')
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)

  const ask = async (text) => {
    setBusy(true)
    try {
      const data = await sathiTask('help', {
        message: `Help me with this everyday digital task. Explain step by step in short sentences. ${text}`,
        context: sathiContext(profile, companion),
      })
      setReply(data.reply)
    } catch {
      setReply('I can walk you through this one step at a time. If it is a paper or a screen, tap Show a photo. Never share your password with anyone who messages you.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="sathi-page">
      <h1 className="sathi-h"><HelpCircle size={26} /> Digital help</h1>
      <p className="sathi-lead">Bills, forms, websites, phone screens, and messages — explained slowly.</p>
      <div className="sathi-examples">
        {PROMPTS.map((item) => (
          <button key={item.text} type="button" onClick={() => ask(item.text)}>
            <item.Icon size={15} /> {item.text}
          </button>
        ))}
      </div>
      <form
        className="sathi-stack"
        onSubmit={(event) => {
          event.preventDefault()
          ask(question)
        }}
      >
        <label>
          <span className="sathi-kicker">What do you need help with?</span>
          <textarea className="sathi-textarea" value={question} onChange={(event) => setQuestion(event.target.value)} />
        </label>
        <button type="submit" className="sathi-btn" disabled={busy}>
          <ListOrdered size={15} /> {busy ? 'Explaining…' : 'Explain step by step'}
        </button>
        <button type="button" className="sathi-btn-ghost" onClick={onExplain}>
          <Camera size={15} /> Show a photo instead
        </button>
      </form>
      {reply && (
        <article className="sathi-card">
          <h3>Step by step</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{reply}</p>
        </article>
      )}
    </section>
  )
}
