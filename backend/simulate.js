const axios = require('axios')

// Base URL of the running backend. Defaults to localhost for manual runs;
// docker-compose sets TARGET_BASE_URL=http://backend:3001 for the sim service.
const BASE = process.env.TARGET_BASE_URL || 'http://localhost:3001'

const updates = [
  { path: '/api/incidents/DR-001/status', body: { status: 'in-progress', team_id: 'TEAM-01', casualties: 22 } },
  { path: '/api/teams/TEAM-04/status', body: { status: 'deployed', current_assignment: 'DR-004' } },
  { path: '/api/incidents/DR-004/status', body: { status: 'in-progress', team_id: 'TEAM-04', casualties: 1 } },
  { path: '/api/teams/TEAM-07/status', body: { status: 'deployed', current_assignment: 'DR-006' } },
  { path: '/api/incidents/DR-006/status', body: { status: 'in-progress', team_id: 'TEAM-07', casualties: 2 } },
  { path: '/api/incidents/DR-001/status', body: { status: 'resolved', team_id: 'TEAM-01', casualties: 40 } },
  { path: '/api/teams/TEAM-01/status', body: { status: 'returning', current_assignment: null } },
  { path: '/api/incidents/DR-007/status', body: { status: 'in-progress', team_id: 'TEAM-05', casualties: 1 } },
  { path: '/api/teams/TEAM-06/status', body: { status: 'available', current_assignment: null } },
  { path: '/api/incidents/DR-004/status', body: { status: 'resolved', team_id: 'TEAM-04', casualties: 3 } },
]

let index = 0

async function sendUpdate() {
  const update = updates[index % updates.length]
  try {
    await axios.patch(BASE + update.path, update.body)
    console.log(`Sent update ${index + 1}: ${update.path.split('/').slice(-2).join('/')}`)
  } catch (err) {
    console.error('Update failed:', err.message)
  }
  index++
}

console.log(`Starting live simulation against ${BASE} — updates every 5 seconds...`)
sendUpdate()
setInterval(sendUpdate, 5000)
