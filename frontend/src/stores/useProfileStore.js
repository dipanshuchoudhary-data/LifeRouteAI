import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export const EMPTY_VITALS = {
  heart_rate: 72,
  systolic_bp: 120,
  diastolic_bp: 80,
  oxygen_saturation: 98,
  temperature_f: 98.6,
  respiratory_rate: 16,
}

export const EMPTY_WEARABLE = {
  status: 'idle',
  deviceId: '',
  deviceName: '',
  lastAlertAt: 0,
}

export const DEMO_PROFILE = {
  name: 'Mr. Sharma',
  age: '72',
  sex: 'male',
  bloodType: 'B+',
  city: 'Noida',
  heightCm: '168',
  weightKg: '74',
  organDonor: false,
  pregnant: false,
  smoking: 'never',
  alcohol: 'none',
  notes: 'Prefers morning appointments. Lives in Noida Sector 62.',
  insurances: [{ id: 'demo-ins-1', payer: 'Star Health', plan: 'Senior', memberId: 'SH-7721', cashless: true }],
  allergies: [{ id: 'demo-al-1', substance: 'Penicillin', severity: 'Severe' }],
  conditions: [
    { id: 'demo-co-1', name: 'Hypertension' },
    { id: 'demo-co-2', name: 'Type 2 Diabetes' },
  ],
  medications: [
    { id: 'demo-med-1', name: 'Amlodipine', dose: '5 mg', frequency: 'Once daily' },
    { id: 'demo-med-2', name: 'Metformin', dose: '500 mg', frequency: 'Twice daily' },
  ],
  emergencyContacts: [
    { id: 'demo-priya', name: 'Priya Sharma', relation: 'Daughter', phone: '+91 98100 11223', canEmergency: true, canSafety: true, canDaily: true },
    { id: 'demo-rahul', name: 'Rahul Sharma', relation: 'Son', phone: '+91 98200 44556', canEmergency: true, canSafety: false, canDaily: false },
  ],
  vitals: { ...EMPTY_VITALS },
  wearable: {
    status: 'connected',
    deviceId: 'apple-watch-ultra',
    deviceName: 'Apple Watch Ultra',
    lastAlertAt: 0,
  },
}

export const EMPTY_PROFILE = {
  name: '',
  age: '',
  sex: '',
  bloodType: '',
  city: '',
  heightCm: '',
  weightKg: '',
  organDonor: false,
  pregnant: false,
  smoking: 'never',
  alcohol: 'none',
  notes: '',
  insurances: [],
  allergies: [],
  conditions: [],
  medications: [],
  emergencyContacts: [],
  vitals: { ...EMPTY_VITALS },
  wearable: { ...EMPTY_WEARABLE },
}

function asList(value, mapper) {
  if (!Array.isArray(value)) return []
  return value.map((item, index) => mapper(item, index)).filter(Boolean)
}

export function migrateProfile(raw) {
  if (!raw || typeof raw !== 'object' || !(raw.name || '').trim()) {
    return { ...DEMO_PROFILE, vitals: { ...EMPTY_VITALS, ...(raw?.vitals || {}) } }
  }
  const allergies = asList(raw.allergies, (item) => {
    if (typeof item === 'string') return { id: uid(), substance: item, severity: 'Moderate' }
    return { id: item.id || uid(), substance: item.substance || '', severity: item.severity || 'Moderate' }
  })
  const conditions = asList(raw.conditions, (item) => {
    if (typeof item === 'string') return { id: uid(), name: item }
    return { id: item.id || uid(), name: item.name || '' }
  })
  const medications = asList(raw.medications, (item) => {
    if (typeof item === 'string') {
      const [name, ...rest] = item.split(' ')
      return { id: uid(), name: name || item, dose: rest.join(' '), frequency: 'Once daily' }
    }
    return {
      id: item.id || uid(),
      name: item.name || '',
      dose: item.dose || '',
      frequency: item.frequency || 'Once daily',
    }
  })
  const insurances = asList(raw.insurances, (item) => ({
    id: item.id || uid(),
    payer: item.payer || '',
    plan: item.plan || '',
    memberId: item.memberId || '',
    cashless: Boolean(item.cashless),
  }))
  if (!insurances.length && raw.insurance) {
    insurances.push({
      id: uid(),
      payer: String(raw.insurance).split('·')[0].trim(),
      plan: String(raw.insurance).includes('Cashless') ? 'Cashless' : 'Retail',
      memberId: '',
      cashless: /cashless/i.test(raw.insurance),
    })
  }
  const emergencyContacts = asList(raw.emergencyContacts, (item) => ({
    id: item.id || uid(),
    name: item.name || '',
    relation: item.relation || '',
    phone: item.phone || '',
    canEmergency: item.canEmergency !== false,
    canSafety: item.canSafety !== false,
    canDaily: Boolean(item.canDaily),
  }))
  if (!emergencyContacts.length && raw.emergencyContact?.name) {
    emergencyContacts.push({ id: uid(), ...raw.emergencyContact })
  }
  return {
    ...EMPTY_PROFILE,
    ...raw,
    allergies,
    conditions,
    medications,
    insurances,
    emergencyContacts,
    vitals: { ...EMPTY_VITALS, ...(raw.vitals || {}) },
    wearable: { ...EMPTY_WEARABLE, ...(raw.wearable || {}) },
  }
}

export const useProfileStore = create(
  persist(
    (set, get) => ({
      profile: { ...DEMO_PROFILE },
      loadDemoPatient: () => set({ profile: { ...DEMO_PROFILE, vitals: { ...EMPTY_VITALS } } }),
      updateProfile: (patch) => set({ profile: { ...get().profile, ...patch } }),
      updateVitals: (patch) =>
        set({ profile: { ...get().profile, vitals: { ...get().profile.vitals, ...patch } } }),
      setWearable: (patch) =>
        set({ profile: { ...get().profile, wearable: { ...EMPTY_WEARABLE, ...get().profile.wearable, ...patch } } }),
      disconnectWearable: () =>
        set({ profile: { ...get().profile, wearable: { ...EMPTY_WEARABLE } } }),
      addInsurance: (row) =>
        set({ profile: { ...get().profile, insurances: [...get().profile.insurances, { id: uid(), cashless: true, ...row }] } }),
      removeInsurance: (id) =>
        set({ profile: { ...get().profile, insurances: get().profile.insurances.filter((row) => row.id !== id) } }),
      patchInsurance: (id, patch) =>
        set({
          profile: {
            ...get().profile,
            insurances: get().profile.insurances.map((row) => (row.id === id ? { ...row, ...patch } : row)),
          },
        }),
      addMedication: (row) =>
        set({ profile: { ...get().profile, medications: [...get().profile.medications, { id: uid(), frequency: 'Once daily', ...row }] } }),
      removeMedication: (id) =>
        set({ profile: { ...get().profile, medications: get().profile.medications.filter((row) => row.id !== id) } }),
      patchMedication: (id, patch) =>
        set({
          profile: {
            ...get().profile,
            medications: get().profile.medications.map((row) => (row.id === id ? { ...row, ...patch } : row)),
          },
        }),
      addAllergy: (row) =>
        set({ profile: { ...get().profile, allergies: [...get().profile.allergies, { id: uid(), severity: 'Moderate', ...row }] } }),
      patchAllergy: (id, patch) =>
        set({
          profile: {
            ...get().profile,
            allergies: get().profile.allergies.map((row) => (row.id === id ? { ...row, ...patch } : row)),
          },
        }),
      removeAllergy: (id) =>
        set({ profile: { ...get().profile, allergies: get().profile.allergies.filter((row) => row.id !== id) } }),
      addCondition: (row) =>
        set({ profile: { ...get().profile, conditions: [...get().profile.conditions, { id: uid(), ...row }] } }),
      removeCondition: (id) =>
        set({ profile: { ...get().profile, conditions: get().profile.conditions.filter((row) => row.id !== id) } }),
      addContact: (row) =>
        set({ profile: { ...get().profile, emergencyContacts: [...get().profile.emergencyContacts, { id: uid(), canEmergency: true, canSafety: true, canDaily: false, ...row }] } }),
      removeContact: (id) =>
        set({ profile: { ...get().profile, emergencyContacts: get().profile.emergencyContacts.filter((row) => row.id !== id) } }),
      patchContact: (id, patch) =>
        set({
          profile: {
            ...get().profile,
            emergencyContacts: get().profile.emergencyContacts.map((row) => (row.id === id ? { ...row, ...patch } : row)),
          },
        }),
      resetProfile: () => set({ profile: { ...EMPTY_PROFILE, vitals: { ...EMPTY_VITALS }, wearable: { ...EMPTY_WEARABLE } } }),
    }),
    {
      name: 'liferoute-medical-chart-v2',
      merge: (persisted, current) => ({
        ...current,
        ...(persisted || {}),
        profile: migrateProfile(persisted?.profile),
      }),
    },
  ),
)

export function allergyNames(profile) {
  return (profile.allergies || []).map((item) => item.substance || item).filter(Boolean)
}

export function conditionNames(profile) {
  return (profile.conditions || []).map((item) => item.name || item).filter(Boolean)
}

export function medicationLabels(profile) {
  return (profile.medications || [])
    .map((item) => (typeof item === 'string' ? item : [item.name, item.dose].filter(Boolean).join(' ')))
    .filter(Boolean)
}

export function profilePayload(profile) {
  return {
    name: profile.name || undefined,
    age: profile.age ? Number(profile.age) : undefined,
    sex: profile.sex || undefined,
    blood_type: profile.bloodType || undefined,
    allergies: allergyNames(profile),
    conditions: conditionNames(profile),
    medications: medicationLabels(profile),
    insurance: (profile.insurances || []).map((row) => row.payer).filter(Boolean).join(', ') || undefined,
  }
}

export function vitalsPayload(profile) {
  return { ...(profile.vitals || {}) }
}

export function withProfileContext(text, profile) {
  const vitals = profile.vitals || {}
  const parts = [
    profile.age ? `${profile.age}${profile.sex ? ` ${profile.sex}` : ''}` : profile.sex,
    profile.bloodType ? `blood ${profile.bloodType}` : null,
    allergyNames(profile).length ? `allergies ${allergyNames(profile).join(', ')}` : null,
    conditionNames(profile).length ? `history ${conditionNames(profile).join(', ')}` : null,
    medicationLabels(profile).length ? `meds ${medicationLabels(profile).join(', ')}` : null,
    (profile.insurances || []).length ? `cover ${(profile.insurances || []).map((row) => row.payer).join(', ')}` : null,
    vitals.heart_rate != null ? `HR ${vitals.heart_rate}` : null,
    vitals.systolic_bp != null ? `BP ${vitals.systolic_bp}/${vitals.diastolic_bp || '—'}` : null,
    vitals.oxygen_saturation != null ? `SpO2 ${vitals.oxygen_saturation}%` : null,
  ].filter(Boolean)
  if (!parts.length) return text
  return `${text}\n\n[Medical profile] ${parts.join(' · ')}`
}

export function vitalsAreCritical(vitals = {}) {
  const hr = Number(vitals.heart_rate)
  const spo2 = Number(vitals.oxygen_saturation)
  const sbp = Number(vitals.systolic_bp)
  return (
    (Number.isFinite(hr) && (hr >= 130 || hr <= 40))
    || (Number.isFinite(spo2) && spo2 <= 90)
    || (Number.isFinite(sbp) && (sbp >= 180 || sbp <= 80))
  )
}

export function criticalVitalReasons(vitals = {}) {
  const reasons = []
  const hr = Number(vitals.heart_rate)
  const spo2 = Number(vitals.oxygen_saturation)
  const sbp = Number(vitals.systolic_bp)
  if (Number.isFinite(hr) && (hr >= 130 || hr <= 40)) reasons.push(`Heart rate ${hr} bpm`)
  if (Number.isFinite(spo2) && spo2 <= 90) reasons.push(`SpO₂ ${spo2}%`)
  if (Number.isFinite(sbp) && (sbp >= 180 || sbp <= 80)) reasons.push(`BP ${sbp}/${vitals.diastolic_bp || '—'}`)
  return reasons
}

export function profileInitials(profile) {
  const name = (profile.name || '').trim()
  if (!name) return '+'
  return name.split(' ').map((part) => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export { uid as newProfileId }
