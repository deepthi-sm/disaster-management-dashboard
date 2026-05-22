import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'

const CHENNAI = [13.0827, 80.2707]
const TILE = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
}

const SEV = {
  critical: { color: '#ff3b5c', size: 30 },
  high: { color: '#ff8c2a', size: 24 },
  medium: { color: '#ffc83d', size: 18 },
  low: { color: '#36d399', size: 14 },
}

function incidentIcon(sev, pulsing) {
  const { color, size } = SEV[sev] || SEV.low
  const ring = pulsing
    ? `<div class="pulse-ring" style="background:${color}"></div>`
    : ''
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="position:relative;width:${size}px;height:${size}px">${ring}
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};
      opacity:.85;border:2px solid rgba(255,255,255,.25);box-shadow:0 0 14px ${color}"></div></div>`,
  })
}

function teamIcon(status) {
  const c = { available: '#36d399', deployed: '#ff8c2a', returning: '#4d9fff', 'off-duty': '#5b6e92' }[status] || '#4d9fff'
  return L.divIcon({
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    html: `<div style="width:11px;height:11px;background:${c};transform:rotate(45deg);
      border:2px solid rgba(255,255,255,.3);box-shadow:0 0 10px ${c}"></div>`,
  })
}

function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lon], 14, { duration: 0.8 })
  }, [target, map])
  return null
}

export default function IncidentMap({ incidents, teams, theme, flyTarget }) {
  return (
    <MapContainer center={CHENNAI} zoom={12} zoomControl={true} attributionControl={false} className="map-host">
      <TileLayer url={theme === 'dark' ? TILE.dark : TILE.light} subdomains="abcd" maxZoom={19} />
      <FlyTo target={flyTarget} />
      {incidents.map((i) =>
        i.location?.lat != null ? (
          <Marker
            key={i._id}
            position={[i.location.lat, i.location.lon]}
            icon={incidentIcon(i.severity, i.status === 'active' || i.status === 'in-progress')}
          >
            <Popup>
              <div className="pop-title">{i._id} — <span style={{ textTransform: 'capitalize' }}>{i.disaster_type}</span></div>
              <div className="pop-row">{i.location.address}</div>
              <div className="pop-row">Severity: <b style={{ textTransform: 'capitalize' }}>{i.severity}</b> · Status: <b style={{ textTransform: 'capitalize' }}>{i.status}</b></div>
              <div className="pop-row">Rescued: <b>{i.casualties_rescued || 0}</b> / {i.casualties_total || 0}</div>
              <div className="pop-row">Teams: <b>{(i.assigned_teams || []).join(', ') || 'Unassigned'}</b></div>
            </Popup>
          </Marker>
        ) : null
      )}
      {teams.map((t) =>
        t.location?.lat != null ? (
          <Marker key={t._id} position={[t.location.lat, t.location.lon]} icon={teamIcon(t.status)}>
            <Popup>
              <div className="pop-title">{t.name}</div>
              <div className="pop-row">Status: <b style={{ textTransform: 'capitalize' }}>{t.status}</b></div>
              <div className="pop-row">Specialization: <b style={{ textTransform: 'capitalize' }}>{t.specialization}</b></div>
              <div className="pop-row">Assignment: <b>{t.current_assignment || 'None'}</b></div>
              <div className="pop-row">Crew: <b>{t.members}</b> / {t.capacity}</div>
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  )
}
