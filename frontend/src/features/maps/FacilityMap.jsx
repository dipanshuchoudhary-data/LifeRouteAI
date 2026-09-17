import { Marker, Tooltip } from 'react-leaflet'
import SatelliteMap from './SatelliteMap'
import { ambulanceIcon, pinIcon } from './markers'
import { hospitalLatLng, DEFAULT_ORIGIN } from './coords'

function loadColor(capacity) {
  if (capacity > 85) return '#FF6B7A'
  if (capacity > 70) return '#FAC75A'
  return '#4DD4A0'
}

export default function FacilityMap({
  origin,
  hospitals = [],
  ambulances = [],
  selectedId,
  heightClass = 'lr-sat-map',
  visible = true,
  basemap = 'satellite',
  originLabel = 'You',
}) {
  const from = origin || DEFAULT_ORIGIN
  const bounds = [
    [from.lat, from.lng],
    ...hospitals.slice(0, 12).map((h) => {
      const p = hospitalLatLng(h)
      return [p.lat, p.lng]
    }),
  ]
  return (
    <SatelliteMap center={[from.lat, from.lng]} zoom={11} bounds={bounds} visible={visible} className={heightClass} basemap={basemap}>
      <Marker position={[from.lat, from.lng]} icon={pinIcon(basemap === 'roads' ? '#12263A' : '#3568D7', originLabel === 'Patient' ? 'P' : 'You', true)}>
        <Tooltip direction="right">{originLabel}</Tooltip>
      </Marker>
      {hospitals.map((hospital) => {
        const p = hospitalLatLng(hospital)
        const active = selectedId != null && String(selectedId) === String(hospital.id)
        return (
          <Marker
            key={hospital.id || hospital.name}
            position={[p.lat, p.lng]}
            icon={pinIcon(loadColor(hospital.capacity), active ? '★' : 'H')}
          >
            <Tooltip direction="top">
              {hospital.name} · {hospital.capacity}% · {hospital.wait}
            </Tooltip>
          </Marker>
        )
      })}
      {ambulances.map((unit) => (
        <Marker key={unit.id} position={[unit.lat, unit.lng]} icon={ambulanceIcon(unit.type)}>
          <Tooltip>{unit.callSign} · {unit.eta}</Tooltip>
        </Marker>
      ))}
    </SatelliteMap>
  )
}
