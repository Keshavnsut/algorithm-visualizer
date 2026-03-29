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
      <button className="ai-toggle-btn" onClick={() => setIsOpen(!isOpen)} title="AI Assistant">
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="ai-panel">
          <div className="ai-header">
            <h3>AI Assistant</h3>
            <p>{problemName}</p>
            <p className="ai-provider">{providerInfo}</p>
          </div>

          <div className="ai-tabs">
            <button
              className={`ai-tab-btn ${activeTab === 'explain' ? 'active' : ''}`}
              onClick={() => setActiveTab('explain')}
            >
              Explain
            </button>
            <button
              className={`ai-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
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
