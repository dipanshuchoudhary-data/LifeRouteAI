import FacilityMap from '../maps/FacilityMap'
import useLiveFacilities from '../../hooks/useLiveFacilities'
import { useLifeRouteStore } from '../../stores/useLifeRouteStore'

export default function LiveCommandCenter({ onNavigate }) {
  const origin = useLifeRouteStore((s) => s.location)
  const { hospitals, ambulances, kpis, live, updatedAt } = useLiveFacilities(origin)
  const result = useLifeRouteStore((s) => s.result)
  const busy = ambulances.filter((unit) => unit.status !== 'available')

  return (
    <div className="ops-live ops-live-idle">
      <header className="ops-live-head">
        <div className="ops-live-head-main">
          <div className="ops-live-head-meta">
            <span className="ops-live-kicker idle">Live operations</span>
            <span className="ops-live-pulse"><i /> LIVE</span>
            <span className="ops-live-id">{live ? 'Telemetry feed' : 'Cached snapshot'} · {updatedAt.toLocaleTimeString()}</span>
          </div>
          <h1>No active emergency</h1>
        </div>
        {onNavigate ? (
          <button type="button" className="ops-btn" onClick={() => onNavigate('home')}>Start a case</button>
        ) : null}
      </header>

      <div className="ops-kpi-row ops-live-kpis">
        <div className="ops-kpi"><strong>{kpis.intercepts}</strong><span>Sentinel intercepts / hr</span></div>
        <div className="ops-kpi"><strong>{kpis.als}</strong><span>ALS units free</span></div>
        <div className="ops-kpi"><strong>{kpis.icuFree}</strong><span>ICU beds open</span></div>
        <div className="ops-kpi"><strong>{kpis.vents}</strong><span>Ventilators ready</span></div>
      </div>

      <section className="ops-live-map-frame" aria-label="Network map">
        <FacilityMap
          origin={origin}
          hospitals={hospitals}
          ambulances={ambulances}
          heightClass="ops-live-map-canvas"
          basemap="roads"
          originLabel="You"
        />
        <div className="ops-live-legend">
          <span><i className="pt" /> You</span>
          <span><i className="amb" /> Ambulance</span>
          <span><i className="er" /> Hospital</span>
        </div>
      </section>

      <aside className="ops-live-summary">
        <p className="ops-live-panel-kicker">Network</p>
        <div className="ops-live-row">
          <span className="ops-live-label">Incident</span>
          <strong>None assigned</strong>
          <p className="ops-live-meta">Open Home to describe a problem and choose E1–E5.</p>
        </div>
        <div className="ops-live-row">
          <span className="ops-live-label">Fleet</span>
          <strong>{busy.length} units committed</strong>
          <p className="ops-live-meta">{ambulances.length} tracked in Delhi NCR</p>
        </div>
        <div className="ops-live-row">
          <span className="ops-live-label">Capacity</span>
          <strong>{kpis.icuFree} ICU open</strong>
          <p className="ops-live-meta">{kpis.als} ALS units free</p>
        </div>
      </aside>

      <article className="ops-live-panel ops-live-amb">
        <p className="ops-live-panel-kicker">Incidents</p>
        <table className="ops-table">
          <thead><tr><th>Case</th><th>Status</th><th>Facility</th></tr></thead>
          <tbody>
            {result ? (
              <tr>
                <td>{result.isEmergency ? 'Sentinel intercept' : 'Routed case'}</td>
                <td><span className={`ops-pill ${result.isEmergency || result.esiLevel <= 2 ? 'crit' : 'warn'}`}>{result.triage}</span></td>
                <td>{result.matchedHospital?.name}</td>
              </tr>
            ) : (
              <tr><td colSpan={3} className="ops-muted">No operator-owned incident.</td></tr>
            )}
            {busy.slice(0, 5).map((unit) => (
              <tr key={unit.id}>
                <td>{unit.callSign}</td>
                <td><span className="ops-pill warn">{unit.status}</span></td>
                <td>{unit.hospital}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <article className="ops-live-panel ops-live-dest">
        <p className="ops-live-panel-kicker">Hospital load</p>
        <table className="ops-table">
          <thead><tr><th>Facility</th><th>Cap</th><th>Wait</th><th>ICU</th></tr></thead>
          <tbody>
            {hospitals.slice(0, 6).map((hospital) => (
              <tr key={hospital.id}>
                <td>{hospital.name}</td>
                <td>{hospital.capacity}%</td>
                <td>{hospital.wait}</td>
                <td>{hospital.icuFree ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  )
}
