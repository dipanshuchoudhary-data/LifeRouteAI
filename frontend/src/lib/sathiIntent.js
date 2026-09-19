const HELP = /\b(help me|i need help|emergency|i fell|fell down|can't breathe|cant breathe|call 108|sos|unconscious)\b/i
const FAMILY = /\b(call|phone|talk to|message|tell|send (this )?photo|daughter|son|priya|rahul)\b/i
const FAMILY_ACTION = /\b(call|phone|talk|message|tell|send)\b/i
const REMEMBER = /\b(remember|remind me|what did i ask you to remember)\b/i
const FOOD = /\b(eat|dinner|lunch|breakfast|food|meal|khichdi|diet|hungry)\b/i
const EXPLAIN = /\b(explain|what('?s| is) this|letter|bill|form|notice|medicine package|screen|photo|picture)\b/i
const BOOK = /\b(book|schedule|set up|arrange)\b.*\b(meeting|meet|appointment|call|visit)\b|\b(meeting|appointment)\b.*\b(today|tonight|tomorrow|\d)/i
const PERSONAL = /\b(order|uber|ola|cab|taxi|pay bill|recharge|reservation|flight|hotel|buy)\b/i
const DAY = /\b(today|my day|what do i have|what'?s important|appointment)\b/i
const HEALTH = /\b(dizzy|unwell|not feel|medicine|tablet|allergy|pain|bp|blood pressure)\b/i

export function interpretSathi(raw) {
  const text = (raw || '').trim()
  const lower = text.toLowerCase()
  if (!text) return { intent: 'empty', text }
  if (HELP.test(lower)) return { intent: 'help', text }
  if (FAMILY_ACTION.test(lower) && FAMILY.test(lower)) return { intent: 'family', text }
  if (REMEMBER.test(lower)) return { intent: 'memory', text }
  if (BOOK.test(lower)) return { intent: 'book', text, time: parseMeetingTime(text) }
  if (PERSONAL.test(lower)) return { intent: 'personal', text }
  if (FOOD.test(lower)) return { intent: 'food', text }
  if (EXPLAIN.test(lower)) return { intent: 'explain', text }
  if (DAY.test(lower)) return { intent: 'day', text }
  if (HEALTH.test(lower)) return { intent: 'health', text }
  return { intent: 'talk', text }
}

export function parseMeetingTime(text) {
  const mer = String(text || '').match(/\b(\d{1,2})(?:[.:](\d{1,2}))?\s*(a\.?m\.?|p\.?m\.?)\b/i)
  if (mer) {
    let hour = Number(mer[1])
    const minute = mer[2] != null ? Number(mer[2]) : 0
    const pm = mer[3].toLowerCase().startsWith('p')
    if (pm && hour < 12) hour += 12
    if (!pm && hour === 12) hour = 0
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
  const mil = String(text || '').match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/)
  if (mil) return `${String(mil[1]).padStart(2, '0')}:${mil[2]}`
  return ''
}

export function formatClock(time) {
  const [hours, minutes] = String(time || '').split(':').map(Number)
  if (!Number.isFinite(hours)) return ''
  const suffix = hours >= 12 ? 'pm' : 'am'
  const hour12 = hours % 12 || 12
  return `${hour12}:${String(minutes || 0).padStart(2, '0')} ${suffix}`
}

export function greetingClock(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function displayName(profile) {
  return (profile?.name || '').trim()
}

export function sathiContext(profile, companion) {
  return {
    name: profile?.name || '',
    age: profile?.age || '',
    city: profile?.city || '',
    bloodType: profile?.bloodType || '',
    allergies: (profile?.allergies || []).map((row) => row.substance || row).filter(Boolean),
    conditions: (profile?.conditions || []).map((row) => row.name || row).filter(Boolean),
    medications: (profile?.medications || []).map((row) => row.name || row).filter(Boolean),
    family: (profile?.emergencyContacts || []).map((row) => ({
      name: row.name,
      relation: row.relation,
      phone: row.phone,
    })),
    memories: (companion?.memories || []).slice(0, 8).map((row) => row.text),
    today: (companion?.tasks || []).map((row) => `${row.time} ${row.title}`),
    meals: companion?.meals || {},
  }
}

export function findFamily(text, contacts) {
  const lower = (text || '').toLowerCase()
  const list = contacts || []
  const hit = list.find((row) => {
    const name = (row.name || '').toLowerCase()
    const relation = (row.relation || '').toLowerCase()
    return (name && lower.includes(name.split(' ')[0])) || (relation && lower.includes(relation))
  })
  if (hit) return hit
  if (/\bdaughter\b/i.test(lower)) return list.find((row) => /daughter|priya/i.test(`${row.relation} ${row.name}`)) || list[0]
  if (/\bson\b/i.test(lower)) return list.find((row) => /son|rahul/i.test(`${row.relation} ${row.name}`)) || list[0]
  return list[0] || null
}

export function rememberFromSpeech(text) {
  return text
    .replace(/^(please\s+)?(remember that|remember|remind me to|remind me)\s+/i, '')
    .trim()
}
