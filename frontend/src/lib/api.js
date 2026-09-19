import { getSessionToken, setSessionToken } from './session'

export const PROVIDER_BUSY = 'Model provider is busy. Please try again later.'

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

function authHeaders(extra = {}) {
  const token = getSessionToken()
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}`, 'X-Sathi-Session': token } : {}),
  }
}

async function readError(response) {
  const data = await response.json().catch(() => ({}))
  return data.error || data.detail || 'Something went wrong. Please try again.'
}

let sessionWait = null

export async function ensureSession() {
  const existing = getSessionToken()
  if (existing) return existing
  if (!sessionWait) {
    sessionWait = (async () => {
      const response = await fetch(apiUrl('/api/v1/auth/demo'), { method: 'POST' })
      if (!response.ok) throw new Error(await readError(response))
      const data = await response.json()
      if (data.token) setSessionToken(data.token)
      return data.token
    })().finally(() => {
      sessionWait = null
    })
  }
  return sessionWait
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
    headers: authHeaders({ 'Content-Type': 'application/json' }),
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
    throw new Error(await readError(response))
  }
  const streamed = await readSse(response, onEvent)
  if (streamed) return streamed
  return triageSync({ input, location, sessionId, vitals, patient, esiLevel })
}

export async function triageSync({ input, location, sessionId, vitals, patient, esiLevel }) {
  const response = await fetch(apiUrl('/api/v2/triage'), {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
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

export async function triggerSos({ input, location, sessionId, vitals, patient, source, requestedBy }) {
  await ensureSession().catch(() => null)
  const [legacy, prepared] = await Promise.allSettled([
    fetch(apiUrl('/api/v2/emergency/sos'), {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        input: input || 'I need help',
        location: location || { lat: 28.6139, lng: 77.209 },
        session_id: sessionId || '',
        vitals: vitals || {},
        patient: patient || {},
        source: source || 'senior',
        requested_by: requestedBy || '',
      }),
    }).then(async (response) => {
      if (!response.ok) throw new Error(await readError(response))
      return response.json()
    }),
    fetch(apiUrl('/api/v1/emergency'), {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        input: input || 'I need help',
        source: source || 'senior',
        requested_by: requestedBy || '',
        lat: location?.lat ?? 28.6139,
        lng: location?.lng ?? 77.209,
        notify_family: true,
        confirm: true,
      }),
    }).then(async (response) => {
      if (!response.ok) throw new Error(await readError(response))
      return response.json()
    }),
  ])
  if (legacy.status !== 'fulfilled') throw new Error(legacy.reason?.message || 'SOS failed')
  return {
    ...legacy.value,
    sathiEmergency: prepared.status === 'fulfilled' ? prepared.value : null,
  }
}

export async function resolveEmergency(emergencyId) {
  const response = await fetch(apiUrl(`/api/v1/emergency/${emergencyId}/resolve`), {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
  })
  if (!response.ok) throw new Error(await readError(response))
  return response.json()
}

export async function streamSathiChat({ message, context, signal, onToken }) {
  await ensureSession().catch(() => null)
  const response = await fetch(apiUrl('/api/v2/sathi/chat/stream'), {
    method: 'POST',
    headers: authHeaders({
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    }),
    body: JSON.stringify({ message, context: context || {} }),
    signal,
  })
  if (!response.ok) throw new Error(await readError(response))
  let reply = ''
  const complete = await readSse(response, (event, payload) => {
    if (event === 'token' && payload?.token) {
      reply += payload.token
      onToken?.(payload.token, reply)
    }
    if (event === 'complete' && payload?.reply) {
      reply = payload.reply
    }
    if (event === 'error') {
      throw new Error(payload?.detail || PROVIDER_BUSY)
    }
  })
  return { reply: complete?.reply || reply, mode: complete?.mode || 'companion' }
}

export async function sathiChat({ message, context, confirm = false, signal }) {
  await ensureSession().catch(() => null)
  const response = await fetch(apiUrl('/api/v2/sathi/chat'), {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ message, context: context || {}, confirm }),
    signal,
  })
  if (response.ok) {
    const data = await response.json().catch(() => ({}))
    if (data.reply) return data
  }
  const fallback = await fetch(apiUrl('/api/v1/sathi/chat'), {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ message, confirm }),
    signal,
  })
  const data = await fallback.json().catch(() => ({}))
  if (!fallback.ok) throw new Error(data.error || data.detail || PROVIDER_BUSY)
  return data
}

export async function sathiTask(task, { message, context, signal }) {
  const response = await fetch(apiUrl(`/api/v2/sathi/${task}`), {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ message, context: context || {} }),
    signal,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || data.detail || PROVIDER_BUSY)
  return data
}

function explainError(data, fallback) {
  const value = data?.error || data?.detail
  if (!value) return fallback
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map((item) => item.msg || JSON.stringify(item)).join(' ')
  return fallback
}

export async function sathiExplain({ imageBase64, mime, question, context, filename = 'photo.jpg' }) {
  await ensureSession().catch(() => null)
  const payload = {
    image_base64: imageBase64,
    mime: mime || 'image/jpeg',
    question: question || 'Please explain this simply.',
    filename,
    context: context || {},
  }
  const urls = ['/api/v2/sathi/explain', '/api/v1/sathi/explain']
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 90_000)
  let lastError = PROVIDER_BUSY
  try {
    for (const path of urls) {
      try {
        const response = await fetch(apiUrl(path), {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(payload),
          signal: controller.signal,
        })
        const data = await response.json().catch(() => ({}))
        if (response.ok && (data.reply || data.text)) {
          return { ...data, reply: data.reply || data.text }
        }
        lastError = explainError(data, lastError)
      } catch (err) {
        if (err?.name === 'AbortError') {
          lastError = PROVIDER_BUSY
          break
        }
        lastError = PROVIDER_BUSY
      }
    }
    throw new Error(lastError)
  } finally {
    clearTimeout(timer)
  }
}

export async function notifyFamily({ contactId, message, confirm, shareHealth = false }) {
  await ensureSession()
  const response = await fetch(apiUrl('/api/v1/family/messages'), {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      contact_id: contactId,
      message,
      confirm,
      share_health: shareHealth,
    }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || data.detail || 'Please confirm before sending.')
  return data
}

export async function downloadReferralPdf(state) {
  const response = await fetch(apiUrl('/api/v2/referral/generate-pdf'), {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ state }),
  })
  if (!response.ok) throw new Error('PDF generation failed')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${state.referral_id || 'sathi-referral'}.pdf`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

const nearbyWait = new Map()

export async function fetchNearbyHospitals({ lat = 28.6139, lng = 77.209 } = {}) {
  const key = `${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`
  const pending = nearbyWait.get(key)
  if (pending) return pending
  const request = fetch(apiUrl(`/api/v2/hospitals/nearby?lat=${lat}&lng=${lng}`))
    .then((response) => (response.ok ? response.json() : null))
    .finally(() => nearbyWait.delete(key))
  nearbyWait.set(key, request)
  return request
}

export async function transcribeVoice(blob, { timeoutMs = 12000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(apiUrl('/api/v2/triage/voice'), {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': blob.type || 'audio/wav' }),
      body: blob,
      signal: controller.signal,
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.error || data.detail || data.message || PROVIDER_BUSY)
    }
    const text = (data.text || '').trim()
    if (!text) throw new Error(data.message || PROVIDER_BUSY)
    return { ...data, text }
  } finally {
    clearTimeout(timer)
  }
}
