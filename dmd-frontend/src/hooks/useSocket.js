import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

// Single shared socket. In dev, Vite proxies /socket.io to :3001.
// onEvent  — fired for each live 'disaster:update'.
// onReplay — fired once on connect with the recent event history from the
//            durable Redis stream, so the dashboard isn't empty on load.
export function useSocket(onEvent, onReplay) {
  const [connected, setConnected] = useState(false)
  const evRef = useRef(onEvent)
  const rpRef = useRef(onReplay)
  // Keep the latest callbacks without re-subscribing (updated after render).
  useEffect(() => { evRef.current = onEvent; rpRef.current = onReplay })

  useEffect(() => {
    const socket = io({ path: '/socket.io' })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('disaster:update', (e) => evRef.current && evRef.current(e))
    socket.on('disaster:replay', (arr) => rpRef.current && rpRef.current(arr))

    return () => socket.disconnect()
  }, [])

  return { connected }
}
