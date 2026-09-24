import { HOSPITALS, NEARBY_AMBULANCES } from '../data/liferouteData'

const TRIAGE_THEME = {
  RED: { label: 'CRITICAL', color: '#FF4444' },
  ORANGE: { label: 'EMERGENCY', color: '#FF8C00' },
  YELLOW: { label: 'URGENT', color: '#E8A000' },
  GREEN: { label: 'SELF-CARE', color: '#22C55E' },
}

export function getCapacityColor(pct) {
  if (pct > 85) return '#FF6B7A'
  if (pct > 70) return '#FAC75A'
  return '#4DD4A0'
}
export function getCapacityBarColor(pct) {
  if (pct > 85) return '#E53935'
  if (pct > 70) return '#E8A000'
  return '#00A86B'
}
export function getCapacityLabel(pct) {
  if (pct > 85) return 'Critical demand'
  if (pct > 70) return 'High demand'
  return 'Normal capacity'
}
export function getWaitColor(waitStr) {
  const num = parseInt(String(waitStr).replace(/[^0-9]/g, ''), 10)
  if (Number.isNaN(num)) return '#4DD4A0'
  if (num >= 20) return '#FF8A9A'
  if (num >= 12) return '#FAC75A'
  return '#4DD4A0'
}
export function getBloodColor(units) {
  if (units <= 5) return '#FF6B7A'
  if (units <= 15) return '#FAC75A'
  return '#4DD4A0'
}

function titleTags(hospital) {
  return (hospital.specialties || hospital.tags || []).map((tag) =>
    String(tag).replace(/\b\w/g, (ch) => ch.toUpperCase())
  )
}

export function adaptHospital(hospital = {}) {
  const fallback = HOSPITALS[0]
  return {
    id: hospital.id ?? fallback.id,
    name: hospital.name || fallback.name,
    govt: Boolean(hospital.govt) || /aiims|safdarjung/i.test(hospital.name || ''),
    city: hospital.city || 'Delhi',
    rating: hospital.rating || 4.2,
    reviews: hospital.review_count || hospital.reviews || 1200,
    distance: hospital.distance_km ? `${hospital.distance_km} km` : hospital.distance || '—',
    tags: titleTags(hospital).length ? titleTags(hospital) : fallback.tags,
    beds: hospital.available_beds ?? hospital.beds ?? 0,
    wait: hospital.emergency_wait_minutes ? `~${hospital.emergency_wait_minutes} min` : hospital.wait || '—',
    capacity: hospital.current_capacity_percent ?? hospital.capacity ?? 0,
    contact: hospital.contact || '',
    mapsUrl: hospital.maps_url,
    lat: hospital.lat,
    lng: hospital.lng,
    travelMinutes: hospital.travel_time_minutes,
    score: hospital.composite_match_score,
    ambulancesAvailable: hospital.ambulances_available,
    icuFree: hospital.available_icu_beds,
    totalIcu: hospital.total_icu_beds,
  }
}

export function adaptTriageResult(payload) {
  if (!payload) return null
  const urgency = payload.urgency_category || (payload.esi_level === 1 || payload.is_emergency ? 'RED' : payload.esi_level === 5 ? 'GREEN' : 'YELLOW')
  const theme = TRIAGE_THEME[urgency] || TRIAGE_THEME.YELLOW
  const facility = adaptHospital(payload.selected_facility || payload.matched_facilities?.[0] || HOSPITALS[0])
  const esi = payload.esi_level
  const ambulance = esi != null && esi <= 2 ? NEARBY_AMBULANCES[0] : NEARBY_AMBULANCES[1]
  const minutes = facility.travelMinutes || 10
  const critical = Boolean(payload.is_emergency) || esi === 1
  return {
    raw: payload,
    triage: critical ? 'CRITICAL' : theme.label,
    triageColor: theme.color,
    esiLevel: esi,
    urgency,
    isEmergency: critical,
    assessment: payload.triage_reasoning || 'Clinical evaluation recommended.',
    matchedHospital: facility,
    matchReason: payload.routing_reason || 'Best composite clinical match for this presentation.',
    ambulance,
    route: {
      distance: facility.distance,
      duration: `${minutes} min`,
      traffic: minutes <= 10 ? 'Light' : 'Moderate',
      via: 'Fastest live corridor to facility',
      alternateVia: 'Alternate arterial route',
      alternateTime: `${minutes + 4} min`,
    },
    actions: payload.immediate_actions?.length
      ? payload.immediate_actions
      : ['Proceed to the recommended facility', 'Call 108 if symptoms worsen', 'Bring current medications'],
    referralDoc: payload.referral_doc,
    referralId: payload.referral_id,
    fhirBundle: payload.fhir_bundle,
    disclaimer: payload.disclaimer,
    language: payload.language || 'en',
    sentinelMs: payload.sentinel_elapsed_ms,
    rankedHospitals: (payload.ranked_hospitals || payload.matched_facilities || []).map(adaptHospital),
    vitals: payload.vitals || {},
    signature: payload.referral_signature,
  }
}
