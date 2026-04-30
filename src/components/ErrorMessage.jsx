export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-ink/50">
      <svg className="w-12 h-12 mb-3 text-red-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
      <p className="text-sm mb-3">{message || 'Something went wrong'}</p>
      {onRetry && <button onClick={onRetry} className="px-4 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-light cursor-pointer transition-colors duration-150">Retry</button>}
    </div>
  )
}
