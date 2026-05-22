import { useState } from 'react'
import { patchTeam } from '../api'

const STATUSES = ['available', 'deployed', 'returning', 'off-duty']

// Operator form to update a team: status + current incident assignment.
export default function TeamControls({ team, incidents, onApplied }) {
  const [status, setStatus] = useState(team.status)
  const [assignment, setAssignment] = useState(team.current_assignment || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [ok, setOk] = useState(false)

  const open = incidents.filter((i) => i.status !== 'resolved')
  const dirty = status !== team.status || assignment !== (team.current_assignment || '')

  async function apply() {
    setBusy(true); setError(null); setOk(false)
    try {
      await patchTeam(team._id, { status, current_assignment: assignment || null })
      setOk(true)
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
        <span className={`tbadge ${team.status}`}>{team.status}</span>
        <span className="ctrl-type">{team.specialization}</span>
        <div className="ctrl-meta mono">
          {team.members}/{team.capacity} crew · {team.location?.area}
        </div>
        <div className="ctrl-meta">Equipment: <span className="mono">{(team.equipment || []).join(', ')}</span></div>
        <div className="ctrl-meta mono">{team.contact}</div>
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
        <label>Current assignment</label>
        <select className="select" value={assignment} onChange={(e) => setAssignment(e.target.value)}>
          <option value="">— unassigned —</option>
          {open.map((i) => (
            <option key={i._id} value={i._id}>{i._id} · {i.disaster_type} ({i.severity})</option>
          ))}
        </select>
      </div>

      {error && <div className="ctrl-error">{error}</div>}

      <button className="btn btn-primary" disabled={busy || !dirty} onClick={apply}>
        {busy ? 'Applying…' : ok ? '✓ Applied' : 'Apply update'}
      </button>
    </div>
  )
}
