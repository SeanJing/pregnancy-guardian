export default function DayCell({ day, isToday, hasContent, contentFlags, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg text-left cursor-pointer transition-colors duration-150 hover:bg-primary/10 active:scale-95 ${isToday ? 'bg-primary/10 font-bold' : ''}`}
      aria-label={`Day ${day}`}
    >
      <div className="p-2 text-center">
        <span className={`text-sm ${isToday ? 'text-primary' : ''}`}>{day}</span>
      </div>
      <div className="px-1.5 pb-2 min-h-16 flex flex-col gap-0.5">
        {hasContent && (
          <>
            {contentFlags.diet && <span className="text-xs text-cta font-medium">Diet</span>}
            {contentFlags.monitor && <span className="text-xs text-primary font-medium">Monitor</span>}
            {contentFlags.exercises && <span className="text-xs text-green-500 font-medium">Exercise</span>}
            {contentFlags.todos && <span className="text-xs text-ink/40 font-medium">To-Do</span>}
          </>
        )}
      </div>
    </button>
  )
}
