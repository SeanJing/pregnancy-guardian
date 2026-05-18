import { useRef } from 'react'
import { api } from '../api'

export default function DiarySection({ diary, date, updateDay }) {
  const timers = useRef({})

  const save = (content) => {
    updateDay(d => ({ ...d, diary: content }))
    clearTimeout(timers.current.diary)
    timers.current.diary = setTimeout(() => {
      api.saveDiary(date, content)
    }, 500)
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
        Diary
      </h3>
      <textarea
        defaultValue={diary || ''}
        onChange={e => save(e.target.value)}
        placeholder="How are you feeling today?"
        rows={4}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-primary transition-colors duration-150 resize-y"
      />
    </section>
  )
}
