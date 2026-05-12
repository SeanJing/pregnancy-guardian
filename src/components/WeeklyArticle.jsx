import { useState, useEffect } from 'react'

export default function WeeklyArticle({ week }) {
  const [sections, setSections] = useState(null)

  useEffect(() => {
    if (!week) return
    import('../data/weekly-articles.json').then(m => {
      setSections(m.default[String(week)] || null)
    })
  }, [week])

  if (!sections || sections.length === 0) return null

  return (
    <div className="mt-3 space-y-2">
      <h3 className="text-sm font-semibold font-heading text-primary px-2">Week {week} Guide</h3>
      {sections.map((s, i) => (
        <details key={i} className="bg-primary/10 rounded-xl border border-primary/20 overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer font-medium text-sm text-ink hover:bg-primary/5 transition-colors duration-150">{s.title}</summary>
          <p className="px-4 pb-3 text-sm text-ink/70 whitespace-pre-line">{s.content}</p>
        </details>
      ))}
    </div>
  )
}
