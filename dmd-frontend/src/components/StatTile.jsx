import { useEffect, useRef, useState } from 'react'

export default function StatTile({ kind, label, value }) {
  const [display, setDisplay] = useState(value)
  const [bump, setBump] = useState(false)
  const prev = useRef(value)

  useEffect(() => {
    if (value === prev.current) return
    const from = prev.current
    prev.current = value
    setBump(true)
    const t = setTimeout(() => setBump(false), 520)
    const steps = 14
    let i = 0
    const tick = () => {
      i++
      setDisplay(Math.round(from + (value - from) * (i / steps)))
      if (i < steps) requestAnimationFrame(tick)
      else setDisplay(value)
    }
    requestAnimationFrame(tick)
    return () => clearTimeout(t)
  }, [value])

  return (
    <div className={`stat ${kind}`}>
      <div className="label">{label}</div>
      <div className={`value ${bump ? 'bump' : ''}`}>{display}</div>
    </div>
  )
}
