import { useEffect, useState } from 'react'
import './App.css'
import SortingVisualizer from './components/SortingVisualizer/SortingVisualizer'
import PathfindingVisualizer from './components/PathfindingVisualizer/PathfindingVisualizer'
import DPSection from './components/DPSection/DPSection'
import AIAssistant from './components/AIAssistant/AIAssistant'

type VisualizerType = 'sorting' | 'pathfinding' | 'dp'
type ThemeMode = 'dark' | 'light'

interface AIContextPayload {
  problemName: string
  problemId: string
  code?: string
  language?: string
}

function App() {
  const [activeVisualizer, setActiveVisualizer] = useState<VisualizerType>('sorting')
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [aiContext, setAiContext] = useState<AIContextPayload>({
    problemName: 'sorting',
    problemId: 'sorting',
  })

  useEffect(() => {
    const storedTheme = localStorage.getItem('algorithm-visualizer-theme') as ThemeMode | null
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
    const initialTheme: ThemeMode = storedTheme ?? (prefersLight ? 'light' : 'dark')
    setTheme(initialTheme)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('algorithm-visualizer-theme', theme)
  }, [theme])

  const updateAiContext = (payload: AIContextPayload) => {
    setAiContext(payload)
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">Algorithm Visualizer</h1>
        <div className="header-actions">
          <nav className="nav">
            <button
              className={`nav-btn ${activeVisualizer === 'sorting' ? 'active' : ''}`}
              onClick={() => setActiveVisualizer('sorting')}
            >
              Sorting
            </button>
            <button
              className={`nav-btn ${activeVisualizer === 'pathfinding' ? 'active' : ''}`}
              onClick={() => setActiveVisualizer('pathfinding')}
            >
              Pathfinding
            </button>
            <button
              className={`nav-btn ${activeVisualizer === 'dp' ? 'active' : ''}`}
              onClick={() => setActiveVisualizer('dp')}
            >
              Dynamic Programming
            </button>
          </nav>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      <aside className="quick-sidebar" aria-label="Quick navigation">
        <button
          type="button"
          className={`quick-sidebar-btn ${activeVisualizer === 'sorting' ? 'active' : ''}`}
          onClick={() => setActiveVisualizer('sorting')}
          aria-label="Sorting section"
          data-tip="Sorting"
        >
          S
        </button>
        <button
          type="button"
          className={`quick-sidebar-btn ${activeVisualizer === 'pathfinding' ? 'active' : ''}`}
          onClick={() => setActiveVisualizer('pathfinding')}
          aria-label="Pathfinding section"
          data-tip="Pathfinding"
        >
          P
        </button>
        <button
          type="button"
          className={`quick-sidebar-btn ${activeVisualizer === 'dp' ? 'active' : ''}`}
          onClick={() => setActiveVisualizer('dp')}
          aria-label="Dynamic programming section"
          data-tip="Dynamic Programming"
        >
          D
        </button>
      </aside>

      <main className="main">
        {activeVisualizer === 'sorting' && <SortingVisualizer onContextChange={updateAiContext} />}
        {activeVisualizer === 'pathfinding' && <PathfindingVisualizer onContextChange={updateAiContext} />}
        {activeVisualizer === 'dp' && <DPSection onContextChange={updateAiContext} />}
      </main>

      <AIAssistant
        problemName={aiContext.problemName}
        problemId={aiContext.problemId}
        code={aiContext.code}
        language={aiContext.language}
      />
    </div>
  )
}

export default App
