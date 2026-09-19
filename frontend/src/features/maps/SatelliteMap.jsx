import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'

const ESRI_SAT =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const ESRI_LABELS =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
const CARTO_ROADS =
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'

function Invalidate({ visible, bounds }) {
  const map = useMap()
  useEffect(() => {
    const ids = [setTimeout(() => map.invalidateSize(), 80), setTimeout(() => map.invalidateSize(), 280)]
    return () => ids.forEach(clearTimeout)
  }, [map, visible])
  const boundKey = (bounds || []).map((pair) => pair.join(',')).join('|')
  useEffect(() => {
    if (!boundKey) return undefined
    const pairs = boundKey.split('|').map((item) => item.split(',').map(Number))
    map.fitBounds(pairs, { padding: [36, 36], maxZoom: 14 })
    return undefined
  }, [map, boundKey])
  return null
}

export default function SatelliteMap({
  center = [28.6139, 77.209],
  zoom = 12,
  bounds,
  visible = true,
  className = 'lr-sat-map',
  basemap = 'satellite',
  children,
}) {
  const roads = basemap === 'roads'
  return (
    <div className={`lr-map-frame ${className}${roads ? ' is-roads' : ''}`}>
      <MapContainer
        className="lr-leaflet"
        center={center}
        zoom={zoom}
        scrollWheelZoom
        attributionControl={false}
      >
        {roads ? (
          <TileLayer url={CARTO_ROADS} subdomains="abcd" />
        ) : (
          <>
            <TileLayer url={ESRI_SAT} />
            <TileLayer url={ESRI_LABELS} opacity={0.85} />
          </>
        )}
        <Invalidate visible={visible} bounds={bounds} />
        {children}
      </MapContainer>
    </div>
  )
}
