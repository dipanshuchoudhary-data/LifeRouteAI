import { useState } from 'react'
import { IconShieldHeart } from '@tabler/icons-react'

const NAV_LINKS = ['Hospitals', 'Ambulance', 'Blood Bank', 'ICU Tracker']
const LANGS = ['EN', 'हि']

export default function Header() {
  const [activeLang, setActiveLang] = useState('EN')

  return (
    <div className="sticky top-0 z-50">
      {/* Red accent bar */}
      <div className="h-[3px] w-full bg-gradient-to-r from-red-brand via-[#FF3344] to-red-brand" />

      <header className="border-b border-white/[0.09] backdrop-blur-2xl bg-[#0a0a0a]/88 h-[64px] flex items-center justify-between px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-[38px] h-[38px] bg-red-brand rounded-[11px] flex items-center justify-center text-white shadow-[0_0_16px_rgba(232,0,29,0.35)]">
            <IconShieldHeart size={20} stroke={2} />
          </div>
          <span className="text-[18px] font-bold tracking-tight text-white font-heading leading-none">
            LifeRoute <span className="text-red-brand">AI</span>
          </span>
          <div className="flex items-center gap-1.5 bg-red-brand/10 border border-red-brand/30 rounded-full px-2.5 py-[3px] font-mono text-[11px] font-semibold text-red-brand uppercase tracking-widest ml-1">
            <span className="w-[7px] h-[7px] rounded-full bg-red-brand animate-live-dot" />
            LIVE
          </div>
        </div>

        {/* Right nav */}
        <nav className="flex items-center gap-0.5">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              className="relative px-4 py-2 rounded-lg text-[13.5px] text-grey-400 hover:text-white transition-colors cursor-pointer no-underline group"
            >
              {link}
              <span className="absolute bottom-[5px] left-4 right-4 h-[2px] bg-red-brand rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
            </a>
          ))}

          <button
            type="button"
            className="animate-sos-pulse flex items-center gap-2 bg-red-brand hover:bg-red-dark text-white font-bold text-[13.5px] px-5 py-[9px] rounded-xl transition-colors cursor-pointer border-none ml-3"
          >
            <IconShieldHeart size={16} stroke={2} />
            Emergency SOS
          </button>

          <div className="flex ml-3">
            <div className="flex gap-0.5 bg-white/[0.06] rounded-lg p-[3px]">
              {LANGS.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLang(lang)}
                  className={`px-2.5 py-1 rounded-[5px] text-xs font-medium cursor-pointer transition-colors border-none ${
                    activeLang === lang
                      ? 'bg-white/10 text-white'
                      : 'text-grey-400 bg-transparent'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </header>
    </div>
  )
}
