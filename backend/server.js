const config = require('./config')
const express = require('express')
const cors = require('cors')
const http = require('http')
const path = require('path')
const { Server } = require('socket.io')
const Redis = require('ioredis')
const { nano, incidentsDb, teamsDb } = require('./db')
const { getStats, incidentsByFilter } = require('./db/queries')
const { updateWithRetry } = require('./db/withRetry')

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json())
app.use(express.static(config.STATIC_DIR))

const redis = new Redis({ host: config.REDIS_HOST, port: config.REDIS_PORT, family: 4 })
const pub = new Redis({ host: config.REDIS_HOST, port: config.REDIS_PORT, family: 4 })
const sub = new Redis({ host: config.REDIS_HOST, port: config.REDIS_PORT, family: 4 })

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// Health check — actually verifies CouchDB + Redis connectivity (used by the
// Docker healthcheck and the Jenkins Smoke stage).
app.get('/api/health', async (req, res) => {
  const health = { status: 'ok', couchdb: false, redis: false }
  try {
    await nano.db.list()
    health.couchdb = true
  } catch (_) { /* leave false */ }
  try {
    health.redis = (await redis.ping()) === 'PONG'
  } catch (_) { /* leave false */ }
  if (!health.couchdb || !health.redis) health.status = 'degraded'
  res.status(health.status === 'ok' ? 200 : 503).json(health)
})

// GET incidents. Optional ?status=&severity=&type= filters run as Mango
// queries (idx-status / idx-severity / idx-type). The unfiltered list is
// served from the 10s Redis cache.
app.get('/api/incidents', async (req, res) => {
  try {
    const { status, severity, type } = req.query
    if (status || severity || type) {
      const docs = await incidentsByFilter({ status, severity, type })
      return res.json(docs)
    }
    const cached = await redis.get('cache:incidents')
    if (cached) return res.json(JSON.parse(cached))
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

// PATCH update incident status (409-safe via updateWithRetry)
app.patch('/api/incidents/:id/status', async (req, res) => {
  try {
    const { status, team_id, casualties } = req.body
    const doc = await updateWithRetry(incidentsDb, req.params.id, (d) => {
      d.status = status || d.status
      d.assigned_teams = d.assigned_teams || []
      if (team_id && !d.assigned_teams.includes(team_id)) d.assigned_teams.push(team_id)
      if (casualties !== undefined) d.casualties_rescued = casualties
      d.last_updated = new Date().toISOString()
      return d
    })

    await redis.del('cache:incidents')

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
    const code = err.statusCode === 404 ? 404 : 500
    res.status(code).json({ error: err.message })
  }
})

// PATCH update team status (409-safe via updateWithRetry)
app.patch('/api/teams/:id/status', async (req, res) => {
  try {
    const { status, current_assignment } = req.body
    const doc = await updateWithRetry(teamsDb, req.params.id, (d) => {
      d.status = status || d.status
      d.current_assignment = current_assignment !== undefined ? current_assignment : d.current_assignment
      d.last_ping = new Date().toISOString()
      return d
    })

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
    const code = err.statusCode === 404 ? 404 : 500
    res.status(code).json({ error: err.message })
  }
})

// GET stats summary — computed by CouchDB map-reduce views (see db/queries.js)
app.get('/api/stats', async (req, res) => {
  try {
    res.json(await getStats())
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

// ─── SPA FALLBACK ─────────────────────────────────────────────────────────────
// Serve the React index.html for any non-API, non-socket route so client-side
// routing works. Express 5 dropped the `app.get('*')` wildcard form, so use
// middleware and exclude the API + websocket paths explicitly.
app.use((req, res, next) => {
  if (req.method !== 'GET') return next()
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next()
  res.sendFile(path.join(config.STATIC_DIR, 'index.html'))
})

// ─── START ────────────────────────────────────────────────────────────────────
if (require.main === module) {
  server.listen(config.PORT, () => {
    console.log(`Server running on http://localhost:${config.PORT}`)
    console.log(`CouchDB: ${config.COUCHDB_URL.replace(/\/\/[^@]*@/, '//***@')}`)
    console.log(`Redis: ${config.REDIS_HOST}:${config.REDIS_PORT}`)
  })
}

module.exports = { app, server, io }