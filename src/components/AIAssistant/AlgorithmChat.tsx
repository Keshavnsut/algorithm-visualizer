import { useState, useEffect, useRef } from 'react'
import { postJson } from './api'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AlgorithmChatProps {
  problemName: string
  problemId: string
  code?: string
  language?: string
}

function AlgorithmChat({ problemName, problemId, code = '', language = 'python' }: AlgorithmChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const storageKey = `ai-chat-${problemId}`

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as Message[]
      if (Array.isArray(parsed)) {
        setMessages(parsed.slice(-20))
      }
    } catch {
      setMessages([])
    }
  }, [storageKey])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages.slice(-20)))
  }, [messages, storageKey])

  const starterPrompts = [
    `Give me the intuition for ${problemName} in simple terms.`,
    `What is the best time and space complexity for ${problemName}?`,
    `What are the most common mistakes in ${problemName}?`,
    `Give me an interview-style explanation for ${problemName}.`,
    ...(code.trim()
      ? [
          `Review this ${language} code for ${problemName} and point out bugs or edge cases:\n\n${code.slice(0, 1200)}`,
          `How can I optimize this ${language} solution for ${problemName}?\n\n${code.slice(0, 1200)}`,
        ]
      : []),
  ]

  const sendMessage = async (override?: string) => {
    const text = (override ?? input).trim()
    if (!text) return

    const userMessage = text
    setInput('')
    const nextMessages = [...messages, { role: 'user' as const, content: userMessage }]
    setMessages(nextMessages)
    setLoading(true)
    setError('')

    try {
      const data = await postJson<{ response: string }>(
        '/api/ai/chat',
        {
          messages: nextMessages,
          problemName,
        },
        { retries: 1, timeoutMs: 30000 }
      )

      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const resetChat = () => {
    setMessages([])
    setError('')
    localStorage.removeItem(storageKey)
  }

  const messageCountLabel = `${messages.length} ${messages.length === 1 ? 'message' : 'messages'}`

  return (
    <div className="ai-chat">
      <div className="chat-toolbar">
        <span className="chat-count">{messageCountLabel}</span>
        <button type="button" className="chat-toolbar-btn" onClick={resetChat} disabled={loading || messages.length === 0}>
          Reset Chat
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <p>Ask me anything about {problemName}.</p>
            <p className="chat-hint">Try: "What is the core intuition?" or "Can you review my approach?"</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.role}`}>
            <span className="message-avatar" aria-hidden>
              {msg.role === 'assistant' ? 'AI' : 'You'}
            </span>
            <div className="message-body">
              <span className="message-role">{msg.role === 'assistant' ? 'Assistant' : 'You'}</span>
              <div className="message-content">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-message assistant">
            <span className="message-avatar" aria-hidden>AI</span>
            <div className="message-body">
              <span className="message-role">Assistant</span>
              <div className="message-content">
                <span className="typing-indicator">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="ai-error">{error}</div>}

      <div className="chat-starters-wrap">
        <p className="chat-starters-title">Quick prompts</p>
        <div className="chat-starters">
          {starterPrompts.map((prompt) => (
            <button key={prompt} type="button" className="chat-starter-btn" onClick={() => void sendMessage(prompt)} disabled={loading}>
              {prompt.length > 70 ? `${prompt.slice(0, 70)}...` : prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              void sendMessage()
            }
          }}
          placeholder="Ask a question..."
          disabled={loading}
        />
        <button type="button" onClick={() => void sendMessage()} disabled={loading || !input.trim()}>
          Send
        </button>
        <button type="button" onClick={resetChat} disabled={loading || messages.length === 0}>
          Clear
        </button>
      </div>
    </div>
  )
}

export default AlgorithmChat
