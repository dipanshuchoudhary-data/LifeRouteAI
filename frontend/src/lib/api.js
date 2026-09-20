const configured = import.meta.env.VITE_API_URL || ''

export function apiBase() {
  return configured.replace(/\/$/, '')
}

export function apiUrl(path) {
  const base = apiBase()
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (!base) return normalized
  return `${base}${normalized}`
}

async function readSse(response, onEvent) {
  if (!response.body) throw new Error('No response body')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let complete = null

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() || ''
    for (const chunk of chunks) {
      const lines = chunk.split('\n')
      let event = 'message'
      const dataLines = []
      for (const line of lines) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
      }
      if (!dataLines.length) continue
      const payload = JSON.parse(dataLines.join('\n'))
      onEvent?.(event, payload)
      if (event === 'complete') complete = payload
      if (event === 'error') throw new Error(payload.detail || 'Triage stream failed')
    }
  }
  return complete
}

export async function streamTriage({ input, location, sessionId, vitals, patient, esiLevel, onEvent }) {
  const response = await fetch(apiUrl('/api/v2/triage/stream'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input,
      location: location || { lat: 28.6139, lng: 77.209 },
      session_id: sessionId || '',
      vitals: vitals || {},
      patient: patient || {},
      esi_level: esiLevel || undefined,
    }),
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Triage failed (${response.status})`)
  }
  const streamed = await readSse(response, onEvent)
  if (streamed) return streamed
  return triageSync({ input, location, sessionId, vitals, patient, esiLevel })
}

export async function triageSync({ input, location, sessionId, vitals, patient, esiLevel }) {
  const response = await fetch(apiUrl('/api/v2/triage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input,
      location: location || { lat: 28.6139, lng: 77.209 },
      session_id: sessionId || '',
      vitals: vitals || {},
      patient: patient || {},
      esi_level: esiLevel || undefined,
    }),
  })
  if (!response.ok) throw new Error(`Triage failed (${response.status})`)
  return response.json()
}

export async function triggerSos({ input, location, sessionId, vitals, patient }) {
  const response = await fetch(apiUrl('/api/v2/emergency/sos'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: input || 'Emergency SOS — unconscious not breathing',
      location: location || { lat: 28.6139, lng: 77.209 },
      session_id: sessionId || '',
      vitals: vitals || {},
      patient: patient || {},
    }),
  })
  if (!response.ok) throw new Error(`SOS failed (${response.status})`)
  return response.json()
}

export async function downloadReferralPdf(state) {
  const response = await fetch(apiUrl('/api/v2/referral/generate-pdf'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }),
  })
  if (!response.ok) throw new Error('PDF generation failed')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${state.referral_id || 'liferoute-referral'}.pdf`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function fetchNearbyHospitals({ lat = 28.6139, lng = 77.209 } = {}) {
  const response = await fetch(apiUrl(`/api/v2/hospitals/nearby?lat=${lat}&lng=${lng}`))
  if (!response.ok) return null
  return response.json()
}

export async function transcribeVoice(blob, { timeoutMs = 12000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(apiUrl('/api/v2/triage/voice'), {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'audio/wav' },
      body: blob,
      signal: controller.signal,
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.detail || data.message || `Transcription failed (${response.status})`)
    }
    const text = (data.text || '').trim()
    if (!text) throw new Error(data.message || 'Empty transcript')
    return { ...data, text }
  } finally {
    clearTimeout(timer)
  }
}
