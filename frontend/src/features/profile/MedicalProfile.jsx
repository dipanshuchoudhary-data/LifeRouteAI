import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Droplet, HeartPulse, IdCard, Phone, Pill, Plus, ShieldPlus, Trash2, UserRound } from 'lucide-react'
import {
  ALLERGY_PRESETS,
  BLOOD_TYPES,
  CONDITION_PRESETS,
  FREQUENCY_OPTIONS,
  INSURANCE_PRESETS,
  MEDICATION_PRESETS,
  RELATION_OPTIONS,
  SEVERITY_OPTIONS,
  ESI_LEGEND,
  PRODUCT_FEATURES,
} from '../../data/liferouteData'
import {
  EMPTY_PROFILE,
  EMPTY_VITALS,
  newProfileId,
  profileInitials,
  useProfileStore,
} from '../../stores/useProfileStore'
import PipelineStrip from '../showcase/PipelineStrip'
import WearableConnect from '../wearable/WearableConnect'

function VitalRing({ label, value, unit, percent, warn }) {
  const offset = 88 - (88 * Math.max(0, Math.min(100, percent))) / 100
  return (
    <div className={`lr-vital-ring ${warn ? 'warn' : ''}`}>
      <div className="lr-vital-ring-dial">
        <svg viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="14" className="lr-vital-track" />
          <circle cx="18" cy="18" r="14" className="lr-vital-value" strokeDasharray="88" strokeDashoffset={offset} />
        </svg>
        <strong>{value}<small>{unit}</small></strong>
      </div>
      <span>{label}</span>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="lr-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function cloneChart(profile) {
  const copy = JSON.parse(JSON.stringify(profile || EMPTY_PROFILE))
  delete copy.wearable
  copy.vitals = { ...EMPTY_VITALS, ...(copy.vitals || {}) }
  copy.insurances = copy.insurances || []
  copy.medications = copy.medications || []
  copy.allergies = copy.allergies || []
  copy.conditions = copy.conditions || []
  copy.emergencyContacts = copy.emergencyContacts || []
  return copy
}

function snapshot(profile) {
  const { wearable, ...rest } = profile || {}
  return JSON.stringify(rest)
}

const EMPTY_ADD = {
  payer: '',
  med: '',
  dose: '',
  allergy: '',
  condition: '',
  contactName: '',
  contactPhone: '',
  contactRelation: 'Spouse',
}

export default function MedicalProfile({ activeNode = '' }) {
  const savedProfile = useProfileStore((s) => s.profile)
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const resetProfile = useProfileStore((s) => s.resetProfile)

  const [chart, setChart] = useState(() => cloneChart(savedProfile))
  const [addForm, setAddForm] = useState(EMPTY_ADD)
  const [justSaved, setJustSaved] = useState(false)
  const baseline = useRef(snapshot(cloneChart(savedProfile)))
  const dirty = snapshot(chart) !== baseline.current

  useEffect(() => {
    if (snapshot(chart) !== baseline.current) return undefined
    const next = cloneChart(savedProfile)
    if (snapshot(next) === snapshot(chart)) return undefined
    setChart(next)
    baseline.current = snapshot(next)
    return undefined
  }, [savedProfile])

  const patchChart = (patch) => setChart((current) => ({ ...current, ...patch }))
  const patchVitals = (patch) => setChart((current) => ({ ...current, vitals: { ...current.vitals, ...patch } }))
  const patchList = (key, id, patch) =>
    setChart((current) => ({
      ...current,
      [key]: current[key].map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }))
  const removeFrom = (key, id) =>
    setChart((current) => ({ ...current, [key]: current[key].filter((row) => row.id !== id) }))
  const addTo = (key, row) =>
    setChart((current) => ({ ...current, [key]: [...current[key], { id: newProfileId(), ...row }] }))

  const saveChart = () => {
    const live = useProfileStore.getState().profile
    const next = {
      ...chart,
      wearable: live.wearable,
      vitals: live.wearable?.status === 'connected' ? live.vitals : chart.vitals,
    }
    updateProfile(next)
    const stored = cloneChart(next)
    setChart(stored)
    baseline.current = snapshot(stored)
    setJustSaved(true)
    window.setTimeout(() => setJustSaved(false), 2200)
  }

  const discardChart = () => {
    const next = cloneChart(useProfileStore.getState().profile)
    setChart(next)
    baseline.current = snapshot(next)
    setAddForm(EMPTY_ADD)
  }

  const clearChart = () => {
    resetProfile()
    const next = cloneChart({ ...EMPTY_PROFILE, vitals: { ...EMPTY_VITALS } })
    setChart(next)
    baseline.current = snapshot(next)
    setAddForm(EMPTY_ADD)
  }

  const vitals = chart.vitals || {}
  const initials = profileInitials(chart)
  const hrWarn = vitals.heart_rate > 110 || vitals.heart_rate < 50
  const spo2Warn = vitals.oxygen_saturation < 94
  const bpWarn = vitals.systolic_bp >= 140
  const primary = chart.emergencyContacts[0]

  return (
    <section className="lr-section">
      <div className="lr-section-header">
        <div>
          <h2 className="lr-section-title ops-profile-title">
            <IdCard size={22} color="#0F766E" /> Medical chart
          </h2>
          <p className="lr-section-sub">
            {dirty
              ? 'Unsaved changes — Save to use this chart for triage, family calling, and matching.'
              : 'You fill this in. Saved insurances, meds, allergies, and vitals are used on every triage pass.'}
          </p>
        </div>
        <div className="ops-profile-actions">
          {justSaved && !dirty && <span className="ops-pill ok">Saved</span>}
          {dirty && (
            <>
              <button type="button" className="ops-btn-ghost" onClick={discardChart}>Discard</button>
              <button type="button" className="ops-btn" onClick={saveChart}>Save</button>
            </>
          )}
          <button type="button" className="lr-filter-btn" onClick={clearChart}>Clear chart</button>
        </div>
      </div>

      <div className="lr-profile-grid">
        <article className="lr-id-card">
          <div className="lr-id-top">
            <div className="lr-id-avatar">{initials}</div>
            <div>
              <h3>{chart.name || 'Unnamed patient'}</h3>
              <p>{[chart.age && `${chart.age} yrs`, chart.sex, chart.city].filter(Boolean).join(' · ') || 'Add identity below'}</p>
            </div>
            <div className={`lr-blood-seal ${spo2Warn || hrWarn ? 'alert' : ''}`}>
              <Droplet size={14} />
              {chart.bloodType || '—'}
            </div>
          </div>
          <div className="lr-form-grid">
            <Field label="Full name">
              <input value={chart.name} onChange={(e) => patchChart({ name: e.target.value })} placeholder="Patient name" />
            </Field>
            <Field label="Age">
              <input type="number" min="0" max="120" value={chart.age} onChange={(e) => patchChart({ age: e.target.value })} placeholder="42" />
            </Field>
            <Field label="Sex">
              <select value={chart.sex} onChange={(e) => patchChart({ sex: e.target.value })}>
                <option value="">Select</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="City">
              <input value={chart.city} onChange={(e) => patchChart({ city: e.target.value })} placeholder="South Delhi" />
            </Field>
            <Field label="Blood type">
              <select value={chart.bloodType} onChange={(e) => patchChart({ bloodType: e.target.value })}>
                <option value="">Select</option>
                {BLOOD_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </Field>
            <Field label="Height (cm)">
              <input type="number" value={chart.heightCm} onChange={(e) => patchChart({ heightCm: e.target.value })} placeholder="165" />
            </Field>
            <Field label="Weight (kg)">
              <input type="number" value={chart.weightKg} onChange={(e) => patchChart({ weightKg: e.target.value })} placeholder="68" />
            </Field>
            <Field label="Smoking">
              <select value={chart.smoking} onChange={(e) => patchChart({ smoking: e.target.value })}>
                <option value="never">Never</option>
                <option value="former">Former</option>
                <option value="current">Current</option>
              </select>
            </Field>
          </div>
          <div className="lr-toggle-row">
            <label><input type="checkbox" checked={chart.organDonor} onChange={(e) => patchChart({ organDonor: e.target.checked })} /> Organ donor</label>
            <label><input type="checkbox" checked={chart.pregnant} onChange={(e) => patchChart({ pregnant: e.target.checked })} /> Pregnant</label>
          </div>
          {primary?.phone && (
            <a className="lr-call-btn" href={`tel:${primary.phone.replace(/\s/g, '')}`}>
              <Phone size={16} /> Call {primary.name || 'contact'}
            </a>
          )}
        </article>

        <article className="lr-vitals-card">
          <div className="lr-result-card-header">
            <HeartPulse size={18} color="#0F766E" />
            <span>Live vitals on file</span>
            {(hrWarn || spo2Warn || bpWarn) && (
              <span className="lr-triage-badge" style={{ background: 'rgba(229,57,53,0.15)', color: '#B91C1C', borderColor: 'rgba(229,57,53,0.35)' }}>
                <AlertTriangle size={12} /> Watch
              </span>
            )}
          </div>
          <div className="lr-vital-rings">
            <VitalRing label="Heart rate" value={vitals.heart_rate} unit="bpm" percent={(vitals.heart_rate - 40) / 1.4} warn={hrWarn} />
            <VitalRing label="SpO₂" value={vitals.oxygen_saturation} unit="%" percent={vitals.oxygen_saturation} warn={spo2Warn} />
            <VitalRing label="Systolic" value={vitals.systolic_bp} unit="mmHg" percent={(vitals.systolic_bp - 80) / 1.2} warn={bpWarn} />
            <VitalRing label="Temp" value={vitals.temperature_f} unit="°F" percent={(vitals.temperature_f - 95) * 14} />
          </div>
          <div className="lr-vital-sliders">
            {[
              { key: 'heart_rate', label: 'HR', min: 40, max: 180 },
              { key: 'oxygen_saturation', label: 'SpO₂', min: 80, max: 100 },
              { key: 'systolic_bp', label: 'SBP', min: 80, max: 210 },
              { key: 'diastolic_bp', label: 'DBP', min: 40, max: 140 },
              { key: 'temperature_f', label: 'Temp', min: 96, max: 105, step: 0.1 },
              { key: 'respiratory_rate', label: 'RR', min: 8, max: 40 },
            ].map((item) => (
              <label key={item.key}>
                <span>{item.label}</span>
                <input
                  type="range"
                  min={item.min}
                  max={item.max}
                  step={item.step || 1}
                  value={vitals[item.key]}
                  onChange={(event) => patchVitals({ [item.key]: Number(event.target.value) })}
                />
                <em>{vitals[item.key]}</em>
              </label>
            ))}
          </div>
        </article>
      </div>

      <WearableConnect />

      <div className="lr-chart-grid">
        <article className="lr-chart-card">
          <h4><ShieldPlus size={14} color="#0F766E" /> Insurances</h4>
          <div className="lr-preset-row">
            {INSURANCE_PRESETS.map((payer) => (
              <button key={payer} type="button" className="lr-soft-chip muted" onClick={() => addTo('insurances', { payer, plan: 'Cashless', cashless: true })}>
                + {payer}
              </button>
            ))}
          </div>
          <div className="lr-add-row">
            <input value={addForm.payer} onChange={(e) => setAddForm({ ...addForm, payer: e.target.value })} placeholder="Payer / TPA" />
            <button type="button" className="lr-filter-btn" onClick={() => { if (addForm.payer.trim()) { addTo('insurances', { payer: addForm.payer.trim(), plan: 'Retail', cashless: false }); setAddForm({ ...addForm, payer: '' }) } }}>
              <Plus size={14} /> Add
            </button>
          </div>
          {chart.insurances.length === 0 && <p className="lr-muted">No cover on file. Add a policy so ranking can prefer cashless network.</p>}
          {chart.insurances.map((row) => (
            <div key={row.id} className="lr-editor-row">
              <input value={row.payer} onChange={(e) => patchList('insurances', row.id, { payer: e.target.value })} placeholder="Payer" />
              <input value={row.plan} onChange={(e) => patchList('insurances', row.id, { plan: e.target.value })} placeholder="Plan" />
              <input value={row.memberId} onChange={(e) => patchList('insurances', row.id, { memberId: e.target.value })} placeholder="Member ID" />
              <label className="lr-check"><input type="checkbox" checked={row.cashless} onChange={(e) => patchList('insurances', row.id, { cashless: e.target.checked })} /> Cashless</label>
              <button type="button" className="lr-icon-del" onClick={() => removeFrom('insurances', row.id)} aria-label="Remove insurance"><Trash2 size={14} /></button>
            </div>
          ))}
        </article>

        <article className="lr-chart-card">
          <h4><Pill size={14} color="#0F766E" /> Medications</h4>
          <div className="lr-preset-row">
            {MEDICATION_PRESETS.map((name) => (
              <button key={name} type="button" className="lr-soft-chip info" onClick={() => addTo('medications', { name, dose: '', frequency: 'Once daily' })}>+ {name}</button>
            ))}
          </div>
          <div className="lr-add-row">
            <input value={addForm.med} onChange={(e) => setAddForm({ ...addForm, med: e.target.value })} placeholder="Medicine name" />
            <input value={addForm.dose} onChange={(e) => setAddForm({ ...addForm, dose: e.target.value })} placeholder="Dose e.g. 500mg" />
            <button type="button" className="lr-filter-btn" onClick={() => { if (addForm.med.trim()) { addTo('medications', { name: addForm.med.trim(), dose: addForm.dose.trim(), frequency: 'Once daily' }); setAddForm({ ...addForm, med: '', dose: '' }) } }}>
              <Plus size={14} /> Add
            </button>
          </div>
          {chart.medications.length === 0 && <p className="lr-muted">Add current medicines so the ER and night pharmacy know what you take.</p>}
          {chart.medications.map((row) => (
            <div key={row.id} className="lr-editor-row">
              <input value={row.name} onChange={(e) => patchList('medications', row.id, { name: e.target.value })} placeholder="Name" />
              <input value={row.dose} onChange={(e) => patchList('medications', row.id, { dose: e.target.value })} placeholder="Dose" />
              <select value={row.frequency} onChange={(e) => patchList('medications', row.id, { frequency: e.target.value })}>
                {FREQUENCY_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
              </select>
              <button type="button" className="lr-icon-del" onClick={() => removeFrom('medications', row.id)} aria-label="Remove medicine"><Trash2 size={14} /></button>
            </div>
          ))}
        </article>

        <article className="lr-chart-card">
          <h4><AlertTriangle size={14} color="#B45309" /> Allergies</h4>
          <div className="lr-preset-row">
            {ALLERGY_PRESETS.map((substance) => (
              <button key={substance} type="button" className="lr-soft-chip danger" onClick={() => addTo('allergies', { substance, severity: 'Moderate' })}>+ {substance}</button>
            ))}
          </div>
          <div className="lr-add-row">
            <input value={addForm.allergy} onChange={(e) => setAddForm({ ...addForm, allergy: e.target.value })} placeholder="Substance" />
            <button type="button" className="lr-filter-btn" onClick={() => { if (addForm.allergy.trim()) { addTo('allergies', { substance: addForm.allergy.trim(), severity: 'Moderate' }); setAddForm({ ...addForm, allergy: '' }) } }}>
              <Plus size={14} /> Add
            </button>
          </div>
          {chart.allergies.map((row) => (
            <div key={row.id} className="lr-editor-row">
              <span className="lr-soft-chip danger">{row.substance}</span>
              <select value={row.severity} onChange={(e) => patchList('allergies', row.id, { severity: e.target.value })}>
                {SEVERITY_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
              </select>
              <button type="button" className="lr-icon-del" onClick={() => removeFrom('allergies', row.id)} aria-label="Remove allergy"><Trash2 size={14} /></button>
            </div>
          ))}
        </article>

        <article className="lr-chart-card">
          <h4><HeartPulse size={14} color="#0F766E" /> Conditions</h4>
          <div className="lr-preset-row">
            {CONDITION_PRESETS.map((name) => (
              <button key={name} type="button" className="lr-soft-chip warn" onClick={() => addTo('conditions', { name })}>+ {name}</button>
            ))}
          </div>
          <div className="lr-add-row">
            <input value={addForm.condition} onChange={(e) => setAddForm({ ...addForm, condition: e.target.value })} placeholder="Condition" />
            <button type="button" className="lr-filter-btn" onClick={() => { if (addForm.condition.trim()) { addTo('conditions', { name: addForm.condition.trim() }); setAddForm({ ...addForm, condition: '' }) } }}>
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="lr-chip-row">
            {chart.conditions.map((row) => (
              <button key={row.id} type="button" className="lr-soft-chip warn" onClick={() => removeFrom('conditions', row.id)}>
                {row.name} ×
              </button>
            ))}
          </div>
        </article>

        <article className="lr-chart-card">
          <h4><UserRound size={14} color="#0F766E" /> Emergency contacts</h4>
          <div className="lr-add-row">
            <input value={addForm.contactName} onChange={(e) => setAddForm({ ...addForm, contactName: e.target.value })} placeholder="Name" />
            <select value={addForm.contactRelation} onChange={(e) => setAddForm({ ...addForm, contactRelation: e.target.value })}>
              {RELATION_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
            </select>
            <input value={addForm.contactPhone} onChange={(e) => setAddForm({ ...addForm, contactPhone: e.target.value })} placeholder="+91 …" />
            <button
              type="button"
              className="lr-filter-btn"
              onClick={() => {
                if (addForm.contactName.trim() && addForm.contactPhone.trim()) {
                  addTo('emergencyContacts', { name: addForm.contactName.trim(), relation: addForm.contactRelation, phone: addForm.contactPhone.trim() })
                  setAddForm({ ...addForm, contactName: '', contactPhone: '' })
                }
              }}
            >
              <Plus size={14} /> Add
            </button>
          </div>
          {chart.emergencyContacts.map((row) => (
            <div key={row.id} className="lr-editor-row">
              <input value={row.name} onChange={(e) => patchList('emergencyContacts', row.id, { name: e.target.value })} />
              <input value={row.relation} onChange={(e) => patchList('emergencyContacts', row.id, { relation: e.target.value })} />
              <input value={row.phone} onChange={(e) => patchList('emergencyContacts', row.id, { phone: e.target.value })} />
              <button type="button" className="lr-icon-del" onClick={() => removeFrom('emergencyContacts', row.id)} aria-label="Remove contact"><Trash2 size={14} /></button>
            </div>
          ))}
        </article>

        <article className="lr-chart-card">
          <h4>Clinical notes</h4>
          <textarea
            rows={5}
            value={chart.notes}
            onChange={(e) => patchChart({ notes: e.target.value })}
            placeholder="Implants, last surgery, dialysis days, language preference…"
          />
        </article>
      </div>

      <PipelineStrip activeNode={activeNode} compact />
      <div className="lr-how-metrics">
        {ESI_LEGEND.map((item) => (
          <span key={item.level} className="lr-esi-chip" style={{ borderColor: `${item.color}55`, color: item.color }}>
            ESI {item.level} · {item.label}
          </span>
        ))}
      </div>
      <div className="lr-how-metrics lr-how-features">
        {PRODUCT_FEATURES.map((item) => (
          <span key={item.title} className="lr-soft-chip info">{item.title} · {item.metric}</span>
        ))}
      </div>

      {dirty && (
        <div className="ops-profile-savebar">
          <span>Unsaved profile changes</span>
          <button type="button" className="ops-btn-ghost" onClick={discardChart}>Discard</button>
          <button type="button" className="ops-btn" onClick={saveChart}>Save</button>
        </div>
      )}
    </section>
  )
}
