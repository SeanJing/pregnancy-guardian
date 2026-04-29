import DayCell from './DayCell'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function dayKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function CalendarGrid({ year, month, data, onDayClick }) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  return (
    <>
      <div className="grid grid-cols-7 text-center text-sm font-medium text-ink/60 mb-1">
        {DAYS.map(d => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} className="p-2" />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1
          const key = dayKey(year, month, d)
          const dd = data[key] || { todos: [], pics: [], note: '', diet: {}, monitor: {}, exercises: {} }
          const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const hasDiet = Object.values(dd.diet || {}).some(m => m?.name)
          const hasMonitor = Object.values(dd.monitor || {}).some(v => v)
          const hasExercises = Object.values(dd.exercises || {}).some(v => v)
          const hasContent = dd.todos.length > 0 || hasDiet || hasMonitor || hasExercises

          return (
            <DayCell
              key={d}
              day={d}
              isToday={isToday}
              hasContent={hasContent}
              contentFlags={{ todos: dd.todos.length > 0, diet: hasDiet, monitor: hasMonitor, exercises: hasExercises }}
              onClick={() => onDayClick(d, key)}
            />
          )
        })}
      </div>
    </>
  )
}
