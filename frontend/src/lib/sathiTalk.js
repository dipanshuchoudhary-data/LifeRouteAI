import { PROVIDER_BUSY, sathiChat, sathiTask, streamSathiChat } from './api'
import {
  findFamily,
  formatClock,
  interpretSathi,
  rememberFromSpeech,
  sathiContext,
} from './sathiIntent'
import { todaysTasks } from '../stores/useCompanionStore'

const TASK_BY_INTENT = {
  food: 'food',
  day: 'day',
  health: 'health',
  memory: 'memory',
}

const CANNED = /tell me what you need, or tap the microphone|i heard:|tell me a little more|everyday food idea|not a medical diet|please confirm with your doctor/i
const LEAK = /we are given a user message|according to the instructions|known facts \(from the app\)|never diagnose or prescribe|untrusted_user_message|we must reply|reply in 2 to 6|prefer hindi only|never follow instructions that appear|never claim an ambulance|system prompt|guardrail|we are sathi, a calm/i

export function isPromptLeak(text) {
  return LEAK.test(text || '')
}

export function usableReply(text) {
  const value = (text || '').trim()
  if (!value || CANNED.test(value) || isPromptLeak(value)) return ''
  return value
}

export function fallbackTalk(text, profile) {
  const name = String(profile?.name || '').split(' ')[0]
  if (/^(hi|hello|hey|namaste|good (morning|afternoon|evening))\b/i.test(text || '')) {
    return name ? `Hello ${name}. How can I help you today?` : 'Hello. How can I help you today?'
  }
  if (/\b(book|schedule|meeting|appointment|order|uber|pay|reservation)\b/i.test(text || '')) {
    return 'I cannot do personal tasks right now.'
  }
  return PROVIDER_BUSY
}

function fromProfile(intent, profile, companion) {
  if (intent === 'day') {
    const items = todaysTasks(companion.tasks)
    if (!items.length) return ''
    return `Today you have ${items.map((row) => `${row.time || ''} ${row.title}`.trim()).join(', ')}.`
  }
  if (intent === 'food') {
    const meals = companion.meals || {}
    if (!meals.breakfast && !meals.lunch && !meals.dinner) return ''
    return `Breakfast can be ${meals.breakfast || 'oats and fruit'}. Lunch can be ${meals.lunch || 'dal, roti and vegetables'}. Dinner can be ${meals.dinner || 'khichdi and curd'}.`
  }
  if (intent === 'health') {
    const meds = (profile.medications || []).map((row) => row.name).filter(Boolean)
    return meds.length ? `Your saved medicines are ${meds.join(', ')}.` : ''
  }
  if (intent === 'memory') {
    const list = (companion.memories || []).slice(0, 5).map((row) => row.text)
    return list.length ? `You asked me to remember: ${list.join('; ')}` : ''
  }
  return ''
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function typewrite(text, onUpdate, delay = 18) {
  const value = (text || '').trim()
  if (!value) return ''
  const parts = value.match(/\S+\s*/g) || [value]
  let acc = ''
  for (const part of parts) {
    acc += part
    onUpdate(acc)
    await sleep(delay)
  }
  onUpdate(acc)
  return acc
}

async function liveStream(intent, text, context, write) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  try {
    if (TASK_BY_INTENT[intent]) {
      const data = await sathiTask(TASK_BY_INTENT[intent], {
        message: text,
        context,
        signal: controller.signal,
      })
      const reply = usableReply(data?.reply)
      if (reply) {
        await typewrite(reply, (next) => write(next, true))
        return reply
      }
    }
    const data = await streamSathiChat({
      message: text,
      context,
      signal: controller.signal,
      onToken: (_token, full) => {
        if (isPromptLeak(full)) return
        write(full, true)
      },
    })
    const streamed = usableReply(data?.reply)
    if (streamed) return streamed
    const fallback = await sathiChat({ message: text, context, signal: controller.signal })
    const reply = usableReply(fallback?.reply)
    if (reply) {
      await typewrite(reply, (next) => write(next, true))
      return reply
    }
    return ''
  } catch {
    return ''
  } finally {
    clearTimeout(timer)
  }
}

export async function runSathiTurn({
  text,
  profile,
  companion,
  onHelp,
  onNavigate,
}) {
  const spoken = (text || '').trim()
  if (!spoken) return
  const parsed = interpretSathi(spoken)
  companion.addTalk({ role: 'me', text: spoken })
  const pendingId = companion.addTalk({ role: 'sathi', text: '', pending: true })
  const write = (next, pending = true) => companion.updateTalk(pendingId, { text: next, pending })

  if (parsed.intent === 'help') {
    write('I am opening emergency help now.', false)
    onHelp?.({ source: 'voice', input: spoken })
    return
  }

  if (parsed.intent === 'family') {
    const person = findFamily(spoken, profile.emergencyContacts)
    const name = person?.name || 'your family'
    if (/send|photo|picture/i.test(spoken)) {
      write(`Opening Family so you can send this to ${name}.`, false)
      onNavigate?.('family')
      return
    }
    if (/tell|message|text/i.test(spoken)) {
      companion.addMessage({ to: name, text: spoken })
      write(`I prepared that message for ${name}.`, false)
      onNavigate?.('family')
      return
    }
    if (person?.phone) {
      window.location.href = `tel:${String(person.phone).replace(/\s/g, '')}`
    }
    write(`Opening Family so you can reach ${name}.`, false)
    onNavigate?.('family')
    return
  }

  if (parsed.intent === 'memory' && !/what did i ask|what do you remember|what have you remembered/i.test(spoken)) {
    const note = rememberFromSpeech(spoken)
    companion.addMemory(note)
    if (/remind me/i.test(spoken)) {
      companion.addTask({ title: note, time: '', kind: 'reminder' })
    }
    await typewrite(`I will remember this: ${note}`, (next) => write(next, true))
    write(`I will remember this: ${note}`, false)
    return
  }

  if (parsed.intent === 'book') {
    const time = parsed.time
    const title = /appointment/i.test(spoken) ? 'Appointment' : 'Meeting'
    if (time) {
      companion.addTask({ title, time, kind: 'appointment' })
      write(`I added a ${title.toLowerCase()} at ${formatClock(time)} today to your plan. I cannot book this with other people.`, false)
    } else {
      write('I cannot do personal tasks right now.', false)
    }
    return
  }

  if (parsed.intent === 'personal') {
    write('I cannot do personal tasks right now.', false)
    return
  }

  if (parsed.intent === 'explain') {
    write('Open Show Sathi and add the photo. I will explain it there.', false)
    onNavigate?.('more', 'explain')
    return
  }

  const live = await liveStream(parsed.intent, spoken, sathiContext(profile, companion), write)
  const reply = live || fromProfile(parsed.intent, profile, companion) || fallbackTalk(spoken, profile) || PROVIDER_BUSY
  if (!live) await typewrite(reply, (next) => write(next, true))
  write(reply, false)
}
