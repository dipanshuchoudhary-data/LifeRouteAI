import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { NETWORK_DONORS } from '../data/liferouteData'
import { newProfileId } from './useProfileStore'

export const useDonorStore = create(
  persist(
    (set, get) => ({
      donors: [],
      registerDonor: (row) => {
        const donor = {
          id: newProfileId(),
          name: row.name.trim(),
          bloodType: row.bloodType,
          phone: row.phone.trim(),
          city: (row.city || '').trim() || 'Delhi NCR',
          available: row.available !== false,
          lastDonated: row.lastDonated || '',
          self: true,
        }
        const existing = get().donors.find((item) => item.phone === donor.phone)
        if (existing) {
          set({
            donors: get().donors.map((item) => (item.id === existing.id ? { ...item, ...donor, id: existing.id } : item)),
          })
          return existing.id
        }
        set({ donors: [...get().donors, donor] })
        return donor.id
      },
      setDonorAvailable: (id, available) =>
        set({ donors: get().donors.map((row) => (row.id === id ? { ...row, available } : row)) }),
      removeDonor: (id) => set({ donors: get().donors.filter((row) => row.id !== id) }),
    }),
    { name: 'liferoute-blood-donors-v1' },
  ),
)

export function allDonors() {
  const mine = useDonorStore.getState().donors
  const phones = new Set(mine.map((row) => row.phone))
  return [...mine, ...NETWORK_DONORS.filter((row) => !phones.has(row.phone))]
}
