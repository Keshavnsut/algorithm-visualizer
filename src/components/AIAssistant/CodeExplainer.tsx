import { useState } from 'react'

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
      setError('Please paste your code first')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:5000/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          problemName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get explanation')
      }

      setExplanation(data.explanation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-explainer">
      <button onClick={handleExplain} disabled={loading} className="ai-action-btn">
        {loading ? 'Analyzing...' : 'Explain My Code'}
      </button>

      {error && <div className="ai-error">{error}</div>}

      {explanation && (
        <div className="ai-result">
          <div className="ai-result-text">{explanation}</div>
        </div>
      )}
    </div>
  )
}

export default CodeExplainer
