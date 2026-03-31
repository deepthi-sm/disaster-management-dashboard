require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const path = require('path')
const { Server } = require('socket.io')
const nano = require('nano')(`http://admin:Admin123$@localhost:5984`)
const Redis = require('ioredis')

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '..', 'frontend')))

const redis = new Redis({ host: '127.0.0.1', port: 6379, family: 4 })
const pub = new Redis({ host: '127.0.0.1', port: 6379, family: 4 })
const sub = new Redis({ host: '127.0.0.1', port: 6379, family: 4 })

const incidentsDb = nano.use('incidents')
const teamsDb = nano.use('teams')

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// GET all incidents (with Redis cache)
app.get('/api/incidents', async (req, res) => {
  try {
    const cached = await redis.get('cache:incidents')
    if (cached) {
      console.log('Serving incidents from Redis cache')
      return res.json(JSON.parse(cached))
    }
    const result = await incidentsDb.list({ include_docs: true })
    const incidents = result.rows.map(r => r.doc).filter(doc => !doc._id.startsWith('_design'))
    await redis.setex('cache:incidents', 10, JSON.stringify(incidents))
    res.json(incidents)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET all teams (with Redis cache)
app.get('/api/teams', async (req, res) => {
  try {
    const cached = await redis.get('cache:teams')
    if (cached) {
      console.log('Serving teams from Redis cache')
      return res.json(JSON.parse(cached))
    }
    const result = await teamsDb.list({ include_docs: true })
    const teams = result.rows.map(r => r.doc).filter(doc => !doc._id.startsWith('_design'))
    await redis.setex('cache:teams', 10, JSON.stringify(teams))
    res.json(teams)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH update incident status
app.patch('/api/incidents/:id/status', async (req, res) => {
  try {
    const { status, team_id, casualties } = req.body
    const doc = await incidentsDb.get(req.params.id)

    doc.status = status || doc.status
    if (team_id && !doc.assigned_teams.includes(team_id)) {
      doc.assigned_teams.push(team_id)
    }
    if (casualties !== undefined) doc.casualties_rescued = casualties
    doc.last_updated = new Date().toISOString()

    await incidentsDb.insert(doc)

    // Clear cache so next request gets fresh data
    await redis.del('cache:incidents')

    // Publish event to Redis
    const event = {
      type: 'INCIDENT_UPDATED',
      incident_id: doc._id,
      status: doc.status,
      assigned_teams: doc.assigned_teams,
      casualties_rescued: doc.casualties_rescued,
      timestamp: doc.last_updated
    }
    await pub.publish('disaster:updates', JSON.stringify(event))

    res.json({ success: true, doc })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH update team status
app.patch('/api/teams/:id/status', async (req, res) => {
  try {
    const { status, current_assignment } = req.body
    const doc = await teamsDb.get(req.params.id)

    doc.status = status || doc.status
    doc.current_assignment = current_assignment !== undefined ? current_assignment : doc.current_assignment
    doc.last_ping = new Date().toISOString()

    await teamsDb.insert(doc)
    await redis.del('cache:teams')

    const event = {
      type: 'TEAM_UPDATED',
      team_id: doc._id,
      name: doc.name,
      status: doc.status,
      current_assignment: doc.current_assignment,
      timestamp: doc.last_ping
    }
    await pub.publish('disaster:updates', JSON.stringify(event))

    res.json({ success: true, doc })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET stats summary
app.get('/api/stats', async (req, res) => {
  try {
    const [incResult, teamResult] = await Promise.all([
      incidentsDb.list({ include_docs: true }),
      teamsDb.list({ include_docs: true })
    ])
    const incidents = incResult.rows.map(r => r.doc).filter(doc => !doc._id.startsWith('_design'))
    const teams = teamResult.rows.map(r => r.doc).filter(doc => !doc._id.startsWith('_design'))

    const stats = {
      critical: incidents.filter(i => i.severity === 'critical').length,
      active: incidents.filter(i => i.status !== 'resolved').length,
      deployed: teams.filter(t => t.status === 'deployed').length,
      rescued: incidents.reduce((sum, i) => sum + (i.casualties_rescued || 0), 0)
    }
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── REDIS PUB/SUB → SOCKET.IO ────────────────────────────────────────────────
sub.subscribe('disaster:updates', (err) => {
  if (err) console.error('Redis subscribe error:', err)
  else console.log('Subscribed to Redis channel: disaster:updates')
})

sub.on('message', (channel, message) => {
  console.log('Redis event received:', message)
  io.emit('disaster:update', JSON.parse(message))
})

// ─── SOCKET.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Browser connected:', socket.id)
  socket.on('disconnect', () => console.log('Browser disconnected:', socket.id))
})

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log('CouchDB connected')
  console.log('Redis connected')
})