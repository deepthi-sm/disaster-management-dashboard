import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

// Single shared socket. In dev, Vite proxies /socket.io to :3001.
export function useSocket(onEvent) {
  const [connected, setConnected] = useState(false)
  const cbRef = useRef(onEvent)
  cbRef.current = onEvent

  useEffect(() => {
    const socket = io({ path: '/socket.io' })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('disaster:update', (e) => cbRef.current && cbRef.current(e))

    return () => socket.disconnect()
  }, [])

  return { connected }
}

// Small helper to centralize polling alongside the socket.
export function usePoll(fn, ms) {
  const fnRef = useRef(fn)
  fnRef.current = fn
  const start = useCallback(() => {
    fnRef.current()
    const id = setInterval(() => fnRef.current(), ms)
    return () => clearInterval(id)
  }, [ms])
  useEffect(() => start(), [start])
}
