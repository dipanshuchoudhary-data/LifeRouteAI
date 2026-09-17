export function extractSpecialties(hospitals) {
  const set = new Set()
  hospitals.forEach((h) => (h.specialties || []).forEach((s) => set.add(s)))
  return [...set].sort().slice(0, 12)
}
