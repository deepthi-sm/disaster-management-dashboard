import { useCallback, useEffect, useRef, useState } from 'react'
import { getIncidents, getTeams, getStats, getEvents, getLeaderboard } from './api'
import { useSocket } from './hooks/useSocket'
import IncidentMap from './components/IncidentMap'
import StatTile from './components/StatTile'
import Modal from './components/Modal'
import Drawer from './components/Drawer'
import Toolbar from './components/Toolbar'
import IncidentControls from './components/IncidentControls'
import TeamControls from './components/TeamControls'
import Leaderboard from './components/Leaderboard'
import StateBlock from './components/StateBlock'
import { RescueTrend, TeamDistribution } from './components/Charts'

const SEV_COLOR = { critical: '#ff3b5c', high: '#ff8c2a', medium: '#ffc83d', low: '#36d399' }
const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3 }
const now = () => new Date().toLocaleTimeString()

// Normalize a stream event (live or replayed) into a display row.
function formatEvent(e) {
  const t = e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : now()
  const id = e.id || Date.now() + Math.random()
  if (e.type === 'INCIDENT_UPDATED') {
    return { id, t, kind: 'incident', txt: `Incident <b>${e.incident_id}</b> &rarr; "${e.status}" &mdash; ${e.casualties_rescued ?? 0} rescued` }
  }
  return { id, t, kind: 'team', txt: `<b>${e.name || e.team_id}</b> status changed to "${e.status}"` }
}

export default function App() {
  const [theme, setTheme] = useState('dark')
  const [incidents, setIncidents] = useState([])
  const [teams, setTeams] = useState([])
  const [stats, setStats] = useState({ critical: 0, active: 0, deployed: 0, rescued: 0 })
  const [leaders, setLeaders] = useState([])
  const [trend, setTrend] = useState([])
  const [events, setEvents] = useState([])
  const [clock, setClock] = useState(now())
  const [flyTarget, setFlyTarget] = useState(null)
  const [flashInc, setFlashInc] = useState(null)
  const [flashTeam, setFlashTeam] = useState(null)
  const [expand, setExpand] = useState(null)
  const [selected, setSelected] = useState(null) // { kind: 'incident'|'team', id }

  // data lifecycle
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // filters
  const [query, setQuery] = useState('')
  const [sevFilter, setSevFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])
  useEffect(() => { const id = setInterval(() => setClock(now()), 1000); return () => clearInterval(id) }, [])

  const refresh = useCallback(async () => {
    try {
      const [inc, tm, st, lb] = await Promise.all([getIncidents(), getTeams(), getStats(), getLeaderboard()])
      setIncidents(inc); setTeams(tm); setStats(st); setLeaders(lb)
      setError(false)
      setTrend((p) => {
        const next = [...p, { t: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), rescued: st.rescued }]
        return next.slice(-14)
      })
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    // seed history over HTTP too (in case the socket replay is delayed)
    getEvents(50).then((h) => setEvents(h.map(formatEvent).reverse().slice(0, 40))).catch(() => {})
    const id = setInterval(refresh, 30000)
    return () => clearInterval(id)
  }, [refresh])

  const { connected } = useSocket(
    (e) => {
      setEvents((p) => [formatEvent(e), ...p].slice(0, 40))
      if (e.type === 'INCIDENT_UPDATED') { setFlashInc(e.incident_id); setTimeout(() => setFlashInc(null), 1000) }
      else if (e.type === 'TEAM_UPDATED') { setFlashTeam(e.team_id); setTimeout(() => setFlashTeam(null), 1000) }
      refresh()
    },
    (history) => setEvents(history.map(formatEvent).reverse().slice(0, 40)),
  )

  const flyKey = useRef(0)
  const focus = (loc) => { if (loc?.lat != null) setFlyTarget({ lat: loc.lat, lon: loc.lon, _k: ++flyKey.current }) }
  const selectIncident = (i) => { setSelected({ kind: 'incident', id: i._id }); focus(i.location) }
  const selectTeam = (t) => { setSelected({ kind: 'team', id: t._id }); focus(t.location) }

  const filtered = incidents.filter((i) => {
    if (sevFilter && i.severity !== sevFilter) return false
    if (statusFilter && i.status !== statusFilter) return false
    if (query) {
      const hay = `${i._id} ${i.disaster_type} ${i.location?.address || ''}`.toLowerCase()
      if (!hay.includes(query.toLowerCase())) return false
    }
    return true
  })
  const sorted = [...filtered].sort((a, b) => (SEV_RANK[a.severity] ?? 9) - (SEV_RANK[b.severity] ?? 9))

  const selectedIncident = selected?.kind === 'incident' ? incidents.find((i) => i._id === selected.id) : null
  const selectedTeam = selected?.kind === 'team' ? teams.find((t) => t._id === selected.id) : null

  const incidentsState = loading ? 'loading' : error ? 'error' : sorted.length === 0 ? 'empty' : 'ready'
  const teamsState = loading ? 'loading' : error ? 'error' : teams.length === 0 ? 'empty' : 'ready'

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">&#9672;</div>
          <div>
            <h1>Disaster Response Command Center</h1>
            <p>Real-time incident &amp; rescue coordination &middot; Chennai</p>
          </div>
        </div>
        <div className="topbar-right">
          <span className="clock mono">{clock}</span>
          <span className={`status-chip ${connected ? '' : 'off'}`}><span className="dot" />{connected ? 'Live' : 'Offline'}</span>
          <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">{theme === 'dark' ? '☾' : '☀'}</button>
        </div>
      </div>

      <div className="console">
        <div className="rail">
          <div className="stat-stack">
            <StatTile kind="critical" label="Critical" value={stats.critical} />
            <StatTile kind="active" label="Active" value={stats.active} />
            <StatTile kind="deployed" label="Deployed" value={stats.deployed} />
            <StatTile kind="rescued" label="Rescued" value={stats.rescued} />
          </div>
          <div className="panel" style={{ flex: 1 }}>
            <div className="panel-head">
              <span className="title"><span className="accent-bar" />Incidents &middot; {filtered.length}/{incidents.length}</span>
              <button className="expand-btn" onClick={() => setExpand('incidents')}>Expand &#10530;</button>
            </div>
            <Toolbar query={query} onQuery={setQuery} sev={sevFilter} onSev={setSevFilter} status={statusFilter} onStatus={setStatusFilter} />
            <div className="panel-body">
              {incidentsState !== 'ready'
                ? <StateBlock state={incidentsState} message={incidentsState === 'empty' ? 'No incidents match your filters.' : undefined} onRetry={refresh} />
                : sorted.map((i) => (
                  <div key={i._id} className={`inc-row ${flashInc === i._id ? 'flash' : ''} ${selected?.id === i._id ? 'selected' : ''}`} onClick={() => selectIncident(i)}>
                    <span className="inc-sev" style={{ background: SEV_COLOR[i.severity], color: SEV_COLOR[i.severity] }} />
                    <div className="inc-main">
                      <div className="id">{i._id} &middot; <span style={{ textTransform: 'capitalize' }}>{i.disaster_type}</span></div>
                      <div className="desc">{i.location?.address}</div>
                    </div>
                    <span className={`badge ${i.severity}`}>{i.severity}</span>
                    <span className="row-cta">Manage &rsaquo;</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="panel map-panel">
          <div className="panel-head">
            <span className="title"><span className="accent-bar" />Live Incident Map</span>
            <button className="expand-btn" onClick={() => setExpand('map')}>Fullscreen &#10530;</button>
          </div>
          <IncidentMap incidents={incidents} teams={teams} theme={theme} flyTarget={flyTarget} />
          <div className="map-legend">
            <div className="leg"><span className="d" style={{ background: '#ff3b5c', boxShadow: '0 0 8px #ff3b5c' }} />Critical</div>
            <div className="leg"><span className="d" style={{ background: '#ff8c2a', boxShadow: '0 0 8px #ff8c2a' }} />High</div>
            <div className="leg"><span className="d" style={{ background: '#ffc83d' }} />Medium / Low</div>
            <div className="leg"><span className="s" style={{ background: '#4d9fff', boxShadow: '0 0 8px #4d9fff' }} />Rescue team</div>
          </div>
        </div>

        <div className="rail">
          <div className="panel" style={{ flex: 1.2 }}>
            <div className="panel-head">
              <span className="title"><span className="accent-bar" />Rescue Teams</span>
              <button className="expand-btn" onClick={() => setExpand('teams')}>Expand &#10530;</button>
            </div>
            <div className="panel-body">
              {teamsState !== 'ready'
                ? <StateBlock state={teamsState} onRetry={refresh} />
                : teams.map((t) => (
                  <div key={t._id} className={`team ${t.status} ${flashTeam === t._id ? 'flash' : ''} ${selected?.id === t._id ? 'selected' : ''}`} onClick={() => selectTeam(t)}>
                    <div>
                      <div className="name">{t.name}</div>
                      <div className="meta mono">{t.current_assignment || 'No active assignment'}</div>
                    </div>
                    <span className={`tbadge ${t.status}`}>{t.status}</span>
                  </div>
                ))}
            </div>
          </div>
          <div className="panel" style={{ flex: 1 }}>
            <div className="panel-head"><span className="title"><span className="accent-bar" />Rescue Progress</span></div>
            <div className="chart-host"><RescueTrend data={trend} /></div>
          </div>
          <div className="panel" style={{ flex: 1 }}>
            <div className="panel-head"><span className="title"><span className="accent-bar" />Team Distribution</span></div>
            <div className="chart-host"><TeamDistribution teams={teams} /></div>
          </div>
        </div>
      </div>

      <div className="dock">
        <div className="panel">
          <div className="panel-head">
            <span className="title"><span className="accent-bar" />Live Event Stream &middot; Redis Stream</span>
            <button className="expand-btn" onClick={() => setExpand('events')}>Expand &#10530;</button>
          </div>
          <div className="panel-body events">
            {events.length === 0 && <div className="event"><span className="t">--:--:--</span><span className="d" /><span className="txt">Waiting for live events&hellip;</span></div>}
            {events.map((e) => (
              <div className="event" key={e.id}>
                <span className="t">{e.t}</span>
                <span className={`d ${e.kind === 'incident' ? 'incident' : ''}`} />
                <span className="txt" dangerouslySetInnerHTML={{ __html: e.txt }} />
              </div>
            ))}
          </div>
        </div>
        <div className="panel lb-panel">
          <div className="panel-head"><span className="title"><span className="accent-bar" />Rescue Leaderboard</span></div>
          <div className="panel-body"><Leaderboard entries={leaders} teams={teams} /></div>
        </div>
      </div>

      {/* Operator drawer */}
      {selectedIncident && (
        <Drawer title={`${selectedIncident._id} · ${selectedIncident.disaster_type}`} subtitle={selectedIncident.location?.address} onClose={() => setSelected(null)}>
          <IncidentControls incident={selectedIncident} teams={teams} onApplied={refresh} />
        </Drawer>
      )}
      {selectedTeam && (
        <Drawer title={selectedTeam.name} subtitle={`${selectedTeam._id} · ${selectedTeam.specialization}`} onClose={() => setSelected(null)}>
          <TeamControls team={selectedTeam} incidents={incidents} onApplied={refresh} />
        </Drawer>
      )}

      {expand === 'incidents' && (
        <Modal title="All Incidents - full detail" onClose={() => setExpand(null)}>
          <table>
            <thead><tr><th>ID</th><th>Type</th><th>Location</th><th>Severity</th><th>Status</th><th>Rescued</th><th>Teams</th><th>Reported by</th></tr></thead>
            <tbody>
              {sorted.map((i) => (
                <tr key={i._id}>
                  <td className="mono">{i._id}</td>
                  <td style={{ textTransform: 'capitalize' }}>{i.disaster_type}</td>
                  <td>{i.location?.address}</td>
                  <td><span className={`badge ${i.severity}`}>{i.severity}</span></td>
                  <td style={{ textTransform: 'capitalize' }}>{i.status}</td>
                  <td className="mono">{i.casualties_rescued || 0}/{i.casualties_total || 0}</td>
                  <td className="mono">{(i.assigned_teams || []).join(', ') || '—'}</td>
                  <td>{i.reported_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
      {expand === 'teams' && (
        <Modal title="All Rescue Teams - full detail" onClose={() => setExpand(null)}>
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Specialization</th><th>Status</th><th>Assignment</th><th>Crew</th><th>Equipment</th><th>Contact</th></tr></thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t._id}>
                  <td className="mono">{t._id}</td>
                  <td>{t.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{t.specialization}</td>
                  <td><span className={`tbadge ${t.status}`}>{t.status}</span></td>
                  <td className="mono">{t.current_assignment || '—'}</td>
                  <td className="mono">{t.members}/{t.capacity}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{(t.equipment || []).join(', ')}</td>
                  <td className="mono">{t.contact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
      {expand === 'map' && (
        <Modal title="Incident Map - fullscreen" onClose={() => setExpand(null)}>
          <div style={{ height: '70vh', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <IncidentMap incidents={incidents} teams={teams} theme={theme} flyTarget={flyTarget} />
          </div>
        </Modal>
      )}
      {expand === 'events' && (
        <Modal title="Event Stream - full log" onClose={() => setExpand(null)}>
          <div className="events">
            {events.map((e) => (
              <div className="event" key={e.id}>
                <span className="t">{e.t}</span>
                <span className={`d ${e.kind === 'incident' ? 'incident' : ''}`} />
                <span className="txt" dangerouslySetInnerHTML={{ __html: e.txt }} />
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
