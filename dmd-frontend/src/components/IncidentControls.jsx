import { useState } from 'react'
import { patchIncident } from '../api'

const STATUSES = ['active', 'in-progress', 'resolved']

// Operator form to update an incident: status, assign a team, rescued count.
export default function IncidentControls({ incident, teams, onApplied }) {
  const [status, setStatus] = useState(incident.status)
  const [teamId, setTeamId] = useState('')
  const [rescued, setRescued] = useState(incident.casualties_rescued || 0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [ok, setOk] = useState(false)

  const total = incident.casualties_total || 0
  const assigned = incident.assigned_teams || []
  const assignable = teams.filter((t) => !assigned.includes(t._id))

  const dirty =
    status !== incident.status ||
    rescued !== (incident.casualties_rescued || 0) ||
    teamId !== ''

  async function apply() {
    setBusy(true); setError(null); setOk(false)
    try {
      const body = { status, casualties: Number(rescued) }
      if (teamId) body.team_id = teamId
      await patchIncident(incident._id, body)
      setOk(true); setTeamId('')
      onApplied && onApplied()
      setTimeout(() => setOk(false), 1500)
    } catch (e) {
      setError(e.message || 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ctrl">
      <div className="ctrl-summary">
        <span className={`badge ${incident.severity}`}>{incident.severity}</span>
        <span className="ctrl-type">{incident.disaster_type}</span>
        <p className="ctrl-desc">{incident.description}</p>
        <div className="ctrl-meta mono">
          {incident.location?.address} · reported by {incident.reported_by}
        </div>
        {assigned.length > 0 && (
          <div className="ctrl-meta">Assigned: <span className="mono">{assigned.join(', ')}</span></div>
        )}
      </div>

      <div className="field">
        <label>Status</label>
        <div className="seg">
          {STATUSES.map((s) => (
            <button key={s} className={`seg-btn ${status === s ? 'on' : ''}`} onClick={() => setStatus(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Assign team</label>
        <select className="select" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          <option value="">— select a team —</option>
          {assignable.map((t) => (
            <option key={t._id} value={t._id}>{t._id} · {t.name} ({t.status})</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Casualties rescued <span className="hint">of {total}</span></label>
        <div className="stepper">
          <button className="step" onClick={() => setRescued((v) => Math.max(0, Number(v) - 1))}>&minus;</button>
          <input
            className="input num mono"
            type="number"
            min="0"
            max={total || undefined}
            value={rescued}
            onChange={(e) => setRescued(e.target.value)}
          />
          <button className="step" onClick={() => setRescued((v) => (total ? Math.min(total, Number(v) + 1) : Number(v) + 1))}>+</button>
        </div>
      </div>

      {error && <div className="ctrl-error">{error}</div>}

      <button className="btn btn-primary" disabled={busy || !dirty} onClick={apply}>
        {busy ? 'Applying…' : ok ? '✓ Applied' : 'Apply update'}
      </button>
    </div>
  )
}
