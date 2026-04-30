import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

const EMPTY = { todos: [], diet: {}, monitor: {}, exercises: [] }

export function useCalendarData() {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getCalendar().then(d => { setData(d); setLoading(false) }) }, [])

  const getDayData = useCallback((key) => data[key] || EMPTY, [data])

  const refreshDay = useCallback(async (key) => {
    if (!key) return
    const fresh = await api.getDay(key)
    setData(prev => ({ ...prev, [key]: fresh }))
  }, [])

  return { data, loading, getDayData, refreshDay }
}
