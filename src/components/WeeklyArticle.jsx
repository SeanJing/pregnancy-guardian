import { useState, useEffect } from 'react'
import Markdown from 'react-markdown'

export default function WeeklyArticle({ week }) {
  const [content, setContent] = useState(null)

  useEffect(() => {
    if (!week) return
    import('../data/weekly-articles.json').then(m => {
      setContent(m.default[String(week)] || null)
    })
  }, [week])

  if (!content) return null

  return (
    <div className="mt-3 bg-primary/10 rounded-xl border border-primary/20 p-5 overflow-y-auto max-h-[60vh]">
      <h3 className="text-sm font-semibold font-heading text-primary mb-3">Week {week} Guide</h3>
      <div className="prose prose-sm max-w-none text-ink/80">
        <Markdown>{content}</Markdown>
      </div>
    </div>
  )
}
