import { useState, useEffect } from 'react'
import { api } from '../api'
import WeekTracker from '../components/WeekTracker'
import WeeklyGuide from '../components/WeeklyGuide'

function getCurrentWeek(dueDate) {
  const due = new Date(dueDate + 'T00:00:00')
  const conception = new Date(due)
  conception.setDate(conception.getDate() - 280)
  const days = Math.floor((new Date() - conception) / 86400000)
  return Math.min(Math.max(Math.floor(days / 7) + 1, 1), 40)
}

export default function HomePage({ onNavigate }) {
  const [dueDate, setDueDate] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSettings().then(s => { setDueDate(s.dueDate || null); setLoading(false) })
  }, [])

  const saveDueDate = async (e) => {
    e.preventDefault()
    if (!input) return
    await api.saveSettings({ dueDate: input })
    setDueDate(input)
  }

  const clearDueDate = async () => {
    await api.saveSettings({ dueDate: '' })
    setDueDate(null)
    setInput('')
  }

  if (loading) return null

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 lg:px-8 text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-heading text-ink mb-3">Pregnancy Guardian</h1>
        <p className="text-ink/50 max-w-md mb-6">Your little one is on the way — let's make every moment count together.</p>

        {/* Week tracker or due date prompt */}
        {!dueDate && (
          <div className="mb-8 w-full max-w-sm">
            <p className="text-ink/60 mb-4">When is your baby due?</p>
            <form onSubmit={saveDueDate} className="flex gap-2">
              <input type="date" value={input} onChange={e => setInput(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-primary transition-colors duration-150" required />
              <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-light cursor-pointer transition-colors duration-150 active:scale-95">Set</button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl">
          {[
            { id: 'calendar', label: 'Calendar', desc: 'Track appointments & daily notes', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/> },
            { id: 'gallery', label: 'Gallery', desc: 'Save ultrasounds & bump photos', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"/> },
            { id: 'documents', label: 'Documents', desc: 'Store reports & prescriptions', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/> },
            { id: 'assistant', label: 'Assistant', desc: 'Ask anything about pregnancy', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/> },
          ].map(item => (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl hover:bg-primary/5 cursor-pointer transition-colors duration-200 active:scale-95 group">
              <div className="w-12 h-12 rounded-xl bg-secondary/60 group-hover:bg-secondary flex items-center justify-center transition-colors duration-200">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">{item.icon}</svg>
              </div>
              <div>
                <p className="font-semibold font-heading text-ink">{item.label}</p>
                <p className="text-xs text-ink/50 mt-0.5">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {dueDate && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <WeekTracker dueDate={dueDate} />
            <WeeklyGuide week={getCurrentWeek(dueDate)} />
            <button onClick={clearDueDate} className="mt-2 text-xs text-ink/30 hover:text-ink/50 cursor-pointer transition-colors duration-150">Change due date</button>
          </div>
        )}
      </div>

      <footer className="text-center text-xs text-ink/30 py-4 space-y-2">
        <a href="/api/backup" download className="inline-flex items-center gap-1 text-ink/40 hover:text-primary cursor-pointer transition-colors duration-150">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
          Backup my data
        </a>
        <p>Made with love for growing families</p>
      </footer>
    </div>
  )
}
