import L from 'leaflet'

export function pinIcon(color, label, pulse = false) {
  return L.divIcon({
    className: 'lr-map-pin-wrap',
    html: `<span class="lr-map-pin ${pulse ? 'pulse' : ''}" style="--pin:${color}">${label || ''}</span>`,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
  })
}

export function ambulanceIcon(type = 'ALS') {
  return L.divIcon({
    className: 'lr-map-pin-wrap',
    html: `<span class="lr-map-amb ${type === 'ALS' ? 'als' : 'bls'}">${type}</span>`,
    iconSize: [36, 22],
    iconAnchor: [18, 11],
  })
}
