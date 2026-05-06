import { useState, useEffect, useMemo } from 'react'
import { api } from '../api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function getExt(name) { return (name.split('.').pop() || '').toLowerCase() }

const FILE_ICONS = {
  pdf: <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>,
  image: <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"/></svg>,
  default: <svg className="w-8 h-8 text-ink/40" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>,
}

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']

function getIcon(name) {
  const ext = getExt(name)
  if (ext === 'pdf') return FILE_ICONS.pdf
  if (IMAGE_EXTS.includes(ext)) return FILE_ICONS.image
  return FILE_ICONS.default
}

function getType(name) {
  const ext = getExt(name)
  if (ext === 'pdf') return 'PDF'
  if (IMAGE_EXTS.includes(ext)) return 'Image'
  if (['doc', 'docx'].includes(ext)) return 'Word'
  if (['xls', 'xlsx'].includes(ext)) return 'Excel'
  if (['txt', 'md'].includes(ext)) return 'Text'
  return 'Other'
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState([])
  const [viewBy, setViewBy] = useState('all') // 'all' | 'date' | 'type'
  const [typeFilter, setTypeFilter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const load = () => { setLoading(true); setError(null); api.getDocuments().then(d => { setDocs(d); setLoading(false) }).catch(e => { setError(e.message); setLoading(false) }) }
  useEffect(load, [])

  const addFiles = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const items = await api.uploadDocuments(files)
    setDocs(prev => [...items, ...prev])
    e.target.value = ''
  }

  const remove = async (i, id) => {
    await api.deleteDocument(id)
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  // Group by date
  const searchedDocs = search ? docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase())) : docs
  const filteredDocs = typeFilter ? searchedDocs.filter(d => getType(d.name) === typeFilter) : searchedDocs

  const byDate = useMemo(() => {
    const groups = {}
    searchedDocs.forEach(d => {
      const key = d.date?.split(' ')[0] || 'Unknown'
      ;(groups[key] ||= []).push(d)
    })
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [searchedDocs])

  // Group by type
  const byType = useMemo(() => {
    const groups = {}
    searchedDocs.forEach(d => {
      const t = getType(d.name)
      ;(groups[t] ||= []).push(d)
    })
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
  }, [searchedDocs])

  // Available types for filter chips
  const types = useMemo(() => [...new Set(docs.map(d => getType(d.name)))].sort(), [docs])

  const renderRow = (doc) => (
    <li key={doc.id} className="flex items-center gap-4 py-3 group">
      {getIcon(doc.name)}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{doc.name}</p>
        <p className="text-xs text-ink/50">{formatSize(doc.size)} · {doc.date?.split(' ')[0] || ''} · {getType(doc.name)}</p>
      </div>
      <button onClick={() => remove(null, doc.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 cursor-pointer transition-opacity duration-150" aria-label="Remove document">
        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
      </button>
    </li>
  )

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur px-4 md:px-6 lg:px-8 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink font-heading">Documents</h2>
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-light cursor-pointer transition-colors duration-150 active:scale-95">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Upload
            <input type="file" multiple className="hidden" onChange={addFiles} />
          </label>
        </div>
        {docs.length > 0 && (
          <div className="space-y-2">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-primary transition-colors duration-150" />
            <div className="flex items-center gap-1.5">
            {['all', 'date', 'type'].map(v => (
              <button key={v} onClick={() => { setViewBy(v); setTypeFilter(null) }}
                className={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors duration-150 ${viewBy === v ? 'bg-primary text-white' : 'bg-white text-ink/60 hover:bg-primary/10'}`}>
                {v === 'all' ? 'All' : v === 'date' ? 'By Date' : 'By Type'}
              </button>
            ))}
            {viewBy === 'type' && types.map(t => (
              <button key={t} onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors duration-150 ${typeFilter === t ? 'bg-secondary text-ink' : 'bg-white text-ink/50 hover:bg-secondary/50'}`}>
                {t}
              </button>
            ))}
            </div>
          </div>
        )}
      </header>

      <div className="px-4 md:px-6 lg:px-8 pb-8">
        {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} onRetry={load} /> : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-ink/40">
            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
            <p className="text-sm">No documents yet. Tap "Upload" to add files.</p>
          </div>
        ) : viewBy === 'all' ? (
          <ul className="divide-y divide-gray-100">{docs.map(renderRow)}</ul>
        ) : viewBy === 'date' ? (
          byDate.map(([date, items]) => (
            <div key={date} className="mb-6">
              <h3 className="text-xs font-semibold text-ink/50 uppercase tracking-wide mb-2">{date}</h3>
              <ul className="divide-y divide-gray-100">{items.map(renderRow)}</ul>
            </div>
          ))
        ) : (
          typeFilter ? (
            <ul className="divide-y divide-gray-100">{filteredDocs.map(renderRow)}</ul>
          ) : (
            byType.map(([type, items]) => (
              <div key={type} className="mb-6">
                <h3 className="text-xs font-semibold text-ink/50 uppercase tracking-wide mb-2">{type} ({items.length})</h3>
                <ul className="divide-y divide-gray-100">{items.map(renderRow)}</ul>
              </div>
            ))
          )
        )}
      </div>
    </>
  )
}
