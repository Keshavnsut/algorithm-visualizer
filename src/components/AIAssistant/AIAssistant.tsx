import { useState } from 'react'
import './AIAssistant.css'
import CodeExplainer from './CodeExplainer'
import HintSystem from './HintSystem'
import AlgorithmChat from './AlgorithmChat'
import CodeOptimizer from './CodeOptimizer'

type AITabType = 'explain' | 'hint' | 'chat' | 'optimize'

interface AIAssistantProps {
  problemName?: string
  problemId?: string
  code?: string
  language?: string
}

function AIAssistant({ problemName = 'Algorithm', problemId = 'general', code = '', language = 'python' }: AIAssistantProps) {
  const [activeTab, setActiveTab] = useState<AITabType>('explain')
  const [isOpen, setIsOpen] = useState(false)

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
          </div>

          <div className="ai-tabs">
            <button
              className={`ai-tab-btn ${activeTab === 'explain' ? 'active' : ''}`}
              onClick={() => setActiveTab('explain')}
            >
              Explain
            </button>
            <button
              className={`ai-tab-btn ${activeTab === 'hint' ? 'active' : ''}`}
              onClick={() => setActiveTab('hint')}
            >
              Hint
            </button>
            <button
              className={`ai-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
            <button
              className={`ai-tab-btn ${activeTab === 'optimize' ? 'active' : ''}`}
              onClick={() => setActiveTab('optimize')}
            >
              Optimize
            </button>
          </div>

          <div className="ai-content">
            {activeTab === 'explain' && (
              <CodeExplainer code={code} language={language} problemName={problemName} />
            )}
            {activeTab === 'hint' && (
              <HintSystem problemName={problemName} problemId={problemId} />
            )}
            {activeTab === 'chat' && (
              <AlgorithmChat problemName={problemName} problemId={problemId} />
            )}
            {activeTab === 'optimize' && (
              <CodeOptimizer code={code} language={language} problemName={problemName} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AIAssistant
