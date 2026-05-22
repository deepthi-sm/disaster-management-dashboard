// CouchDB schema: map-reduce design documents + Mango indexes.
// Aggregations (counts/sums) are served by views; ad-hoc filtered lists are
// served by Mango. Everything here is applied idempotently by seed.js.

// ── Map-reduce views ─────────────────────────────────────────────────────────
const incidentsDesign = {
  _id: '_design/incidents',
  views: {
    by_status: {
      map: "function(doc){ if(doc.type==='incident' && doc.status){ emit(doc.status,1) } }",
      reduce: '_count',
    },
    by_severity: {
      map: "function(doc){ if(doc.type==='incident' && doc.severity){ emit(doc.severity,1) } }",
      reduce: '_count',
    },
    by_region: {
      map: "function(doc){ if(doc.type==='incident' && doc.location && doc.location.region){ emit(doc.location.region,1) } }",
      reduce: '_count',
    },
    rescued_total: {
      map: "function(doc){ if(doc.type==='incident'){ emit(null, doc.casualties_rescued||0) } }",
      reduce: '_sum',
    },
  },
}

const teamsDesign = {
  _id: '_design/teams',
  views: {
    by_status: {
      map: "function(doc){ if(doc.type==='team' && doc.status){ emit(doc.status,1) } }",
      reduce: '_count',
    },
    by_specialization: {
      map: "function(doc){ if(doc.type==='team' && doc.specialization){ emit(doc.specialization,1) } }",
      reduce: '_count',
    },
  },
}

// ── Mango indexes ────────────────────────────────────────────────────────────
const incidentIndexes = [
  { index: { fields: ['status'] }, name: 'idx-status', ddoc: 'idx-status', type: 'json' },
  { index: { fields: ['severity'] }, name: 'idx-severity', ddoc: 'idx-severity', type: 'json' },
  { index: { fields: ['disaster_type'] }, name: 'idx-type', ddoc: 'idx-type', type: 'json' },
]
const teamIndexes = [
  { index: { fields: ['status'] }, name: 'idx-status', ddoc: 'idx-status', type: 'json' },
  { index: { fields: ['specialization'] }, name: 'idx-specialization', ddoc: 'idx-specialization', type: 'json' },
]

// Upsert a design doc, preserving _rev so re-runs don't 409.
async function upsertDesignDoc(db, ddoc) {
  try {
    const existing = await db.get(ddoc._id)
    await db.insert({ ...ddoc, _rev: existing._rev })
  } catch (e) {
    if (e.statusCode === 404) await db.insert(ddoc)
    else throw e
  }
}

// Idempotently apply all views + indexes. CouchDB's createIndex is itself
// idempotent (returns "exists" rather than erroring on a duplicate).
async function applySchema(incidentsDb, teamsDb) {
  await upsertDesignDoc(incidentsDb, incidentsDesign)
  await upsertDesignDoc(teamsDb, teamsDesign)
  for (const idx of incidentIndexes) await incidentsDb.createIndex(idx)
  for (const idx of teamIndexes) await teamsDb.createIndex(idx)
}

module.exports = {
  incidentsDesign,
  teamsDesign,
  incidentIndexes,
  teamIndexes,
  upsertDesignDoc,
  applySchema,
}
