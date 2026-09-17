import { useState } from 'react'

const KEY = 'liferoute-ops-settings'

function readSettings() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export default function SettingsPanel({ language, onLanguageChange }) {
  const saved = readSettings()
  const [region, setRegion] = useState(saved.region || 'Delhi NCR')
  const [units, setUnits] = useState(saved.units || 'metric')
  const [alerts, setAlerts] = useState(saved.alerts !== false)

  const persist = (next) => {
    localStorage.setItem(KEY, JSON.stringify({ region, units, alerts, language, ...next }))
  }

  return (
    <section className="ops-settings">
      <article className="ops-card">
        <h3>Console</h3>
        <label>
          Region
          <select value={region} onChange={(e) => { setRegion(e.target.value); persist({ region: e.target.value }) }}>
            <option>Delhi NCR</option>
            <option>Mumbai MMR</option>
            <option>Bengaluru</option>
          </select>
        </label>
        <label style={{ marginTop: 12 }}>
          Language
          <select value={language} onChange={(e) => { onLanguageChange?.(e.target.value); persist({ language: e.target.value }) }}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </label>
        <label style={{ marginTop: 12 }}>
          Distance units
          <select value={units} onChange={(e) => { setUnits(e.target.value); persist({ units: e.target.value }) }}>
            <option value="metric">Kilometers</option>
            <option value="imperial">Miles</option>
          </select>
        </label>
        <label style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={alerts} onChange={(e) => { setAlerts(e.target.checked); persist({ alerts: e.target.checked }) }} />
          Critical capacity alerts
        </label>
      </article>
      <article className="ops-card">
        <h3>Safety</h3>
        <p className="ops-muted">Life-threatening language is intercepted before any generative model. Emergency calling number is 108.</p>
      </article>
    </section>
  )
}
