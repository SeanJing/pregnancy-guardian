import Markdown from 'react-markdown'
import articles from '../data/weekly-articles.json'

export default function WeeklyArticle({ week }) {
  const content = articles[String(week)]
  if (!content) return null

  return (
    <div className="mt-3 bg-white rounded-xl border border-gray-200 p-5 overflow-y-auto max-h-[60vh]">
      <h3 className="text-sm font-semibold font-heading text-primary mb-3">Week {week} Guide</h3>
      <div className="prose prose-sm max-w-none text-ink/80">
        <Markdown>{content}</Markdown>
      </div>
    </div>
  )
}
