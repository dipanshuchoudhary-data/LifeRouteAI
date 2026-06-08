export default function Navbar({ language, setLanguage, rightSlot }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="flex items-center gap-3">
          <div className="logo-mark">🏥</div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[15px] text-text-primary">LifeRoute AI</span>
            <span className="live-badge">
              <span className="live-dot" />
              LIVE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {setLanguage && (
            <div className="flex gap-1 mr-2">
              <button
                type="button"
                className={`lang-pill ${language === 'en' ? 'lang-pill--active' : ''}`}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={`lang-pill ${language === 'hi' ? 'lang-pill--active' : ''}`}
                onClick={() => setLanguage('hi')}
              >
                हिं
              </button>
            </div>
          )}
          {rightSlot}
        </div>
      </div>
    </nav>
  )
}
