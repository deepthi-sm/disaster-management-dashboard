// Integration tests for the API + database layer. Requires a CouchDB and a
// Redis reachable via the COUCHDB_*/REDIS_* env vars (docker-compose.test.yml
// provides them in CI). Run with: npm test
const { test, before, after } = require('node:test')
const assert = require('node:assert')
const request = require('supertest')

const { app, shutdown } = require('../server')
const { nano, incidentsDb, teamsDb } = require('../db')
const { applySchema } = require('../db/designdocs')
const { teams, incidents } = require('../seed')
const events = require('../redis/events')

// Fresh, deterministic state before the suite: rebuild both databases, apply
// the schema, load seed docs, and clear the Redis stream + leaderboard.
before(async () => {
  for (const name of ['incidents', 'teams']) {
    try { await nano.db.destroy(name) } catch (_) { /* may not exist */ }
    await nano.db.create(name)
  }
  await applySchema(incidentsDb, teamsDb)
  await teamsDb.bulk({ docs: teams })
  await incidentsDb.bulk({ docs: incidents })
  await events.client.flushall()
})

after(async () => {
  await shutdown()
})

test('GET /api/health reports couchdb + redis up', async () => {
  const res = await request(app).get('/api/health')
  assert.strictEqual(res.status, 200)
  assert.strictEqual(res.body.status, 'ok')
  assert.strictEqual(res.body.couchdb, true)
  assert.strictEqual(res.body.redis, true)
})

test('GET /api/incidents returns clean incident docs (no _design)', async () => {
  const res = await request(app).get('/api/incidents')
  assert.strictEqual(res.status, 200)
  assert.strictEqual(res.body.length, 8)
  for (const inc of res.body) {
    assert.ok(!inc._id.startsWith('_design'))
    assert.ok(inc.severity && inc.status && inc.location)
  }
})

test('GET /api/stats matches known seed values (computed via views)', async () => {
  const res = await request(app).get('/api/stats')
  assert.strictEqual(res.status, 200)
  assert.deepStrictEqual(res.body, { critical: 2, active: 7, deployed: 4, rescued: 35 })
})

test('GET /api/incidents?status=active uses Mango and filters server-side', async () => {
  const res = await request(app).get('/api/incidents?status=active')
  assert.strictEqual(res.status, 200)
  assert.strictEqual(res.body.length, 3)
  assert.ok(res.body.every((i) => i.status === 'active'))
})

test('GET /api/incidents?severity=critical returns the critical incidents', async () => {
  const res = await request(app).get('/api/incidents?severity=critical')
  assert.strictEqual(res.body.length, 2)
  assert.deepStrictEqual(res.body.map((i) => i._id).sort(), ['DR-001', 'DR-002'])
})

test('PATCH /api/incidents/:id/status updates the doc + invalidates cache', async () => {
  await request(app).get('/api/incidents') // warm the cache
  const res = await request(app)
    .patch('/api/incidents/DR-004/status')
    .send({ status: 'in-progress', team_id: 'TEAM-04', casualties: 7 })
  assert.strictEqual(res.status, 200)
  assert.strictEqual(res.body.doc.status, 'in-progress')
  assert.strictEqual(res.body.doc.casualties_rescued, 7)

  const list = await request(app).get('/api/incidents')
  const dr004 = list.body.find((i) => i._id === 'DR-004')
  assert.strictEqual(dr004.casualties_rescued, 7) // cache was invalidated
})

test('PATCH on a missing id returns 404', async () => {
  const res = await request(app).patch('/api/incidents/DR-999/status').send({ status: 'resolved' })
  assert.strictEqual(res.status, 404)
})

test('concurrent PATCHes all succeed (409 retry, no lost update error)', async () => {
  const results = await Promise.all(
    [11, 12, 13, 14].map((c) =>
      request(app).patch('/api/incidents/DR-002/status').send({ casualties: c })
    )
  )
  assert.ok(results.every((r) => r.status === 200))
})

test('Redis stream records events and replays them; leaderboard ranks teams', async () => {
  // The PATCHes above appended events; DR-004 credited TEAM-04 with +7.
  const ev = await request(app).get('/api/events?limit=50')
  assert.strictEqual(ev.status, 200)
  assert.ok(ev.body.length >= 1)
  assert.ok(ev.body.every((e) => typeof e.id === 'string')) // carries stream id

  const lb = await request(app).get('/api/leaderboard')
  assert.strictEqual(lb.status, 200)
  const team04 = lb.body.find((t) => t.team_id === 'TEAM-04')
  assert.ok(team04 && team04.rescued >= 7)
})
