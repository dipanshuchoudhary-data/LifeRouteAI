import { describe, expect, it } from 'vitest'
import { PATHS, pathFor } from './paths'

describe('pathFor', () => {
  it('opens settings from the More panel', () => {
    expect(pathFor('more', 'settings')).toBe(PATHS.settings)
    expect(pathFor('more', 'profile')).toBe(PATHS.settings)
  })

  it('keeps explain and emergency routes', () => {
    expect(pathFor('more', 'explain')).toBe(PATHS.explain)
    expect(pathFor('emergency')).toBe(PATHS.emergency)
  })
})
