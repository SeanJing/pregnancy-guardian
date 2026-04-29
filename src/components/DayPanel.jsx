import DietSection from './DietSection'
import MonitorSection from './MonitorSection'
import ExerciseSection from './ExerciseSection'
import TodoSection from './TodoSection'

export default function DayPanel({ dateKey, title, dayData, onUpdate, onClose }) {
  if (!dateKey) return null

  return (
    <aside className="w-[40rem] shrink-0 border-l border-gray-200 bg-white overflow-y-auto transition-all duration-500 ease-in-out">
      <div className="sticky top-0 bg-white z-10 px-5 py-4 flex items-center justify-between border-b border-gray-200">
        <h2 className="text-lg font-semibold font-heading">{title}</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-150 active:scale-95" aria-label="Close">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div className="p-5 space-y-6">
        <DietSection diet={dayData.diet || {}} onUpdate={diet => onUpdate(d => ({ ...d, diet }))} />
        <MonitorSection monitor={dayData.monitor || {}} onUpdate={monitor => onUpdate(d => ({ ...d, monitor }))} />
        <ExerciseSection exercises={dayData.exercises || {}} onUpdate={exercises => onUpdate(d => ({ ...d, exercises }))} />
        <TodoSection todos={dayData.todos} onUpdate={todos => onUpdate(d => ({ ...d, todos }))} />
      </div>
    </aside>
  )
}
