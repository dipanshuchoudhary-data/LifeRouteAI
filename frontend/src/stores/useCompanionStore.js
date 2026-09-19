import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10)
}

const TALK_LEAK = /tell me what you need, or tap the microphone|i heard:|tell me a little more|everyday food idea|according to the instructions|we are given a user message|never diagnose or prescribe|known facts \(from the app\)/i

export function keepTalk(rows) {
  return (rows || [])
    .filter((row) => {
      const text = (row.text || '').trim()
      if (!text || row.pending) return false
      return !TALK_LEAK.test(text)
    })
    .slice(-40)
}

function readLegacyTalk() {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem('sathi-companion-v2') || localStorage.getItem('sathi-companion-v1')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return keepTalk(parsed?.state?.talk)
  } catch {
    return []
  }
}

function seedTasks() {
  const day = todayStamp()
  return [
    { id: 'seed-apt', day, time: '11:30', title: 'Doctor appointment', kind: 'appointment', done: false },
    { id: 'seed-call', day, time: '16:00', title: 'Call Priya', kind: 'family', done: false },
    { id: 'seed-med', day, time: '20:00', title: 'Evening medicine', kind: 'medicine', done: false },
  ]
}

export const useCompanionStore = create(
  persist(
    (set, get) => ({
      memories: [
        { id: 'seed-mem-1', text: "Priya is my daughter. Her birthday is 12 October.", at: Date.now() - 86400000 },
        { id: 'seed-mem-2', text: 'I prefer doctor appointments in the morning.', at: Date.now() - 43200000 },
      ],
      tasks: seedTasks(),
      meals: {
        breakfast: 'Oats and fruit',
        lunch: 'Dal, roti and vegetables',
        dinner: 'Khichdi and curd',
        notes: '',
      },
      messages: [],
      talk: readLegacyTalk(),
      safetyEvents: [],
      pendingCheck: null,

      addMemory: (text) => {
        const clean = (text || '').trim()
        if (!clean) return
        set({ memories: [{ id: uid(), text: clean, at: Date.now() }, ...get().memories] })
      },
      removeMemory: (id) => set({ memories: get().memories.filter((row) => row.id !== id) }),

      addTask: (row) => {
        const task = {
          id: uid(),
          day: row.day || todayStamp(),
          time: row.time || '',
          title: (row.title || '').trim(),
          kind: row.kind || 'task',
          repeat: row.repeat || '',
          done: false,
        }
        if (!task.title) return
        set({ tasks: [...get().tasks, task].sort((a, b) => String(a.time).localeCompare(String(b.time))) })
      },
      toggleTask: (id) =>
        set({ tasks: get().tasks.map((row) => (row.id === id ? { ...row, done: !row.done } : row)) }),
      removeTask: (id) => set({ tasks: get().tasks.filter((row) => row.id !== id) }),

      setMeals: (patch) => set({ meals: { ...get().meals, ...patch } }),

      addMessage: (row) =>
        set({
          messages: [
            {
              id: uid(),
              to: row.to || '',
              text: row.text || '',
              photo: row.photo || '',
              at: Date.now(),
              fromFamily: Boolean(row.fromFamily),
            },
            ...get().messages,
          ],
        }),

      addTalk: (row) => {
        const next = { id: uid(), at: Date.now(), ...row }
        set({ talk: [...get().talk, next] })
        return next.id
      },
      updateTalk: (id, patch) =>
        set({ talk: get().talk.map((row) => (row.id === id ? { ...row, ...patch } : row)) }),
      clearTalk: () => set({ talk: [] }),

      logSafety: (row) =>
        set({ safetyEvents: [{ id: uid(), at: Date.now(), ...row }, ...get().safetyEvents].slice(0, 20) }),
      setPendingCheck: (value) => set({ pendingCheck: value }),
    }),
    {
      name: 'sathi-companion-v3',
      version: 3,
      partialize: (state) => ({
        memories: state.memories,
        tasks: state.tasks,
        meals: state.meals,
        messages: state.messages,
        talk: keepTalk(state.talk),
        safetyEvents: state.safetyEvents,
      }),
      migrate: (state) => {
        const talk = keepTalk(state?.talk)
        return {
          ...state,
          talk: talk.length ? talk : readLegacyTalk(),
        }
      },
    },
  ),
)

export function todaysTasks(tasks) {
  const day = todayStamp()
  return (tasks || [])
    .filter((row) => row.day === day || !row.day)
    .sort((a, b) => String(a.time).localeCompare(String(b.time)))
}

export function formatWhen(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}
