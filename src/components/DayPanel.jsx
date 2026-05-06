import DietSection from './DietSection'
import MonitorSection from './MonitorSection'
import ExerciseSection from './ExerciseSection'
import TodoSection from './TodoSection'

export default function DayPanel({ isOpen, dateKey, title, dayData, updateDay, onClose, week }) {
  // Use a version key so sections remount when data loads
  const version = dateKey + JSON.stringify(dayData)

  return (
    <aside className={`shrink-0 border-l border-gray-200 bg-white overflow-hidden transition-all duration-1000 ease-in-out ${isOpen ? 'w-[40rem]' : 'w-0 border-l-0'}`}>
      <div className="w-[40rem] h-full overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 px-5 py-4 flex items-center justify-between border-b border-gray-200">
          <h2 className="text-lg font-semibold font-heading">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-150 active:scale-95" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div key={version} className="p-5 space-y-6">
          <DietSection diet={dayData.diet || {}} date={dateKey} updateDay={updateDay} week={week} />
          <MonitorSection monitor={dayData.monitor || {}} date={dateKey} updateDay={updateDay} />
          <ExerciseSection exercises={dayData.exercises || []} date={dateKey} updateDay={updateDay} />
          <TodoSection todos={dayData.todos || []} date={dateKey} updateDay={updateDay} />
        </div>
      </div>
    </aside>
  )
}
