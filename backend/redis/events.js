// Durable event log + leaderboard on Redis.
//
//  - stream:disaster:events  (Redis Stream)  — append-only, capped log of every
//    incident/team update. Survives restarts and can be replayed, unlike the
//    old fire-and-forget pub/sub. A blocking XREAD tails it for live push.
//  - zset:leaderboard:rescued (Sorted Set)   — teams ranked by casualties they
//    helped rescue (ZINCRBY on each update, ZREVRANGE to read the top N).
const Redis = require('ioredis')
const config = require('../config')

const STREAM = 'stream:disaster:events'
const LEADERBOARD = 'zset:leaderboard:rescued'
const opts = { host: config.REDIS_HOST, port: config.REDIS_PORT, family: 4 }

// Command client (XADD / XREVRANGE / ZINCRBY / ZREVRANGE).
const client = new Redis(opts)
// Dedicated connection for the blocking XREAD tail — a blocking call must not
// share a connection with regular commands.
const tailClient = new Redis(opts)

function fieldsToObj(fields) {
  const obj = {}
  for (let i = 0; i < fields.length; i += 2) obj[fields[i]] = fields[i + 1]
  return obj
}

// Append an event to the stream (kept ~1000 entries). Returns the stream id.
async function appendEvent(evt) {
  return client.xadd(STREAM, 'MAXLEN', '~', 1000, '*', 'data', JSON.stringify(evt))
}

// Most recent `count` events in chronological order (oldest → newest).
async function replayEvents(count = 50) {
  const rows = await client.xrevrange(STREAM, '+', '-', 'COUNT', count)
  return rows
    .map(([id, fields]) => ({ id, ...JSON.parse(fieldsToObj(fields).data) }))
    .reverse()
}

// Continuously tail new stream entries and hand each to onEvent. Starts from
// "now" ($) so only live events are pushed (history comes from replayEvents).
function streamTail(onEvent) {
  let lastId = '$'
  ;(async function loop() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const res = await tailClient.xread('BLOCK', 0, 'COUNT', 10, 'STREAMS', STREAM, lastId)
        if (!res) continue
        for (const [, messages] of res) {
          for (const [id, fields] of messages) {
            lastId = id
            try { onEvent({ id, ...JSON.parse(fieldsToObj(fields).data) }) } catch (_) { /* skip bad */ }
          }
        }
      } catch (err) {
        console.error('stream tail error:', err.message)
        await new Promise((r) => setTimeout(r, 1000))
      }
    }
  })()
}

// Credit a team with `delta` rescued people.
async function bumpLeaderboard(team, delta) {
  if (!team || !delta || delta <= 0) return
  await client.zincrby(LEADERBOARD, delta, team)
}

// Top N teams by rescued count, highest first.
async function topRescuers(n = 10) {
  const flat = await client.zrevrange(LEADERBOARD, 0, n - 1, 'WITHSCORES')
  const out = []
  for (let i = 0; i < flat.length; i += 2) out.push({ team_id: flat[i], rescued: Number(flat[i + 1]) })
  return out
}

module.exports = {
  STREAM,
  LEADERBOARD,
  appendEvent,
  replayEvents,
  streamTail,
  bumpLeaderboard,
  topRescuers,
}
