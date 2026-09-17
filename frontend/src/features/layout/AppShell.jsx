import {
  Activity, Ambulance, BedDouble, Bell, Droplet, LayoutDashboard,
  MapPinned, Menu, Radio, Settings, ShieldPlus, UserRound, Wifi, X,
} from 'lucide-react'
import { NAV_LINKS } from '../../data/liferouteData'
import { profileInitials, useProfileStore } from '../../stores/useProfileStore'

const ICONS = {
  home: LayoutDashboard,
  ops: Radio,
  hospitals: Activity,
  ambulance: Ambulance,
  blood: Droplet,
  icu: BedDouble,
  profile: UserRound,
  settings: Settings,
}

const NAV_GROUPS = [
  { id: 'care', label: 'Care', ids: ['home', 'ops'] },
  { id: 'network', label: 'Network', ids: ['hospitals', 'ambulance', 'blood', 'icu'] },
  { id: 'account', label: 'Account', ids: ['profile', 'settings'] },
]

const TITLES = {
  home: 'Home',
  ops: 'Live operations',
  hospitals: 'Hospital network',
  ambulance: 'Ambulance fleet',
  blood: 'Blood inventory',
  icu: 'ICU capacity',
  profile: 'Medical chart',
  settings: 'System settings',
}

export default function AppShell({
  activeNavLink,
  onNavigate,
  onSos,
  children,
  live = true,
  region = 'Delhi NCR',
  menuOpen,
  setMenuOpen,
}) {
  const profile = useProfileStore((s) => s.profile)
  const initials = profileInitials(profile)

  const go = (id) => {
    setMenuOpen(false)
    onNavigate(id)
  }

  return (
    <div className="ops-shell">
      <aside className={`ops-sidebar ${menuOpen ? 'open' : ''}`}>
        <button type="button" className="ops-brand" onClick={() => go('home')}>
          <span className="ops-mark"><ShieldPlus size={18} /></span>
          <span>
            <strong>LifeRoute AI</strong>
            <em>Emergency care</em>
          </span>
        </button>
        <nav className="ops-nav" aria-label="Primary">
          {NAV_GROUPS.map((group, index) => (
            <div key={group.id} className="ops-nav-group">
              {index > 0 && <div className="ops-nav-barrier" role="separator" />}
              <p className="ops-nav-label">{group.label}</p>
              {NAV_LINKS.filter((link) => group.ids.includes(link.id)).map((link) => {
                const Icon = ICONS[link.id] || LayoutDashboard
                return (
                  <button
                    key={link.id}
                    type="button"
                    className={`ops-nav-item ${activeNavLink === link.id ? 'active' : ''}`}
                    onClick={() => go(link.id)}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                    {link.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="ops-sidebar-foot">
          <span className={`ops-pill ${live ? 'ok' : 'warn'}`}>
            <Wifi size={12} /> {live ? 'Telemetry live' : 'Cached'}
          </span>
        </div>
      </aside>

      {menuOpen && <button type="button" className="ops-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <div className="ops-main">
        <header className="ops-topbar">
          <button type="button" className="ops-icon-btn ops-menu-toggle" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="ops-top-title">
            <h1>{TITLES[activeNavLink] || 'LifeRoute'}</h1>
            <p>{region}</p>
          </div>
          <div className="ops-top-meta">
            <span className="ops-pill info"><MapPinned size={12} /> {region}</span>
            <span className={`ops-pill ${live ? 'ok' : 'warn'}`}><span className="ops-live-dot" /> {live ? 'Connected' : 'Degraded'}</span>
            <button type="button" className="ops-icon-btn" aria-label="Notifications" onClick={() => go('ops')}>
              <Bell size={16} />
            </button>
            <button type="button" className="ops-user" onClick={() => go('profile')}>
              <span>{initials}</span>
              <em>{profile.name || 'Chart'}</em>
            </button>
            <button type="button" className="ops-sos" onClick={onSos}>
              Emergency SOS
            </button>
          </div>
        </header>
        <div className="ops-workspace">{children}</div>
      </div>
    </div>
  )
}
