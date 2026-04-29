export default function DayCell({ day, isToday, hasContent, contentFlags, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-lg text-left cursor-pointer transition-colors duration-150 hover:bg-primary/10 active:scale-95 min-h-16 ${isToday ? 'bg-primary/10 font-bold' : ''}`}
      aria-label={`Day ${day}`}
    >
      <span className={`text-sm ${isToday ? 'text-primary' : ''}`}>{day}</span>
      {hasContent && (
        <div className="mt-1 flex gap-0.5 flex-wrap">
          {contentFlags.diet && <span className="w-1.5 h-1.5 rounded-full bg-cta" />}
          {contentFlags.monitor && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          {contentFlags.exercises && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
          {contentFlags.todos && <span className="w-1.5 h-1.5 rounded-full bg-ink/30" />}
        </div>
      )}
    </button>
  )
}
