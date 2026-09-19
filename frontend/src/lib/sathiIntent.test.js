import { describe, expect, it } from 'vitest'
import { interpretSathi } from './sathiIntent'

describe('interpretSathi', () => {
  it('routes help language to emergency', () => {
    expect(interpretSathi('I need help').intent).toBe('help')
  })

  it('routes appointment questions to the day list', () => {
    expect(interpretSathi("What's important today?").intent).toBe('day')
  })

  it('routes booking a meeting to the plan', () => {
    const parsed = interpretSathi('can you book a meeting on 9.0 pm today')
    expect(parsed.intent).toBe('book')
    expect(parsed.time).toBe('21:00')
  })
})
