import { useState } from 'react'
import { postJson } from './api'

interface CodeOptimizerProps {
  code: string
  language: string
  problemName: string
}

function CodeOptimizer({ code, language, problemName }: CodeOptimizerProps) {
  const [suggestions, setSuggestions] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleOptimize = async () => {
    if (!code.trim()) {
      setError('Please paste your code first')
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await postJson<{ suggestions: string }>(
        '/api/ai/optimize',
        {
          code,
          language,
          problemName,
        },
        { retries: 1 }
      )

      setSuggestions(data.suggestions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-optimizer">
      <button onClick={handleOptimize} disabled={loading} className="ai-action-btn">
        {loading ? 'Analyzing...' : 'Optimize My Code'}
      </button>

      {error && <div className="ai-error">{error}</div>}

      {suggestions && (
        <div className="ai-result">
          <div className="ai-result-text">{suggestions}</div>
        </div>
      )}
    </div>
  )
}

export default CodeOptimizer
