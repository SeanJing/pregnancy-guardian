import { useState, useRef, useEffect } from 'react'
import Markdown from 'react-markdown'
import { api } from '../api'

export default function AssistantPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const ask = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const question = input.trim()
    setMessages(prev => [...prev, { role: 'user', text: question }])
    setInput('')
    setLoading(true)
    // Add empty assistant message that will stream in
    setMessages(prev => [...prev, { role: 'assistant', text: '' }])
    try {
      const { sources } = await api.ask(question, (text) => {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', text }
          return updated
        })
      })
      // Add sources after stream completes
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { ...updated[updated.length - 1], sources }
        return updated
      })
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', text: 'Sorry, something went wrong. Please try again.' }
        return updated
      })
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur px-4 md:px-6 lg:px-8 py-4">
        <h2 className="text-xl font-bold text-ink font-heading">Assistant</h2>
        <p className="text-xs text-ink/40 mt-0.5">Ask anything about your pregnancy</p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-ink/30">
            <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>
            <p className="text-sm">Try asking: "What should I eat in week 12?"</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white text-ink'}`}>
              {msg.role === 'user' ? (
                <p>{msg.text}</p>
              ) : (
                <div className="prose prose-sm max-w-none"><Markdown>{msg.text}</Markdown></div>
              )}
              {msg.sources?.length > 0 && (
                <details className="text-xs mt-2 opacity-50 border-t border-ink/10 pt-2">
                  <summary className="font-medium cursor-pointer">Sources ({msg.sources.length})</summary>
                  <div className="mt-1 space-y-1">
                    {msg.sources.map((s, i) => (
                      <p key={i}>{s.week ? `Week ${s.week}` : s.page ? `Page ${s.page}` : ''}{s.text ? ` — ${s.text}…` : ''}</p>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-2.5">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={ask} className="px-4 md:px-6 lg:px-8 py-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask a question…" className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary transition-colors duration-150" />
          <button type="submit" disabled={loading} className="px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-light cursor-pointer transition-colors duration-150 active:scale-95 disabled:opacity-50">Ask</button>
        </div>
      </form>
    </div>
  )
}
