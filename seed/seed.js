const nano = require('nano')('http://admin:Admin123$@localhost:5984')

const teams = [
  {
    _id: 'TEAM-01',
    type: 'team',
    name: 'Alpha Flood Response',
    specialization: 'flood',
    status: 'deployed',
    location: { lat: 13.0827, lon: 80.2707, area: 'Anna Nagar' },
    current_assignment: 'DR-001',
    capacity: 12,
    members: 10,
    equipment: ['boat', 'life-jackets', 'pumps', 'radio'],
    contact: '+91-9000000001'
  },
  {
    _id: 'TEAM-02',
    type: 'team',
    name: 'Bravo Search & Rescue',
    specialization: 'search-rescue',
    status: 'deployed',
    location: { lat: 13.0900, lon: 80.2785, area: 'T Nagar' },
    current_assignment: 'DR-002',
    capacity: 10,
    members: 8,
    equipment: ['sniffer-dogs', 'thermal-camera', 'stretcher', 'radio'],
    contact: '+91-9000000002'
  },
  {
    _id: 'TEAM-03',
    type: 'team',
    name: 'Charlie Medical Unit',
    specialization: 'medical',
    status: 'deployed',
    location: { lat: 13.0750, lon: 80.2600, area: 'Guindy' },
    current_assignment: 'DR-003',
    capacity: 8,
    members: 7,
    equipment: ['defibrillator', 'medical-kit', 'oxygen', 'ambulance'],
    contact: '+91-9000000003'
  },
  {
    _id: 'TEAM-04',
    type: 'team',
    name: 'Delta Fire Brigade',
    specialization: 'fire',
    status: 'available',
    location: { lat: 13.0820, lon: 80.2550, area: 'Ashok Nagar' },
    current_assignment: null,
    capacity: 15,
    members: 12,
    equipment: ['fire-truck', 'hose', 'foam', 'breathing-apparatus'],
    contact: '+91-9000000004'
  },
  {
    _id: 'TEAM-05',
    type: 'team',
    name: 'Echo Hazmat Squad',
    specialization: 'hazmat',
    status: 'available',
    location: { lat: 13.0950, lon: 80.2900, area: 'Manali' },
    current_assignment: null,
    capacity: 6,
    members: 6,
    equipment: ['hazmat-suits', 'chemical-detector', 'containment-kit'],
    contact: '+91-9000000005'
  },
  {
    _id: 'TEAM-06',
    type: 'team',
    name: 'Foxtrot Engineering Corps',
    specialization: 'engineering',
    status: 'returning',
    location: { lat: 13.1000, lon: 80.2650, area: 'Ambattur' },
    current_assignment: null,
    capacity: 10,
    members: 9,
    equipment: ['crane', 'excavator', 'cutting-tools', 'generator'],
    contact: '+91-9000000006'
  },
  {
    _id: 'TEAM-07',
    type: 'team',
    name: 'Golf Cyclone Response',
    specialization: 'search-rescue',
    status: 'available',
    location: { lat: 13.0700, lon: 80.2480, area: 'Marina Beach' },
    current_assignment: null,
    capacity: 14,
    members: 11,
    equipment: ['helicopter', 'rope-kit', 'emergency-rations', 'radio'],
    contact: '+91-9000000007'
  },
  {
    _id: 'TEAM-08',
    type: 'team',
    name: 'Hotel Landslide Unit',
    specialization: 'engineering',
    status: 'deployed',
    location: { lat: 13.1100, lon: 80.3100, area: 'Sholinganallur' },
    current_assignment: 'DR-005',
    capacity: 8,
    members: 8,
    equipment: ['excavator', 'sniffer-dogs', 'medical-kit', 'radio'],
    contact: '+91-9000000008'
  }
]

const incidents = [
  {
    _id: 'DR-001',
    type: 'incident',
    disaster_type: 'flood',
    severity: 'critical',
    location: { lat: 13.0827, lon: 80.2707, address: 'Anna Nagar, Chennai', region: 'north' },
    description: 'Severe flooding in residential area, 200+ families trapped',
    status: 'in-progress',
    assigned_teams: ['TEAM-01'],
    casualties_total: 45,
    casualties_rescued: 20,
    reported_by: 'Civil Defense HQ',
    timestamp: new Date().toISOString()
  },
  {
    _id: 'DR-002',
    type: 'incident',
    disaster_type: 'collapse',
    severity: 'critical',
    location: { lat: 13.0900, lon: 80.2785, address: 'T Nagar, Chennai', region: 'central' },
    description: 'Partial building collapse, multiple people trapped under debris',
    status: 'in-progress',
    assigned_teams: ['TEAM-02'],
    casualties_total: 12,
    casualties_rescued: 5,
    reported_by: 'Local Police',
    timestamp: new Date().toISOString()
  },
  {
    _id: 'DR-003',
    type: 'incident',
    disaster_type: 'fire',
    severity: 'high',
    location: { lat: 13.0750, lon: 80.2600, address: 'Guindy Industrial Area, Chennai', region: 'south' },
    description: 'Industrial warehouse fire spreading to adjacent buildings',
    status: 'in-progress',
    assigned_teams: ['TEAM-03', 'TEAM-04'],
    casualties_total: 8,
    casualties_rescued: 8,
    reported_by: 'Fire Station 4',
    timestamp: new Date().toISOString()
  },
  {
    _id: 'DR-004',
    type: 'incident',
    disaster_type: 'cyclone',
    severity: 'high',
    location: { lat: 13.0950, lon: 80.2900, address: 'Marina Beach Area, Chennai', region: 'east' },
    description: 'Cyclone warning, coastal evacuation required for 500+ residents',
    status: 'active',
    assigned_teams: [],
    casualties_total: 0,
    casualties_rescued: 0,
    reported_by: 'Meteorological Dept',
    timestamp: new Date().toISOString()
  },
  {
    _id: 'DR-005',
    type: 'incident',
    disaster_type: 'landslide',
    severity: 'high',
    location: { lat: 13.1100, lon: 80.3100, address: 'Sholinganallur Hills, Chennai', region: 'south-east' },
    description: 'Landslide blocking main highway, vehicles and people stranded',
    status: 'in-progress',
    assigned_teams: ['TEAM-08'],
    casualties_total: 6,
    casualties_rescued: 2,
    reported_by: 'Highway Authority',
    timestamp: new Date().toISOString()
  },
  {
    _id: 'DR-006',
    type: 'incident',
    disaster_type: 'chemical',
    severity: 'medium',
    location: { lat: 13.0700, lon: 80.2480, address: 'Manali Industrial Zone, Chennai', region: 'north' },
    description: 'Chemical leak at refinery, toxic fumes spreading to nearby area',
    status: 'active',
    assigned_teams: [],
    casualties_total: 3,
    casualties_rescued: 0,
    reported_by: 'Factory Safety Officer',
    timestamp: new Date().toISOString()
  },
  {
    _id: 'DR-007',
    type: 'incident',
    disaster_type: 'earthquake',
    severity: 'medium',
    location: { lat: 13.0650, lon: 80.2650, address: 'Tambaram, Chennai', region: 'west' },
    description: 'Magnitude 4.2 earthquake, structural damage to old buildings',
    status: 'active',
    assigned_teams: [],
    casualties_total: 2,
    casualties_rescued: 0,
    reported_by: 'Seismological Center',
    timestamp: new Date().toISOString()
  },
  {
    _id: 'DR-008',
    type: 'incident',
    disaster_type: 'flood',
    severity: 'low',
    location: { lat: 13.0550, lon: 80.2550, address: 'Velachery, Chennai', region: 'south' },
    description: 'Waterlogging in low-lying areas, roads blocked',
    status: 'resolved',
    assigned_teams: ['TEAM-06'],
    casualties_total: 0,
    casualties_rescued: 0,
    reported_by: 'Municipal Corporation',
    timestamp: new Date().toISOString()
  }
]

async function seed() {
  try {
    for (const dbName of ['incidents', 'teams']) {
      try { await nano.db.destroy(dbName) } catch (e) {}
      await nano.db.create(dbName)
      console.log(`Created database: ${dbName}`)
    }

    const incidentsDb = nano.use('incidents')
    const teamsDb = nano.use('teams')

    await teamsDb.bulk({ docs: teams })
    console.log('8 teams inserted!')

    await incidentsDb.bulk({ docs: incidents })
    console.log('8 incidents inserted!')

    console.log('CouchDB seeded successfully!')
  } catch (err) {
    console.error('Seeding error:', err.message)
  }
}

seed()