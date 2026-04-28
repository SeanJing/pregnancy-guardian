export default function PicsSection({ pics, onUpdate }) {
  const addPic = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onUpdate([...pics, reader.result])
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const remove = (i) => onUpdate(pics.filter((_, j) => j !== i))

  return (
    <section>
      <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"/></svg>
        Pics
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {pics.map((src, i) => (
          <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img src={src} alt="Uploaded" className="w-full h-full object-cover" />
            <button onClick={() => remove(i)} className="absolute top-1 right-1 p-0.5 rounded bg-white/80 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-150" aria-label="Remove image">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        ))}
      </div>
      <label className="mt-2 flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-ink/60 hover:border-primary hover:text-primary cursor-pointer transition-colors duration-150">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
        Upload image
        <input type="file" accept="image/*" className="hidden" onChange={addPic} />
      </label>
    </section>
  )
}
