import { useEffect, useState } from 'react'
import { Marker, Polyline, Tooltip } from 'react-leaflet'
import SatelliteMap from './SatelliteMap'
import { ambulanceIcon, pinIcon } from './markers'
import { hospitalLatLng, DEFAULT_ORIGIN } from './coords'
import { fetchBestRoutes, pointAlong, slicePath } from './osrm'

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
  destination = null,
  routeProgress = 0,
}) {
  const from = origin || DEFAULT_ORIGIN
  const dest = destination ? hospitalLatLng(destination) : null
  const [routes, setRoutes] = useState(null)

  useEffect(() => {
    if (!dest) {
      setRoutes(null)
      return undefined
    }
    let cancelled = false
    fetchBestRoutes(from, dest).then((result) => {
      if (!cancelled) setRoutes(result)
    })
    return () => {
      cancelled = true
    }
  }, [from.lat, from.lng, dest?.lat, dest?.lng])

  const primaryPath = routes?.primary?.path || []
  const drawn = dest && routeProgress > 0 ? slicePath(primaryPath, routeProgress) : []
  const ambulanceAt = dest && routeProgress > 0.12 && primaryPath.length
    ? pointAlong(primaryPath, Math.min(0.42, routeProgress * 0.38))
    : null
  const bounds = [
    [from.lat, from.lng],
    ...hospitals.slice(0, 12).map((h) => {
      const p = hospitalLatLng(h)
      return [p.lat, p.lng]
    }),
  ]
  if (dest) bounds.push([dest.lat, dest.lng])
  primaryPath.forEach((point) => bounds.push([point.lat, point.lng]))

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
      {drawn.length > 1 && (
        <Polyline
          positions={drawn.map((point) => [point.lat, point.lng])}
          pathOptions={{ color: '#0F766E', weight: 5, opacity: 0.95 }}
        />
      )}
      {routeProgress >= 0.35 && routes?.alternate?.path && (
        <Polyline
          positions={routes.alternate.path.map((point) => [point.lat, point.lng])}
          pathOptions={{ color: '#94A3B8', weight: 3, opacity: 0.45, dashArray: '7 8' }}
        />
      )}
      {ambulances.map((unit) => (
        <Marker key={unit.id} position={[unit.lat, unit.lng]} icon={ambulanceIcon(unit.type)}>
          <Tooltip>{unit.callSign} · {unit.eta}</Tooltip>
        </Marker>
      ))}
      {ambulanceAt && (
        <Marker position={[ambulanceAt.lat, ambulanceAt.lng]} icon={ambulanceIcon('ALS')}>
          <Tooltip>Assigned unit</Tooltip>
        </Marker>
      )}
    </SatelliteMap>
  )
}
