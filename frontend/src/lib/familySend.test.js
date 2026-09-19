import { describe, expect, it } from 'vitest'
import { familyCallHref, familySendReady } from './familySend'

describe('familySendReady', () => {
  it('asks for a trusted person first', () => {
    expect(familySendReady({ chosen: null, confirmSend: true, draft: 'Hi', photo: '' }).ok).toBe(false)
  })

  it('requires confirmation before sending', () => {
    const ready = familySendReady({
      chosen: { id: '1', name: 'Priya' },
      confirmSend: false,
      draft: 'I am home',
      photo: '',
    })
    expect(ready.ok).toBe(false)
    expect(ready.notice).toMatch(/confirm/i)
  })

  it('requires a message or photo', () => {
    const ready = familySendReady({
      chosen: { id: '1', name: 'Priya' },
      confirmSend: true,
      draft: '   ',
      photo: '',
    })
    expect(ready.ok).toBe(false)
  })

  it('allows a confirmed text message', () => {
    expect(familySendReady({
      chosen: { id: '1', name: 'Priya' },
      confirmSend: true,
      draft: 'I am home',
      photo: '',
    }).ok).toBe(true)
  })
})

describe('familyCallHref', () => {
  it('builds a tel link from a local number', () => {
    expect(familyCallHref('98765 43210')).toBe('tel:9876543210')
  })

  it('returns empty when there is no phone', () => {
    expect(familyCallHref('')).toBe('')
  })
})
