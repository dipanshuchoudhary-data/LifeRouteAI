import { useEffect, useState } from 'react'
import { Bluetooth, Check, HeartPulse, Radio, Unplug, Watch } from 'lucide-react'
import { EMPTY_VITALS, useProfileStore } from '../../stores/useProfileStore'

const DEMO_DEVICES = [
  { id: 'apple-watch-ultra', name: 'Apple Watch Ultra', kind: 'Watch' },
  { id: 'galaxy-watch', name: 'Samsung Galaxy Watch', kind: 'Watch' },
  { id: 'fitbit-charge', name: 'Fitbit Charge 6', kind: 'Band' },
  { id: 'garmin-fenix', name: 'Garmin Fenix 8', kind: 'Watch' },
]

function jitter(value, amount) {
  return Math.round(value + (Math.random() * amount * 2 - amount))
}

export default function WearableConnect() {
  const profile = useProfileStore((s) => s.profile)
  const setWearable = useProfileStore((s) => s.setWearable)
  const disconnectWearable = useProfileStore((s) => s.disconnectWearable)
  const updateVitals = useProfileStore((s) => s.updateVitals)
  const wearable = profile.wearable || {}
  const [devices, setDevices] = useState(DEMO_DEVICES)
  const [hint, setHint] = useState('')

  useEffect(() => {
    if (wearable.status !== 'connected') return undefined
    const tick = setInterval(() => {
      const current = useProfileStore.getState().profile.vitals || EMPTY_VITALS
      const crashed = current.heart_rate >= 130 || current.oxygen_saturation <= 90
      if (crashed) return
      updateVitals({
        heart_rate: Math.min(118, Math.max(58, jitter(current.heart_rate || 72, 2))),
        oxygen_saturation: Math.min(99, Math.max(94, jitter(current.oxygen_saturation || 98, 1))),
        systolic_bp: Math.min(138, Math.max(108, jitter(current.systolic_bp || 120, 2))),
        diastolic_bp: Math.min(90, Math.max(68, jitter(current.diastolic_bp || 80, 1))),
        respiratory_rate: Math.min(22, Math.max(12, jitter(current.respiratory_rate || 16, 1))),
      })
    }, 2200)
    return () => clearInterval(tick)
  }, [wearable.status, updateVitals])

  const scan = async () => {
    setHint('')
    setWearable({ status: 'scanning', deviceId: '', deviceName: '' })
    const found = [...DEMO_DEVICES]
    if (navigator.bluetooth?.requestDevice) {
      try {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['heart_rate', 'battery_service'],
        })
        found.unshift({
          id: device.id || 'ble-device',
          name: device.name || 'Bluetooth device',
          kind: 'Bluetooth',
        })
      } catch (error) {
        if (error?.name !== 'NotFoundError' && error?.name !== 'NotAllowedError') {
          setHint('Bluetooth is unavailable here. Pick a device from the list.')
        }
      }
    } else {
      setHint('This browser has no Web Bluetooth. Select a device to continue the demo.')
    }
    await new Promise((resolve) => setTimeout(resolve, 900))
    setDevices(found)
    setWearable({ status: 'select' })
  }

  const pair = async (device) => {
    setWearable({ status: 'connecting', deviceId: device.id, deviceName: device.name })
    await new Promise((resolve) => setTimeout(resolve, 1100))
    updateVitals({ ...EMPTY_VITALS })
    setWearable({ status: 'connected', deviceId: device.id, deviceName: device.name, lastAlertAt: 0 })
  }

  const simulateCrash = () => {
    updateVitals({
      heart_rate: 148,
      oxygen_saturation: 84,
      systolic_bp: 188,
      diastolic_bp: 112,
      respiratory_rate: 28,
      temperature_f: 99.1,
    })
  }

  return (
    <article className="ops-card lr-wearable">
      <div className="lr-wearable-head">
        <Watch size={18} />
        <div>
          <h3>Wearable</h3>
          <p className="ops-muted">Connect a watch or band. Abnormal vitals auto-alert family and nearby ambulance.</p>
        </div>
      </div>

      <ol className="lr-wearable-steps">
        <li className={wearable.status !== 'idle' ? 'done' : 'active'}>Bluetooth</li>
        <li className={wearable.status === 'select' || wearable.status === 'connecting' ? 'active' : wearable.status === 'connected' ? 'done' : ''}>Select device</li>
        <li className={wearable.status === 'connecting' ? 'active' : wearable.status === 'connected' ? 'done' : ''}>Live vitals</li>
      </ol>

      {wearable.status === 'idle' && (
        <button type="button" className="ops-btn" onClick={scan}>
          <Bluetooth size={15} /> Connect through Bluetooth
        </button>
      )}

      {wearable.status === 'scanning' && (
        <p className="lr-wearable-status"><Radio size={14} className="lr-spin" /> Looking for Bluetooth devices…</p>
      )}

      {wearable.status === 'select' && (
        <div className="lr-wearable-list">
          {hint && <p className="ops-muted">{hint}</p>}
          {devices.map((device) => (
            <button key={device.id} type="button" className="lr-wearable-device" onClick={() => pair(device)}>
              <Watch size={16} />
              <span>
                <strong>{device.name}</strong>
                <em>{device.kind}</em>
              </span>
            </button>
          ))}
          <button type="button" className="ops-btn-ghost" onClick={scan}>Scan again</button>
        </div>
      )}

      {wearable.status === 'connecting' && (
        <p className="lr-wearable-status"><Radio size={14} className="lr-spin" /> Pairing {wearable.deviceName}…</p>
      )}

      {wearable.status === 'connected' && (
        <div className="lr-wearable-live">
          <p className="lr-wearable-ok"><Check size={14} /> Connected to {wearable.deviceName}</p>
          <div className="lr-wearable-vitals">
            <span><HeartPulse size={13} /> {profile.vitals?.heart_rate} bpm</span>
            <span>SpO₂ {profile.vitals?.oxygen_saturation}%</span>
            <span>BP {profile.vitals?.systolic_bp}/{profile.vitals?.diastolic_bp}</span>
          </div>
          <div className="lr-wearable-actions">
            <button type="button" className="ops-sos" onClick={simulateCrash}>Simulate abnormal vitals</button>
            <button type="button" className="ops-btn-ghost" onClick={disconnectWearable}>
              <Unplug size={14} /> Disconnect
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
