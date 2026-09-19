import { HOSPITALS, NEARBY_AMBULANCES } from '../data/liferouteData'
import { hospitalLatLng } from '../features/maps/coords'
import { adaptHospital } from './triageAdapters'

function toRad(value) {
  return (value * Math.PI) / 180
}

function kmBetween(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export function nearestHospitals(origin, limit = 10) {
  const from = origin || { lat: 28.6271, lng: 77.3649 }
  return HOSPITALS.map((row) => {
    const hospital = adaptHospital(row)
    const loc = hospitalLatLng(hospital)
    const km = kmBetween(from, loc)
    return {
      ...hospital,
      lat: loc.lat,
      lng: loc.lng,
      travelMinutes: Math.max(6, Math.round(km * 2.8)),
      distance: `${km.toFixed(1)} km`,
    }
  })
    .sort((a, b) => a.travelMinutes - b.travelMinutes)
    .slice(0, limit)
}

export function localEmergencyResult(origin, query) {
  const ranked = nearestHospitals(origin, 10)
  const hospital = ranked[0]
  return {
    isEmergency: true,
    esiLevel: 1,
    assessment: query || 'Emergency assistance',
    matchedHospital: hospital,
    rankedHospitals: ranked,
    ambulance: {
      ...NEARBY_AMBULANCES[0],
      callSign: 'NOI-ALS-014',
      eta: '4 min',
      status: 'assigned',
      distance: '1.6 km',
    },
    route: {
      duration: `${hospital?.travelMinutes || 8} min`,
      distance: hospital?.distance || '2.4 km',
      traffic: 'Moderate',
      via: 'Fastest live corridor',
    },
  }
}
