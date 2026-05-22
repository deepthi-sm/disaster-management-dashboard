// Search + severity/status filter chips for the incidents panel.
const SEVERITIES = ['critical', 'high', 'medium', 'low']
const STATUSES = ['active', 'in-progress', 'resolved']

export default function Toolbar({ query, onQuery, sev, onSev, status, onStatus }) {
  return (
    <div className="toolbar">
      <div className="search">
        <span className="search-ico">&#9906;</span>
        <input
          className="input"
          placeholder="Search id, type, location…"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
        {query && (
          <button className="clear" onClick={() => onQuery('')} aria-label="Clear search">&times;</button>
        )}
      </div>
      <div className="chips">
        <Chip active={!sev} onClick={() => onSev(null)}>All sev</Chip>
        {SEVERITIES.map((s) => (
          <Chip key={s} active={sev === s} kind={s} onClick={() => onSev(sev === s ? null : s)}>{s}</Chip>
        ))}
      </div>
      <div className="chips">
        <Chip active={!status} onClick={() => onStatus(null)}>All status</Chip>
        {STATUSES.map((s) => (
          <Chip key={s} active={status === s} onClick={() => onStatus(status === s ? null : s)}>{s}</Chip>
        ))}
      </div>
    </div>
  )
}

function Chip({ active, kind, onClick, children }) {
  return (
    <button className={`chip ${active ? 'active' : ''} ${kind || ''}`} onClick={onClick}>
      {children}
    </button>
  )
}
