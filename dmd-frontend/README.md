# Frontend — Disaster Response Command Center (React + Vite)

A dense, JHU-style real-time command console. Talks to the existing
Express/CouchDB/Redis backend via relative /api/* and /socket.io.

## Run in development (live reload)
Dev server proxies /api and /socket.io to your backend on :3001 — run backend first.

    # terminal 1 — backend
    node server.js
    # terminal 2 — frontend dev server
    cd frontend-src && npm install && npm run dev   # http://localhost:5173
    # terminal 3 — optional: drive live updates
    node simulate.js

## Build for production
    cd frontend-src && npm install && npm run build   # outputs to ../frontend
Your existing server.js serves ../frontend at http://localhost:3001. No frontend server in prod.

## Backend contract (unchanged)
- GET /api/incidents, /api/teams, /api/stats
- Socket.IO 'disaster:update' with type INCIDENT_UPDATED | TEAM_UPDATED
All URLs are relative, so the same build works locally and in Docker.

## Structure
    src/api.js                fetch helpers (relative URLs)
    src/hooks/useSocket.js    Socket.IO connection + state
    src/components/IncidentMap.jsx   react-leaflet, proportional severity markers
    src/components/StatTile.jsx      animated count-up stat
    src/components/Charts.jsx        Recharts trend + distribution
    src/components/Modal.jsx         expand overlay
    src/App.jsx               dense console layout + live wiring
    src/index.css             deep-space design system (dark + light)

## Notes
- Map tiles load from CartoDB CDN (needs internet first load; markers still render if blocked).
- Theme toggle top-right re-themes map + charts.
- Each panel has Expand -> full-detail modal.
