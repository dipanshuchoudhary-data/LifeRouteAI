import { useEffect, useMemo, useState } from 'react'
import { Marker, Polyline, Tooltip } from 'react-leaflet'
import SatelliteMap from './SatelliteMap'
import { ambulanceIcon, pinIcon } from './markers'
import { hospitalLatLng, DEFAULT_ORIGIN } from './coords'
import { fetchBestRoutes, pointAlong } from './osrm'

function slicePath(path, t) {
  if (!path?.length) return []
  const count = Math.max(2, Math.round(path.length * Math.max(0.02, t)))
  return path.slice(0, count)
}

function RouteScene({ from, dest, hospital, alternate, visible, basemap, className, tone, embedded }) {
  const ops = tone === 'ops'
  const altDest = alternate ? hospitalLatLng(alternate) : null
  const [routes, setRoutes] = useState(null)
  const [phase, setPhase] = useState(0)
  const [travel, setTravel] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchBestRoutes(from, dest).then((result) => {
      if (!cancelled) setRoutes(result)
    })
    const timers = [
      setTimeout(() => setPhase(1), 350),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1400),
    ]
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [from.lat, from.lng, dest.lat, dest.lng])

  useEffect(() => {
    if (phase < 3 || !routes?.primary?.path) return undefined
    let start
    let frame
    const tick = (now) => {
      if (!start) start = now
      const t = Math.min(1, (now - start) / 5200)
      setTravel(t)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [phase, routes])

  const primaryPath = routes?.primary?.path || []
  const drawn = slicePath(primaryPath, phase >= 3 ? 1 : phase >= 2 ? 0.35 : 0)
  const ambulanceAt = primaryPath.length ? pointAlong(primaryPath, travel) : null
  const bounds = useMemo(() => {
    const pts = [[from.lat, from.lng], [dest.lat, dest.lng]]
    if (altDest) pts.push([altDest.lat, altDest.lng])
    primaryPath.forEach((p) => pts.push([p.lat, p.lng]))
    return pts
  }, [from.lat, from.lng, dest.lat, dest.lng, altDest?.lat, altDest?.lng, primaryPath])

  const eta = routes?.primary?.durationMin
  const km = routes?.primary?.distanceKm

  return (
    <div className={`lr-route-map-block${embedded ? ' is-embedded' : ''}`}>
      <SatelliteMap
        center={[from.lat, from.lng]}
        zoom={12}
        bounds={bounds}
        visible={visible}
        basemap={basemap}
        className={className}
      >
        <Marker position={[from.lat, from.lng]} icon={pinIcon(ops ? '#12263A' : '#3568D7', 'P', true)}>
          <Tooltip direction="right" offset={[10, -8]} permanent={ops}>Patient</Tooltip>
        </Marker>
        {phase >= 1 && (
          <Marker position={[dest.lat, dest.lng]} icon={pinIcon(ops ? '#0F766E' : '#E53935', 'H')}>
            <Tooltip direction="top" offset={[0, -18]} permanent={ops}>Hospital</Tooltip>
          </Marker>
        )}
        {phase >= 1 && altDest && (
          <Marker position={[altDest.lat, altDest.lng]} icon={pinIcon('#94A3B8', '2')}>
            <Tooltip direction="bottom">{alternate.name}</Tooltip>
          </Marker>
        )}
        {phase >= 2 && routes?.alternate?.path && (
          <Polyline
            positions={routes.alternate.path.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: ops ? '#94A3B8' : '#F5D76E', weight: ops ? 3 : 4, opacity: ops ? 0.45 : 0.55, dashArray: '7 8' }}
          />
        )}
        {drawn.length > 1 && (
          <Polyline
            positions={drawn.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: ops ? '#0F766E' : '#B8FF59', weight: ops ? 5 : 6, opacity: 0.95 }}
          />
        )}
        {ambulanceAt && phase >= 3 && (
          <Marker position={[ambulanceAt.lat, ambulanceAt.lng]} icon={ambulanceIcon('ALS')} />
        )}
      </SatelliteMap>
      {embedded ? (
        <div className="ops-live-hud">
          <span>Patient → Ambulance → Hospital</span>
          {eta != null && <strong>{eta} min · {km} km</strong>}
        </div>
      ) : (
        <div className="lr-route-map-caption">
          <span className="lr-live-badge"><span className="lr-live-dot" /> Satellite · {routes?.source === 'osrm' ? 'live roads' : 'estimating corridor'}</span>
          {eta != null && <strong>{eta} min · {km} km</strong>}
        </div>
      )}
    </div>
  )
}

export default function RouteFinderMap({
  origin,
  hospital,
  alternate,
  visible = true,
  basemap = 'satellite',
  className = 'lr-sat-map',
  tone = 'default',
  embedded = false,
}) {
  const from = origin || DEFAULT_ORIGIN
  const dest = hospital ? hospitalLatLng(hospital) : null
  if (!dest) {
    return <SatelliteMap center={[from.lat, from.lng]} zoom={12} visible={visible} basemap={basemap} className={className} />
  }
  return (
    <RouteScene
      key={`${from.lat}-${dest.lat}-${dest.lng}`}
      from={from}
      dest={dest}
      hospital={hospital}
      alternate={alternate}
      visible={visible}
      basemap={basemap}
      className={className}
      tone={tone}
      embedded={embedded}
    />
  )
}
