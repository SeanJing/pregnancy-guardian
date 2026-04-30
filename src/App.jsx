import { useState } from 'react'
import Sidebar from './components/Sidebar'
import HomePage from './pages/HomePage'
import CalendarPage from './pages/CalendarPage'
import GalleryPage from './pages/GalleryPage'
import DocumentsPage from './pages/DocumentsPage'
import SearchPage from './pages/SearchPage'

const PAGES = { calendar: CalendarPage, gallery: GalleryPage, documents: DocumentsPage, search: SearchPage }

export default function App() {
  const [page, setPage] = useState('home')
  const [visited, setVisited] = useState({})

  const navigate = (p) => {
    setPage(p)
    if (p !== 'home') setVisited(prev => ({ ...prev, [p]: true }))
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
            {visited.search && <div className={page === 'search' ? '' : 'hidden'}><SearchPage /></div>}
          </main>
        </div>
      )}
    </div>
  )
}
