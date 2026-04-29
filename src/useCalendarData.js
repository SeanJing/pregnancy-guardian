import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

const EMPTY = { todos: [], pics: [], note: '', diet: {}, monitor: {}, exercises: {} }

export function useCalendarData() {
  const [data, setData] = useState({})

  useEffect(() => { api.getCalendar().then(setData) }, [])

  const getDayData = useCallback((key) => data[key] || EMPTY, [data])

  const refreshDay = useCallback(async (key) => {
    if (!key) return
    const fresh = await api.getDay(key)
    setData(prev => ({ ...prev, [key]: fresh }))
  }, [])

  const setDayData = useCallback((key, updater) => {
    setData(prev => {
      const current = prev[key] || EMPTY
      const next = typeof updater === 'function' ? updater(current) : updater
      api.saveDay(key, next)
      return { ...prev, [key]: next }
    })
  }, [])

  return { data, getDayData, setDayData, refreshDay }
}
