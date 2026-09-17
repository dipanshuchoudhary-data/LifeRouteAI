import { ShieldPlus } from 'lucide-react'
import { NAV_LINKS } from '../../data/liferouteData'

export default function AppFooter({ onNavigate }) {
  return (
    <footer className="lr-footer">
      <div className="lr-footer-row">
        <div className="lr-footer-brand">
          <div className="lr-logo-group">
            <div className="lr-logo-icon lr-logo-icon-sm">
              <ShieldPlus size={16} strokeWidth={2} />
            </div>
            <div className="lr-logo-text">LifeRoute <span>AI</span></div>
          </div>
          <p>Right facility. Live beds. Signed referral.</p>
        </div>
        <nav className="lr-footer-links" aria-label="Product">
          {NAV_LINKS.map((link) => (
            <button key={link.id} type="button" onClick={() => onNavigate?.(link.id)}>
              {link.label}
            </button>
          ))}
        </nav>
      </div>
      <p className="lr-footer-disclaimer" id="disclaimer-section">
        Navigation aid, not a medical device. Life-threatening symptoms skip the LLM. Call 108 if unresponsive or not breathing.
      </p>
      <div className="lr-footer-bottom">
        <span>© {new Date().getFullYear()} LifeRoute AI</span>
        <span>English · हिन्दी · Delhi NCR</span>
      </div>
    </footer>
  )
}
