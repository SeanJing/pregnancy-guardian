import { useState, useRef, useCallback } from 'react'
import { api } from '../api'

const METRICS = [
  { key: 'weight', label: 'Weight (kg)', placeholder: 'e.g. 62.5' },
  { key: 'bloodPressure', label: 'Blood Pressure', placeholder: 'e.g. 120/80' },
  { key: 'heartRate', label: 'Heart Rate (bpm)', placeholder: 'e.g. 75' },
  { key: 'bloodSugar', label: 'Blood Sugar (mmol/L)', placeholder: 'e.g. 5.2' },
]

export default function MonitorSection({ monitor, date, onRefresh }) {
  const [local, setLocal] = useState(
    Object.fromEntries(METRICS.map(m => [m.key, monitor[m.key]?.value || '']))
  )
  const timers = useRef({})

  // Sync when props change
  const prevMonitor = useRef(monitor)
  if (monitor !== prevMonitor.current) {
    prevMonitor.current = monitor
    setLocal(Object.fromEntries(METRICS.map(m => [m.key, monitor[m.key]?.value || ''])))
  }

  const update = useCallback((metric, value) => {
    setLocal(prev => ({ ...prev, [metric]: value }))
    clearTimeout(timers.current[metric])
    timers.current[metric] = setTimeout(() => {
      if (value) api.saveMonitor(date, metric, value).then(onRefresh)
    }, 500)
  }, [date, onRefresh])

  return (
    <section>
      <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
        Monitor
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {METRICS.map(m => (
          <div key={m.key}>
            <label className="text-xs text-ink/50 mb-0.5 block">{m.label}</label>
            <input
              value={local[m.key]}
              onChange={e => update(m.key, e.target.value)}
              placeholder={m.placeholder}
              className="w-full px-2.5 py-1.5 text-sm rounded-md border border-gray-200 focus:outline-none focus:border-primary transition-colors duration-150"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
