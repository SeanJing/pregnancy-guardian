import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../api'

const METRICS = [
  { key: 'weight', label: 'Weight (kg)', color: '#F472B6' },
  { key: 'bloodPressure', label: 'Blood Pressure', color: '#0D9488' },
  { key: 'heartRate', label: 'Heart Rate (bpm)', color: '#F97316' },
  { key: 'bloodSugar', label: 'Blood Sugar (mmol/L)', color: '#8B5CF6' },
  { key: 'kickCounts', label: 'Kick Counts', color: '#22C55E' },
  { key: 'mood', label: 'Mood (1-5)', color: '#EAB308' },
]

export default function TrendsPage() {
  const [metric, setMetric] = useState('weight')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.getTrends(metric, '2000-01-01', '2099-12-31').then(rows => {
      setData(rows.map(r => ({ date: r.date, value: parseFloat(r.value) || 0 })))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [metric])

  const current = METRICS.find(m => m.key === metric)

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur px-4 md:px-6 lg:px-8 py-4">
        <h2 className="text-xl font-bold text-ink font-heading mb-3">Trends</h2>
        <div className="flex gap-2 flex-wrap">
          {METRICS.map(m => (
            <button key={m.key} onClick={() => setMetric(m.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-colors duration-150 ${metric === m.key ? 'text-white' : 'bg-white text-ink/60 hover:bg-primary/10'}`}
              style={metric === m.key ? { backgroundColor: m.color } : {}}>
              {m.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 px-4 md:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-ink/40">Loading...</div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-ink/40">
            <p className="text-sm">No {current.label.toLowerCase()} data recorded yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mt-2">
            <p className="text-sm font-medium text-ink/70 mb-4">{current.label} over time ({data.length} entries)</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke={current.color} strokeWidth={2} dot={{ r: 3 }} name={current.label} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
