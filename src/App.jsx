import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import HomePage from './pages/HomePage'
import CalendarPage from './pages/CalendarPage'
import GalleryPage from './pages/GalleryPage'
import DocumentsPage from './pages/DocumentsPage'
import AssistantPage from './pages/AssistantPage'

function getHash() {
  return window.location.hash.replace('#/', '') || 'home'
}

export default function App() {
  const [page, setPage] = useState(getHash)
  const [visited, setVisited] = useState(() => {
    const h = getHash()
    return h !== 'home' ? { [h]: true } : {}
  })

  useEffect(() => {
    const onHash = () => {
      const p = getHash()
      setPage(p)
      if (p !== 'home') setVisited(prev => ({ ...prev, [p]: true }))
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = (p) => {
    window.location.hash = p === 'home' ? '/' : `/${p}`
  }

  const hasVisited = Object.keys(visited).length > 0

  return (
    <div className="bg-surface text-ink font-sans min-h-screen">
      {/* Home page */}
      <div className={page === 'home' ? '' : 'hidden'}>
        <HomePage onNavigate={navigate} />
      </div>

      {/* App shell - rendered once after first navigation, never unmounted */}
      {hasVisited && (
        <div className={`flex min-h-screen ${page === 'home' ? 'hidden' : ''}`}>
          <Sidebar active={page} onChange={navigate} onHome={() => navigate('home')} />
          <main className="flex-1 min-w-0 overflow-y-auto">
            {visited.calendar && <div className={page === 'calendar' ? '' : 'hidden'}><CalendarPage /></div>}
            {visited.gallery && <div className={page === 'gallery' ? '' : 'hidden'}><GalleryPage /></div>}
            {visited.documents && <div className={page === 'documents' ? '' : 'hidden'}><DocumentsPage /></div>}
            {visited.assistant && <div className={page === 'assistant' ? '' : 'hidden'}><AssistantPage /></div>}
          </main>
        </div>
      )}
    </div>
  )
}
