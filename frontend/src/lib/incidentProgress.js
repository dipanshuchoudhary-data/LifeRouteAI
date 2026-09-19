export const STAGE_MS = 1400
export const ROUTE_DRAW_MS = 1600

export const INCIDENT_STAGES = [
  { id: 'received', label: 'Received', hint: 'Case received' },
  { id: 'classified', label: 'Classified', hint: 'Classifying ESI' },
  { id: 'ambulance', label: 'Ambulance', hint: 'Dispatching nearby unit' },
  { id: 'hospital', label: 'Hospital', hint: 'Matching receiving facility' },
  { id: 'routing', label: 'Routing', hint: 'Calculating live route' },
  { id: 'arrival', label: 'Arrival', hint: 'En route to hospital' },
]

export function incidentClock(elapsed = 0) {
  const ms = Math.max(0, Number(elapsed) || 0)
  const index = Math.min(INCIDENT_STAGES.length - 1, Math.floor(ms / STAGE_MS))
  const routeProgress = ms < STAGE_MS * 4 ? 0 : Math.min(1, (ms - STAGE_MS * 4) / ROUTE_DRAW_MS)
  return {
    index,
    routeProgress,
    hint: INCIDENT_STAGES[index].hint,
    assigned: index >= 2,
    hospitalReady: index >= 3,
    routing: index >= 4,
    enRoute: index >= 5 || routeProgress >= 1,
  }
}
