const axios = require('axios')

const updates = [
  { url: 'http://localhost:3001/api/incidents/DR-001/status', body: { status: 'in-progress', team_id: 'TEAM-01', casualties: 22 } },
  { url: 'http://localhost:3001/api/teams/TEAM-04/status', body: { status: 'deployed', current_assignment: 'DR-004' } },
  { url: 'http://localhost:3001/api/incidents/DR-004/status', body: { status: 'in-progress', team_id: 'TEAM-04', casualties: 1 } },
  { url: 'http://localhost:3001/api/teams/TEAM-07/status', body: { status: 'deployed', current_assignment: 'DR-006' } },
  { url: 'http://localhost:3001/api/incidents/DR-006/status', body: { status: 'in-progress', team_id: 'TEAM-07', casualties: 2 } },
  { url: 'http://localhost:3001/api/incidents/DR-001/status', body: { status: 'resolved', team_id: 'TEAM-01', casualties: 40 } },
  { url: 'http://localhost:3001/api/teams/TEAM-01/status', body: { status: 'returning', current_assignment: null } },
  { url: 'http://localhost:3001/api/incidents/DR-007/status', body: { status: 'in-progress', team_id: 'TEAM-05', casualties: 1 } },
  { url: 'http://localhost:3001/api/teams/TEAM-06/status', body: { status: 'available', current_assignment: null } },
  { url: 'http://localhost:3001/api/incidents/DR-004/status', body: { status: 'resolved', team_id: 'TEAM-04', casualties: 3 } },
]

let index = 0

async function sendUpdate() {
  const update = updates[index % updates.length]
  try {
    await axios.patch(update.url, update.body)
    console.log(`Sent update ${index + 1}: ${update.url.split('/').slice(-2).join('/')}`)
  } catch (err) {
    console.error('Update failed:', err.message)
  }
  index++
}

console.log('Starting live simulation — updates every 5 seconds...')
sendUpdate()
setInterval(sendUpdate, 5000)