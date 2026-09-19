import { describe, expect, it } from 'vitest'
import { nearestHospitals } from './localEmergency'

describe('nearestHospitals', () => {
  it('returns ten Noida and Gurugram hospitals around Sector 62', () => {
    const list = nearestHospitals({ lat: 28.6271, lng: 77.3649 }, 10)
    expect(list).toHaveLength(10)
    expect(list[0].name).toMatch(/Noida|Gurugram|Gurgaon|Jaypee|Fortis|Apollo|Max|Metro|Kailash|Medanta|Narayana|Artemis/i)
    expect(list[0].lat).toBeTypeOf('number')
    expect(list[0].lng).toBeTypeOf('number')
  })
})
