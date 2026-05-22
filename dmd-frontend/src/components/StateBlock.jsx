// Shared loading / error / empty placeholder for panel bodies.
export default function StateBlock({ state, message, onRetry }) {
  if (state === 'loading') {
    return (
      <div className="state-block">
        <span className="spinner" />
        <span>{message || 'Loading…'}</span>
      </div>
    )
  }
  if (state === 'error') {
    return (
      <div className="state-block error">
        <span className="state-icon">&#9888;</span>
        <span>{message || 'Could not reach the command center.'}</span>
        {onRetry && <button className="btn" onClick={onRetry}>Retry</button>}
      </div>
    )
  }
  return (
    <div className="state-block">
      <span className="state-icon muted">&#9711;</span>
      <span>{message || 'Nothing to show.'}</span>
    </div>
  )
}
