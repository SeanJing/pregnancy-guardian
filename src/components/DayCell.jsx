export default function DayCell({ day, isToday, isActive, hasContent, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg text-center cursor-pointer transition-colors duration-150 hover:bg-primary/10 active:scale-95 p-3 ${isActive ? 'ring-2 ring-primary bg-primary/5' : ''} ${isToday ? 'bg-primary/10 font-bold' : ''}`}
      aria-label={`Day ${day}`}
    >
      <span className={`text-sm ${isToday ? 'text-primary' : ''}`}>{day}</span>
      {hasContent && <span className="block w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1" />}
    </button>
  )
}
