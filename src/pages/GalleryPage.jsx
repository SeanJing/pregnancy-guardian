import { useState, useEffect } from 'react'
import { api, UPLOADS_BASE } from '../api'

export default function GalleryPage() {
  const [photos, setPhotos] = useState([])
  const [viewing, setViewing] = useState(null)

  useEffect(() => { api.getGallery().then(setPhotos) }, [])

  const addPhotos = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const items = await api.uploadPhotos(files)
    setPhotos(prev => [...items, ...prev])
    e.target.value = ''
  }

  const remove = async (i) => {
    await api.deletePhoto(photos[i].id)
    setPhotos(prev => prev.filter((_, j) => j !== i))
    setViewing(null)
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-ink font-heading">Gallery</h2>
        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-light cursor-pointer transition-colors duration-150 active:scale-95">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Add Photos
          <input type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} />
        </label>
      </header>

      <div className="px-4 md:px-6 lg:px-8 pb-8">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-ink/40">
            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"/></svg>
            <p className="text-sm">No photos yet. Tap "Add Photos" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
            {photos.map((p, i) => (
              <button key={p.id} onClick={() => setViewing(i)} className="aspect-square overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity duration-150">
                <img src={UPLOADS_BASE + p.url} alt={p.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {viewing !== null && photos[viewing] && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setViewing(null)} className="text-white/80 hover:text-white text-sm font-medium cursor-pointer transition-colors duration-150">Close</button>
            <span className="text-white/60 text-sm">{photos[viewing].name}</span>
            <button onClick={() => remove(viewing)} className="text-red-400 hover:text-red-300 text-sm font-medium cursor-pointer transition-colors duration-150">Delete</button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={UPLOADS_BASE + photos[viewing].url} alt={photos[viewing].name} className="max-w-full max-h-full object-contain" />
          </div>
        </div>
      )}
    </>
  )
}
