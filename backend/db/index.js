// Single CouchDB connection + database handles, shared by server.js, seed.js
// and the query helpers. `nano.use()` only builds a handle (no network call),
// so requiring this before the databases exist is safe.
const config = require('../config')
const nano = require('nano')(config.COUCHDB_URL)

module.exports = {
  nano,
  incidentsDb: nano.use('incidents'),
  teamsDb: nano.use('teams'),
}
