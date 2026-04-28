import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

export function useCalendarData() {
  const [data, setData] = useState({})

  useEffect(() => { api.getCalendar().then(setData) }, [])

  const getDayData = useCallback((key) => data[key] || { todos: [], pics: [], note: '' }, [data])

  const setDayData = useCallback((key, updater) => {
    setData(prev => {
      const current = prev[key] || { todos: [], pics: [], note: '' }
      const next = typeof updater === 'function' ? updater(current) : updater
      api.saveDay(key, next)
      return { ...prev, [key]: next }
    })
  }, [])

  return { data, getDayData, setDayData }
}
