// Database-side queries: stats come from grouped map-reduce views, filtered
// incident lists come from Mango. Replaces the old in-JS filtering/aggregation.
const { incidentsDb, teamsDb } = require('./index')

// Aggregate dashboard stats using CouchDB reduces instead of scanning in JS.
async function getStats() {
  const [sev, incStatus, teamStatus, rescued] = await Promise.all([
    incidentsDb.view('incidents', 'by_severity', { group: true }),
    incidentsDb.view('incidents', 'by_status', { group: true }),
    teamsDb.view('teams', 'by_status', { group: true }),
    incidentsDb.view('incidents', 'rescued_total'), // reduce, single row
  ])
  const sevMap = Object.fromEntries(sev.rows.map((r) => [r.key, r.value]))
  const teamMap = Object.fromEntries(teamStatus.rows.map((r) => [r.key, r.value]))
  const active = incStatus.rows
    .filter((r) => r.key !== 'resolved')
    .reduce((sum, r) => sum + r.value, 0)

  return {
    critical: sevMap.critical || 0,
    active,
    deployed: teamMap.deployed || 0,
    rescued: rescued.rows.length ? rescued.rows[0].value : 0,
  }
}

// Filtered incident list via a Mango selector (uses the idx-status / idx-severity
// / idx-type indexes). Falls through to a full list when no filter is given.
async function incidentsByFilter({ status, severity, type } = {}) {
  const selector = { type: 'incident' }
  if (status) selector.status = status
  if (severity) selector.severity = severity
  if (type) selector.disaster_type = type
  const res = await incidentsDb.find({ selector, limit: 1000 })
  return res.docs.filter((d) => !d._id.startsWith('_design'))
}

module.exports = { getStats, incidentsByFilter }
