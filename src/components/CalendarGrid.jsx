import { useRef } from 'react'
import DayCell from './DayCell'
import DietSection from './DietSection'
import MonitorSection from './MonitorSection'
import ExerciseSection from './ExerciseSection'
import TodoSection from './TodoSection'
import WeeklyArticle from './WeeklyArticle'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getWeekDates(baseDate) {
  const d = new Date(baseDate)
  const day = d.getDay()
  const sun = new Date(d)
  sun.setDate(d.getDate() - day)
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(sun)
    date.setDate(sun.getDate() + i)
    return date
  })
}

export default function CalendarGrid({ weekStart, data, activeKey, onDayClick, onClose, getDayData, updateDay, week }) {
  const today = new Date()
  const todayKey = dayKey(today)
  const dates = getWeekDates(weekStart)
  const lastKeyRef = useRef(activeKey)
  if (activeKey) lastKeyRef.current = activeKey
  const displayKey = activeKey || lastKeyRef.current
  const dayData = getDayData(displayKey || '')
  const version = displayKey + JSON.stringify(dayData)

  return (
    <>
      <div className="grid grid-cols-7 text-center text-sm font-medium text-ink/60 mb-1">
        {DAYS.map(d => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {dates.map(date => {
          const key = dayKey(date)
          const dd = data[key] || { todos: [], diet: {}, monitor: {}, exercises: [] }
          const isToday = key === todayKey
          const isActive = key === activeKey
          const hasDiet = Object.values(dd.diet || {}).some(m => m?.name)
          const hasMonitor = Object.keys(dd.monitor || {}).length > 0
          const hasExercises = (dd.exercises || []).length > 0
          const hasContent = dd.todos.length > 0 || hasDiet || hasMonitor || hasExercises

          return (
            <DayCell
              key={key}
              day={date.getDate()}
              isToday={isToday}
              isActive={isActive}
              hasContent={hasContent}
              onClick={() => onDayClick(date.getDate(), key)}
            />
          )
        })}
      </div>

      <div className={`mt-3 grid transition-all duration-1000 ease-in-out ${activeKey ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold font-heading text-ink">
                {displayKey ? new Date(displayKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : ''}
              </h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-150" aria-label="Close">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            {displayKey && (
              <div key={version} className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DietSection diet={dayData.diet || {}} date={displayKey} updateDay={(updater) => updateDay(displayKey, updater)} />
                <MonitorSection monitor={dayData.monitor || {}} date={displayKey} updateDay={(updater) => updateDay(displayKey, updater)} />
                <ExerciseSection exercises={dayData.exercises || []} date={displayKey} updateDay={(updater) => updateDay(displayKey, updater)} />
                <TodoSection todos={dayData.todos || []} date={displayKey} updateDay={(updater) => updateDay(displayKey, updater)} />
              </div>
            )}
          </div>
        </div>
      </div>

      {week && (
        <div className={`transition-all duration-1000 ease-in-out ${activeKey ? 'opacity-0 max-h-0 overflow-hidden' : 'opacity-100 max-h-[2000px]'}`}>
          <WeeklyArticle week={week} />
        </div>
      )}
    </>
  )
}
