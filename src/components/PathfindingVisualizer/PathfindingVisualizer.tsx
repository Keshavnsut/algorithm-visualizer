import { useState, useRef, useEffect } from 'react'
import './PathfindingVisualizer.css'
import bfsCppSource from './cpp/bfs.cpp?raw'
import dfsCppSource from './cpp/dfs.cpp?raw'
import dijkstraCppSource from './cpp/dijkstra.cpp?raw'
import astarCppSource from './cpp/astar.cpp?raw'

type Algorithm = 'bfs' | 'dfs' | 'dijkstra' | 'astar'
type NodeState = 'default' | 'start' | 'end' | 'visited' | 'path' | 'current'
type PathfindingView = 'visual' | 'cpp'

interface GraphNode {
  id: number
  x: number
  y: number
  state: NodeState
  distance: number
  heuristic: number
  parent: number | null
}

interface Edge {
  from: number
  to: number
  weight: number
}

const ALGORITHM_INFO: Record<Algorithm, { name: string; description: string; weighted: boolean }> = {
  bfs: {
    name: 'Breadth-First Search',
    description: 'Explores all neighbors at the current depth before moving to nodes at the next depth level. Guarantees the shortest path in unweighted graphs.',
    weighted: false,
  },
  dfs: {
    name: 'Depth-First Search',
    description: 'Explores as far as possible along each branch before backtracking. Does not guarantee the shortest path.',
    weighted: false,
  },
  dijkstra: {
    name: "Dijkstra's Algorithm",
    description: 'Finds the shortest path between nodes by selecting the unvisited node with the smallest distance. Guarantees the shortest path in weighted graphs.',
    weighted: true,
  },
  astar: {
    name: 'A* Search',
    description: 'Uses heuristics (Euclidean distance) to guide the search towards the goal. Combines path cost and estimated distance for optimal pathfinding.',
    weighted: true,
  },
}

// Predefined graph layouts
const PRESET_GRAPHS = {
  simple: {
    nodes: [
      { id: 0, x: 100, y: 200 },
      { id: 1, x: 250, y: 100 },
      { id: 2, x: 250, y: 300 },
      { id: 3, x: 400, y: 150 },
      { id: 4, x: 400, y: 250 },
      { id: 5, x: 550, y: 200 },
    ],
    edges: [
      { from: 0, to: 1, weight: 4 },
      { from: 0, to: 2, weight: 2 },
      { from: 1, to: 3, weight: 5 },
      { from: 2, to: 4, weight: 3 },
      { from: 1, to: 2, weight: 1 },
      { from: 3, to: 5, weight: 2 },
      { from: 4, to: 5, weight: 4 },
      { from: 3, to: 4, weight: 1 },
    ],
  },
  complex: {
    nodes: [
      { id: 0, x: 80, y: 200 },
      { id: 1, x: 180, y: 80 },
      { id: 2, x: 180, y: 200 },
      { id: 3, x: 180, y: 320 },
      { id: 4, x: 320, y: 80 },
      { id: 5, x: 320, y: 200 },
      { id: 6, x: 320, y: 320 },
      { id: 7, x: 460, y: 120 },
      { id: 8, x: 460, y: 280 },
      { id: 9, x: 580, y: 200 },
    ],
    edges: [
      { from: 0, to: 1, weight: 3 },
      { from: 0, to: 2, weight: 1 },
      { from: 0, to: 3, weight: 4 },
      { from: 1, to: 2, weight: 2 },
      { from: 1, to: 4, weight: 5 },
      { from: 2, to: 3, weight: 2 },
      { from: 2, to: 5, weight: 3 },
      { from: 3, to: 6, weight: 4 },
      { from: 4, to: 5, weight: 1 },
      { from: 4, to: 7, weight: 3 },
      { from: 5, to: 6, weight: 2 },
      { from: 5, to: 7, weight: 4 },
      { from: 5, to: 8, weight: 3 },
      { from: 6, to: 8, weight: 2 },
      { from: 7, to: 9, weight: 2 },
      { from: 8, to: 9, weight: 3 },
    ],
  },
  circular: {
    nodes: Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 330 + 150 * Math.cos((2 * Math.PI * i) / 8 - Math.PI / 2),
      y: 200 + 150 * Math.sin((2 * Math.PI * i) / 8 - Math.PI / 2),
    })),
    edges: [
      { from: 0, to: 1, weight: 2 },
      { from: 1, to: 2, weight: 3 },
      { from: 2, to: 3, weight: 2 },
      { from: 3, to: 4, weight: 4 },
      { from: 4, to: 5, weight: 2 },
      { from: 5, to: 6, weight: 3 },
      { from: 6, to: 7, weight: 2 },
      { from: 7, to: 0, weight: 3 },
      { from: 0, to: 4, weight: 5 },
      { from: 1, to: 5, weight: 4 },
      { from: 2, to: 6, weight: 5 },
      { from: 3, to: 7, weight: 4 },
    ],
  },
}

const PATHFINDING_CPP_IMPLEMENTATIONS: Record<Algorithm, { title: string; source: string }> = {
  bfs: { title: 'Breadth-First Search (BFS)', source: bfsCppSource },
  dfs: { title: 'Depth-First Search (DFS)', source: dfsCppSource },
  dijkstra: { title: "Dijkstra's Algorithm", source: dijkstraCppSource },
  astar: { title: 'A* Search', source: astarCppSource },
}

function PathfindingVisualizer() {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [algorithm, setAlgorithm] = useState<Algorithm>('bfs')
  const [view, setView] = useState<PathfindingView>('visual')
  const [cppAlgorithm, setCppAlgorithm] = useState<Algorithm>('bfs')
  const [isRunning, setIsRunning] = useState(false)
  const [speed, setSpeed] = useState(50)
  const [startNode, setStartNode] = useState<number>(0)
  const [endNode, setEndNode] = useState<number | null>(null)
  const [selectedNode, setSelectedNode] = useState<number | null>(null)
  const [mode, setMode] = useState<'select' | 'addNode' | 'addEdge' | 'delete'>('select')
  const [edgeStart, setEdgeStart] = useState<number | null>(null)
  const [draggingNode, setDraggingNode] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const runningRef = useRef(false)

  // Initialize with simple graph
  useEffect(() => {
    loadPreset('simple')
  }, [])

  const loadPreset = (preset: keyof typeof PRESET_GRAPHS) => {
    const graph = PRESET_GRAPHS[preset]
    const lastNodeId = graph.nodes.length - 1
    setNodes(graph.nodes.map(n => ({
      ...n,
      state: n.id === 0 ? 'start' : n.id === lastNodeId ? 'end' : 'default',
      distance: Infinity,
      heuristic: 0,
      parent: null,
    })))
    setEdges([...graph.edges])
    setStartNode(0)
    setEndNode(lastNodeId)
  }

  const resetStates = () => {
    setNodes(prev => prev.map(n => ({
      ...n,
      state: n.id === startNode ? 'start' : n.id === endNode ? 'end' : 'default',
      distance: Infinity,
      heuristic: 0,
      parent: null,
    })))
  }

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const getNeighbors = (nodeId: number): { id: number; weight: number }[] => {
    const neighbors: { id: number; weight: number }[] = []
    edges.forEach(edge => {
      if (edge.from === nodeId) {
        neighbors.push({ id: edge.to, weight: edge.weight })
      } else if (edge.to === nodeId) {
        neighbors.push({ id: edge.from, weight: edge.weight })
      }
    })
    return neighbors
  }

  const euclideanDistance = (a: GraphNode, b: GraphNode): number => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)) / 50
  }

  const visualizePath = async (endId: number, nodeMap: Map<number, GraphNode>) => {
    const path: number[] = []
    let current: number | null = endId
    
    while (current !== null) {
      path.unshift(current)
      current = nodeMap.get(current)?.parent ?? null
    }

    for (const nodeId of path) {
      if (!runningRef.current) return
      if (nodeId !== startNode && nodeId !== endNode) {
        setNodes(prev => prev.map(n => 
          n.id === nodeId ? { ...n, state: 'path' } : n
        ))
        await delay(101 - speed)
      }
    }
  }

  // BFS Algorithm
  const bfs = async () => {
    const nodeMap = new Map<number, GraphNode>()
    nodes.forEach(n => nodeMap.set(n.id, { ...n, parent: null }))
    
    const queue: number[] = [startNode]
    const visited = new Set<number>([startNode])

    while (queue.length > 0 && runningRef.current) {
      const currentId = queue.shift()!

      if (currentId === endNode) {
        await visualizePath(currentId, nodeMap)
        return true
      }

      if (currentId !== startNode && currentId !== endNode) {
        setNodes(prev => prev.map(n => 
          n.id === currentId ? { ...n, state: 'visited' } : n
        ))
        await delay(101 - speed)
      }

      for (const neighbor of getNeighbors(currentId)) {
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id)
          const neighborNode = nodeMap.get(neighbor.id)!
          neighborNode.parent = currentId
          queue.push(neighbor.id)
        }
      }
    }

    return false
  }

  // DFS Algorithm
  const dfs = async () => {
    const nodeMap = new Map<number, GraphNode>()
    nodes.forEach(n => nodeMap.set(n.id, { ...n, parent: null }))
    
    const stack: number[] = [startNode]
    const visited = new Set<number>()

    while (stack.length > 0 && runningRef.current) {
      const currentId = stack.pop()!
      
      if (visited.has(currentId)) continue
      visited.add(currentId)

      if (currentId === endNode) {
        await visualizePath(currentId, nodeMap)
        return true
      }

      if (currentId !== startNode && currentId !== endNode) {
        setNodes(prev => prev.map(n => 
          n.id === currentId ? { ...n, state: 'visited' } : n
        ))
        await delay(101 - speed)
      }

      for (const neighbor of getNeighbors(currentId)) {
        if (!visited.has(neighbor.id)) {
          const neighborNode = nodeMap.get(neighbor.id)!
          neighborNode.parent = currentId
          stack.push(neighbor.id)
        }
      }
    }

    return false
  }

  // Dijkstra's Algorithm
  const dijkstra = async () => {
    const nodeMap = new Map<number, GraphNode>()
    nodes.forEach(n => nodeMap.set(n.id, { ...n, distance: Infinity, parent: null }))
    nodeMap.get(startNode)!.distance = 0

    const unvisited = new Set<number>(nodes.map(n => n.id))
    const visited = new Set<number>()

    while (unvisited.size > 0 && runningRef.current) {
      // Find node with minimum distance
      let minDist = Infinity
      let currentId: number | null = null
      
      for (const id of unvisited) {
        const dist = nodeMap.get(id)!.distance
        if (dist < minDist) {
          minDist = dist
          currentId = id
        }
      }

      if (currentId === null || minDist === Infinity) break
      
      unvisited.delete(currentId)
      visited.add(currentId)

      if (currentId === endNode) {
        await visualizePath(currentId, nodeMap)
        return true
      }

      if (currentId !== startNode && currentId !== endNode) {
        setNodes(prev => prev.map(n => 
          n.id === currentId ? { ...n, state: 'visited' } : n
        ))
        await delay(101 - speed)
      }

      for (const neighbor of getNeighbors(currentId)) {
        if (!visited.has(neighbor.id)) {
          const current = nodeMap.get(currentId)!
          const neighborNode = nodeMap.get(neighbor.id)!
          const newDist = current.distance + neighbor.weight

          if (newDist < neighborNode.distance) {
            neighborNode.distance = newDist
            neighborNode.parent = currentId
          }
        }
      }
    }

    return false
  }

  // A* Algorithm
  const astar = async () => {
    const nodeMap = new Map<number, GraphNode>()
    const endNodeData = nodes.find(n => n.id === endNode)!
    
    nodes.forEach(n => {
      nodeMap.set(n.id, { 
        ...n, 
        distance: Infinity, 
        heuristic: euclideanDistance(n, endNodeData),
        parent: null 
      })
    })
    nodeMap.get(startNode)!.distance = 0

    const openSet = new Set<number>([startNode])
    const visited = new Set<number>()

    while (openSet.size > 0 && runningRef.current) {
      // Find node with minimum f = g + h
      let minF = Infinity
      let currentId: number | null = null
      
      for (const id of openSet) {
        const node = nodeMap.get(id)!
        const f = node.distance + node.heuristic
        if (f < minF) {
          minF = f
          currentId = id
        }
      }

      if (currentId === null) break
      
      openSet.delete(currentId)
      visited.add(currentId)

      if (currentId === endNode) {
        await visualizePath(currentId, nodeMap)
        return true
      }

      if (currentId !== startNode && currentId !== endNode) {
        setNodes(prev => prev.map(n => 
          n.id === currentId ? { ...n, state: 'visited' } : n
        ))
        await delay(101 - speed)
      }

      for (const neighbor of getNeighbors(currentId)) {
        if (!visited.has(neighbor.id)) {
          const current = nodeMap.get(currentId)!
          const neighborNode = nodeMap.get(neighbor.id)!
          const newDist = current.distance + neighbor.weight

          if (newDist < neighborNode.distance) {
            neighborNode.distance = newDist
            neighborNode.parent = currentId
            openSet.add(neighbor.id)
          }
        }
      }
    }

    return false
  }

  const runAlgorithm = async () => {
    if (endNode === null) {
      alert('Please set an end node!')
      return
    }

    setIsRunning(true)
    runningRef.current = true
    resetStates()
    await delay(100)

    let found = false
    switch (algorithm) {
      case 'bfs':
        found = await bfs()
        break
      case 'dfs':
        found = await dfs()
        break
      case 'dijkstra':
        found = await dijkstra()
        break
      case 'astar':
        found = await astar()
        break
    }

    if (!found && runningRef.current) {
      alert('No path found!')
    }

    setIsRunning(false)
    runningRef.current = false
  }

  const stopAlgorithm = () => {
    runningRef.current = false
    setIsRunning(false)
  }

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isRunning || mode !== 'addNode') return
    
    const svg = svgRef.current!
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newId = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 0
    setNodes(prev => [...prev, {
      id: newId,
      x,
      y,
      state: 'default',
      distance: Infinity,
      heuristic: 0,
      parent: null,
    }])
  }

  const handleNodeClick = (nodeId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isRunning) return

    if (mode === 'select') {
      setSelectedNode(nodeId === selectedNode ? null : nodeId)
    } else if (mode === 'addEdge') {
      if (edgeStart === null) {
        setEdgeStart(nodeId)
      } else if (edgeStart !== nodeId) {
        // Check if edge already exists
        const exists = edges.some(
          e => (e.from === edgeStart && e.to === nodeId) || (e.from === nodeId && e.to === edgeStart)
        )
        if (!exists) {
          const weight = Math.round(euclideanDistance(
            nodes.find(n => n.id === edgeStart)!,
            nodes.find(n => n.id === nodeId)!
          ))
          setEdges(prev => [...prev, { from: edgeStart, to: nodeId, weight: Math.max(1, weight) }])
        }
        setEdgeStart(null)
      }
    } else if (mode === 'delete') {
      if (nodeId !== startNode) {
        setNodes(prev => prev.filter(n => n.id !== nodeId))
        setEdges(prev => prev.filter(e => e.from !== nodeId && e.to !== nodeId))
        if (nodeId === endNode) setEndNode(null)
      }
    }
  }

  const handleNodeMouseDown = (nodeId: number, e: React.MouseEvent) => {
    if (mode === 'select' && !isRunning) {
      e.preventDefault()
      setDraggingNode(nodeId)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingNode === null || isRunning) return
    
    const svg = svgRef.current!
    const rect = svg.getBoundingClientRect()
    const x = Math.max(30, Math.min(e.clientX - rect.left, rect.width - 30))
    const y = Math.max(30, Math.min(e.clientY - rect.top, rect.height - 30))

    setNodes(prev => prev.map(n => 
      n.id === draggingNode ? { ...n, x, y } : n
    ))
  }

  const handleMouseUp = () => {
    setDraggingNode(null)
  }

  const setAsStart = () => {
    if (selectedNode === null || selectedNode === endNode) return
    setNodes(prev => prev.map(n => ({
      ...n,
      state: n.id === selectedNode ? 'start' : n.id === startNode ? 'default' : n.state
    })))
    setStartNode(selectedNode)
  }

  const setAsEnd = () => {
    if (selectedNode === null || selectedNode === startNode) return
    setNodes(prev => prev.map(n => ({
      ...n,
      state: n.id === selectedNode ? 'end' : n.id === endNode ? 'default' : n.state
    })))
    setEndNode(selectedNode)
  }

  const getEdgeMidpoint = (edge: Edge) => {
    const from = nodes.find(n => n.id === edge.from)!
    const to = nodes.find(n => n.id === edge.to)!
    return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
  }

  return (
    <div className="visualizer-container">
      <div className="controls">
        <div className="control-group">
          <label>Algorithm:</label>
          <select
            value={algorithm}
            onChange={(e) => {
              const selected = e.target.value as Algorithm
              setAlgorithm(selected)
              setCppAlgorithm(selected)
            }}
            disabled={isRunning}
          >
            <option value="bfs">BFS</option>
            <option value="dfs">DFS</option>
            <option value="dijkstra">Dijkstra's</option>
            <option value="astar">A* Search</option>
          </select>
        </div>

        <div className="control-group">
          <label>Mode:</label>
          <select
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as typeof mode)
              setEdgeStart(null)
              setSelectedNode(null)
            }}
            disabled={isRunning}
          >
            <option value="select">Select/Move</option>
            <option value="addNode">Add Node</option>
            <option value="addEdge">Add Edge</option>
            <option value="delete">Delete</option>
          </select>
        </div>

        <div className="control-group">
          <label>Speed: {speed}%</label>
          <input
            type="range"
            min="1"
            max="100"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label>Preset:</label>
          <select onChange={(e) => loadPreset(e.target.value as keyof typeof PRESET_GRAPHS)} disabled={isRunning}>
            <option value="simple">Simple</option>
            <option value="complex">Complex</option>
            <option value="circular">Circular</option>
          </select>
        </div>

        <button
          className="btn btn-secondary"
          onClick={resetStates}
          disabled={isRunning}
        >
          Clear Path
        </button>

        {!isRunning ? (
          <button className="btn btn-primary" onClick={runAlgorithm}>
            Visualize!
          </button>
        ) : (
          <button className="btn btn-danger" onClick={stopAlgorithm}>
            Stop
          </button>
        )}
      </div>

      <div className="pathfinding-view-toggle" role="tablist" aria-label="Pathfinding section view">
        <button
          type="button"
          className={`pathfinding-view-btn ${view === 'visual' ? 'active' : ''}`}
          onClick={() => setView('visual')}
          aria-selected={view === 'visual'}
        >
          Visualization
        </button>
        <button
          type="button"
          className={`pathfinding-view-btn ${view === 'cpp' ? 'active' : ''}`}
          onClick={() => setView('cpp')}
          aria-selected={view === 'cpp'}
        >
          C++ Code
        </button>
      </div>

      {view === 'visual' && selectedNode !== null && mode === 'select' && (
        <div className="node-controls">
          <span>Node {selectedNode} selected</span>
          <button className="btn btn-success btn-sm" onClick={setAsStart} disabled={selectedNode === endNode}>
            Set as Start
          </button>
          <button className="btn btn-danger btn-sm" onClick={setAsEnd} disabled={selectedNode === startNode}>
            Set as End
          </button>
        </div>
      )}

      {view === 'visual' && mode === 'addEdge' && edgeStart !== null && (
        <div className="mode-hint">
          Click another node to connect to Node {edgeStart}
        </div>
      )}

      {view === 'visual' ? (
        <>
          <div className="graph-container">
            <svg
              ref={svgRef}
              className="graph-svg"
              onClick={handleSvgClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Edges */}
              {edges.map((edge, idx) => {
                const from = nodes.find(n => n.id === edge.from)
                const to = nodes.find(n => n.id === edge.to)
                if (!from || !to) return null
                
                const mid = getEdgeMidpoint(edge)
                const isPath = (from.state === 'path' || from.state === 'start') && 
                              (to.state === 'path' || to.state === 'end')
                
                return (
                  <g key={idx}>
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      className={`edge ${isPath ? 'path' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (mode === 'delete' && !isRunning) {
                          setEdges(prev => prev.filter((_, i) => i !== idx))
                        }
                      }}
                    />
                    {(algorithm === 'dijkstra' || algorithm === 'astar') && (
                      <g>
                        <rect
                          x={mid.x - 12}
                          y={mid.y - 10}
                          width="24"
                          height="20"
                          rx="4"
                          className="edge-weight-bg"
                        />
                        <text
                          x={mid.x}
                          y={mid.y + 5}
                          className="edge-weight"
                        >
                          {edge.weight}
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}

              {/* Edge being drawn */}
              {edgeStart !== null && (
                <line
                  x1={nodes.find(n => n.id === edgeStart)?.x ?? 0}
                  y1={nodes.find(n => n.id === edgeStart)?.y ?? 0}
                  x2={nodes.find(n => n.id === edgeStart)?.x ?? 0}
                  y2={nodes.find(n => n.id === edgeStart)?.y ?? 0}
                  className="edge drawing"
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* Nodes */}
              {nodes.map(node => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={24}
                    className={`node ${node.state} ${selectedNode === node.id ? 'selected' : ''} ${edgeStart === node.id ? 'edge-start' : ''}`}
                    onClick={(e) => handleNodeClick(node.id, e)}
                    onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                    style={{ cursor: mode === 'select' ? 'move' : 'pointer' }}
                  />
                  <text
                    x={node.x}
                    y={node.y + 5}
                    className="node-label"
                    style={{ pointerEvents: 'none' }}
                  >
                    {node.id}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="legend">
            <div className="legend-item">
              <div className="legend-color start" />
              <span>Start</span>
            </div>
            <div className="legend-item">
              <div className="legend-color end" />
              <span>End</span>
            </div>
            <div className="legend-item">
              <div className="legend-color visited" />
              <span>Visited</span>
            </div>
            <div className="legend-item">
              <div className="legend-color path" />
              <span>Path</span>
            </div>
          </div>

          <div className="algorithm-info">
            <h3>{ALGORITHM_INFO[algorithm].name}</h3>
            <p>{ALGORITHM_INFO[algorithm].description}</p>
            <div className="complexity">
              <span>Weighted: <code>{ALGORITHM_INFO[algorithm].weighted ? 'Yes' : 'No'}</code></span>
              <span>Shows edge weights: <code>{ALGORITHM_INFO[algorithm].weighted ? 'Yes' : 'No'}</code></span>
            </div>
          </div>

          <div className="instructions">
            <h4>How to use:</h4>
            <ul>
              <li><strong>Select/Move:</strong> Click to select a node, drag to move it</li>
              <li><strong>Add Node:</strong> Click on empty space to add a node</li>
              <li><strong>Add Edge:</strong> Click two nodes to connect them</li>
              <li><strong>Delete:</strong> Click a node or edge to remove it</li>
            </ul>
          </div>
        </>
      ) : (
        <section className="pathfinding-code-section" aria-label="C plus plus implementations for pathfinding algorithms">
          <div className="pathfinding-code-header">
            <h3>C++ Implementations</h3>
            <span>Includes all pathfinding algorithms used in this visualizer.</span>
          </div>

          <div className="pathfinding-code-toolbar">
            <label>Algorithm:</label>
            <select
              value={cppAlgorithm}
              onChange={(e) => setCppAlgorithm(e.target.value as Algorithm)}
            >
              <option value="bfs">BFS</option>
              <option value="dfs">DFS</option>
              <option value="dijkstra">Dijkstra's</option>
              <option value="astar">A* Search</option>
            </select>
          </div>

          <div className="pathfinding-code-stack">
            <article className="pathfinding-code-card">
              <h4>{PATHFINDING_CPP_IMPLEMENTATIONS[cppAlgorithm].title}</h4>
              <div className="pathfinding-code-block">
                <pre>{PATHFINDING_CPP_IMPLEMENTATIONS[cppAlgorithm].source}</pre>
              </div>
            </article>
          </div>
        </section>
      )}
    </div>
  )
}

export default PathfindingVisualizer
