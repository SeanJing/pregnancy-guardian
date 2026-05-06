export default function DayCell({ day, isToday, hasContent, contentFlags, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative p-3 rounded-lg text-left cursor-pointer transition-colors duration-150 hover:bg-primary/10 active:scale-95 min-h-24 ${isToday ? 'bg-primary/10 font-bold' : ''}`}
      aria-label={`Day ${day}`}
    >
      <span className={`text-sm ${isToday ? 'text-primary' : ''}`}>{day}</span>
      {hasContent && (
        <div className="mt-1.5 flex flex-col gap-0.5">
          {contentFlags.diet && <span className="text-[10px] text-cta font-medium">Diet</span>}
          {contentFlags.monitor && <span className="text-[10px] text-primary font-medium">Monitor</span>}
          {contentFlags.exercises && <span className="text-[10px] text-green-500 font-medium">Exercise</span>}
          {contentFlags.todos && <span className="text-[10px] text-ink/40 font-medium">To-Do</span>}
        </div>
      )}
    </button>
  )
}
