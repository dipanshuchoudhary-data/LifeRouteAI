import { describe, expect, it, vi } from 'vitest'
import { interpretSathi } from './sathiIntent'
import { fallbackTalk, runSathiTurn, usableReply } from './sathiTalk'

vi.mock('./api', () => ({
  PROVIDER_BUSY: 'Model provider is busy. Please try again later.',
  sathiChat: vi.fn().mockResolvedValue({ reply: '' }),
  sathiTask: vi.fn().mockResolvedValue({
    reply: 'Breakfast can be oats. Lunch can be dal. Dinner can be khichdi.',
  }),
  streamSathiChat: vi.fn().mockResolvedValue({
    reply: 'Hello. How can I help you today?',
  }),
}))

function mockCompanion(extra = {}) {
  const talks = []
  return {
    talks,
    meals: { breakfast: 'Oats', lunch: 'Dal', dinner: 'Khichdi' },
    tasks: [],
    memories: [],
    addTalk: (row) => {
      const item = { id: String(talks.length + 1), ...row }
      talks.push(item)
      return item.id
    },
    updateTalk: (id, patch) => {
      const row = talks.find((item) => item.id === id)
      if (row) Object.assign(row, patch)
    },
    addMemory: vi.fn(),
    addTask: vi.fn(),
    addMessage: vi.fn(),
    ...extra,
  }
}

describe('usableReply', () => {
  it('drops leftover canned talk lines', () => {
    expect(usableReply('I am Sathi. Tell me what you need, or tap the microphone.')).toBe('')
    expect(usableReply('I heard: hello. I can explain a photo.')).toBe('')
    expect(usableReply('I am here. Tell me a little more. This is an everyday food idea, not a medical diet.')).toBe('')
    expect(usableReply('We are given a user message: hello sathi. According to the instructions we are Sathi.')).toBe('')
  })
})

describe('runSathiTurn', () => {
  it('answers food questions without canned talk lines', async () => {
    const companion = mockCompanion()
    await runSathiTurn({
      text: 'what to eat today',
      profile: { name: 'Mr. Sharma', medications: [], emergencyContacts: [] },
      companion,
      onNavigate: vi.fn(),
    })
    expect(interpretSathi('what to eat today').intent).toBe('food')
    expect(companion.talks[0]).toMatchObject({ role: 'me', text: 'what to eat today' })
    const reply = companion.talks.find((row) => row.role === 'sathi')
    expect(reply.text.toLowerCase()).toContain('oats')
    expect(reply.pending).toBe(false)
    expect(reply.text.toLowerCase()).not.toMatch(/i heard|tell me a little more|everyday food idea/)
  })

  it('adds a meeting to today’s plan instead of a greeting', async () => {
    const companion = mockCompanion()
    await runSathiTurn({
      text: 'can you book a meeting on 9.0 pm today',
      profile: { name: 'Mr. Sharma', medications: [], emergencyContacts: [] },
      companion,
    })
    expect(companion.addTask).toHaveBeenCalledWith(expect.objectContaining({ title: 'Meeting', time: '21:00' }))
    const reply = companion.talks.find((row) => row.role === 'sathi')
    expect(reply.text.toLowerCase()).toContain('9:00 pm')
    expect(reply.text.toLowerCase()).toMatch(/cannot book|cannot do personal/)
    expect(reply.text).not.toMatch(/How can I help you today/)
  })

  it('shows a busy message when talk models fail', async () => {
    const companion = mockCompanion()
    const { streamSathiChat, sathiChat } = await import('./api')
    streamSathiChat.mockRejectedValueOnce(new Error('offline'))
    sathiChat.mockRejectedValueOnce(new Error('offline'))
    await runSathiTurn({
      text: 'what is the weather in Noida',
      profile: { name: 'Mr. Sharma', medications: [], emergencyContacts: [] },
      companion,
    })
    const reply = companion.talks.find((row) => row.role === 'sathi')
    expect(reply.text).toBe('Model provider is busy. Please try again later.')
  })

  it('always replies to a greeting', async () => {
    expect(fallbackTalk('hello sath', { name: 'Mr. Sharma' })).toMatch(/Hello Mr/)
    const companion = mockCompanion()
    const { streamSathiChat } = await import('./api')
    streamSathiChat.mockRejectedValueOnce(new Error('offline'))
    await runSathiTurn({
      text: 'hello sath',
      profile: { name: 'Mr. Sharma', medications: [], emergencyContacts: [] },
      companion,
    })
    const reply = companion.talks.find((row) => row.role === 'sathi')
    expect(reply.text).toMatch(/Hello Mr/)
    expect(reply.pending).toBe(false)
  })
})
