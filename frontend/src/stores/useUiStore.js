import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUiStore = create(
  persist(
    (set) => ({
      textScale: 'normal',
      setTextScale: (textScale) => set({ textScale }),
    }),
    { name: 'sathi-ui-v1' },
  ),
)
