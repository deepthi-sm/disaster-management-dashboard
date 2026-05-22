// Single source of configuration. Reads from environment with sane localhost
// defaults so the app runs identically locally, in Docker Compose, and in CI.
require('dotenv').config()
const path = require('path')

function couchUrl() {
  if (process.env.COUCHDB_URL) return process.env.COUCHDB_URL
  const host = process.env.COUCHDB_HOST || 'localhost'
  const port = process.env.COUCHDB_PORT || '5984'
  const user = process.env.COUCHDB_USER || 'admin'
  const pass = process.env.COUCHDB_PASSWORD || 'Admin123$'
  return `http://${user}:${encodeURIComponent(pass)}@${host}:${port}`
}

module.exports = {
  COUCHDB_URL: couchUrl(),
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
  PORT: Number(process.env.PORT || 3001),
  // In containers this is set to /app/frontend; locally it falls back to the
  // sibling frontend/ directory that `vite build` populates.
  STATIC_DIR: process.env.STATIC_DIR || path.join(__dirname, '..', 'frontend'),
}
