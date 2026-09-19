import { Heart, Home, Menu, MessageCircle, MoreHorizontal, ShieldPlus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { PATHS, navIdFromPath } from '../../lib/paths'
import { displayName } from '../../lib/sathiIntent'
import { profileInitials, useProfileStore } from '../../stores/useProfileStore'

const TABS = [
  { id: 'home', to: PATHS.home, label: 'Home', Icon: Home, end: true },
  { id: 'talk', to: PATHS.talk, label: 'Talk', Icon: MessageCircle },
  { id: 'health', to: PATHS.health, label: 'Health', Icon: Heart },
]

const MORE_LINKS = [
  { to: PATHS.family, label: 'Family' },
  { to: PATHS.safety, label: 'Safety' },
  { to: PATHS.explain, label: 'Show Sathi' },
  { to: PATHS.memory, label: 'Memory' },
  { to: PATHS.food, label: 'Food' },
  { to: PATHS.tasks, label: 'Today’s plan' },
  { to: PATHS.help, label: 'Digital help' },
  { to: PATHS.settings, label: 'Settings' },
]

export default function SathiShell({ onHelp, children, wide = false }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const moreRef = useRef(null)
  const navigate = useNavigate()
  const pathname = useLocation().pathname
  const tab = navIdFromPath(pathname)
  const profile = useProfileStore((state) => state.profile)
  const name = displayName(profile) || 'Guest'

  useEffect(() => {
    const close = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) setMoreOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setMoreOpen(false)
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className="sathi-app">
      <a className="sathi-skip" href="#sathi-main">Skip to content</a>
      <header className="sathi-top">
        <nav className="sathi-navbar" aria-label="Sathi">
          <button type="button" className="sathi-brand" onClick={() => navigate(PATHS.home)}>
            <span className="sathi-mark"><Heart size={18} fill="currentColor" /></span>
            <span>
              <strong>Sathi AI</strong>
              <em>Your companion for a safer, easier tomorrow</em>
            </span>
          </button>

          <div className="sathi-tabs">
            {TABS.map((item) => (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.end}
                className={`sathi-tab ${tab === item.id ? 'active' : ''}`}
                aria-current={tab === item.id ? 'page' : undefined}
              >
                <item.Icon size={15} /> {item.label}
              </NavLink>
            ))}
            <div className={`sathi-more${moreOpen ? ' open' : ''}`} ref={moreRef}>
              <button
                type="button"
                className={`sathi-tab${tab === 'more' ? ' active' : ''}`}
                aria-expanded={moreOpen}
                aria-controls="sathi-more-menu"
                onClick={() => setMoreOpen((open) => !open)}
              >
                <MoreHorizontal size={15} /> More
              </button>
              <div id="sathi-more-menu" className="sathi-menu" hidden={!moreOpen}>
                {MORE_LINKS.map((item) => (
                  <NavLink key={item.to} to={item.to} onClick={() => setMoreOpen(false)}>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>

          <div className="sathi-top-right">
            <button type="button" className="sathi-emergency" onClick={onHelp} aria-label="Start emergency help">
              <ShieldPlus size={16} /> Emergency
            </button>
            <NavLink className="sathi-userchip" to={PATHS.settings}>
              <span className="sathi-avatar">{profileInitials(profile)}</span>
              <span>
                <strong>{name}</strong>
                <em>Stay well</em>
              </span>
            </NavLink>
            <button
              type="button"
              className="sathi-burger"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="sathi-mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
        {menuOpen && (
          <div id="sathi-mobile-menu" className="sathi-mobile-menu open">
            {TABS.map((item) => (
              <NavLink key={item.id} to={item.to} end={item.end} onClick={() => setMenuOpen(false)}>
                {item.label}
              </NavLink>
            ))}
            {MORE_LINKS.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>
      <main id="sathi-main" className={`sathi-work${wide ? ' wide' : ''}`}>{children}</main>
    </div>
  )
}
