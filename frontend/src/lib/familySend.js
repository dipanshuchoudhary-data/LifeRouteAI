export function familySendReady({ chosen, confirmSend, draft, photo }) {
  if (!chosen) return { ok: false, notice: 'Add a trusted person first.' }
  if (!confirmSend) return { ok: false, notice: 'Please confirm before sending.' }
  const text = (draft || '').trim()
  if (!text && !photo) return { ok: false, notice: 'Write a message first.' }
  return { ok: true, notice: '' }
}

export function familyCallHref(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : ''
}
