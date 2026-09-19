import { describe, expect, it } from 'vitest'
import { incidentClock, STAGE_MS } from './incidentProgress'

describe('incidentClock', () => {
  it('starts on received, then advances about every 1.4s', () => {
    expect(incidentClock(0).index).toBe(0)
    expect(incidentClock(STAGE_MS - 1).index).toBe(0)
    expect(incidentClock(STAGE_MS).index).toBe(1)
    expect(incidentClock(STAGE_MS * 4).index).toBe(4)
    expect(incidentClock(STAGE_MS * 4).routeProgress).toBe(0)
    expect(incidentClock(STAGE_MS * 4 + 800).routeProgress).toBeGreaterThan(0)
    expect(incidentClock(STAGE_MS * 4 + 800).routeProgress).toBeLessThan(1)
    expect(incidentClock(STAGE_MS * 5).index).toBe(5)
  })
})
