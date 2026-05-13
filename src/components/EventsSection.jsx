import { useState } from 'react'
import { api } from '../api'

export default function EventsSection({ events: initialEvents, date, updateDay }) {
  const [events, setEvents] = useState(initialEvents)
  const [text, setText] = useState('')
  const [time, setTime] = useState('')

  const sync = (newEvents) => { setEvents(newEvents); updateDay(d => ({ ...d, events: newEvents })) }

  const add = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    const res = await api.createEvent(date, text.trim(), time)
    sync([...events, { id: res.id, text: text.trim(), time }])
    setText(''); setTime('')
  }

  const remove = async (id) => {
    sync(events.filter(t => t.id !== id))
    api.deleteEvent(id)
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
        Events
      </h3>
      <ul className="space-y-1.5">
        {events.map(t => (
          <li key={t.id} className="flex items-center gap-2 group">
            <span className="flex-1 text-sm">{t.time && <span className="text-ink/40 mr-1.5">{t.time}</span>}{t.text}</span>
            <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 cursor-pointer transition-opacity duration-150" aria-label="Delete">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-2 flex flex-wrap gap-2">
        <input value={text} onChange={e => setText(e.target.value)} type="text" placeholder="Add an event…" className="flex-1 min-w-[120px] px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-primary transition-colors duration-150" required />
        <input value={time} onChange={e => setTime(e.target.value)} type="time" className="w-28 px-2 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-primary transition-colors duration-150" />
        <button type="submit" className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-light cursor-pointer transition-colors duration-150 active:scale-95">Add</button>
      </form>
    </section>
  )
}
