import { Bookmark, Camera, ClipboardList, HelpCircle, Settings, UtensilsCrossed } from 'lucide-react'

const ITEMS = [
  { id: 'memory', title: 'Memory', text: 'What Sathi should remember for you', Icon: Bookmark },
  { id: 'explain', title: 'Show Sathi', text: 'Explain a photo, letter, or screen', Icon: Camera },
  { id: 'help', title: 'Digital help', text: 'Bills, forms, and phone messages', Icon: HelpCircle },
  { id: 'food', title: 'Food & nutrition', text: 'Simple meals for today', Icon: UtensilsCrossed },
  { id: 'tasks', title: 'My day', text: 'Tasks and reminders', Icon: ClipboardList },
  { id: 'settings', title: 'Settings', text: 'Name, city, and text size', Icon: Settings },
]

export default function MorePanel({ onOpen }) {
  return (
    <section className="sathi-page">
      <h1 className="sathi-h">More</h1>
      <p className="sathi-lead">Everyday tools, kept off the main buttons.</p>
      <div className="sathi-actions-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {ITEMS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`sathi-action ${['mint', 'blue', 'gold', 'rose', 'mint', 'blue'][index]}`}
            onClick={() => onOpen(item.id)}
          >
            <item.Icon size={18} />
            <strong>{item.title}</strong>
            <span>{item.text}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
