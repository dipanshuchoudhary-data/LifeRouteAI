import { useState } from 'react'
import { Coffee, MessageCircle, Moon, Soup, UtensilsCrossed } from 'lucide-react'
import { sathiTask } from '../../lib/api'
import { sathiContext } from '../../lib/sathiIntent'

const MEAL_ICONS = {
  breakfast: Coffee,
  lunch: Soup,
  dinner: Moon,
}

export default function FoodPanel({ profile, companion, meals, onChange }) {
  const [question, setQuestion] = useState('What should I eat today?')
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)

  const ask = async (text) => {
    setBusy(true)
    try {
      const data = await sathiTask('food', {
        message: text,
        context: { ...sathiContext(profile, companion), meals },
      })
      const textReply = (data.reply || '').trim()
      if (textReply && !/tell me a little more|everyday food idea|i am here/i.test(textReply)) {
        setReply(textReply)
      } else {
        setReply(`Breakfast: ${meals.breakfast}. Lunch: ${meals.lunch}. Dinner: ${meals.dinner}.`)
      }
    } catch {
      setReply(`Breakfast: ${meals.breakfast}. Lunch: ${meals.lunch}. Dinner: ${meals.dinner}.`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="sathi-page">
      <h1 className="sathi-h"><UtensilsCrossed size={26} /> Food & nutrition</h1>
      <p className="sathi-lead">Simple meals for today. Ask Sathi if you are unsure.</p>

      <div className="sathi-list">
        {[
          ['breakfast', 'Breakfast'],
          ['lunch', 'Lunch'],
          ['dinner', 'Dinner'],
        ].map(([key, label]) => {
          const Icon = MEAL_ICONS[key]
          return (
            <label key={key} className="sathi-row">
              <span className="sathi-time"><Icon size={14} style={{ marginRight: 6, verticalAlign: -2 }} />{label}</span>
              <input
                className="sathi-input"
                value={meals[key] || ''}
                onChange={(event) => onChange({ [key]: event.target.value })}
              />
            </label>
          )
        })}
      </div>

      <form
        className="sathi-stack"
        style={{ marginTop: 20 }}
        onSubmit={(event) => {
          event.preventDefault()
          ask(question)
        }}
      >
        <label>
          <span className="sathi-kicker">Ask about food</span>
          <input className="sathi-input" value={question} onChange={(event) => setQuestion(event.target.value)} />
        </label>
        <button type="submit" className="sathi-btn" disabled={busy}>
          <MessageCircle size={15} /> {busy ? 'Thinking…' : 'Ask Sathi'}
        </button>
      </form>
      <div className="sathi-examples">
        <button type="button" onClick={() => ask('Suggest a simple dinner.')}><Moon size={15} /> Simple dinner</button>
        <button type="button" onClick={() => ask('Can I eat this if I have my usual conditions?')}><UtensilsCrossed size={15} /> Can I eat this?</button>
      </div>
      {reply && (
        <article className="sathi-card">
          <h3>Sathi suggests</h3>
          <p>{reply}</p>
          <p className="sathi-muted">This is everyday food help, not a diagnosis or prescription.</p>
        </article>
      )}
    </section>
  )
}
