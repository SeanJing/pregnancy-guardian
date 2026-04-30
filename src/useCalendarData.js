import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

const EMPTY = { todos: [], diet: {}, monitor: {}, exercises: [] }

export function useCalendarData() {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true); setError(null)
    api.getCalendar().then(d => { setData(d); setLoading(false) }).catch(e => { setError(e.message); setLoading(false) })
  }, [])

  useEffect(load, [load])

  const getDayData = useCallback((key) => data[key] || EMPTY, [data])

  const refreshDay = useCallback(async (key) => {
    if (!key) return
    const fresh = await api.getDay(key)
    setData(prev => ({ ...prev, [key]: fresh }))
  }, [])

  return { data, loading, error, getDayData, refreshDay, retry: load }
}
