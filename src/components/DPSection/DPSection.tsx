import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import './DPSection.css'
import climbingStairsCppSource from './cpp/climbing_stairs.cpp?raw'
import climbingStairsMemoCppSource from './cpp/climbing_stairs_memo.cpp?raw'
import houseRobberCppSource from './cpp/house_robber.cpp?raw'
import houseRobberMemoCppSource from './cpp/house_robber_memo.cpp?raw'

interface ClimbingStairsResult {
  ways: number
  dp: number[]
  transitions: string[]
}

type VisualMode = 'dp' | 'compare' | 'tree'

interface DryRunRow {
  step: number
  expression: string
  substitution: string
  result: number
  type: 'base' | 'transition'
}

interface HouseRobberResult {
  maxLoot: number
  dp: number[]
  transitions: string[]
}

interface HouseDryRunRow {
  houseIndex: number
  amount: number
  skip: number
  take: number
  chosen: number
}

interface TreeGraphNode {
  id: string
  label: string
  valueText: string
  x: number
  y: number
  root: boolean
  leaf: boolean
}

interface TreeGraphEdge {
  id: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  side: 'left' | 'right'
}

const DP_CATEGORIES = [
  {
    title: '1D Dynamic Programming',
    description: 'Linear-state problems where each state depends on previous indices.',
    placeholders: ['Climbing Stairs', 'House Robber', 'Coin Change'],
  },
  {
    title: '2D Dynamic Programming',
    description: 'Grid, matrix, or two-parameter state transitions.',
    placeholders: ['Unique Paths', 'Longest Common Subsequence', 'Edit Distance'],
  },
  {
    title: 'Knapsack Pattern',
    description: 'Include/exclude decisions with capacity or constraints.',
    placeholders: ['0/1 Knapsack', 'Partition Equal Subset Sum', 'Target Sum'],
  },
  {
    title: 'Longest Increasing Subsequence Pattern',
    description: 'Subsequence optimization with ordering constraints.',
    placeholders: ['LIS', 'Russian Doll Envelopes', 'Number of LIS'],
  },
  {
    title: 'Interval Dynamic Programming',
    description: 'State depends on ranges [l, r] and split points.',
    placeholders: ['Matrix Chain Multiplication', 'Burst Balloons', 'Palindrome Partitioning'],
  },
  {
    title: 'Tree Dynamic Programming',
    description: 'DP states on tree nodes with parent-child decisions.',
    placeholders: ['House Robber III', 'Diameter Variants', 'Tree Matching'],
  },
]

const solveClimbingStairs = (n: number): ClimbingStairsResult => {
  if (n <= 1) {
    return {
      ways: 1,
      dp: [1, 1].slice(0, n + 1),
      transitions: [`dp(${n}) = 1 (base case)`],
    }
  }

  const dp = Array.from({ length: n + 1 }, () => 0)
  const transitions: string[] = []
  dp[0] = 1
  dp[1] = 1
  transitions.push('dp(0) = 1')
  transitions.push('dp(1) = 1')

  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2]
    transitions.push(`dp(${i}) = dp(${i - 1}) + dp(${i - 2}) = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}`)
  }

  return { ways: dp[n], dp, transitions }
}

const buildClimbingStairsDryRun = (dp: number[]): DryRunRow[] => {
  if (dp.length === 0) return []

  const rows: DryRunRow[] = [
    {
      step: 0,
      expression: 'dp[0] = 1',
      substitution: 'Base case',
      result: 1,
      type: 'base',
    },
  ]

  if (dp.length > 1) {
    rows.push({
      step: 1,
      expression: 'dp[1] = 1',
      substitution: 'Base case',
      result: 1,
      type: 'base',
    })
  }

  for (let i = 2; i < dp.length; i++) {
    rows.push({
      step: i,
      expression: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}]`,
      substitution: `${dp[i - 1]} + ${dp[i - 2]}`,
      result: dp[i],
      type: 'transition',
    })
  }

  return rows
}

const buildNaiveRecursionCallCounts = (n: number): number[] => {
  if (n === 0) return [1]

  const calls = Array.from({ length: n + 1 }, () => 0)
  calls[0] = 1
  if (n >= 1) calls[1] = 1

  for (let i = 2; i <= n; i++) {
    calls[i] = 1 + calls[i - 1] + calls[i - 2]
  }

  return calls
}

const buildRecursionTreeLevels = (
  root: number,
  maxDepth: number,
  childrenResolver: (value: number) => [number, number] | null,
  labelResolver: (value: number) => string
): Array<Array<string | null>> => {
  const numericLevels: Array<Array<number | null>> = [[root]]

  for (let depth = 0; depth < maxDepth - 1; depth++) {
    const currentLevel = numericLevels[depth]
    const nextLevel: Array<number | null> = []
    let hasAnyRealNode = false

    for (const value of currentLevel) {
      if (value === null) {
        nextLevel.push(null, null)
        continue
      }

      const children = childrenResolver(value)
      if (!children) {
        nextLevel.push(null, null)
        continue
      }

      nextLevel.push(children[0], children[1])
      hasAnyRealNode = true
    }

    if (!hasAnyRealNode) break
    numericLevels.push(nextLevel)
  }

  return numericLevels.map((level) => level.map((value) => (value === null ? null : labelResolver(value))))
}

const buildTreeGraph = (
  levels: Array<Array<string | null>>,
  valueResolver: (label: string) => string
) => {
  const maxNodes = Math.max(1, ...levels.map((level) => level.length))
  const width = maxNodes * 68 + 48
  const height = levels.length * 68 + 28

  const nodes: TreeGraphNode[] = []
  const edges: TreeGraphEdge[] = []

  const nodeMap = new Map<string, TreeGraphNode>()

  levels.forEach((level, levelIndex) => {
    const slots = level.length
    const segment = width / slots

    level.forEach((label, slotIndex) => {
      if (!label) return

      const childrenLevel = levels[levelIndex + 1]
      const leftChild = childrenLevel ? childrenLevel[slotIndex * 2] : null
      const rightChild = childrenLevel ? childrenLevel[slotIndex * 2 + 1] : null

      const node: TreeGraphNode = {
        id: `${levelIndex}-${slotIndex}`,
        label,
        valueText: valueResolver(label),
        x: (slotIndex + 0.5) * segment,
        y: 24 + levelIndex * 68,
        root: levelIndex === 0,
        leaf: !leftChild && !rightChild,
      }

      nodeMap.set(node.id, node)
      nodes.push(node)

      if (levelIndex > 0) {
        const parentSlot = Math.floor(slotIndex / 2)
        const parentId = `${levelIndex - 1}-${parentSlot}`
        const parent = nodeMap.get(parentId)

        if (parent) {
          edges.push({
            id: `${parent.id}->${node.id}`,
            fromX: parent.x,
            fromY: parent.y + 14,
            toX: node.x,
            toY: node.y - 14,
            side: slotIndex % 2 === 0 ? 'left' : 'right',
          })
        }
      }
    })
  })

  return { width, height, nodes, edges }
}

const generateHouses = (count: number): number[] => {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 17) + 4)
}

const solveHouseRobber = (houses: number[]): HouseRobberResult => {
  const n = houses.length
  if (n === 0) return { maxLoot: 0, dp: [0], transitions: ['dp[0] = 0 (no houses)'] }

  const dp = Array.from({ length: n + 1 }, () => 0)
  const transitions: string[] = []
  dp[0] = 0
  dp[1] = houses[0]
  transitions.push('dp[0] = 0')
  transitions.push(`dp[1] = houses[0] = ${houses[0]}`)

  for (let i = 2; i <= n; i++) {
    const skip = dp[i - 1]
    const take = houses[i - 1] + dp[i - 2]
    dp[i] = Math.max(skip, take)
    transitions.push(
      `dp[${i}] = max(dp[${i - 1}], houses[${i - 1}] + dp[${i - 2}]) = max(${skip}, ${houses[i - 1]} + ${dp[i - 2]}) = ${dp[i]}`
    )
  }

  return { maxLoot: dp[n], dp, transitions }
}

const buildHouseRobberDryRun = (houses: number[], dp: number[]): HouseDryRunRow[] => {
  const rows: HouseDryRunRow[] = []
  for (let i = 0; i < houses.length; i++) {
    const oneBased = i + 1
    const skip = dp[Math.max(0, oneBased - 1)]
    const take = houses[i] + dp[Math.max(0, oneBased - 2)]
    const chosen = dp[oneBased]
    rows.push({
      houseIndex: i,
      amount: houses[i],
      skip,
      take,
      chosen,
    })
  }
  return rows
}

type ProblemView = 'visual' | 'cpp'

function DPSection() {
  const [selectedProblem, setSelectedProblem] = useState<'climbing' | 'house'>('climbing')
  const [stairsCount, setStairsCount] = useState(6)
  const [problemView, setProblemView] = useState<ProblemView>('visual')
  const [visualMode, setVisualMode] = useState<VisualMode>('dp')
  const [currentStep, setCurrentStep] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showClimbingExplanation, setShowClimbingExplanation] = useState(true)

  const [houseCount, setHouseCount] = useState(7)
  const [houses, setHouses] = useState<number[]>(() => generateHouses(7))
  const [houseProblemView, setHouseProblemView] = useState<ProblemView>('visual')
  const [houseVisualMode, setHouseVisualMode] = useState<VisualMode>('dp')
  const [currentHouseIndex, setCurrentHouseIndex] = useState(0)
  const [isHousePlaying, setIsHousePlaying] = useState(false)
  const [showHouseExplanation, setShowHouseExplanation] = useState(true)

  const climbingStairs = useMemo(() => solveClimbingStairs(stairsCount), [stairsCount])
  const dryRunRows = useMemo(() => buildClimbingStairsDryRun(climbingStairs.dp), [climbingStairs.dp])
  const recursionCallCounts = useMemo(() => buildNaiveRecursionCallCounts(stairsCount), [stairsCount])
  const houseRobber = useMemo(() => solveHouseRobber(houses), [houses])
  const houseDryRunRows = useMemo(() => buildHouseRobberDryRun(houses, houseRobber.dp), [houses, houseRobber.dp])
  const houseRecursionCallCounts = useMemo(() => buildNaiveRecursionCallCounts(houses.length), [houses.length])
  const climbingTreeLevels = useMemo(
    () => buildRecursionTreeLevels(currentStep, 5, (value) => (value <= 1 ? null : [value - 1, value - 2]), (value) => `f(${value})`),
    [currentStep]
  )
  const houseTreeLevels = useMemo(
    () => buildRecursionTreeLevels(currentHouseIndex + 1, 5, (value) => (value <= 0 ? null : [value - 1, value - 2]), (value) => `R(${value})`),
    [currentHouseIndex]
  )
  const climbingTreeGraph = useMemo(
    () =>
      buildTreeGraph(climbingTreeLevels, (label) => {
        const match = label.match(/f\((\d+)\)/)
        if (!match) return 'value: ?'
        const step = Number(match[1])
        const ways = climbingStairs.dp[step]
        return `ways=${ways ?? '?'} `
      }),
    [climbingTreeLevels, climbingStairs.dp]
  )
  const houseTreeGraph = useMemo(
    () =>
      buildTreeGraph(houseTreeLevels, (label) => {
        const match = label.match(/R\((\d+)\)/)
        if (!match) return 'value: ?'
        const index = Number(match[1])
        const best = houseRobber.dp[index]
        return `best=${best ?? '?'} `
      }),
    [houseTreeLevels, houseRobber.dp]
  )
  const climbingTreeDepth = climbingTreeLevels.length
  const houseTreeDepth = houseTreeLevels.length

  useEffect(() => {
    setCurrentStep(Math.min(1, stairsCount))
    setIsPlaying(false)
  }, [stairsCount])

  useEffect(() => {
    if (problemView !== 'visual') {
      setIsPlaying(false)
    }
  }, [problemView])

  useEffect(() => {
    setHouses(generateHouses(houseCount))
  }, [houseCount])

  useEffect(() => {
    setCurrentHouseIndex(0)
    setIsHousePlaying(false)
  }, [houses])

  useEffect(() => {
    if (houseProblemView !== 'visual') {
      setIsHousePlaying(false)
    }
  }, [houseProblemView])

  useEffect(() => {
    if (!isPlaying || problemView !== 'visual') return

    if (currentStep >= stairsCount) {
      setIsPlaying(false)
      return
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, stairsCount))
    }, 700)

    return () => clearTimeout(timer)
  }, [isPlaying, problemView, currentStep, stairsCount])

  useEffect(() => {
    if (!isHousePlaying || houseProblemView !== 'visual') return
    if (currentHouseIndex >= houses.length - 1) {
      setIsHousePlaying(false)
      return
    }

    const timer = setTimeout(() => {
      setCurrentHouseIndex((prev) => Math.min(prev + 1, houses.length - 1))
    }, 800)

    return () => clearTimeout(timer)
  }, [isHousePlaying, houseProblemView, currentHouseIndex, houses.length])

  const visibleTransitionCount = Math.min(currentStep + 1, climbingStairs.transitions.length)
  const isComplete = currentStep === stairsCount
  const currentRecursionCalls = recursionCallCounts[currentStep] ?? 0
  const currentDpTransitions = Math.max(0, currentStep - 1)
  const currentDpStates = currentStep + 1
  const improvementFactor = currentDpStates > 0 ? (currentRecursionCalls / currentDpStates).toFixed(1) : '0.0'
  const visibleHouseTransitions = Math.min(currentHouseIndex + 2, houseRobber.transitions.length)
  const houseComplete = currentHouseIndex === houses.length - 1
  const currentHouseRecCalls = houseRecursionCallCounts[currentHouseIndex + 1] ?? 1
  const currentHouseDpStates = currentHouseIndex + 2
  const currentHouseDpTransitions = Math.max(0, currentHouseIndex)
  const houseImprovement = currentHouseDpStates > 0
    ? (currentHouseRecCalls / currentHouseDpStates).toFixed(1)
    : '0.0'

  const STEP_WIDTH = 52
  const STEP_GAP = 5
  const TRACK_HEIGHT = 260
  const BASE_STEP_HEIGHT = 32
  const STEP_HEIGHT_GAIN = 9
  const TRACK_PADDING_X = 10

  const stepTopY = (step: number) => TRACK_HEIGHT - (BASE_STEP_HEIGHT + step * STEP_HEIGHT_GAIN) - 8
  const stepCenterX = (step: number) => TRACK_PADDING_X + (step - 1) * (STEP_WIDTH + STEP_GAP) + STEP_WIDTH / 2
  const trackCanvasWidth = TRACK_PADDING_X * 2 + stairsCount * STEP_WIDTH + Math.max(0, stairsCount - 1) * STEP_GAP

  const choicePathArrows = useMemo(() => {
    if (currentStep < 2) return []

    const targetX = stepCenterX(currentStep)
    const targetY = stepTopY(currentStep) + 8
    const sources = [currentStep - 1, currentStep - 2]

    return sources.map((sourceStep, index) => {
      const fromGround = sourceStep <= 0
      const sourceX = fromGround ? 6 : stepCenterX(sourceStep)
      const sourceY = fromGround ? TRACK_HEIGHT - 22 : stepTopY(sourceStep) + 8

      const controlX = (sourceX + targetX) / 2
      const controlY = Math.min(sourceY, targetY) - (fromGround ? 38 : 26)

      return {
        id: `${sourceStep}-${currentStep}`,
        fromLabel: fromGround ? 'dp[0]' : `dp[${sourceStep}]`,
        path: `M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`,
        labelX: controlX,
        labelY: controlY - 9,
        variant: index === 0 ? 'primary' : 'secondary',
      }
    })
  }, [currentStep])

  const stairStageStyle = {
    ['--current-step']: currentStep,
    ['--total-steps']: stairsCount,
  } as CSSProperties

  return (
    <section className="visualizer-container dp-section">
      <div className="dp-header">
        <h2>Dynamic Programming Hub</h2>
        <p>
          This is the base structure for DP module. From here, we will add problems one by one with
          clear explanations, state transitions, and interactive visualizations.
        </p>
      </div>

      <div className="dp-roadmap">
        <span className="dp-badge">Phase 1: Structure</span>
        <span className="dp-badge">Phase 2: Problem Implementations</span>
        <span className="dp-badge dp-badge-muted">Phase 3: Interactive Visualizations</span>
      </div>

      <div className="dp-problem-picker">
        <label htmlFor="dp-problem-select">Select Problem</label>
        <select
          id="dp-problem-select"
          value={selectedProblem}
          onChange={(e) => setSelectedProblem(e.target.value as 'climbing' | 'house')}
        >
          <option value="climbing">Climbing Stairs</option>
          <option value="house">House Robber</option>
        </select>
      </div>

      {selectedProblem === 'climbing' && (
      <article className="dp-problem-card">
        <div className="dp-problem-header">
          <h3>Problem 1: Climbing Stairs</h3>
          <span className="dp-problem-tag">1D DP</span>
        </div>

        <p className="dp-problem-description">
          You can climb either 1 or 2 steps at a time. Find the number of distinct ways to reach step n.
          Recurrence: dp(i) = dp(i - 1) + dp(i - 2).
        </p>

        <section className="dp-explanation" aria-label="Problem explanation">
          <div className="dp-explanation-header">
            <h4>Explanation</h4>
            <button
              type="button"
              className="dp-explain-toggle"
              onClick={() => setShowClimbingExplanation((prev) => !prev)}
            >
              {showClimbingExplanation ? 'Hide' : 'Show'}
            </button>
          </div>
          {showClimbingExplanation && (
            <div className="dp-explanation-grid">
            <article className="dp-explanation-card">
              <h5>Intuition</h5>
              <p>
                To reach step i, your last move is either from step i-1 (one jump) or i-2 (two jumps).
                So total ways to reach i is the sum of ways to reach these two previous steps.
              </p>
            </article>

            <article className="dp-explanation-card">
              <h5>Recurrence</h5>
              <p>dp[i] = dp[i-1] + dp[i-2]</p>
              <p>Base cases: dp[0] = 1, dp[1] = 1</p>
            </article>

            <article className="dp-explanation-card">
              <h5>Why DP Helps</h5>
              <p>
                Naive recursion recomputes the same subproblems many times. DP stores results once and
                reuses them, reducing repeated work drastically.
              </p>
            </article>

            <article className="dp-explanation-card">
              <h5>Complexity</h5>
              <p>Tabulation: Time O(n), Space O(n)</p>
              <p>Memoization: Time O(n), Space O(n) + recursion stack</p>
            </article>
            </div>
          )}
        </section>

        <div className="dp-view-toggle" role="tablist" aria-label="Climbing Stairs problem view">
          <button
            type="button"
            className={`dp-view-btn ${problemView === 'visual' ? 'active' : ''}`}
            onClick={() => setProblemView('visual')}
            aria-selected={problemView === 'visual'}
          >
            Visual Walkthrough
          </button>
          <button
            type="button"
            className={`dp-view-btn ${problemView === 'cpp' ? 'active' : ''}`}
            onClick={() => setProblemView('cpp')}
            aria-selected={problemView === 'cpp'}
          >
            C++ Solution
          </button>
        </div>

        {problemView === 'visual' ? (
          <>
            <div className="dp-problem-controls">
              <label htmlFor="stairs-count">Number of steps: {stairsCount}</label>
              <input
                id="stairs-count"
                type="range"
                min="1"
                max="20"
                value={stairsCount}
                onChange={(e) => setStairsCount(Number(e.target.value))}
              />
            </div>

            <div className="dp-mode-toggle" role="tablist" aria-label="Climbing stairs visualization mode">
              <button
                type="button"
                className={`dp-mode-btn ${visualMode === 'dp' ? 'active' : ''}`}
                onClick={() => setVisualMode('dp')}
                aria-selected={visualMode === 'dp'}
              >
                DP Mode
              </button>
              <button
                type="button"
                className={`dp-mode-btn ${visualMode === 'compare' ? 'active' : ''}`}
                onClick={() => setVisualMode('compare')}
                aria-selected={visualMode === 'compare'}
              >
                Recursion vs DP
              </button>
              <button
                type="button"
                className={`dp-mode-btn ${visualMode === 'tree' ? 'active' : ''}`}
                onClick={() => setVisualMode('tree')}
                aria-selected={visualMode === 'tree'}
              >
                Recursion Tree
              </button>
            </div>

            <div className="dp-player-controls">
              <button
                type="button"
                className="dp-player-btn"
                onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
                disabled={currentStep <= 1 || isPlaying}
              >
                Previous
              </button>
              <button
                type="button"
                className="dp-player-btn"
                onClick={() => setIsPlaying((prev) => !prev)}
                disabled={isComplete}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                className="dp-player-btn"
                onClick={() => setCurrentStep((prev) => Math.min(prev + 1, stairsCount))}
                disabled={currentStep >= stairsCount || isPlaying}
              >
                Next
              </button>
              <button
                type="button"
                className="dp-player-btn dp-player-reset"
                onClick={() => {
                  setCurrentStep(1)
                  setIsPlaying(false)
                }}
              >
                Reset
              </button>
            </div>

            <div className="dp-answer">
              <span>
                {isComplete
                  ? `Ways to reach step ${stairsCount}:`
                  : `Computing step ${currentStep} of ${stairsCount}`}
              </span>
              <strong>{isComplete ? climbingStairs.ways : '...'}</strong>
            </div>

            <div
              className="dp-stair-stage"
              style={stairStageStyle}
            >
              <div className="dp-ground-cell">
                <span>dp[0]</span>
                <strong>{climbingStairs.dp[0]}</strong>
              </div>

              <div className="dp-stairs-track">
                {Array.from({ length: stairsCount }, (_, index) => {
                  const stepNumber = index + 1
                  const revealed = stepNumber <= currentStep
                  const current = stepNumber === currentStep

                  return (
                    <div
                      key={stepNumber}
                      className={`dp-stair-step ${revealed ? 'revealed' : ''} ${current ? 'current' : ''}`}
                      style={{ ['--step-height']: `${32 + stepNumber * 9}px` } as CSSProperties}
                    >
                      <span>dp[{stepNumber}]</span>
                      <strong>{revealed ? climbingStairs.dp[stepNumber] : '?'}</strong>
                    </div>
                  )
                })}

                {choicePathArrows.length > 0 && (
                  <div
                    className="dp-choice-overlay-svg-wrap"
                    style={{ width: `${trackCanvasWidth}px`, height: `${TRACK_HEIGHT}px` }}
                    aria-hidden
                  >
                    <svg
                      className="dp-choice-overlay-svg"
                      viewBox={`0 0 ${trackCanvasWidth} ${TRACK_HEIGHT}`}
                    >
                      <defs>
                        <marker id="arrowhead-primary" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                          <path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" />
                        </marker>
                        <marker id="arrowhead-secondary" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                          <path d="M0,0 L0,6 L6,3 z" fill="#818cf8" />
                        </marker>
                      </defs>

                      {choicePathArrows.map((arrow) => (
                        <g key={arrow.id} className={`dp-choice-path ${arrow.variant}`}>
                          <path
                            d={arrow.path}
                            className="dp-choice-line-glow"
                            markerEnd={`url(#arrowhead-${arrow.variant})`}
                          />
                          <path
                            d={arrow.path}
                            className="dp-choice-line"
                            markerEnd={`url(#arrowhead-${arrow.variant})`}
                          />
                          <text
                            x={arrow.labelX}
                            y={arrow.labelY}
                            className="dp-choice-label"
                            textAnchor="middle"
                          >
                            {arrow.fromLabel}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                )}

                <div className={`dp-climber ${isPlaying ? 'moving' : ''}`}>
                  P
                </div>
              </div>
            </div>

            {visualMode === 'compare' && (
              <div className="dp-compare-panel">
                <div className="dp-compare-cards">
                  <div className="dp-compare-card recursion">
                    <h5>Naive Recursion</h5>
                    <p>Function calls for n = {currentStep}</p>
                    <strong>{currentRecursionCalls}</strong>
                  </div>
                  <div className="dp-compare-card dynamic">
                    <h5>Dynamic Programming</h5>
                    <p>States + transitions used</p>
                    <strong>{currentDpStates} states / {currentDpTransitions} transitions</strong>
                  </div>
                  <div className="dp-compare-card highlight">
                    <h5>Efficiency Gain</h5>
                    <p>Approx call-to-state ratio</p>
                    <strong>{improvementFactor}x</strong>
                  </div>
                </div>

                <div className="dp-compare-bars">
                  {recursionCallCounts.slice(1).map((calls, idx) => {
                    const step = idx + 1
                    const maxCalls = recursionCallCounts[recursionCallCounts.length - 1] || 1
                    const height = Math.max(8, Math.round((calls / maxCalls) * 82))
                    return (
                      <div key={step} className={`dp-compare-bar ${step === currentStep ? 'active' : ''}`}>
                        <div style={{ height: `${height}%` }} />
                        <span>{step}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {visualMode === 'tree' && (
              <section className="dp-recursion-tree-section" aria-label="Climbing stairs recursion tree">
                <div className="dp-recursion-tree-header">
                  <h4>Recursion Tree (Naive)</h4>
                  <span>Root: f({currentStep}) | Depth: {climbingTreeDepth} | Nodes: {climbingTreeGraph.nodes.length}</span>
                </div>
                <div className="dp-recursion-context">
                  <span className="ctx root">Root</span>
                  <span className="ctx internal">Internal</span>
                  <span className="ctx leaf">Leaf / Base</span>
                  <span className="ctx left">Left branch (n-1)</span>
                  <span className="ctx right">Right branch (n-2)</span>
                  <span className="ctx value">Node value: ways at that state</span>
                </div>
                <div className="dp-recursion-tree-canvas">
                  <svg
                    className="dp-recursion-svg"
                    viewBox={`0 0 ${climbingTreeGraph.width} ${climbingTreeGraph.height}`}
                  >
                    {climbingTreeGraph.edges.map((edge) => (
                      <line
                        key={edge.id}
                        className={`dp-recursion-edge ${edge.side}`}
                        x1={edge.fromX}
                        y1={edge.fromY}
                        x2={edge.toX}
                        y2={edge.toY}
                      />
                    ))}

                    {climbingTreeGraph.nodes.map((node) => (
                      <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                        <circle className={`dp-recursion-node ${node.root ? 'root' : ''} ${node.leaf ? 'leaf' : 'internal'}`} r="15" />
                        <text className="dp-recursion-node-label" textAnchor="middle" dominantBaseline="middle">
                          {node.label}
                        </text>
                        <text className="dp-recursion-node-value" textAnchor="middle" y="26">
                          {node.valueText}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </section>
            )}

            <div className="dp-transitions">
              <h4>State Transitions</h4>
              <ul>
                {climbingStairs.transitions.slice(0, visibleTransitionCount).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>

            <div className="dp-dry-run">
              <div className="dp-dry-run-header">
                <h4>Detailed Dry Run</h4>
                <span>Current focus: dp[{currentStep}]</span>
              </div>

              <div className="dp-dry-run-table-wrap">
                <table className="dp-dry-run-table">
                  <thead>
                    <tr>
                      <th>Step</th>
                      <th>Formula</th>
                      <th>Substitution</th>
                      <th>Result</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dryRunRows.map((row) => {
                      const isCurrent = row.step === currentStep
                      const isDone = row.step <= currentStep

                      return (
                        <tr
                          key={row.step}
                          className={`dp-dry-run-row ${isCurrent ? 'current' : ''} ${isDone ? 'done' : 'pending'}`}
                        >
                          <td>dp[{row.step}]</td>
                          <td>{row.expression}</td>
                          <td>{row.substitution}</td>
                          <td>{isDone ? row.result : '?'}</td>
                          <td>
                            {isCurrent
                              ? 'Computing'
                              : isDone
                                ? 'Computed'
                                : 'Pending'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="dp-code-stack" aria-label="C plus plus solutions">
            <section className="dp-code-section">
              <h4>C++ Tabulation (Bottom-Up)</h4>
              <div className="dp-code-block">
                <pre>{climbingStairsCppSource}</pre>
              </div>
            </section>

            <section className="dp-code-section">
              <h4>C++ Memoization (Top-Down)</h4>
              <div className="dp-code-block">
                <pre>{climbingStairsMemoCppSource}</pre>
              </div>
            </section>
          </div>
        )}
      </article>
      )}

      {selectedProblem === 'house' && (
      <article className="dp-problem-card">
        <div className="dp-problem-header">
          <h3>Problem 2: House Robber</h3>
          <span className="dp-problem-tag">1D DP</span>
        </div>

        <p className="dp-problem-description">
          You are given money in each house on a street. You cannot rob two adjacent houses.
          Find the maximum money you can rob without alerting the police.
        </p>

        <section className="dp-explanation" aria-label="House robber explanation">
          <div className="dp-explanation-header">
            <h4>Explanation</h4>
            <button
              type="button"
              className="dp-explain-toggle"
              onClick={() => setShowHouseExplanation((prev) => !prev)}
            >
              {showHouseExplanation ? 'Hide' : 'Show'}
            </button>
          </div>
          {showHouseExplanation && (
            <div className="dp-explanation-grid">
              <article className="dp-explanation-card">
                <h5>Intuition</h5>
                <p>
                  At each house i, you either skip it (keep previous best) or rob it
                  (take its money plus best till i-2).
                </p>
              </article>
              <article className="dp-explanation-card">
                <h5>Recurrence</h5>
                <p>dp[i] = max(dp[i-1], houses[i-1] + dp[i-2])</p>
                <p>Base cases: dp[0] = 0, dp[1] = houses[0]</p>
              </article>
              <article className="dp-explanation-card">
                <h5>Why DP Helps</h5>
                <p>
                  Naive recursion branches at every house and repeats subproblems. DP caches/bottoms-up,
                  reducing complexity to linear time.
                </p>
              </article>
              <article className="dp-explanation-card">
                <h5>Complexity</h5>
                <p>Tabulation: Time O(n), Space O(n)</p>
                <p>Memoization: Time O(n), Space O(n) + recursion stack</p>
              </article>
            </div>
          )}
        </section>

        <div className="dp-view-toggle" role="tablist" aria-label="House robber problem view">
          <button
            type="button"
            className={`dp-view-btn ${houseProblemView === 'visual' ? 'active' : ''}`}
            onClick={() => setHouseProblemView('visual')}
            aria-selected={houseProblemView === 'visual'}
          >
            Visual Walkthrough
          </button>
          <button
            type="button"
            className={`dp-view-btn ${houseProblemView === 'cpp' ? 'active' : ''}`}
            onClick={() => setHouseProblemView('cpp')}
            aria-selected={houseProblemView === 'cpp'}
          >
            C++ Solution
          </button>
        </div>

        {houseProblemView === 'visual' ? (
          <>
            <div className="dp-problem-controls">
              <label htmlFor="house-count">Number of houses: {houseCount}</label>
              <input
                id="house-count"
                type="range"
                min="4"
                max="12"
                value={houseCount}
                onChange={(e) => setHouseCount(Number(e.target.value))}
              />
            </div>

            <div className="dp-player-controls">
              <button
                type="button"
                className="dp-player-btn"
                onClick={() => setCurrentHouseIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentHouseIndex <= 0 || isHousePlaying}
              >
                Previous
              </button>
              <button
                type="button"
                className="dp-player-btn"
                onClick={() => setIsHousePlaying((prev) => !prev)}
                disabled={houseComplete}
              >
                {isHousePlaying ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                className="dp-player-btn"
                onClick={() => setCurrentHouseIndex((prev) => Math.min(prev + 1, houses.length - 1))}
                disabled={currentHouseIndex >= houses.length - 1 || isHousePlaying}
              >
                Next
              </button>
              <button
                type="button"
                className="dp-player-btn dp-player-reset"
                onClick={() => {
                  setCurrentHouseIndex(0)
                  setIsHousePlaying(false)
                }}
              >
                Reset
              </button>
              <button
                type="button"
                className="dp-player-btn"
                onClick={() => setHouses(generateHouses(houseCount))}
                disabled={isHousePlaying}
              >
                Randomize Houses
              </button>
            </div>

            <div className="dp-mode-toggle" role="tablist" aria-label="House robber visualization mode">
              <button
                type="button"
                className={`dp-mode-btn ${houseVisualMode === 'dp' ? 'active' : ''}`}
                onClick={() => setHouseVisualMode('dp')}
                aria-selected={houseVisualMode === 'dp'}
              >
                DP Mode
              </button>
              <button
                type="button"
                className={`dp-mode-btn ${houseVisualMode === 'compare' ? 'active' : ''}`}
                onClick={() => setHouseVisualMode('compare')}
                aria-selected={houseVisualMode === 'compare'}
              >
                Recursion vs DP
              </button>
              <button
                type="button"
                className={`dp-mode-btn ${houseVisualMode === 'tree' ? 'active' : ''}`}
                onClick={() => setHouseVisualMode('tree')}
                aria-selected={houseVisualMode === 'tree'}
              >
                Recursion Tree
              </button>
            </div>

            <div className="dp-answer">
              <span>
                {houseComplete
                  ? 'Maximum loot possible:'
                  : `Evaluating house ${currentHouseIndex + 1} of ${houses.length}`}
              </span>
              <strong>{houseComplete ? houseRobber.maxLoot : '...'}</strong>
            </div>

            <div className="house-track" aria-label="House robber visualization">
              {houses.map((value, idx) => {
                const isRevealed = idx <= currentHouseIndex
                const isCurrent = idx === currentHouseIndex
                return (
                  <div
                    key={idx}
                    className={`house-card ${isRevealed ? 'revealed' : ''} ${isCurrent ? 'current' : ''}`}
                  >
                    <div className="house-icon">H</div>
                    <div className="house-label">House {idx + 1}</div>
                    <div className="house-value">${value}</div>
                    <div className="house-dp">best: {isRevealed ? houseRobber.dp[idx + 1] : '?'}</div>
                  </div>
                )
              })}
            </div>

            {houseVisualMode === 'compare' && (
              <div className="dp-compare-panel">
                <div className="dp-compare-cards">
                  <div className="dp-compare-card recursion">
                    <h5>Naive Recursion</h5>
                    <p>Function calls for first {currentHouseIndex + 1} houses</p>
                    <strong>{currentHouseRecCalls}</strong>
                  </div>
                  <div className="dp-compare-card dynamic">
                    <h5>Dynamic Programming</h5>
                    <p>States + transitions used</p>
                    <strong>{currentHouseDpStates} states / {currentHouseDpTransitions} transitions</strong>
                  </div>
                  <div className="dp-compare-card highlight">
                    <h5>Efficiency Gain</h5>
                    <p>Approx call-to-state ratio</p>
                    <strong>{houseImprovement}x</strong>
                  </div>
                </div>
              </div>
            )}

            {houseVisualMode === 'tree' && (
              <section className="dp-recursion-tree-section" aria-label="House robber recursion tree">
                <div className="dp-recursion-tree-header">
                  <h4>Recursion Tree (Naive)</h4>
                  <span>Root: R({currentHouseIndex + 1}) | Depth: {houseTreeDepth} | Nodes: {houseTreeGraph.nodes.length}</span>
                </div>
                <div className="dp-recursion-context">
                  <span className="ctx root">Root</span>
                  <span className="ctx internal">Internal</span>
                  <span className="ctx leaf">Leaf / Base</span>
                  <span className="ctx left">Left branch (i-1)</span>
                  <span className="ctx right">Right branch (i-2)</span>
                  <span className="ctx value">Node value: max loot till that state</span>
                </div>
                <div className="dp-recursion-tree-canvas">
                  <svg
                    className="dp-recursion-svg"
                    viewBox={`0 0 ${houseTreeGraph.width} ${houseTreeGraph.height}`}
                  >
                    {houseTreeGraph.edges.map((edge) => (
                      <line
                        key={edge.id}
                        className={`dp-recursion-edge ${edge.side}`}
                        x1={edge.fromX}
                        y1={edge.fromY}
                        x2={edge.toX}
                        y2={edge.toY}
                      />
                    ))}

                    {houseTreeGraph.nodes.map((node) => (
                      <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                        <circle className={`dp-recursion-node ${node.root ? 'root' : ''} ${node.leaf ? 'leaf' : 'internal'}`} r="15" />
                        <text className="dp-recursion-node-label" textAnchor="middle" dominantBaseline="middle">
                          {node.label}
                        </text>
                        <text className="dp-recursion-node-value" textAnchor="middle" y="26">
                          {node.valueText}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </section>
            )}

            <div className="dp-transitions">
              <h4>State Transitions</h4>
              <ul>
                {houseRobber.transitions.slice(0, visibleHouseTransitions).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>

            <div className="dp-dry-run">
              <div className="dp-dry-run-header">
                <h4>Detailed Dry Run</h4>
                <span>Current focus: house {currentHouseIndex + 1}</span>
              </div>

              <div className="dp-dry-run-table-wrap">
                <table className="dp-dry-run-table">
                  <thead>
                    <tr>
                      <th>House</th>
                      <th>Amount</th>
                      <th>Skip (dp[i-1])</th>
                      <th>Take (value + dp[i-2])</th>
                      <th>Chosen (dp[i])</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {houseDryRunRows.map((row) => {
                      const isCurrent = row.houseIndex === currentHouseIndex
                      const isDone = row.houseIndex <= currentHouseIndex
                      return (
                        <tr
                          key={row.houseIndex}
                          className={`dp-dry-run-row ${isCurrent ? 'current' : ''} ${isDone ? 'done' : 'pending'}`}
                        >
                          <td>House {row.houseIndex + 1}</td>
                          <td>{row.amount}</td>
                          <td>{isDone ? row.skip : '?'}</td>
                          <td>{isDone ? row.take : '?'}</td>
                          <td>{isDone ? row.chosen : '?'}</td>
                          <td>
                            {isCurrent
                              ? 'Computing'
                              : isDone
                                ? 'Computed'
                                : 'Pending'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="dp-code-stack" aria-label="House robber C plus plus solutions">
            <section className="dp-code-section">
              <h4>C++ Tabulation (Bottom-Up)</h4>
              <div className="dp-code-block">
                <pre>{houseRobberCppSource}</pre>
              </div>
            </section>

            <section className="dp-code-section">
              <h4>C++ Memoization (Top-Down)</h4>
              <div className="dp-code-block">
                <pre>{houseRobberMemoCppSource}</pre>
              </div>
            </section>
          </div>
        )}
      </article>
      )}

      <div className="dp-grid">
        {DP_CATEGORIES.map((category) => (
          <article key={category.title} className="dp-card">
            <h3>{category.title}</h3>
            <p>{category.description}</p>
            <ul>
              {category.placeholders.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

export default DPSection
