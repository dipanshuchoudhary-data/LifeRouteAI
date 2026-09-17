import { useEffect, useState } from 'react'
import { fetchNearbyHospitals } from '../lib/api'
import { adaptHospital } from '../lib/triageAdapters'
import { hospitalLatLng, DEFAULT_ORIGIN } from '../features/maps/coords'
import { HOSPITALS, BLOOD_BANKS } from '../data/liferouteData'

const DRIVERS = ['Rajesh Kumar', 'Amit Sharma', 'Sunil Verma', 'Pradeep Singh', 'Vikram Yadav', 'Neha Joshi', 'Arjun Malik']
const EQUIP_ALS = ['Defibrillator', 'Ventilator', 'Cardiac Monitor']
const EQUIP_BLS = ['First Aid', 'Oxygen', 'Stretcher']

function jitter(seed, spread) {
  const n = Math.sin(seed * 12.9898) * 43758.5453
  return (n - Math.floor(n) - 0.5) * spread
}

function deriveAmbulances(hospitals, tick) {
  return hospitals.slice(0, 6).flatMap((hospital, index) => {
    const loc = hospitalLatLng(hospital)
    const count = Math.max(1, Math.min(2, hospital.ambulancesAvailable || 1))
    return Array.from({ length: count }, (_, unit) => {
      const type = (index + unit) % 2 === 0 ? 'ALS' : 'BLS'
      const roll = (tick + index + unit) % 10
      const status = roll === 0
        ? 'offline'
        : roll === 1
          ? 'at-scene'
          : roll === 2
            ? 'transporting'
            : roll === 3
              ? 'assigned'
              : roll <= 5
                ? 'en-route'
                : 'available'
      return {
        id: `${hospital.id}-amb-${unit}`,
        type,
        callSign: `${hospital.city?.slice(0, 3).toUpperCase() || 'DEL'}-${type}-${String(10 + index * 2 + unit).padStart(3, '0')}`,
        driver: DRIVERS[(index + unit) % DRIVERS.length],
        distance: `${(1.1 + index * 0.7 + unit * 0.4).toFixed(1)} km`,
        eta: `${Math.max(3, (hospital.travelMinutes || 8) - 4 + unit * 2)} min`,
        status,
        equipment: type === 'ALS' ? EQUIP_ALS : EQUIP_BLS,
        phone: '108',
        lat: loc.lat + jitter(index * 10 + unit + tick, 0.018),
        lng: loc.lng + jitter(index * 7 + unit + 3, 0.018),
        hospital: hospital.name,
      }
    })
  })
}

function deriveIcu(hospitals, tick) {
  return hospitals.slice(0, 6).map((hospital, index) => {
    const total = hospital.totalIcu || Math.max(8, Math.round((hospital.beds || 20) / 2))
    const free = Math.max(0, hospital.icuFree ?? Math.max(1, total - Math.round(total * (hospital.capacity || 70) / 100)))
    const occupied = Math.max(0, total - free)
    const ventsTotal = Math.max(6, Math.round(total * 0.45))
    const ventsFree = Math.max(0, Math.round(ventsTotal * (0.2 + ((tick + index) % 4) * 0.08)))
    const tags = (hospital.tags || []).join(' ')
    const type = /cardiac|cardio/i.test(tags)
      ? 'Cardiac ICU'
      : /neuro/i.test(tags)
        ? 'Neuro ICU'
        : /trauma/i.test(tags)
          ? 'Trauma ICU'
          : 'Multi-specialty ICU'
    return {
      id: hospital.id,
      hospital: hospital.name,
      totalICU: total,
      occupiedICU: occupied,
      ventilators: { total: ventsTotal, available: Math.min(ventsTotal, ventsFree) },
      type,
      lastUpdated: `${(tick % 5) + 1}0s ago`,
      capacity: hospital.capacity,
    }
  })
}

function deriveBlood(tick) {
  return BLOOD_BANKS.map((bank, index) => {
    const stocks = Object.fromEntries(
      Object.entries(bank.stocks).map(([type, units]) => {
        const wobble = ((tick + index + type.charCodeAt(0)) % 7) - 3
        return [type, Math.max(1, units + wobble)]
      }),
    )
    return { ...bank, stocks, lastUpdated: `${(tick % 4) + 1} min ago` }
  })
}

function enrichHospital(raw) {
  const adapted = adaptHospital(raw)
  return {
    ...adapted,
    icuFree: raw.available_icu_beds,
    totalIcu: raw.total_icu_beds,
    ambulancesAvailable: raw.ambulances_available,
    divert: raw.ambulance_divert_status,
    telemetry: raw.telemetry_timestamp,
  }
}

export default function useLiveFacilities(origin = DEFAULT_ORIGIN) {
  const [hospitals, setHospitals] = useState(() => HOSPITALS.map(adaptHospital))
  const [tick, setTick] = useState(0)
  const [updatedAt, setUpdatedAt] = useState(new Date())
  const [live, setLive] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await fetchNearbyHospitals({ lat: origin.lat, lng: origin.lng })
        const list = (data?.hospitals || []).map(enrichHospital)
        if (!cancelled && list.length) {
          setHospitals(list)
          setLive(true)
          setUpdatedAt(new Date())
        }
      } catch {
        if (!cancelled) setLive(false)
      }
    }
    load()
    const poll = setInterval(load, 12000)
    const clock = setInterval(() => setTick((n) => n + 1), 4000)
    return () => {
      cancelled = true
      clearInterval(poll)
      clearInterval(clock)
    }
  }, [origin.lat, origin.lng])

  return {
    hospitals,
    ambulances: deriveAmbulances(hospitals, tick),
    icu: deriveIcu(hospitals, tick),
    blood: deriveBlood(tick),
    live,
    updatedAt,
    tick,
    kpis: {
      intercepts: 12 + (tick % 9),
      als: deriveAmbulances(hospitals, tick).filter((a) => a.type === 'ALS' && a.status === 'available').length,
      icuFree: deriveIcu(hospitals, tick).reduce((sum, row) => sum + (row.totalICU - row.occupiedICU), 0),
      vents: deriveIcu(hospitals, tick).reduce((sum, row) => sum + row.ventilators.available, 0),
    },
  }
}
