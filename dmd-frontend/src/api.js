// All requests are same-origin relative paths.
// Dev: Vite proxies /api -> :3001. Prod: Express serves this bundle, same origin.

async function getJSON(path) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`${path} -> ${res.status}`)
  return res.json()
}

async function send(path, method, body) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${path} -> ${res.status}`)
  return res.json()
}

function qs(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== '')
  return entries.length ? '?' + new URLSearchParams(entries).toString() : ''
}

// ── reads ────────────────────────────────────────────────────────────────────
export const getIncidents = (params) =>
  getJSON('/api/incidents' + qs(params)).then((d) => d.filter((i) => !i._id.startsWith('_')))

export const getTeams = () =>
  getJSON('/api/teams').then((d) => d.filter((t) => !t._id.startsWith('_')))

export const getStats = () => getJSON('/api/stats')
export const getEvents = (limit = 50) => getJSON(`/api/events?limit=${limit}`)
export const getLeaderboard = () => getJSON('/api/leaderboard')

// ── writes ───────────────────────────────────────────────────────────────────
export const patchIncident = (id, body) => send(`/api/incidents/${id}/status`, 'PATCH', body)
export const patchTeam = (id, body) => send(`/api/teams/${id}/status`, 'PATCH', body)
