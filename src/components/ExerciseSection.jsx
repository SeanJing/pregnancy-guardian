export default function ExerciseSection({ exercises, onUpdate }) {
  const update = (key, value) => onUpdate({ ...exercises, [key]: value })

  return (
    <section>
      <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z"/></svg>
        Exercises
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-ink/50 mb-0.5 block">Steps</label>
          <input
            value={exercises.steps || ''}
            onChange={e => update('steps', e.target.value)}
            placeholder="e.g. 5000"
            type="number"
            className="w-full px-2.5 py-1.5 text-sm rounded-md border border-gray-200 focus:outline-none focus:border-primary transition-colors duration-150"
          />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-0.5 block">Duration (min)</label>
          <input
            value={exercises.duration || ''}
            onChange={e => update('duration', e.target.value)}
            placeholder="e.g. 30"
            type="number"
            className="w-full px-2.5 py-1.5 text-sm rounded-md border border-gray-200 focus:outline-none focus:border-primary transition-colors duration-150"
          />
        </div>
      </div>
      <div className="mt-2">
        <label className="text-xs text-ink/50 mb-0.5 block">Activity</label>
        <input
          value={exercises.activity || ''}
          onChange={e => update('activity', e.target.value)}
          placeholder="e.g. Walking, Yoga, Swimming"
          className="w-full px-2.5 py-1.5 text-sm rounded-md border border-gray-200 focus:outline-none focus:border-primary transition-colors duration-150"
        />
      </div>
    </section>
  )
}
