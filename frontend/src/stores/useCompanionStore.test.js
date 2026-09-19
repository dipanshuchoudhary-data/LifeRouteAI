import { describe, expect, it } from 'vitest'
import { keepTalk } from './useCompanionStore'

describe('keepTalk', () => {
  it('keeps human and sathi messages for reload', () => {
    const kept = keepTalk([
      { id: '1', role: 'me', text: 'hello sath' },
      { id: '2', role: 'sathi', text: 'Hello. How can I help you today?' },
      { id: '3', role: 'sathi', text: '', pending: true },
      { id: '4', role: 'sathi', text: 'According to the instructions we are Sathi.' },
    ])
    expect(kept.map((row) => row.text)).toEqual(['hello sath', 'Hello. How can I help you today?'])
  })
})
