import { useState } from 'react'
import { Menu, ShieldPlus, X } from 'lucide-react'
import { NAV_LINKS } from '../../data/liferouteData'

export default function AppHeader({ activeNavLink, onNavigate, onSos }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const go = (id) => {
    setMenuOpen(false)
    onNavigate(id)
  }

  return (
    <header className="lr-header-sticky">
      <div className="lr-accent-bar" />
      <nav className="lr-navbar">
        <button type="button" className="lr-logo-group" onClick={() => go('home')} aria-label="LifeRoute home">
          <div className="lr-logo-icon">
            <ShieldPlus size={22} strokeWidth={2} />
          </div>
          <div className="lr-logo-text">LifeRoute <span>AI</span></div>
          <div className="lr-live-badge">
            <div className="lr-live-dot" />
            LIVE
          </div>
        </button>
        <div className="lr-nav-right">
          <div className="lr-nav-tabs">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                className={`lr-nav-link ${activeNavLink === link.id ? 'active' : ''}`}
                onClick={() => go(link.id)}
                type="button"
              >
                {link.label}
              </button>
            ))}
          </div>
          <button className="lr-sos-btn" onClick={onSos} type="button">
            <ShieldPlus size={16} strokeWidth={2} />
            Emergency SOS
          </button>
          <button
            className="lr-menu-btn"
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div className="lr-mobile-menu">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              className={`lr-nav-link ${activeNavLink === link.id ? 'active' : ''}`}
              onClick={() => go(link.id)}
              type="button"
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}
