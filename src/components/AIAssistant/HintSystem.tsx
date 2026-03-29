import { useEffect, useState } from 'react'
import { getJson, postJson } from './api'

interface HintSystemProps {
  problemName: string
  problemId: string
}

function HintSystem({ problemName, problemId }: HintSystemProps) {
  const [hintLevel, setHintLevel] = useState(1)
  const [hints, setHints] = useState<string[]>(['', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let active = true

    const loadHintHistory = async () => {
      try {
        const data = await getJson<{ history: Array<{ hint_level: number; hint: string }> }>(`/api/ai/hint-history/${problemId}`)
        if (!active) return

        const next = ['', '', '']
        data.history.forEach((entry) => {
          const idx = Math.min(3, Math.max(1, entry.hint_level)) - 1
          next[idx] = entry.hint
        })

        setHints(next)
      } catch {
        // History is optional; keep UX responsive if unavailable.
      }
    }

    void loadHintHistory()

    return () => {
      active = false
    }
  }, [problemId])

  const getHint = async (level: number) => {
    setLoading(true)
    setError('')

    try {
      const data = await postJson<{ hint: string }>(
        '/api/ai/hint',
        {
          problemName,
          difficulty: 'medium',
          hintLevel: level,
        },
        { retries: 1 }
      )

      setHints((prev) => {
        const next = [...prev]
        next[level - 1] = data.hint
        return next
      })
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
