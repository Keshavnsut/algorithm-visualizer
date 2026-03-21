import { useState } from 'react'
import './App.css'
import SortingVisualizer from './components/SortingVisualizer/SortingVisualizer'
import PathfindingVisualizer from './components/PathfindingVisualizer/PathfindingVisualizer'
import DPSection from './components/DPSection/DPSection'

type VisualizerType = 'sorting' | 'pathfinding' | 'dp'

function App() {
  const [activeVisualizer, setActiveVisualizer] = useState<VisualizerType>('sorting')

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">Algorithm Visualizer</h1>
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
      </header>

      <main className="main">
        {activeVisualizer === 'sorting' && <SortingVisualizer />}
        {activeVisualizer === 'pathfinding' && <PathfindingVisualizer />}
        {activeVisualizer === 'dp' && <DPSection />}
      </main>

      <footer className="footer">
        <p>Built with React + TypeScript | <a href="https://github.com" target="_blank" rel="noopener noreferrer">View on GitHub</a></p>
      </footer>
    </div>
  )
}

export default App
