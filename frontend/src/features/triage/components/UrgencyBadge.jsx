export default function UrgencyBadge({ esiLevel, urgency, color, label }) {
  return (
    <span className="lr-triage-badge" style={{ background: `${color}20`, color, borderColor: `${color}40` }}>
      {esiLevel ? `ESI ${esiLevel}` : ''}{esiLevel && label ? ' · ' : ''}{label || urgency}
    </span>
  )
}
