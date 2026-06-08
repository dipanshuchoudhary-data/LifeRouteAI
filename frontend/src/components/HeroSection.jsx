import { useState } from 'react'
import {
  IconBolt,
  IconMicrophone,
  IconArrowRight,
  IconHeartRateMonitor,
  IconBrain,
  IconAmbulance,
  IconThermometer,
  IconLungs,
  IconBabyCarriage,
} from '@tabler/icons-react'

const chips = [
  {
    label: 'Chest Pain',
    icon: IconHeartRateMonitor,
    query: 'Chest pain / cardiac emergency',
    color: 'red',
  },
  {
    label: 'Stroke',
    icon: IconBrain,
    query: 'Stroke symptoms — face drooping, arm weakness',
    color: 'red',
  },
  {
    label: 'Accident / Trauma',
    icon: IconAmbulance,
    query: 'Accident or major trauma injury',
    color: 'red',
  },
  {
    label: 'High Fever',
    icon: IconThermometer,
    query: 'High fever above 103°F',
    color: 'amber',
  },
  {
    label: 'Breathing Issues',
    icon: IconLungs,
    query: 'Severe breathing difficulty',
    color: 'blue',
  },
  {
    label: 'Child Emergency',
    icon: IconBabyCarriage,
    query: 'Child emergency pediatric care',
    color: 'amber',
  },
]

const chipColorMap = {
  red:   'bg-red-brand/[0.09] border-red-brand/30 text-[#FF8A9A] hover:bg-red-brand/[0.16] hover:border-red-brand/45 hover:scale-[1.04]',
  amber: 'bg-amber-warn/[0.09] border-amber-warn/30 text-[#FAC75A] hover:bg-amber-warn/[0.16] hover:border-amber-warn/45 hover:scale-[1.04]',
  blue:  'bg-[#3568D7]/[0.09] border-[#3568D7]/30 text-[#7BA5F5] hover:bg-[#3568D7]/[0.16] hover:border-[#3568D7]/45 hover:scale-[1.04]',
}

const stats = [
  { val: '15+',  label: 'Hospitals Live', accent: false },
  { val: '<30s', label: 'Avg. Routing',   accent: true  },
  { val: '3',    label: 'Cities',         accent: false },
  { val: 'AI',   label: 'Powered',        accent: false },
]

export default function HeroSection() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  return (
    <section className="w-full flex flex-col items-center px-6 pt-20 pb-[80px]">
      <div className="w-full max-w-[700px] flex flex-col items-center text-center">

        {/* Hero badge */}
        <div className="animate-badge-glow inline-flex items-center gap-2 bg-red-brand/[0.08] border border-red-brand/35 rounded-full px-4 py-[6px] text-[14px] font-semibold text-[#FF6070] uppercase tracking-[0.07em] mb-8 shadow-[0_0_0_1px_rgba(232,0,29,0.1)]">
          <IconBolt size={14} stroke={2} className="text-red-brand" />
          AI-powered emergency routing · Delhi NCR
        </div>

        {/* Headline */}
        <h1 className="font-heading text-[clamp(40px,5.5vw,56px)] font-bold leading-[1.06] tracking-[-0.03em] text-white mb-5">
          Find the right care,
          <br />
          <em className="not-italic text-red-brand">in seconds.</em>
        </h1>

        {/* Subtitle */}
        <p className="text-[17px] text-grey-400 max-w-[520px] mb-10 font-light leading-[1.65]">
          Real-time bed availability, ambulance tracking, and AI-matched
          hospital routing — when every second counts.
        </p>

        {/* Search bar */}
        <div
          className={`relative w-full max-w-[660px] mb-6 rounded-2xl transition-all duration-200 ${
            focused
              ? 'shadow-[0_0_0_2px_rgba(232,0,29,0.5),0_8px_32px_rgba(232,0,29,0.12)]'
              : 'shadow-[0_0_0_1px_rgba(255,255,255,0.1)]'
          }`}
        >
          {/* Mic button — left */}
          <button
            type="button"
            className="absolute left-[18px] top-1/2 -translate-y-1/2 text-grey-400 hover:text-[#FF6070] cursor-pointer p-1 transition-colors z-10"
          >
            <IconMicrophone size={20} stroke={1.5} />
          </button>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Describe symptoms… e.g. severe chest pain, stroke, trauma"
            className="w-full bg-white/[0.055] border border-white/[0.12] rounded-2xl py-[18px] pl-[52px] pr-[148px] font-sans text-[15px] text-white outline-none placeholder:text-grey-400 focus:border-red-brand/45 focus:bg-white/[0.075] transition-colors"
          />

          {/* Find Care CTA */}
          <button
            type="button"
            className="absolute right-[7px] top-1/2 -translate-y-1/2 flex items-center gap-2 bg-red-brand hover:bg-red-dark border-none rounded-[14px] px-5 py-[11px] font-sans text-[14px] font-bold text-white cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Find Care
            <IconArrowRight size={16} stroke={2} />
          </button>
        </div>

        {/* Quick chips */}
        <div className="flex flex-wrap justify-center gap-2.5 w-full max-w-[660px] mb-14">
          {chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => setQuery(chip.query)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-sans text-[13.5px] font-medium cursor-pointer border transition-all duration-150 ${chipColorMap[chip.color]}`}
            >
              <chip.icon size={15} stroke={1.5} />
              {chip.label}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className="w-full max-w-[580px] flex border border-white/[0.09] rounded-2xl overflow-hidden bg-white/[0.025]">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex-1 px-4 py-5 text-center ${
                i < stats.length - 1 ? 'border-r border-white/[0.09]' : ''
              }`}
            >
              <div
                className={`font-mono text-[28px] font-bold tracking-[-0.04em] leading-none mb-1.5 ${
                  s.accent ? 'text-red-brand' : 'text-white'
                }`}
              >
                {s.val}
              </div>
              <div className="text-[11px] text-grey-400 uppercase tracking-[0.08em] font-medium">
                {s.label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
