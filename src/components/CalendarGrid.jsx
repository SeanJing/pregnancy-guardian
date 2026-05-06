import DayCell from './DayCell'

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

export default function CalendarGrid({ weekStart, data, onDayClick }) {
  const today = new Date()
  const todayKey = dayKey(today)
  const dates = getWeekDates(weekStart)

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
          const hasDiet = Object.values(dd.diet || {}).some(m => m?.name)
          const hasMonitor = Object.keys(dd.monitor || {}).length > 0
          const hasExercises = (dd.exercises || []).length > 0
          const hasContent = dd.todos.length > 0 || hasDiet || hasMonitor || hasExercises

          return (
            <DayCell
              key={key}
              day={date.getDate()}
              isToday={isToday}
              hasContent={hasContent}
              contentFlags={{ todos: dd.todos.length > 0, diet: hasDiet, monitor: hasMonitor, exercises: hasExercises }}
              onClick={() => onDayClick(date.getDate(), key)}
            />
          )
        })}
      </div>
    </>
  )
}
