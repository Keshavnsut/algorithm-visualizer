import { useState } from 'react'
import { postJson } from './api'
import './CodeExplainer.css'

interface CodeExplainerProps {
  code: string
  language: string
  problemName: string
}

function CodeExplainer({ code, language, problemName }: CodeExplainerProps) {
  const [explanation, setExplanation] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleExplain = async () => {
    if (!code.trim()) {
      setError('No code available for this problem.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await postJson<{ explanation: string }>(
        '/api/ai/explain',
        {
          code,
          language,
          problemName,
        },
        { retries: 1 }
      )

      setExplanation(data.explanation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred analyzing the code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-explainer-container">
      {!explanation ? (
        <div className="code-explainer-intro">
          <div className="code-info">
            <h3>C++ Algorithm Explanation</h3>
            <p>Problem: <strong>{problemName}</strong></p>
            {code.trim() ? (
              <>
                <p>Language: <strong>{language.toUpperCase()}</strong></p>
                <p>Code Preview:</p>
                <div className="code-preview">
                  <pre><code>{code.slice(0, 400)}{code.length > 400 ? '...' : ''}</code></pre>
                </div>
                <button onClick={handleExplain} disabled={loading} className="ai-action-btn">
                  {loading ? 'Analyzing Code...' : 'Generate Explanation'}
                </button>
              </>
            ) : (
              <p className="code-unavailable">No code available for this problem yet.</p>
            )}
          </div>
        </div>
      ) : null}

      {error && <div className="ai-error">{error}</div>}

      {explanation && (
        <div className="ai-result">
          <div className="result-header">
            <h3>Code Explanation: {problemName}</h3>
            <button onClick={() => setExplanation('')} className="btn-close">✕</button>
          </div>
          <div className="ai-result-text">{explanation}</div>
          <button onClick={handleExplain} disabled={loading} className="ai-action-btn">
            {loading ? 'Regenerating...' : 'Regenerate Explanation'}
          </button>
        </div>
      )}
    </div>
  )
}

export default CodeExplainer
