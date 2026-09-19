import { describe, expect, it } from 'vitest'
import { canPollLiveFacilities } from './useLiveFacilities'

describe('canPollLiveFacilities', () => {
  it('pauses background ticks on a hidden tab', () => {
    expect(canPollLiveFacilities(true)).toBe(false)
    expect(canPollLiveFacilities(false)).toBe(true)
    expect(canPollLiveFacilities(undefined)).toBe(true)
  })
})
