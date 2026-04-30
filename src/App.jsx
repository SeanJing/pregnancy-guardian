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

  if (page === 'home') {
    return <div className="bg-surface text-ink font-sans min-h-screen"><HomePage onNavigate={setPage} /></div>
  }

  return (
    <div className="flex bg-surface text-ink font-sans min-h-screen">
      <Sidebar active={page} onChange={setPage} onHome={() => setPage('home')} />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className={page === 'calendar' ? '' : 'hidden'}><CalendarPage /></div>
        <div className={page === 'gallery' ? '' : 'hidden'}><GalleryPage /></div>
        <div className={page === 'documents' ? '' : 'hidden'}><DocumentsPage /></div>
        <div className={page === 'search' ? '' : 'hidden'}><SearchPage /></div>
      </main>
    </div>
  )
}
