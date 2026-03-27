import { useState, useEffect } from 'react'

interface HintSystemProps {
  problemName: string
  problemId: string
}

function HintSystem({ problemName, problemId }: HintSystemProps) {
  const [hintLevel, setHintLevel] = useState(1)
  const [hints, setHints] = useState<string[]>(['', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const getHint = async (level: number) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:5000/api/ai/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemName,
          difficulty: 'medium',
          hintLevel: level,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get hint')
      }

      const newHints = [...hints]
      newHints[level - 1] = data.hint
      setHints(newHints)
      setHintLevel(level)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-hint-system">
      <p className="hint-info">Need help? Get graduated hints to guide you.</p>

      <div className="hint-buttons">
        {[1, 2, 3].map((level) => (
          <button
            key={level}
            onClick={() => getHint(level)}
            disabled={loading}
            className={`hint-btn ${hints[level - 1] ? 'completed' : ''}`}
          >
            Hint {level}
          </button>
        ))}
      </div>

      {error && <div className="ai-error">{error}</div>}

      {hints[hintLevel - 1] && (
        <div className="ai-result">
          <div className="hint-badge">Level {hintLevel} Hint</div>
          <div className="ai-result-text">{hints[hintLevel - 1]}</div>
        </div>
      )}

      <div className="hint-legend">
        <span>💡 Level 1: General approach</span>
        <span>💡 Level 2: Algorithm hints</span>
        <span>💡 Level 3: Detailed guide</span>
      </div>
    </div>
  )
}

export default HintSystem
