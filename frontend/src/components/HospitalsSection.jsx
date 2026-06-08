import { useState } from 'react'
import {
  IconMapPin,
  IconAdjustmentsHorizontal,
  IconRefresh,
  IconLayoutGrid,
  IconHeart,
  IconBrain,
  IconBone,
  IconAmbulance,
  IconMicroscope,
  IconStethoscope,
  IconVenus,
  IconBabyCarriage,
  IconDroplet,
} from '@tabler/icons-react'
import { hospitals } from '../data/hospitals'
import HospitalCard from './HospitalCard'

const cities = ['All Cities', 'Delhi', 'Gurgaon', 'Noida']

const specialties = [
  { label: 'All',         icon: IconLayoutGrid  },
  { label: 'Cardiology',  icon: IconHeart        },
  { label: 'Neurology',   icon: IconBrain        },
  { label: 'Orthopedics', icon: IconBone         },
  { label: 'Trauma',      icon: IconAmbulance    },
  { label: 'Oncology',    icon: IconMicroscope   },
  { label: 'General',     icon: IconStethoscope  },
  { label: 'Gynecology',  icon: IconVenus        },
  { label: 'Pediatrics',  icon: IconBabyCarriage },
  { label: 'Nephrology',  icon: IconDroplet      },
]

export default function HospitalsSection() {
  const [activeCity, setActiveCity] = useState('All Cities')
  const [activeSpec, setActiveSpec] = useState('All')

  const filtered = hospitals.filter((h) => {
    const cityMatch = activeCity === 'All Cities' || h.city === activeCity
    const specMatch =
      activeSpec === 'All' ||
      h.specialties.some((s) => s.label.includes(activeSpec))
    return cityMatch && specMatch
  })

  return (
    <section className="w-full max-w-[1200px] mx-auto px-6 pt-10 pb-16">

      {/* Section header */}
      <div className="flex items-center justify-between mb-6 mt-6 flex-wrap gap-4">
        <div>
          <h2 className="font-heading text-[22px] font-bold tracking-[-0.025em] text-white leading-tight">
            Nearby Hospitals
          </h2>
          <p className="text-[13px] text-grey-400 mt-[3px]">
            {filtered.length} facilities · nearest first
          </p>
        </div>
        <div className="flex gap-2.5 items-center">
          <span className="flex items-center gap-1.5 text-[13px] text-grey-400">
            <IconMapPin size={14} stroke={1.5} />
            Delhi NCR
          </span>
          <button
            type="button"
            className="flex items-center gap-1.5 px-4 py-[8px] rounded-xl bg-white/[0.05] border border-white/[0.1] text-grey-200 text-[13px] font-medium cursor-pointer transition-colors hover:bg-white/[0.09] hover:border-white/[0.16]"
          >
            <IconAdjustmentsHorizontal size={15} stroke={1.5} />
            Filters
          </button>
        </div>
      </div>

      {/* Row 1: City tabs */}
      <div className="flex gap-1 bg-white/[0.04] border border-white/[0.07] rounded-[12px] p-1 w-fit mb-3">
        {cities.map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => setActiveCity(city)}
            className={`px-4 py-[7px] rounded-[9px] text-[13px] font-medium cursor-pointer border-none transition-all ${
              activeCity === city
                ? 'bg-white/[0.1] text-white shadow-[0_1px_4px_rgba(0,0,0,0.3)]'
                : 'bg-transparent text-grey-400 hover:text-grey-200'
            }`}
          >
            {city}
          </button>
        ))}
      </div>

      {/* Row 2: Specialty filter chips */}
      <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1 mb-8">
        {specialties.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setActiveSpec(s.label)}
            className={`flex items-center gap-[6px] whitespace-nowrap px-4 py-[8px] rounded-xl text-[13px] font-medium cursor-pointer border transition-all shrink-0 ${
              activeSpec === s.label
                ? 'bg-red-brand/10 border-red-brand/35 text-[#FF8A9A] shadow-[0_0_10px_rgba(232,0,29,0.12)]'
                : 'bg-white/[0.04] border-white/[0.08] text-grey-400 hover:bg-white/[0.08] hover:text-grey-200 hover:border-white/[0.14]'
            }`}
          >
            <s.icon size={14} stroke={1.5} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Hospital grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length > 0 ? (
          filtered.map((h) => <HospitalCard key={h.id} hospital={h} />)
        ) : (
          <div className="col-span-full text-center py-16 text-grey-400">
            No hospitals match these filters.
          </div>
        )}
      </div>

      {/* Load more */}
      <div className="text-center mt-10">
        <button
          type="button"
          className="inline-flex items-center gap-2 px-7 py-[11px] rounded-[10px] bg-white/[0.05] border border-white/[0.1] text-grey-200 text-[14px] font-medium cursor-pointer transition-colors hover:bg-white/[0.08]"
        >
          <IconRefresh size={16} stroke={1.5} />
          Load 11 more hospitals
        </button>
      </div>
    </section>
  )
}
