import { useState } from 'react'
import { api } from '../api'

export default function TodoSection({ todos, date, onRefresh }) {
  const [text, setText] = useState('')

  const add = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    await api.createTodo(date, text.trim())
    setText('')
    onRefresh()
  }

  const toggle = async (todo) => {
    await api.updateTodo(todo.id, { text: todo.text, done: !todo.done })
    onRefresh()
  }

  const remove = async (id) => {
    await api.deleteTodo(id)
    onRefresh()
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        To-Dos
      </h3>
      <ul className="space-y-1.5">
        {todos.map(t => (
          <li key={t.id} className="flex items-center gap-2 group">
            <button onClick={() => toggle(t)} className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors duration-150 ${t.done ? 'bg-primary border-primary' : 'border-gray-300'}`} aria-label="Toggle task">
              {t.done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>}
            </button>
            <span className={`flex-1 text-sm ${t.done ? 'line-through text-ink/40' : ''}`}>{t.text}</span>
            <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 cursor-pointer transition-opacity duration-150" aria-label="Delete task">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-2 flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} type="text" placeholder="Add a task…" className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-primary transition-colors duration-150" required />
        <button type="submit" className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-light cursor-pointer transition-colors duration-150 active:scale-95">Add</button>
      </form>
    </section>
  )
}
