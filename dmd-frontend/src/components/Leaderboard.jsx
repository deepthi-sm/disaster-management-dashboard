// Top rescuing teams, ranked from the Redis sorted set. Resolves team ids to
// names using the live teams list.
export default function Leaderboard({ entries, teams }) {
  const nameFor = (id) => teams.find((t) => t._id === id)?.name || id
  const max = entries.reduce((m, e) => Math.max(m, e.rescued), 0) || 1

  if (!entries.length) {
    return <div className="lb-empty">No rescues recorded yet — apply an update or start the simulator.</div>
  }

  return (
    <div className="lb">
      {entries.map((e, i) => (
        <div className="lb-row" key={e.team_id}>
          <span className={`lb-rank r${i + 1}`}>{i + 1}</span>
          <div className="lb-main">
            <div className="lb-name">{nameFor(e.team_id)}</div>
            <div className="lb-bar"><span style={{ width: `${(e.rescued / max) * 100}%` }} /></div>
          </div>
          <span className="lb-count mono">{e.rescued}</span>
        </div>
      ))}
    </div>
  )
}
