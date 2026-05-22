// All requests are same-origin relative paths.
// Dev: Vite proxies /api -> :3001. Prod: Express serves this bundle, same origin.

async function getJSON(path) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`${path} -> ${res.status}`)
  return res.json()
}

export const getIncidents = () =>
  getJSON('/api/incidents').then((d) => d.filter((i) => !i._id.startsWith('_')))

export const getTeams = () =>
  getJSON('/api/teams').then((d) => d.filter((t) => !t._id.startsWith('_')))

export const getStats = () => getJSON('/api/stats')
