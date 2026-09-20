import { create } from 'zustand'
import { streamTriage, triggerSos, triageSync } from '../lib/api'
import { adaptTriageResult } from '../lib/triageAdapters'
import { profilePayload, useProfileStore, vitalsPayload, withProfileContext } from './useProfileStore'

function defaultLocation() {
  return { lat: 28.6139, lng: 77.209 }
}

export const useLifeRouteStore = create((set, get) => ({
  sessionId: '',
  status: 'idle',
  searchQuery: '',
  activeNode: '',
  error: '',
  result: null,
  rawState: null,
  isEmergency: false,
  esiLevel: null,
  location: defaultLocation(),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setLocation: (location) => set({ location }),
  resetSession: () =>
    set({
      status: 'idle',
      activeNode: '',
      error: '',
      result: null,
      rawState: null,
      isEmergency: false,
      esiLevel: null,
    }),

  submitMessage: async (text, { esiLevel } = {}) => {
    const typed = (text || get().searchQuery || '').trim()
    if (!typed) return
    const profile = useProfileStore.getState().profile
    const input = withProfileContext(typed, profile)
    set({
      status: 'streaming',
      searchQuery: typed,
      error: '',
      result: null,
      isEmergency: esiLevel === 1,
      esiLevel: esiLevel || null,
      activeNode: 'safety_sentinel',
    })
    try {
      const payload = await streamTriage({
        input,
        location: get().location,
        sessionId: get().sessionId,
        vitals: vitalsPayload(profile),
        patient: profilePayload(profile),
        esiLevel,
        onEvent: (event, data) => {
          if (event === 'session') set({ sessionId: data.session_id })
          if (event === 'sentinel' && data.is_emergency && (data.esi_level || 1) === 1) {
            set({ isEmergency: true, esiLevel: data.esi_level || 1, status: 'emergency' })
          }
          if (event === 'node') set({ activeNode: data.node, isEmergency: Boolean(data.is_emergency) || get().isEmergency })
        },
      })
      const adapted = adaptTriageResult(payload)
      set({
        rawState: payload,
        result: adapted,
        status: adapted?.isEmergency ? 'emergency' : 'completed',
        isEmergency: Boolean(adapted?.isEmergency),
        esiLevel: adapted?.esiLevel ?? esiLevel ?? null,
        sessionId: payload.session_id || get().sessionId,
        activeNode: '',
      })
    } catch (error) {
      try {
        const payload = await triageSync({
          input,
          location: get().location,
          sessionId: get().sessionId,
          vitals: vitalsPayload(profile),
          patient: profilePayload(profile),
          esiLevel,
        })
        const adapted = adaptTriageResult(payload)
        set({
          rawState: payload,
          result: adapted,
          status: adapted?.isEmergency ? 'emergency' : 'completed',
          isEmergency: Boolean(adapted?.isEmergency),
          esiLevel: adapted?.esiLevel ?? esiLevel ?? null,
          error: '',
          activeNode: '',
        })
      } catch (fallbackError) {
        set({ status: 'idle', error: fallbackError.message || error.message, activeNode: '' })
      }
    }
  },

  triggerSOS: async () => {
    const profile = useProfileStore.getState().profile
    const input = get().searchQuery || 'Emergency SOS — unconscious not breathing'
    set({
      status: 'emergency',
      searchQuery: input,
      error: '',
      result: null,
      isEmergency: true,
      esiLevel: 1,
      activeNode: 'emergency_fast_track',
    })
    try {
      const payload = await triggerSos({
        input,
        location: get().location,
        sessionId: get().sessionId,
        vitals: vitalsPayload(profile),
        patient: profilePayload(profile),
      })
      const adapted = adaptTriageResult(payload)
      set({
        rawState: payload,
        result: adapted,
        status: 'emergency',
        isEmergency: true,
        esiLevel: 1,
        sessionId: payload.session_id || get().sessionId,
        activeNode: '',
      })
    } catch (error) {
      set({ error: error.message || 'SOS failed', status: 'idle', activeNode: '' })
    }
  },
}))
