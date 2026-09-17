import { useMemo, useState } from 'react'
import { Clock, Droplet, MapPin, Navigation, Phone, UserPlus } from 'lucide-react'
import { BLOOD_TYPES, donorCanGiveTo } from '../../../data/liferouteData'
import { getBloodColor } from '../../../lib/triageAdapters'
import { useProfileStore } from '../../../stores/useProfileStore'
import { allDonors, useDonorStore } from '../../../stores/useDonorStore'
import useLiveFacilities from '../../../hooks/useLiveFacilities'
import { useLifeRouteStore } from '../../../stores/useLifeRouteStore'

export default function BloodBankPanel() {
  const origin = useLifeRouteStore((s) => s.location)
  const result = useLifeRouteStore((s) => s.result)
  const profile = useProfileStore((s) => s.profile)
  const { blood } = useLiveFacilities(origin)
  const registered = useDonorStore((s) => s.donors)
  const registerDonor = useDonorStore((s) => s.registerDonor)
  const setDonorAvailable = useDonorStore((s) => s.setDonorAvailable)
  const removeDonor = useDonorStore((s) => s.removeDonor)

  const bloodType = profile.bloodType
  const patientType = result?.raw?.blood_type || bloodType || ''
  const [neededType, setNeededType] = useState(patientType || 'O-')
  const [form, setForm] = useState({
    name: profile.name || '',
    bloodType: bloodType || 'O+',
    phone: profile.emergencyContacts?.[0]?.phone || '',
    city: profile.city || '',
    available: true,
  })
  const [saved, setSaved] = useState(false)

  const donors = useMemo(() => allDonors(), [registered])
  const self = registered.find((row) => row.self) || registered[0]
  const shortages = blood.flatMap((bank) =>
    Object.entries(bank.stocks).filter(([, units]) => units <= 5).map(([type, units]) => ({ bank: bank.name, type, units })),
  )
  const needed = neededType || patientType
  const matches = donors.filter((row) => row.available && donorCanGiveTo(row.bloodType, needed))
  const byType = BLOOD_TYPES.map((type) => ({
    type,
    ready: donors.filter((row) => row.bloodType === type && row.available).length,
    total: donors.filter((row) => row.bloodType === type).length,
  }))

  const submitDonor = (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.bloodType) return
    registerDonor(form)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <section className="lr-section">
      <div className="lr-section-header">
        <div>
          <h2 className="lr-section-title ops-profile-title">
            <Droplet size={20} color="#0F766E" /> Blood inventory
          </h2>
          <p className="lr-section-sub">
            {blood.length} banks · {donors.filter((row) => row.available).length} donors available
            {bloodType ? <> · chart type {bloodType}</> : ' · set blood type on Profile'}
          </p>
        </div>
      </div>

      {shortages.length > 0 && (
        <article className="ops-card" style={{ marginBottom: 16, borderColor: '#FECACA' }}>
          <h3 style={{ color: '#B91C1C' }}>Critical shortages</h3>
          <div className="ops-chips">
            {shortages.map((row) => (
              <button
                key={`${row.bank}-${row.type}`}
                type="button"
                className="ops-pill crit"
                onClick={() => setNeededType(row.type)}
              >
                {row.type} · {row.units}u · {row.bank}
              </button>
            ))}
          </div>
        </article>
      )}

      <div className="ops-blood-layout">
        <article className="ops-card ops-donor-match">
          <p className="ops-live-panel-kicker">Emergency match</p>
          <div className="ops-donor-needed">
            <label className="lr-field">
              <span>Patient needs</span>
              <select value={needed} onChange={(e) => setNeededType(e.target.value)}>
                {BLOOD_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <p className="ops-muted">
              {patientType ? `Active chart / case type ${patientType}. ` : ''}
              Compatible available donors can be called now.
            </p>
          </div>
          {matches.length === 0 ? (
            <p className="ops-muted">No available compatible donor. Contact a bank below or register to donate.</p>
          ) : (
            <ul className="ops-donor-list">
              {matches.map((row) => (
                <li key={row.id}>
                  <div>
                    <strong>{row.name}{row.self ? ' · You' : ''}</strong>
                    <span>{row.bloodType} · {row.city}</span>
                  </div>
                  <a className="ops-btn" href={`tel:${String(row.phone).replace(/\s/g, '')}`}>
                    <Phone size={14} /> Call
                  </a>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="ops-card">
          <p className="ops-live-panel-kicker">Be a blood donor</p>
          {self ? (
            <>
              <h2 className="ops-donor-self">{self.name}</h2>
              <p className="ops-muted">{self.bloodType} · {self.phone} · {self.city}</p>
              <label className="lr-check" style={{ marginTop: 12 }}>
                <input type="checkbox" checked={self.available} onChange={(e) => setDonorAvailable(self.id, e.target.checked)} />
                Available for emergency requests
              </label>
              <div className="ops-donor-actions">
                <a className="ops-btn" href="tel:108">Notify 108</a>
                <button type="button" className="ops-btn-ghost" onClick={() => removeDonor(self.id)}>Leave registry</button>
              </div>
            </>
          ) : (
            <form className="ops-donor-form" onSubmit={submitDonor}>
              <p className="ops-muted">Register once. LifeRoute will match you to emergency patients who can receive your type.</p>
              <label className="lr-field">
                <span>Full name</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" required />
              </label>
              <div className="ops-donor-form-row">
                <label className="lr-field">
                  <span>Blood type</span>
                  <select value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value })}>
                    {BLOOD_TYPES.map((type) => <option key={type}>{type}</option>)}
                  </select>
                </label>
                <label className="lr-field">
                  <span>Phone</span>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 …" required />
                </label>
              </div>
              <label className="lr-field">
                <span>City</span>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Delhi NCR" />
              </label>
              <label className="lr-check">
                <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
                Available for emergency calls
              </label>
              <button type="submit" className="ops-btn">
                <UserPlus size={14} /> {saved ? 'Registered' : 'Register as donor'}
              </button>
            </form>
          )}
        </article>
      </div>

      <article className="ops-card" style={{ margin: '16px 0' }}>
        <p className="ops-live-panel-kicker">Donor roster</p>
        <div className="ops-donor-types">
          {byType.map((row) => (
            <button
              key={row.type}
              type="button"
              className={`ops-donor-type ${row.type === needed ? 'active' : ''}`}
              onClick={() => setNeededType(row.type)}
            >
              <strong>{row.type}</strong>
              <span>{row.ready} ready</span>
            </button>
          ))}
        </div>
        <table className="ops-table">
          <thead>
            <tr><th>Donor</th><th>Type</th><th>City</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {donors.map((row) => (
              <tr key={row.id}>
                <td>{row.name}{row.self ? ' · You' : ''}</td>
                <td>{row.bloodType}</td>
                <td>{row.city}</td>
                <td>
                  <span className={`ops-pill ${row.available ? 'ok' : 'warn'}`}>
                    {row.available ? 'Available' : 'Not now'}
                  </span>
                </td>
                <td>
                  {row.available ? (
                    <a className="ops-live-link" href={`tel:${String(row.phone).replace(/\s/g, '')}`}>
                      <Phone size={12} /> Call
                    </a>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <div className="lr-blood-grid">
        {blood.map((bank) => (
          <div key={bank.id} className="lr-blood-card">
            <div className="lr-blood-card-header">
              <h3>{bank.name}</h3>
              <span className="lr-blood-updated"><Clock size={12} /> {bank.lastUpdated}</span>
            </div>
            <div className="lr-card-row2" style={{ marginBottom: 16 }}>
              <span><MapPin size={13} /> {bank.city}</span>
              <span><Navigation size={13} /> {bank.distance}</span>
            </div>
            <div className="lr-blood-stocks">
              {Object.entries(bank.stocks).map(([type, units]) => (
                <div key={type} className={`lr-blood-type ${type === bloodType ? 'match' : ''}`}>
                  <span className="lr-blood-type-label">{type}</span>
                  <span className="lr-blood-type-units" style={{ color: units <= 5 ? '#DC2626' : getBloodColor(units) }}>{units}</span>
                  <span className="lr-blood-type-unit">units</span>
                </div>
              ))}
            </div>
            <a className="lr-call-btn" href={`tel:${bank.phone}`}><Phone size={16} /> Contact bank</a>
          </div>
        ))}
      </div>
    </section>
  )
}
