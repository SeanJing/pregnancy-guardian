import { useState } from 'react'
import CalendarGrid from '../components/CalendarGrid'
import DayPanel from '../components/DayPanel'
import { useCalendarData } from '../useCalendarData'

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [activeKey, setActiveKey] = useState(null)
  const [activeTitle, setActiveTitle] = useState('')
  const { data, getDayData, setDayData } = useCalendarData()

  const label = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const changeMonth = (dir) => {
    let m = month + dir, y = year
    if (m > 11) { m = 0; y++ } else if (m < 0) { m = 11; y-- }
    setMonth(m); setYear(y)
  }

  const openDay = (day, key) => {
    setActiveKey(key)
    setActiveTitle(new Date(year, month, day).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }))
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur px-4 md:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink font-heading">Calendar</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-primary/10 cursor-pointer transition-colors duration-150 active:scale-95" aria-label="Previous month">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
            </button>
            <button onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()) }} className="text-base font-semibold px-3 py-1 rounded-lg hover:bg-primary/10 cursor-pointer transition-colors duration-150 active:scale-95">{label}</button>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-primary/10 cursor-pointer transition-colors duration-150 active:scale-95" aria-label="Next month">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
            </button>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 min-w-0 px-4 md:px-6 lg:px-8 pb-8 overflow-y-auto transition-all duration-700 ease-in-out ${activeKey ? 'pr-0' : ''}`}>
          <CalendarGrid year={year} month={month} data={data} onDayClick={openDay} />
        </div>
        {activeKey && (
          <DayPanel dateKey={activeKey} title={activeTitle} dayData={getDayData(activeKey)} onUpdate={(updater) => setDayData(activeKey, updater)} onClose={() => setActiveKey(null)} />
        )}
      </div>
    </div>
  )
}
