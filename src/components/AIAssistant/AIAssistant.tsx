import { useEffect, useState } from 'react'
import './AIAssistant.css'
import CodeExplainer from './CodeExplainer'
import AlgorithmChat from './AlgorithmChat'
import { getJson } from './api'

type AITabType = 'explain' | 'chat'

interface AIAssistantProps {
  problemName?: string
  problemId?: string
  code?: string
  language?: string
}

function AIAssistant({ problemName = 'Algorithm', problemId = 'general', code = '', language = 'python' }: AIAssistantProps) {
  const [activeTab, setActiveTab] = useState<AITabType>('chat')
  const [isOpen, setIsOpen] = useState(false)
  const [providerInfo, setProviderInfo] = useState<string>('AI offline')
  const aiOnline = providerInfo !== 'AI offline'

  useEffect(() => {
    let active = true

    const loadStatus = async () => {
      try {
        const data = await getJson<{ provider: string; model: string }>('/api/ai/status')
        if (!active) return
        setProviderInfo(`${data.provider} • ${data.model}`)
      } catch {
        if (!active) return
        setProviderInfo('AI offline')
      }
    }

    void loadStatus()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="ai-assistant">
      {/* Floating Button */}
      <button
        className="ai-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="AI Assistant"
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        aria-expanded={isOpen}
      >
        <span className="ai-toggle-icon">{isOpen ? '×' : 'AI'}</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="ai-panel">
          <div className="ai-panel-glow" aria-hidden />
          <div className="ai-header">
            <div className="ai-header-main">
              <h3>AI Assistant</h3>
              <span className={`ai-status-pill ${aiOnline ? 'online' : 'offline'}`}>
                {aiOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className="ai-problem-label">{problemName}</p>
            <p className="ai-provider">{providerInfo}</p>
          </div>

          <div className="ai-tabs">
            <button
              className={`ai-tab-btn ${activeTab === 'explain' ? 'active' : ''}`}
              onClick={() => setActiveTab('explain')}
            >
              Explain Code
            </button>
            <button
              className={`ai-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              Live Chat
            </button>
          </div>

          <div className="ai-content">
            {activeTab === 'explain' && (
              <CodeExplainer code={code} language={language} problemName={problemName} />
            )}
            {activeTab === 'chat' && (
              <AlgorithmChat problemName={problemName} problemId={problemId} code={code} language={language} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AIAssistant
