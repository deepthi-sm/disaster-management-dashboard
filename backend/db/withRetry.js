// Optimistic-concurrency helper for CouchDB. Fetches the current doc, applies a
// mutation, and writes it back; on a 409 (document update conflict from a
// concurrent write) it re-fetches the latest _rev and retries. This makes the
// PATCH handlers safe under the parallel updates the simulator generates.
async function updateWithRetry(db, id, mutate, attempts = 5) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    const doc = await db.get(id) // throws 404 if missing — caller handles
    const next = mutate({ ...doc })
    try {
      const res = await db.insert(next)
      return { ...next, _rev: res.rev }
    } catch (e) {
      lastErr = e
      if (e.statusCode === 409 && i < attempts - 1) continue // stale _rev, retry
      throw e
    }
  }
  throw lastErr
}

module.exports = { updateWithRetry }
