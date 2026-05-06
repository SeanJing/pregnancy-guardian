import { useState, useEffect } from 'react'
import CalendarGrid from '../components/CalendarGrid'
import DayPanel from '../components/DayPanel'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { useCalendarData } from '../useCalendarData'
import { api } from '../api'

const TRIMESTER_COLORS = {
  1: 'bg-pink-50 border-pink-200',
  2: 'bg-amber-50 border-amber-200',
  3: 'bg-purple-50 border-purple-200',
}

function getTrimester(dueDate, year, month) {
  if (!dueDate) return null
  const due = new Date(dueDate + 'T00:00:00')
  const conception = new Date(due)
  conception.setDate(conception.getDate() - 280)
  const midMonth = new Date(year, month, 15)
  const daysPregnant = Math.floor((midMonth - conception) / 86400000)
  const week = Math.floor(daysPregnant / 7) + 1
  if (week < 1 || week > 40) return null
  if (week <= 13) return 1
  if (week <= 27) return 2
  return 3
}

function getWeekForDate(dueDate, dateStr) {
  if (!dueDate || !dateStr) return null
  const due = new Date(dueDate + 'T00:00:00')
  const conception = new Date(due)
  conception.setDate(conception.getDate() - 280)
  const d = new Date(dateStr + 'T00:00:00')
  const days = Math.floor((d - conception) / 86400000)
  const week = Math.floor(days / 7) + 1
  return week >= 1 && week <= 40 ? week : null
}

export default function CalendarPage() {
  const now = new Date()
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(now)
    d.setDate(d.getDate() - d.getDay())
    return d
  })
  const [activeKey, setActiveKey] = useState(null)
  const [dueDate, setDueDate] = useState(null)

  useEffect(() => { api.getSettings().then(s => setDueDate(s.dueDate || null)) }, [])
  const [activeTitle, setActiveTitle] = useState('')
  const { data, loading, error, getDayData, retry } = useCalendarData(weekStart)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const label = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const changeWeek = (dir) => {
    setWeekStart(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + dir * 7)
      return d
    })
  }

  const goToday = () => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay())
    setWeekStart(d)
  }

  const openDay = (day, key) => {
    setActiveKey(key)
    const d = new Date(key + 'T00:00:00')
    setActiveTitle(d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }))
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur px-4 md:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink font-heading">Calendar</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => changeWeek(-1)} className="p-2 rounded-lg hover:bg-primary/10 cursor-pointer transition-colors duration-150 active:scale-95" aria-label="Previous week">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
            </button>
            <button onClick={goToday} className="text-base font-semibold px-3 py-1 rounded-lg hover:bg-primary/10 cursor-pointer transition-colors duration-150 active:scale-95">{label}</button>
            <button onClick={() => changeWeek(1)} className="p-2 rounded-lg hover:bg-primary/10 cursor-pointer transition-colors duration-150 active:scale-95" aria-label="Next week">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
            </button>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 min-w-0 px-4 md:px-6 lg:px-8 pb-8 overflow-y-auto transition-all duration-1000 ease-in-out rounded-xl m-2 border ${TRIMESTER_COLORS[getTrimester(dueDate, weekStart.getFullYear(), weekStart.getMonth())] || 'bg-surface border-transparent'}`}>
          {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} onRetry={retry} /> : <CalendarGrid weekStart={weekStart} data={data} onDayClick={openDay} />}
        </div>
        <DayPanel isOpen={!!activeKey} dateKey={activeKey || ''} title={activeTitle} dayData={getDayData(activeKey || '')} onRefresh={retry} onClose={() => setActiveKey(null)} week={getWeekForDate(dueDate, activeKey)} />
      </div>
    </div>
  )
}
