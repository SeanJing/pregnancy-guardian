import { useState, useCallback } from 'react'
import { api } from '../api'

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)

  const search = useCallback(async (q) => {
    setQuery(q)
    if (q.trim().length < 2) { setResults(null); return }
    setResults(await api.search(q.trim()))
  }, [])

  const total = results ? results.calendar.length + results.gallery.length + results.documents.length : 0

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur px-4 md:px-6 lg:px-8 py-4">
        <h2 className="text-xl font-bold text-ink font-heading mb-3">Search</h2>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
          <input value={query} onChange={e => search(e.target.value)} type="text" placeholder="Search notes, photos, documents…"
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-primary transition-colors duration-150" autoFocus />
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-8 pb-8">
        {!results && (
          <div className="flex flex-col items-center justify-center py-24 text-ink/30">
            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            <p className="text-sm">Type at least 2 characters to search</p>
          </div>
        )}

        {results && total === 0 && (
          <p className="text-center text-ink/40 text-sm py-16">No results for "{query}"</p>
        )}

        {results && results.calendar.length > 0 && (
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-ink/50 uppercase tracking-wide mb-2">Calendar Notes ({results.calendar.length})</h3>
            <ul className="space-y-2">
              {results.calendar.map(r => (
                <li key={r.date} className="bg-white rounded-xl p-4">
                  <p className="text-xs font-medium text-primary mb-1">{r.date}</p>
                  {r.note && <p className="text-sm text-ink/80">{r.note}</p>}
                  {r.todos.filter(t => t.text.toLowerCase().includes(query.toLowerCase())).map((t, i) => (
                    <p key={i} className="text-sm text-ink/60 mt-1 flex items-center gap-1.5">
                      <span className={`w-3 h-3 rounded border ${t.done ? 'bg-primary border-primary' : 'border-gray-300'}`} />
                      {t.text}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        )}

        {results && results.gallery.length > 0 && (
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-ink/50 uppercase tracking-wide mb-2">Photos ({results.gallery.length})</h3>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {results.gallery.map(p => (
                <div key={p.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={UPLOADS_BASE + p.url} alt={p.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {results && results.documents.length > 0 && (
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-ink/50 uppercase tracking-wide mb-2">Documents ({results.documents.length})</h3>
            <ul className="divide-y divide-gray-100">
              {results.documents.map(doc => (
                <li key={doc.id} className="flex items-center gap-4 py-3">
                  <svg className="w-8 h-8 text-ink/40 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{doc.name}</p>
                    <p className="text-xs text-ink/50">{formatSize(doc.size)} · {doc.date?.split(' ')[0]}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  )
}
