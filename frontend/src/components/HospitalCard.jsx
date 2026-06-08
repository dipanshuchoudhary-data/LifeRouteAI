import {
  IconMapPin,
  IconStarFilled,
  IconNavigation,
  IconAmbulance,
  IconPhoneCall,
} from '@tabler/icons-react'

/* ── Tag colour system ────────────────────────────────────────────────────── */
const tagStyles = {
  cardio:  'bg-red-brand/[0.1] text-[#FF8A9A] border-red-brand/20',
  neuro:   'bg-[#7B45D8]/[0.12] text-[#C49EF5] border-[#7B45D8]/25',
  ortho:   'bg-green-avail/[0.1] text-[#4DD4A0] border-green-avail/20',
  trauma:  'bg-amber-warn/[0.1] text-[#FAC75A] border-amber-warn/20',
  onco:    'bg-amber-warn/[0.1] text-[#FAC75A] border-amber-warn/20',
  gynae:   'bg-[#E83589]/[0.1] text-[#F580BC] border-[#E83589]/25',
  peds:    'bg-[#3568D7]/[0.1] text-[#7BA5F5] border-[#3568D7]/25',
  general: 'bg-white/[0.05] text-grey-200 border-white/[0.09]',
}

/* ── Ambulance status styles ─────────────────────────────────────────────── */
const ambConfig = {
  available: {
    iconCls:  'bg-green-avail/[0.12] text-green-avail',
    textCls:  'text-green-avail',
    label:    'AVAILABLE',
  },
  limited: {
    iconCls:  'bg-amber-warn/[0.1] text-amber-warn',
    textCls:  'text-amber-warn',
    label:    'LIMITED',
  },
  none: {
    iconCls:  'bg-red-brand/[0.1] text-[#FF8A9A]',
    textCls:  'text-[#FF8A9A]',
    label:    'UNAVAILABLE',
  },
}

export default function HospitalCard({ hospital }) {
  const {
    name, city, distanceKm, rating, reviews, isGovt,
    specialties, beds, waitMin, capacityPct,
    ambulances, ambulanceStatus, etaMin,
  } = hospital

  /* capacity colour */
  const capColor =
    capacityPct > 85 ? 'text-[#FF6B7A]'
    : capacityPct > 70 ? 'text-amber-warn'
    : 'text-green-avail'

  const barColor =
    capacityPct > 85 ? 'bg-red-brand'
    : capacityPct > 70 ? 'bg-amber-warn'
    : 'bg-green-avail'

  const statusLabel =
    capacityPct > 85 ? 'Critical demand'
    : capacityPct > 70 ? 'High demand'
    : 'Normal capacity'

  /* wait colour */
  const waitColor =
    waitMin >= 20 ? 'text-[#FF8A9A]'
    : waitMin >= 12 ? 'text-amber-warn'
    : 'text-green-avail'

  const amb = ambConfig[ambulanceStatus] ?? ambConfig.none

  return (
    <article className="
      group bg-[#111111] border border-white/[0.08] rounded-2xl
      p-5 flex flex-col gap-4
      transition-all duration-200 cursor-pointer
      hover:border-white/[0.16]
      hover:-translate-y-[3px]
      hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]
    ">

      {/* ── Row 1: Name + Distance ────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[18px] font-semibold text-white tracking-[-0.02em] leading-snug flex items-center gap-2 flex-wrap">
          {name}
          {isGovt && (
            <span className="text-[11px] font-semibold text-[#818CF8] bg-indigo-500/[0.12] border border-indigo-500/25 rounded-full px-2.5 py-[2px] whitespace-nowrap">
              Govt.
            </span>
          )}
        </h3>
        <div className="flex items-center gap-1.5 bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-[7px] font-mono text-[12px] font-medium text-grey-200 whitespace-nowrap shrink-0">
          <IconNavigation size={13} stroke={1.5} />
          {distanceKm} km
        </div>
      </div>

      {/* ── Row 2: City + Rating ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 text-[13px] text-grey-400 -mt-1">
        <span className="flex items-center gap-1">
          <IconMapPin size={13} stroke={1.5} />
          {city}
        </span>
        <span className="flex items-center gap-1 text-[#FAC75A] font-semibold">
          <IconStarFilled size={12} />
          {rating}
        </span>
        <span>({reviews.toLocaleString()} reviews)</span>
      </div>

      {/* ── Specialty tags ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {specialties.map((s) => (
          <span
            key={s.label}
            className={`px-3 py-[5px] rounded-full text-[12px] font-medium border ${tagStyles[s.variant] ?? tagStyles.general}`}
          >
            {s.label}
          </span>
        ))}
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="px-4 py-3 text-center border-r border-white/[0.08]">
          <div className="font-mono text-[22px] font-bold tracking-tight text-white leading-none mb-1">
            {beds}
          </div>
          <div className="text-[11px] text-grey-400 uppercase tracking-[0.07em]">Beds</div>
        </div>
        <div className="px-4 py-3 text-center border-r border-white/[0.08]">
          <div className={`font-mono text-[22px] font-bold tracking-tight leading-none mb-1 ${waitColor}`}>
            ~{waitMin}m
          </div>
          <div className="text-[11px] text-grey-400 uppercase tracking-[0.07em]">Est. Wait</div>
        </div>
        <div className="px-4 py-3 text-center">
          <div className={`font-mono text-[22px] font-bold tracking-tight leading-none mb-1 ${capColor}`}>
            {capacityPct}%
          </div>
          <div className="text-[11px] text-grey-400 uppercase tracking-[0.07em]">Capacity</div>
        </div>
      </div>

      {/* ── Capacity bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <div className="h-[6px] w-full bg-white/[0.08] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${capacityPct}%` }}
          />
        </div>
        <span className={`text-[13px] font-medium leading-none ${capColor}`}>
          {capacityPct}% full · {statusLabel}
        </span>
      </div>

      {/* ── Ambulance row ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${amb.iconCls}`}>
          <IconAmbulance size={16} stroke={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-[13px] font-semibold ${amb.textCls}`}>
            {ambulances.available}/{ambulances.total} Ambulances{' '}
            <span className="font-mono tracking-wider text-[12px]">{amb.label}</span>
          </div>
          <div className="text-[12px] text-grey-400 font-mono mt-[2px]">
            ETA: ~{etaMin} min
          </div>
        </div>
      </div>

      {/* ── Call Hospital — full width ─────────────────────────────────────── */}
      <button
        type="button"
        className="
          w-full flex items-center justify-center gap-2
          bg-red-brand hover:bg-red-dark
          border-none rounded-xl h-11
          font-sans text-[14px] font-bold text-white
          cursor-pointer transition-all
          active:scale-[0.98]
          group-hover:shadow-[0_4px_16px_rgba(232,0,29,0.25)]
        "
      >
        <IconPhoneCall size={16} stroke={2} />
        Call Hospital
      </button>
    </article>
  )
}
