import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

const EMPTY = { events: [], diet: {}, monitor: {}, exercises: [], diary: '' }

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useCalendarData(weekStart) {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const from = formatDate(weekStart)
  const to = (() => { const d = new Date(weekStart); d.setDate(d.getDate() + 6); return formatDate(d) })()

  const load = useCallback(() => {
    setLoading(true); setError(null)
    api.getCalendar(from, to).then(d => { setData(d); setLoading(false) }).catch(e => { setError(e.message); setLoading(false) })
  }, [from, to])

  useEffect(load, [load])

  const getDayData = useCallback((key) => data[key] || EMPTY, [data])

  // Update a specific day's data in the local cache
  const updateDay = useCallback((key, updater) => {
    setData(prev => {
      const current = prev[key] || EMPTY
      const next = typeof updater === 'function' ? updater(current) : updater
      return { ...prev, [key]: next }
    })
  }, [])

  return { data, loading, error, getDayData, retry: load, updateDay }
}
