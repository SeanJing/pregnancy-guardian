import { useState } from 'react'
import { api } from '../api'

export default function ExerciseSection({ exercises: initialExercises, date, onRefresh }) {
  const [exercises, setExercises] = useState(initialExercises)
  const [activity, setActivity] = useState('')
  const [steps, setSteps] = useState('')
  const [duration, setDuration] = useState('')

  const add = async (e) => {
    e.preventDefault()
    if (!activity && !steps && !duration) return
    const temp = { id: Date.now(), activity, steps: Number(steps) || 0, duration: Number(duration) || 0 }
    setExercises(prev => [...prev, temp])
    setActivity(''); setSteps(''); setDuration('')
    const res = await api.createExercise({ date, ...temp })
    setExercises(prev => prev.map(ex => ex.id === temp.id ? { ...ex, id: res.id } : ex))
  }

  const remove = async (id) => {
    setExercises(prev => prev.filter(ex => ex.id !== id))
    api.deleteExercise(id).catch(onRefresh)
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z"/></svg>
        Exercises
      </h3>
      {exercises.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {exercises.map(ex => (
            <li key={ex.id} className="flex items-center gap-2 text-sm bg-surface/50 rounded-lg px-3 py-2 group">
              <span className="flex-1">{ex.activity || 'Activity'} · {ex.steps} steps · {ex.duration} min</span>
              <button onClick={() => remove(ex.id)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 cursor-pointer transition-opacity duration-150" aria-label="Remove">
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="grid grid-cols-3 gap-2">
        <input value={activity} onChange={e => setActivity(e.target.value)} placeholder="Activity" className="px-2.5 py-1.5 text-sm rounded-md border border-gray-200 focus:outline-none focus:border-primary transition-colors duration-150" />
        <input value={steps} onChange={e => setSteps(e.target.value)} placeholder="Steps" type="number" className="px-2.5 py-1.5 text-sm rounded-md border border-gray-200 focus:outline-none focus:border-primary transition-colors duration-150" />
        <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="Min" type="number" className="px-2.5 py-1.5 text-sm rounded-md border border-gray-200 focus:outline-none focus:border-primary transition-colors duration-150" />
        <button type="submit" className="col-span-3 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-light cursor-pointer transition-colors duration-150 active:scale-95">Add Exercise</button>
      </form>
    </section>
  )
}
