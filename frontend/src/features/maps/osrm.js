export function slicePath(path, t) {
  if (!path?.length) return []
  const count = Math.max(2, Math.round(path.length * Math.max(0.02, Math.min(1, t))))
  return path.slice(0, count)
}

export function geodesic(from, to, steps = 48) {
  const path = []
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    path.push({
      lat: from.lat + (to.lat - from.lat) * t,
      lng: from.lng + (to.lng - from.lng) * t,
    })
  }
  return path
}

export function pathLengthKm(path) {
  if (!path?.length) return 0
  let sum = 0
  for (let i = 1; i < path.length; i += 1) {
    sum += haversineKm(path[i - 1], path[i])
  }
  return sum
}

export function haversineKm(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function pointAlong(path, t) {
  if (!path?.length) return null
  if (path.length === 1 || t <= 0) return path[0]
  if (t >= 1) return path[path.length - 1]
  const total = pathLengthKm(path) || 1
  let remain = total * t
  for (let i = 1; i < path.length; i += 1) {
    const seg = haversineKm(path[i - 1], path[i]) || 0.0001
    if (remain <= seg) {
      const u = remain / seg
      return {
        lat: path[i - 1].lat + (path[i].lat - path[i - 1].lat) * u,
        lng: path[i - 1].lng + (path[i].lng - path[i - 1].lng) * u,
      }
    }
    remain -= seg
  }
  return path[path.length - 1]
}

function toLatLng(coord) {
  return { lat: coord[1], lng: coord[0] }
}

export async function fetchDrivingRoute(from, to, { alternatives = true, signal } = {}) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&alternatives=${alternatives ? 'true' : 'false'}`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('OSRM unavailable')
  const data = await response.json()
  const routes = (data.routes || []).map((route) => ({
    path: (route.geometry?.coordinates || []).map(toLatLng),
    durationMin: Math.max(1, Math.round((route.duration || 0) / 60)),
    distanceKm: Math.round(((route.distance || 0) / 1000) * 10) / 10,
  }))
  if (!routes.length || routes[0].path.length < 2) throw new Error('No road geometry')
  return routes
}

export async function fetchBestRoutes(from, to) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const routes = await fetchDrivingRoute(from, to, { signal: controller.signal })
    return {
      primary: routes[0],
      alternate: routes[1] || null,
      source: 'osrm',
    }
  } catch {
    const fallback = geodesic(from, to)
    const km = Math.round(pathLengthKm(fallback) * 10) / 10
    return {
      primary: { path: fallback, durationMin: Math.max(6, Math.round(km * 2.4)), distanceKm: km },
      alternate: null,
      source: 'geodesic',
    }
  } finally {
    clearTimeout(timer)
  }
}
