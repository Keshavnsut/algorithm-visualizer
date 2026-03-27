import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import './DPSection.css'
import climbingStairsCppSource from './cpp/climbing_stairs.cpp?raw'
import climbingStairsMemoCppSource from './cpp/climbing_stairs_memo.cpp?raw'
import houseRobberCppSource from './cpp/house_robber.cpp?raw'
import houseRobberMemoCppSource from './cpp/house_robber_memo.cpp?raw'
import coinChangeCppSource from './cpp/coin_change.cpp?raw'
import uniquePathsCppSource from './cpp/unique_paths.cpp?raw'
import lcsCppSource from './cpp/lcs.cpp?raw'
import editDistanceCppSource from './cpp/edit_distance.cpp?raw'

interface ClimbingStairsResult {
  ways: number
  dp: number[]
  transitions: string[]
}

type VisualMode = 'dp' | 'compare' | 'tree' | 'dryrun'

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

interface CoinChangeResult {
  minCoins: number
  dp: number[]
  transitions: string[]
}

interface CoinChangeDryRunRow {
  amount: number
  choices: string
  result: number
}

interface UniquePathsResult {
  paths: number
  dp: number[][]
  transitions: string[]
}

interface UniquePathsDryRunRow {
  row: number
  col: number
  fromTop: number
  fromLeft: number
  value: number
}

interface LcsResult {
  length: number
  dp: number[][]
  transitions: string[]
}

interface LcsDryRunRow {
  row: number
  col: number
  charA: string
  charB: string
  fromTop: number
  fromLeft: number
  fromDiag: number
  value: number
}

interface EditDistanceResult {
  distance: number
  dp: number[][]
  transitions: string[]
}

interface EditDistanceDryRunRow {
  row: number
  col: number
  charA: string
  charB: string
  insertCost: number
  deleteCost: number
  replaceCost: number
  value: number
  action: string
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

const parseCoins = (raw: string): number[] => {
  const parsed = raw
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0)

  const uniqueSorted = Array.from(new Set(parsed)).sort((a, b) => a - b)
  return uniqueSorted.length > 0 ? uniqueSorted : [1, 2, 5]
}

const solveCoinChange = (coins: number[], amount: number): CoinChangeResult => {
  const INF = Number.MAX_SAFE_INTEGER
  const dp = Array.from({ length: amount + 1 }, () => INF)
  const transitions: string[] = []
  dp[0] = 0
  transitions.push('dp[0] = 0')

  for (let a = 1; a <= amount; a++) {
    let best = INF
    for (const coin of coins) {
      if (coin <= a && dp[a - coin] !== INF) {
        best = Math.min(best, dp[a - coin] + 1)
      }
    }
    dp[a] = best
    transitions.push(
      best === INF
        ? `dp[${a}] = INF (not reachable yet)`
        : `dp[${a}] = ${best}`
    )
  }

  return {
    minCoins: dp[amount] === INF ? -1 : dp[amount],
    dp,
    transitions,
  }
}

const buildCoinChangeDryRun = (coins: number[], dp: number[]): CoinChangeDryRunRow[] => {
  const rows: CoinChangeDryRunRow[] = []
  const INF = Number.MAX_SAFE_INTEGER

  for (let amount = 1; amount < dp.length; amount++) {
    const choices = coins
      .filter((coin) => coin <= amount)
      .map((coin) => {
        const prev = dp[amount - coin]
        return prev === INF ? `${coin}:INF` : `${coin}:${prev + 1}`
      })
      .join(' | ')

    rows.push({
      amount,
      choices: choices || 'no valid coin',
      result: dp[amount] === INF ? -1 : dp[amount],
    })
  }

  return rows
}

const solveUniquePaths = (rows: number, cols: number): UniquePathsResult => {
  const dp = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0))
  const transitions: string[] = []

  for (let r = 0; r < rows; r++) dp[r][0] = 1
  for (let c = 0; c < cols; c++) dp[0][c] = 1
  transitions.push('First row and first column are 1 (only one way).')

  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      dp[r][c] = dp[r - 1][c] + dp[r][c - 1]
      transitions.push(`dp[${r}][${c}] = dp[${r - 1}][${c}] + dp[${r}][${c - 1}] = ${dp[r][c]}`)
    }
  }

  return {
    paths: dp[rows - 1][cols - 1],
    dp,
    transitions,
  }
}

const buildUniquePathsDryRun = (dp: number[][]): UniquePathsDryRunRow[] => {
  const rows: UniquePathsDryRunRow[] = []
  for (let r = 1; r < dp.length; r++) {
    for (let c = 1; c < dp[0].length; c++) {
      rows.push({
        row: r,
        col: c,
        fromTop: dp[r - 1][c],
        fromLeft: dp[r][c - 1],
        value: dp[r][c],
      })
    }
  }
  return rows
}

const solveLcs = (a: string, b: string): LcsResult => {
  const rows = a.length + 1
  const cols = b.length + 1
  const dp = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0))
  const transitions: string[] = []

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
        transitions.push(`dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${dp[i][j]} (${a[i - 1]} matches)`)
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
        transitions.push(`dp[${i}][${j}] = max(dp[${i - 1}][${j}], dp[${i}][${j - 1}]) = ${dp[i][j]}`)
      }
    }
  }

  return { length: dp[a.length][b.length], dp, transitions }
}

const buildLcsDryRun = (a: string, b: string, dp: number[][]): LcsDryRunRow[] => {
  const rows: LcsDryRunRow[] = []
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      rows.push({
        row: i,
        col: j,
        charA: a[i - 1],
        charB: b[j - 1],
        fromTop: dp[i - 1][j],
        fromLeft: dp[i][j - 1],
        fromDiag: dp[i - 1][j - 1],
        value: dp[i][j],
      })
    }
  }
  return rows
}

const solveEditDistance = (a: string, b: string): EditDistanceResult => {
  const rows = a.length + 1
  const cols = b.length + 1
  const dp = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0))
  const transitions: string[] = []

  for (let i = 0; i <= a.length; i++) dp[i][0] = i
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  transitions.push('Initialize first row/column with insertion/deletion counts.')

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
        transitions.push(`dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${dp[i][j]} (chars match)`)
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
        transitions.push(`dp[${i}][${j}] = 1 + min(del, ins, rep) = ${dp[i][j]}`)
      }
    }
  }

  return { distance: dp[a.length][b.length], dp, transitions }
}

const buildEditDistanceDryRun = (a: string, b: string, dp: number[][]): EditDistanceDryRunRow[] => {
  const rows: EditDistanceDryRunRow[] = []

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const deleteCost = dp[i - 1][j] + 1
      const insertCost = dp[i][j - 1] + 1
      const replaceCost = dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      let action = 'replace'
      if (a[i - 1] === b[j - 1]) action = 'match'
      else if (dp[i][j] === insertCost) action = 'insert'
      else if (dp[i][j] === deleteCost) action = 'delete'

      rows.push({
        row: i,
        col: j,
        charA: a[i - 1],
        charB: b[j - 1],
        insertCost,
        deleteCost,
        replaceCost,
        value: dp[i][j],
        action,
      })
    }
  }

  return rows
}

const buildCoinNaiveCallCounts = (maxAmount: number, coins: number[]): number[] => {
  const CAP = 1_000_000_000
  const calls = Array.from({ length: maxAmount + 1 }, () => 0)
  calls[0] = 1

  for (let amount = 1; amount <= maxAmount; amount++) {
    let total = 1
    for (const coin of coins) {
      if (coin <= amount) {
        total += calls[amount - coin]
        if (total > CAP) {
          total = CAP
          break
        }
      }
    }
    calls[amount] = total
  }

  return calls
}

const buildUniqueNaiveCallCounts = (rows: number, cols: number): number[][] => {
  const CAP = 1_000_000_000
  const calls = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0))

  for (let r = 0; r < rows; r++) {
    calls[r][0] = 1
  }
  for (let c = 0; c < cols; c++) {
    calls[0][c] = 1
  }

  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      calls[r][c] = Math.min(CAP, 1 + calls[r - 1][c] + calls[r][c - 1])
    }
  }

  return calls
}

const buildLcsNaiveCallCounts = (a: string, b: string): number[][] => {
  const CAP = 1_000_000_000
  const rows = a.length + 1
  const cols = b.length + 1
  const calls = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0))

  for (let i = 0; i <= a.length; i++) calls[i][0] = 1
  for (let j = 0; j <= b.length; j++) calls[0][j] = 1

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        calls[i][j] = Math.min(CAP, 1 + calls[i - 1][j - 1])
      } else {
        calls[i][j] = Math.min(CAP, 1 + calls[i - 1][j] + calls[i][j - 1])
      }
    }
  }

  return calls
}

const buildEditNaiveCallCounts = (a: string, b: string): number[][] => {
  const CAP = 1_000_000_000
  const rows = a.length + 1
  const cols = b.length + 1
  const calls = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0))

  for (let i = 0; i <= a.length; i++) calls[i][0] = 1
  for (let j = 0; j <= b.length; j++) calls[0][j] = 1

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        calls[i][j] = Math.min(CAP, 1 + calls[i - 1][j - 1])
      } else {
        calls[i][j] = Math.min(CAP, 1 + calls[i - 1][j] + calls[i][j - 1] + calls[i - 1][j - 1])
      }
    }
  }

  return calls
}

const encodeCell = (row: number, col: number) => row * 100 + col
const decodeCell = (value: number) => ({ row: Math.floor(value / 100), col: value % 100 })

type ProblemView = 'visual' | 'cpp'
type QuickStartMode = 'visual' | 'tree' | 'dryrun' | 'cpp'

type ProblemId =
  | 'climbing'
  | 'house'
  | 'coin-change'
  | 'unique-paths'
  | 'lcs'
  | 'edit-distance'
  | 'knapsack-01'
  | 'partition-equal-subset-sum'
  | 'target-sum'
  | 'lis'
  | 'russian-doll-envelopes'
  | 'number-of-lis'
  | 'matrix-chain-multiplication'
  | 'burst-balloons'
  | 'palindrome-partitioning'
  | 'house-robber-iii'
  | 'diameter-variants'
  | 'tree-matching'

const DP_PROBLEM_DIRECTORY: Array<{
  id: ProblemId
  title: string
  tag: string
  summary: string
  implemented: boolean
}> = [
  {
    id: 'climbing',
    title: 'Climbing Stairs',
    tag: '1D DP',
    summary: 'Count total ways to reach step n using 1-step and 2-step moves.',
    implemented: true,
  },
  {
    id: 'house',
    title: 'House Robber',
    tag: '1D DP',
    summary: 'Maximize loot with the constraint that adjacent houses cannot be robbed.',
    implemented: true,
  },
  {
    id: 'coin-change',
    title: 'Coin Change',
    tag: '1D DP',
    summary: 'Minimum coins needed to make a target amount.',
    implemented: true,
  },
  {
    id: 'unique-paths',
    title: 'Unique Paths',
    tag: '2D DP',
    summary: 'Count grid paths with right/down moves.',
    implemented: true,
  },
  {
    id: 'lcs',
    title: 'Longest Common Subsequence',
    tag: '2D DP',
    summary: 'Find longest subsequence common to two strings.',
    implemented: true,
  },
  {
    id: 'edit-distance',
    title: 'Edit Distance',
    tag: '2D DP',
    summary: 'Minimum operations to convert one string into another.',
    implemented: true,
  },
  {
    id: 'knapsack-01',
    title: '0/1 Knapsack',
    tag: 'Knapsack',
    summary: 'Maximize value under capacity with pick-or-skip choices.',
    implemented: false,
  },
  {
    id: 'partition-equal-subset-sum',
    title: 'Partition Equal Subset Sum',
    tag: 'Knapsack',
    summary: 'Check if array can split into two equal-sum subsets.',
    implemented: false,
  },
  {
    id: 'target-sum',
    title: 'Target Sum',
    tag: 'Knapsack',
    summary: 'Count ways to assign +/- signs to hit a target.',
    implemented: false,
  },
  {
    id: 'lis',
    title: 'Longest Increasing Subsequence',
    tag: 'LIS Pattern',
    summary: 'Find the longest strictly increasing subsequence.',
    implemented: false,
  },
  {
    id: 'russian-doll-envelopes',
    title: 'Russian Doll Envelopes',
    tag: 'LIS Pattern',
    summary: 'Maximize nested envelopes after sorting constraints.',
    implemented: false,
  },
  {
    id: 'number-of-lis',
    title: 'Number of LIS',
    tag: 'LIS Pattern',
    summary: 'Count how many longest increasing subsequences exist.',
    implemented: false,
  },
  {
    id: 'matrix-chain-multiplication',
    title: 'Matrix Chain Multiplication',
    tag: 'Interval DP',
    summary: 'Choose split points to minimize multiplication cost.',
    implemented: false,
  },
  {
    id: 'burst-balloons',
    title: 'Burst Balloons',
    tag: 'Interval DP',
    summary: 'Maximize coins by choosing optimal burst order.',
    implemented: false,
  },
  {
    id: 'palindrome-partitioning',
    title: 'Palindrome Partitioning',
    tag: 'Interval DP',
    summary: 'Minimize cuts so each partition is a palindrome.',
    implemented: false,
  },
  {
    id: 'house-robber-iii',
    title: 'House Robber III',
    tag: 'Tree DP',
    summary: 'Tree variant of robbery with parent-child constraints.',
    implemented: false,
  },
  {
    id: 'diameter-variants',
    title: 'Diameter Variants',
    tag: 'Tree DP',
    summary: 'Compute longest path style metrics on trees.',
    implemented: false,
  },
  {
    id: 'tree-matching',
    title: 'Tree Matching',
    tag: 'Tree DP',
    summary: 'Optimize matching or independent choices on trees.',
    implemented: false,
  },
]

function DPSection() {
  const [selectedProblem, setSelectedProblem] = useState<ProblemId | null>(null)
  const [quickStartProblem, setQuickStartProblem] = useState<ProblemId>('climbing')
  const [quickStartMode, setQuickStartMode] = useState<QuickStartMode>('visual')
  const [lastOpenedProblem, setLastOpenedProblem] = useState<ProblemId | null>(null)
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

  const [coinProblemView, setCoinProblemView] = useState<ProblemView>('visual')
  const [coinVisualMode, setCoinVisualMode] = useState<VisualMode>('dp')
  const [coinAmount, setCoinAmount] = useState(11)
  const [coinInput, setCoinInput] = useState('1,2,5')
  const [showCoinExplanation, setShowCoinExplanation] = useState(true)

  const [uniqueProblemView, setUniqueProblemView] = useState<ProblemView>('visual')
  const [uniqueVisualMode, setUniqueVisualMode] = useState<VisualMode>('dp')
  const [gridRows, setGridRows] = useState(3)
  const [gridCols, setGridCols] = useState(5)
  const [showUniqueExplanation, setShowUniqueExplanation] = useState(true)

  const [lcsProblemView, setLcsProblemView] = useState<ProblemView>('visual')
  const [lcsVisualMode, setLcsVisualMode] = useState<VisualMode>('dp')
  const [lcsFirst, setLcsFirst] = useState('abcde')
  const [lcsSecond, setLcsSecond] = useState('ace')
  const [showLcsExplanation, setShowLcsExplanation] = useState(true)

  const [editProblemView, setEditProblemView] = useState<ProblemView>('visual')
  const [editVisualMode, setEditVisualMode] = useState<VisualMode>('dp')
  const [editFirst, setEditFirst] = useState('horse')
  const [editSecond, setEditSecond] = useState('ros')
  const [showEditExplanation, setShowEditExplanation] = useState(true)

  const climbingStairs = useMemo(() => solveClimbingStairs(stairsCount), [stairsCount])
  const dryRunRows = useMemo(() => buildClimbingStairsDryRun(climbingStairs.dp), [climbingStairs.dp])
  const recursionCallCounts = useMemo(() => buildNaiveRecursionCallCounts(stairsCount), [stairsCount])
  const houseRobber = useMemo(() => solveHouseRobber(houses), [houses])
  const houseDryRunRows = useMemo(() => buildHouseRobberDryRun(houses, houseRobber.dp), [houses, houseRobber.dp])
  const houseRecursionCallCounts = useMemo(() => buildNaiveRecursionCallCounts(houses.length), [houses.length])
  const climbingTreeLevels = useMemo(
    () => buildRecursionTreeLevels(stairsCount, 5, (value) => (value <= 1 ? null : [value - 1, value - 2]), (value) => `f(${value})`),
    [stairsCount]
  )
  const houseTreeLevels = useMemo(
    () => buildRecursionTreeLevels(houses.length, 5, (value) => (value <= 0 ? null : [value - 1, value - 2]), (value) => `R(${value})`),
    [houses.length]
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
  const coins = useMemo(() => parseCoins(coinInput), [coinInput])
  const coinChange = useMemo(() => solveCoinChange(coins, coinAmount), [coins, coinAmount])
  const coinDryRunRows = useMemo(() => buildCoinChangeDryRun(coins, coinChange.dp), [coins, coinChange.dp])
  const coinNaiveCallCounts = useMemo(() => buildCoinNaiveCallCounts(coinAmount, coins), [coinAmount, coins])
  const coinTreeLevels = useMemo(() => {
    const firstCoin = coins[0]
    const secondCoin = coins[1] ?? coins[0]
    return buildRecursionTreeLevels(
      coinAmount,
      5,
      (value) => (value <= 0 ? null : [Math.max(0, value - firstCoin), Math.max(0, value - secondCoin)]),
      (value) => `C(${value})`
    )
  }, [coinAmount, coins])
  const coinTreeGraph = useMemo(
    () =>
      buildTreeGraph(coinTreeLevels, (label) => {
        const match = label.match(/C\((\d+)\)/)
        if (!match) return 'value: ?'
        const amount = Number(match[1])
        const value = coinChange.dp[amount]
        return `dp=${value === Number.MAX_SAFE_INTEGER ? 'INF' : value}`
      }),
    [coinTreeLevels, coinChange.dp]
  )
  const uniquePaths = useMemo(() => solveUniquePaths(gridRows, gridCols), [gridRows, gridCols])
  const uniqueDryRunRows = useMemo(() => buildUniquePathsDryRun(uniquePaths.dp), [uniquePaths.dp])
  const uniqueNaiveCallCounts = useMemo(() => buildUniqueNaiveCallCounts(gridRows, gridCols), [gridRows, gridCols])
  const uniqueTreeLevels = useMemo(
    () =>
      buildRecursionTreeLevels(
        encodeCell(gridRows - 1, gridCols - 1),
        5,
        (value) => {
          const { row, col } = decodeCell(value)
          if (row === 0 || col === 0) return null
          return [encodeCell(row - 1, col), encodeCell(row, col - 1)]
        },
        (value) => {
          const { row, col } = decodeCell(value)
          return `U(${row},${col})`
        }
      ),
    [gridRows, gridCols]
  )
  const uniqueTreeGraph = useMemo(
    () =>
      buildTreeGraph(uniqueTreeLevels, (label) => {
        const match = label.match(/U\((\d+),(\d+)\)/)
        if (!match) return 'value: ?'
        const row = Number(match[1])
        const col = Number(match[2])
        return `dp=${uniquePaths.dp[row]?.[col] ?? '?'} `
      }),
    [uniqueTreeLevels, uniquePaths.dp]
  )
  const lcsResult = useMemo(() => solveLcs(lcsFirst, lcsSecond), [lcsFirst, lcsSecond])
  const lcsDryRunRows = useMemo(() => buildLcsDryRun(lcsFirst, lcsSecond, lcsResult.dp), [lcsFirst, lcsSecond, lcsResult.dp])
  const lcsNaiveCallCounts = useMemo(() => buildLcsNaiveCallCounts(lcsFirst, lcsSecond), [lcsFirst, lcsSecond])
  const lcsTreeLevels = useMemo(
    () =>
      buildRecursionTreeLevels(
        encodeCell(lcsFirst.length, lcsSecond.length),
        5,
        (value) => {
          const { row, col } = decodeCell(value)
          if (row === 0 || col === 0) return null
          return [encodeCell(row - 1, col), encodeCell(row, col - 1)]
        },
        (value) => {
          const { row, col } = decodeCell(value)
          return `L(${row},${col})`
        }
      ),
    [lcsFirst.length, lcsSecond.length]
  )
  const lcsTreeGraph = useMemo(
    () =>
      buildTreeGraph(lcsTreeLevels, (label) => {
        const match = label.match(/L\((\d+),(\d+)\)/)
        if (!match) return 'value: ?'
        const row = Number(match[1])
        const col = Number(match[2])
        return `dp=${lcsResult.dp[row]?.[col] ?? '?'} `
      }),
    [lcsTreeLevels, lcsResult.dp]
  )
  const editDistanceResult = useMemo(() => solveEditDistance(editFirst, editSecond), [editFirst, editSecond])
  const editDryRunRows = useMemo(
    () => buildEditDistanceDryRun(editFirst, editSecond, editDistanceResult.dp),
    [editFirst, editSecond, editDistanceResult.dp]
  )
  const editNaiveCallCounts = useMemo(() => buildEditNaiveCallCounts(editFirst, editSecond), [editFirst, editSecond])
  const editTreeLevels = useMemo(
    () =>
      buildRecursionTreeLevels(
        encodeCell(editFirst.length, editSecond.length),
        5,
        (value) => {
          const { row, col } = decodeCell(value)
          if (row === 0 || col === 0) return null
          return [encodeCell(row - 1, col), encodeCell(row, col - 1)]
        },
        (value) => {
          const { row, col } = decodeCell(value)
          return `E(${row},${col})`
        }
      ),
    [editFirst.length, editSecond.length]
  )
  const editTreeGraph = useMemo(
    () =>
      buildTreeGraph(editTreeLevels, (label) => {
        const match = label.match(/E\((\d+),(\d+)\)/)
        if (!match) return 'value: ?'
        const row = Number(match[1])
        const col = Number(match[2])
        return `dp=${editDistanceResult.dp[row]?.[col] ?? '?'} `
      }),
    [editTreeLevels, editDistanceResult.dp]
  )

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
  const coinRecCalls = coinNaiveCallCounts[coinAmount] ?? 1
  const coinDpStates = coinAmount + 1
  const coinDpTransitions = Math.max(0, coinAmount)
  const coinImprovement = coinDpStates > 0 ? (coinRecCalls / coinDpStates).toFixed(1) : '0.0'
  const coinTreeDepth = coinTreeLevels.length
  const uniqueRecCalls = uniqueNaiveCallCounts[gridRows - 1]?.[gridCols - 1] ?? 1
  const uniqueDpStates = gridRows * gridCols
  const uniqueDpTransitions = Math.max(0, (gridRows - 1) * (gridCols - 1))
  const uniqueImprovement = uniqueDpStates > 0 ? (uniqueRecCalls / uniqueDpStates).toFixed(1) : '0.0'
  const uniqueTreeDepth = uniqueTreeLevels.length
  const lcsRecCalls = lcsNaiveCallCounts[lcsFirst.length]?.[lcsSecond.length] ?? 1
  const lcsDpStates = (lcsFirst.length + 1) * (lcsSecond.length + 1)
  const lcsDpTransitions = lcsFirst.length * lcsSecond.length
  const lcsImprovement = lcsDpStates > 0 ? (lcsRecCalls / lcsDpStates).toFixed(1) : '0.0'
  const lcsTreeDepth = lcsTreeLevels.length
  const editRecCalls = editNaiveCallCounts[editFirst.length]?.[editSecond.length] ?? 1
  const editDpStates = (editFirst.length + 1) * (editSecond.length + 1)
  const editDpTransitions = editFirst.length * editSecond.length
  const editImprovement = editDpStates > 0 ? (editRecCalls / editDpStates).toFixed(1) : '0.0'
  const editTreeDepth = editTreeLevels.length

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

  const handleSelectProblem = (problem: ProblemId) => {
    setSelectedProblem(problem)
    setLastOpenedProblem(problem)
  }

  const handleQuickStart = () => {
    const targetProblem = quickStartProblem
    handleSelectProblem(targetProblem)

    if (targetProblem === 'climbing') {
      if (quickStartMode === 'cpp') {
        setProblemView('cpp')
      } else {
        setProblemView('visual')
        setVisualMode(quickStartMode === 'visual' ? 'dp' : quickStartMode)
      }
      return
    }

    if (targetProblem === 'house') {
      if (quickStartMode === 'cpp') {
        setHouseProblemView('cpp')
      } else {
        setHouseProblemView('visual')
        setHouseVisualMode(quickStartMode === 'visual' ? 'dp' : quickStartMode)
      }
      return
    }

    if (targetProblem === 'coin-change') {
      if (quickStartMode === 'cpp') {
        setCoinProblemView('cpp')
      } else {
        setCoinProblemView('visual')
        setCoinVisualMode(quickStartMode === 'visual' ? 'dp' : quickStartMode)
      }
      return
    }

    if (targetProblem === 'unique-paths') {
      if (quickStartMode === 'cpp') {
        setUniqueProblemView('cpp')
      } else {
        setUniqueProblemView('visual')
        setUniqueVisualMode(quickStartMode === 'visual' ? 'dp' : quickStartMode)
      }
      return
    }

    if (targetProblem === 'lcs') {
      if (quickStartMode === 'cpp') {
        setLcsProblemView('cpp')
      } else {
        setLcsProblemView('visual')
        setLcsVisualMode(quickStartMode === 'visual' ? 'dp' : quickStartMode)
      }
      return
    }

    if (targetProblem === 'edit-distance') {
      if (quickStartMode === 'cpp') {
        setEditProblemView('cpp')
      } else {
        setEditProblemView('visual')
        setEditVisualMode(quickStartMode === 'visual' ? 'dp' : quickStartMode)
      }
    }
  }

  const selectedProblemTitle =
    DP_PROBLEM_DIRECTORY.find((problem) => problem.id === selectedProblem)?.title ?? 'Choose a problem'
  const selectedProblemInfo = DP_PROBLEM_DIRECTORY.find((problem) => problem.id === selectedProblem)
  const lastOpenedTitle =
    DP_PROBLEM_DIRECTORY.find((problem) => problem.id === lastOpenedProblem)?.title ?? 'None yet'
  const totalProblems = DP_PROBLEM_DIRECTORY.length
  const implementedProblems = DP_PROBLEM_DIRECTORY.filter((problem) => problem.implemented).length
  const upcomingProblems = totalProblems - implementedProblems

  return (
    <section className="visualizer-container dp-section">
      <div className="dp-header">
        <span className="dp-header-kicker">Algorithm Visualizer • DP Workspace</span>
        <div className="dp-header-top">
          <h2>Dynamic Programming Hub</h2>
          <div className="dp-header-stats" aria-label="DP section stats">
            <span><strong>{implementedProblems}</strong> implemented</span>
            <span><strong>{upcomingProblems}</strong> coming soon</span>
            <span><strong>{totalProblems}</strong> total</span>
          </div>
        </div>
        <p>
          Learn each problem through visual modes, recursion trees, dry runs, and C++ references.
          Pick a problem from the index and dive deep with interactive controls.
        </p>
      </div>

      <div className="dp-roadmap">
        <span className="dp-badge dp-badge-violet">Problem Index</span>
        <span className="dp-badge dp-badge-violet">Interactive Visuals</span>
        <span className="dp-badge dp-badge-violet">C++</span>
        <span className="dp-badge dp-badge-violet">Dry Run</span>
        <span className="dp-badge dp-badge-violet">Recursion Tree</span>
      </div>

      <section className="dp-quickstart" aria-label="Quick start panel">
        <div className="dp-quickstart-head">
          <h3>Start Here</h3>
          <span>Last opened: {lastOpenedTitle}</span>
        </div>

        <div className="dp-quickstart-grid">
          <label className="dp-quickstart-field">
            <span>Problem</span>
            <select
              value={quickStartProblem}
              onChange={(e) => setQuickStartProblem(e.target.value as ProblemId)}
            >
              {DP_PROBLEM_DIRECTORY.map((problem) => (
                <option key={problem.id} value={problem.id}>
                  {problem.title}
                </option>
              ))}
            </select>
          </label>

          <label className="dp-quickstart-field">
            <span>Mode</span>
            <select
              value={quickStartMode}
              onChange={(e) => setQuickStartMode(e.target.value as QuickStartMode)}
            >
              <option value="visual">Visual Walkthrough</option>
              <option value="tree">Recursion Tree</option>
              <option value="dryrun">Dry Run</option>
              <option value="cpp">C++ Solution</option>
            </select>
          </label>

          <button
            type="button"
            className="dp-quickstart-btn"
            onClick={handleQuickStart}
          >
            Open Problem
          </button>
        </div>
      </section>

      {selectedProblem === null && (
      <div className="dp-problem-directory" id="dp-problem-directory">
        <div className="dp-problem-directory-head">
          <h3>Problem List</h3>
          <span>{selectedProblemTitle}</span>
        </div>

        <div className="dp-problem-directory-grid" role="list" aria-label="DP problems list">
          {DP_PROBLEM_DIRECTORY.map((problem) => (
            <button
              key={problem.id}
              type="button"
              role="listitem"
              className={`dp-problem-tile ${selectedProblem === problem.id ? 'active' : ''}`}
              onClick={() => handleSelectProblem(problem.id)}
            >
              <div className="dp-problem-tile-head">
                <strong>{problem.title}</strong>
                <span>{problem.tag}</span>
              </div>
              <p>{problem.summary}</p>
            </button>
          ))}
        </div>
      </div>
      )}

      {selectedProblem === 'climbing' && (
      <article className="dp-problem-card" id="dp-problem-climbing">
        <div className="dp-problem-header">
          <h3>Problem 1: Climbing Stairs</h3>
          <span className="dp-problem-tag">1D DP</span>
        </div>

        <div className="dp-problem-nav-row">
          <button
            type="button"
            className="dp-problem-nav-btn"
            onClick={() => setSelectedProblem(null)}
          >
            Back to Problem List
          </button>
          <button
            type="button"
            className="dp-problem-nav-btn"
            onClick={() => handleSelectProblem('house')}
          >
            Go to House Robber
          </button>
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
              <button
                type="button"
                className={`dp-mode-btn ${visualMode === 'dryrun' ? 'active' : ''}`}
                onClick={() => setVisualMode('dryrun')}
                aria-selected={visualMode === 'dryrun'}
              >
                Dry Run
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
                  <span>Root: f({stairsCount}) | Depth: {climbingTreeDepth} | Nodes: {climbingTreeGraph.nodes.length}</span>
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

            {visualMode === 'dryrun' && (
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
            )}

            <div className="dp-transitions">
              <h4>State Transitions</h4>
              <ul>
                {climbingStairs.transitions.slice(0, visibleTransitionCount).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
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
      <article className="dp-problem-card" id="dp-problem-house">
        <div className="dp-problem-header">
          <h3>Problem 2: House Robber</h3>
          <span className="dp-problem-tag">1D DP</span>
        </div>

        <div className="dp-problem-nav-row">
          <button
            type="button"
            className="dp-problem-nav-btn"
            onClick={() => setSelectedProblem(null)}
          >
            Back to Problem List
          </button>
          <button
            type="button"
            className="dp-problem-nav-btn"
            onClick={() => handleSelectProblem('climbing')}
          >
            Go to Climbing Stairs
          </button>
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
              <button
                type="button"
                className={`dp-mode-btn ${houseVisualMode === 'dryrun' ? 'active' : ''}`}
                onClick={() => setHouseVisualMode('dryrun')}
                aria-selected={houseVisualMode === 'dryrun'}
              >
                Dry Run
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
                  <span>Root: R({houses.length}) | Depth: {houseTreeDepth} | Nodes: {houseTreeGraph.nodes.length}</span>
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

            {houseVisualMode === 'dryrun' && (
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
            )}

            <div className="dp-transitions">
              <h4>State Transitions</h4>
              <ul>
                {houseRobber.transitions.slice(0, visibleHouseTransitions).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
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

      {selectedProblem === 'coin-change' && (
      <article className="dp-problem-card" id="dp-problem-coin-change">
        <div className="dp-problem-header">
          <h3>Problem 3: Coin Change</h3>
          <span className="dp-problem-tag">1D DP</span>
        </div>

        <div className="dp-problem-nav-row">
          <button
            type="button"
            className="dp-problem-nav-btn"
            onClick={() => setSelectedProblem(null)}
          >
            Back to Problem List
          </button>
          <button
            type="button"
            className="dp-problem-nav-btn"
            onClick={() => handleSelectProblem('unique-paths')}
          >
            Go to Unique Paths
          </button>
        </div>

        <p className="dp-problem-description">
          Given coin denominations and a target amount, find the minimum number of coins needed.
          If no combination can make the amount, return -1.
        </p>

        <section className="dp-explanation" aria-label="Coin change explanation">
          <div className="dp-explanation-header">
            <h4>Explanation</h4>
            <button
              type="button"
              className="dp-explain-toggle"
              onClick={() => setShowCoinExplanation((prev) => !prev)}
            >
              {showCoinExplanation ? 'Hide' : 'Show'}
            </button>
          </div>
          {showCoinExplanation && (
            <div className="dp-explanation-grid">
              <article className="dp-explanation-card">
                <h5>Recurrence</h5>
                <p>dp[a] = min(dp[a - coin] + 1) for all valid coins</p>
                <p>Base case: dp[0] = 0</p>
              </article>
              <article className="dp-explanation-card">
                <h5>Complexity</h5>
                <p>Time: O(amount * number_of_coins)</p>
                <p>Space: O(amount)</p>
              </article>
            </div>
          )}
        </section>

        <div className="dp-view-toggle" role="tablist" aria-label="Coin change problem view">
          <button
            type="button"
            className={`dp-view-btn ${coinProblemView === 'visual' ? 'active' : ''}`}
            onClick={() => setCoinProblemView('visual')}
            aria-selected={coinProblemView === 'visual'}
          >
            Visual Walkthrough
          </button>
          <button
            type="button"
            className={`dp-view-btn ${coinProblemView === 'cpp' ? 'active' : ''}`}
            onClick={() => setCoinProblemView('cpp')}
            aria-selected={coinProblemView === 'cpp'}
          >
            C++ Solution
          </button>
        </div>

        {coinProblemView === 'visual' ? (
          <>
            <div className="dp-problem-controls">
              <label htmlFor="coin-change-amount">Target amount: {coinAmount}</label>
              <input
                id="coin-change-amount"
                type="range"
                min="1"
                max="40"
                value={coinAmount}
                onChange={(e) => setCoinAmount(Number(e.target.value))}
              />
            </div>

            <div className="dp-problem-controls">
              <label htmlFor="coin-change-coins">Coins (comma-separated)</label>
              <input
                id="coin-change-coins"
                type="text"
                className="dp-text-input"
                value={coinInput}
                onChange={(e) => setCoinInput(e.target.value)}
              />
            </div>

            <div className="dp-answer">
              <span>Minimum coins required:</span>
              <strong>{coinChange.minCoins}</strong>
            </div>

            <div className="dp-mode-toggle" role="tablist" aria-label="Coin change visualization mode">
              <button
                type="button"
                className={`dp-mode-btn ${coinVisualMode === 'dp' ? 'active' : ''}`}
                onClick={() => setCoinVisualMode('dp')}
                aria-selected={coinVisualMode === 'dp'}
              >
                DP Mode
              </button>
              <button
                type="button"
                className={`dp-mode-btn ${coinVisualMode === 'compare' ? 'active' : ''}`}
                onClick={() => setCoinVisualMode('compare')}
                aria-selected={coinVisualMode === 'compare'}
              >
                Recursion vs DP
              </button>
              <button
                type="button"
                className={`dp-mode-btn ${coinVisualMode === 'tree' ? 'active' : ''}`}
                onClick={() => setCoinVisualMode('tree')}
                aria-selected={coinVisualMode === 'tree'}
              >
                Recursion Tree
              </button>
              <button
                type="button"
                className={`dp-mode-btn ${coinVisualMode === 'dryrun' ? 'active' : ''}`}
                onClick={() => setCoinVisualMode('dryrun')}
                aria-selected={coinVisualMode === 'dryrun'}
              >
                Dry Run
              </button>
            </div>

            {coinVisualMode === 'compare' && (
              <div className="dp-compare-panel">
                <div className="dp-compare-cards">
                  <div className="dp-compare-card recursion">
                    <h5>Naive Recursion</h5>
                    <p>Estimated calls for amount = {coinAmount}</p>
                    <strong>{coinRecCalls >= 1_000_000_000 ? '1B+' : coinRecCalls}</strong>
                  </div>
                  <div className="dp-compare-card dynamic">
                    <h5>Dynamic Programming</h5>
                    <p>States + transitions used</p>
                    <strong>{coinDpStates} states / {coinDpTransitions} transitions</strong>
                  </div>
                  <div className="dp-compare-card highlight">
                    <h5>Efficiency Gain</h5>
                    <p>Approx call-to-state ratio</p>
                    <strong>{coinImprovement}x</strong>
                  </div>
                </div>
              </div>
            )}

            {coinVisualMode === 'tree' && (
              <section className="dp-recursion-tree-section" aria-label="Coin change recursion tree">
                <div className="dp-recursion-tree-header">
                  <h4>Recursion Tree (Naive, Simplified)</h4>
                  <span>Root: C({coinAmount}) | Depth: {coinTreeDepth} | Nodes: {coinTreeGraph.nodes.length}</span>
                </div>
                <div className="dp-recursion-context">
                  <span className="ctx root">Root</span>
                  <span className="ctx internal">Internal</span>
                  <span className="ctx leaf">Leaf / Base</span>
                  <span className="ctx left">Left branch (-{coins[0] ?? 1})</span>
                  <span className="ctx right">Right branch (-{coins[1] ?? coins[0] ?? 1})</span>
                  <span className="ctx value">Node value: dp amount value</span>
                </div>
                <div className="dp-recursion-tree-canvas">
                  <svg className="dp-recursion-svg" viewBox={`0 0 ${coinTreeGraph.width} ${coinTreeGraph.height}`}>
                    {coinTreeGraph.edges.map((edge) => (
                      <line
                        key={edge.id}
                        className={`dp-recursion-edge ${edge.side}`}
                        x1={edge.fromX}
                        y1={edge.fromY}
                        x2={edge.toX}
                        y2={edge.toY}
                      />
                    ))}
                    {coinTreeGraph.nodes.map((node) => (
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
                {coinChange.transitions.slice(0, Math.min(coinAmount + 1, coinChange.transitions.length)).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>

            {coinVisualMode === 'dryrun' && (
              <div className="dp-dry-run">
                <div className="dp-dry-run-header">
                  <h4>Detailed Dry Run</h4>
                  <span>Coins: {coins.join(', ')}</span>
                </div>
                <div className="dp-dry-run-table-wrap">
                  <table className="dp-dry-run-table">
                    <thead>
                      <tr>
                        <th>Amount</th>
                        <th>Choices (coin : candidate)</th>
                        <th>dp[amount]</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coinDryRunRows.map((row) => (
                        <tr key={row.amount} className="dp-dry-run-row done">
                          <td>{row.amount}</td>
                          <td>{row.choices}</td>
                          <td>{row.result === -1 ? 'INF' : row.result}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="dp-code-stack" aria-label="Coin change C plus plus solution">
            <section className="dp-code-section">
              <h4>C++ Tabulation</h4>
              <div className="dp-code-block">
                <pre>{coinChangeCppSource}</pre>
              </div>
            </section>
          </div>
        )}
      </article>
      )}

      {selectedProblem === 'unique-paths' && (
      <article className="dp-problem-card" id="dp-problem-unique-paths">
        <div className="dp-problem-header">
          <h3>Problem 4: Unique Paths</h3>
          <span className="dp-problem-tag">2D DP</span>
        </div>

        <div className="dp-problem-nav-row">
          <button
            type="button"
            className="dp-problem-nav-btn"
            onClick={() => setSelectedProblem(null)}
          >
            Back to Problem List
          </button>
          <button
            type="button"
            className="dp-problem-nav-btn"
            onClick={() => handleSelectProblem('coin-change')}
          >
            Go to Coin Change
          </button>
        </div>

        <p className="dp-problem-description">
          In an m x n grid, count how many unique paths exist from top-left to bottom-right,
          moving only right or down.
        </p>

        <section className="dp-explanation" aria-label="Unique paths explanation">
          <div className="dp-explanation-header">
            <h4>Explanation</h4>
            <button
              type="button"
              className="dp-explain-toggle"
              onClick={() => setShowUniqueExplanation((prev) => !prev)}
            >
              {showUniqueExplanation ? 'Hide' : 'Show'}
            </button>
          </div>
          {showUniqueExplanation && (
            <div className="dp-explanation-grid">
              <article className="dp-explanation-card">
                <h5>Recurrence</h5>
                <p>dp[r][c] = dp[r - 1][c] + dp[r][c - 1]</p>
                <p>First row and first column are all 1.</p>
              </article>
              <article className="dp-explanation-card">
                <h5>Complexity</h5>
                <p>Time: O(rows * cols)</p>
                <p>Space: O(rows * cols)</p>
              </article>
            </div>
          )}
        </section>

        <div className="dp-view-toggle" role="tablist" aria-label="Unique paths problem view">
          <button
            type="button"
            className={`dp-view-btn ${uniqueProblemView === 'visual' ? 'active' : ''}`}
            onClick={() => setUniqueProblemView('visual')}
            aria-selected={uniqueProblemView === 'visual'}
          >
            Visual Walkthrough
          </button>
          <button
            type="button"
            className={`dp-view-btn ${uniqueProblemView === 'cpp' ? 'active' : ''}`}
            onClick={() => setUniqueProblemView('cpp')}
            aria-selected={uniqueProblemView === 'cpp'}
          >
            C++ Solution
          </button>
        </div>

        {uniqueProblemView === 'visual' ? (
          <>
            <div className="dp-problem-controls">
              <label htmlFor="unique-paths-rows">Rows: {gridRows}</label>
              <input
                id="unique-paths-rows"
                type="range"
                min="2"
                max="8"
                value={gridRows}
                onChange={(e) => setGridRows(Number(e.target.value))}
              />
            </div>
            <div className="dp-problem-controls">
              <label htmlFor="unique-paths-cols">Columns: {gridCols}</label>
              <input
                id="unique-paths-cols"
                type="range"
                min="2"
                max="8"
                value={gridCols}
                onChange={(e) => setGridCols(Number(e.target.value))}
              />
            </div>

            <div className="dp-answer">
              <span>Total unique paths:</span>
              <strong>{uniquePaths.paths}</strong>
            </div>

            <div className="dp-mode-toggle" role="tablist" aria-label="Unique paths visualization mode">
              <button
                type="button"
                className={`dp-mode-btn ${uniqueVisualMode === 'dp' ? 'active' : ''}`}
                onClick={() => setUniqueVisualMode('dp')}
                aria-selected={uniqueVisualMode === 'dp'}
              >
                DP Mode
              </button>
              <button
                type="button"
                className={`dp-mode-btn ${uniqueVisualMode === 'compare' ? 'active' : ''}`}
                onClick={() => setUniqueVisualMode('compare')}
                aria-selected={uniqueVisualMode === 'compare'}
              >
                Recursion vs DP
              </button>
              <button
                type="button"
                className={`dp-mode-btn ${uniqueVisualMode === 'tree' ? 'active' : ''}`}
                onClick={() => setUniqueVisualMode('tree')}
                aria-selected={uniqueVisualMode === 'tree'}
              >
                Recursion Tree
              </button>
              <button
                type="button"
                className={`dp-mode-btn ${uniqueVisualMode === 'dryrun' ? 'active' : ''}`}
                onClick={() => setUniqueVisualMode('dryrun')}
                aria-selected={uniqueVisualMode === 'dryrun'}
              >
                Dry Run
              </button>
            </div>

            {uniqueVisualMode === 'compare' && (
              <div className="dp-compare-panel">
                <div className="dp-compare-cards">
                  <div className="dp-compare-card recursion">
                    <h5>Naive Recursion</h5>
                    <p>Estimated calls for {gridRows}x{gridCols}</p>
                    <strong>{uniqueRecCalls >= 1_000_000_000 ? '1B+' : uniqueRecCalls}</strong>
                  </div>
                  <div className="dp-compare-card dynamic">
                    <h5>Dynamic Programming</h5>
                    <p>States + transitions used</p>
                    <strong>{uniqueDpStates} states / {uniqueDpTransitions} transitions</strong>
                  </div>
                  <div className="dp-compare-card highlight">
                    <h5>Efficiency Gain</h5>
                    <p>Approx call-to-state ratio</p>
                    <strong>{uniqueImprovement}x</strong>
                  </div>
                </div>
              </div>
            )}

            {uniqueVisualMode === 'tree' && (
              <section className="dp-recursion-tree-section" aria-label="Unique paths recursion tree">
                <div className="dp-recursion-tree-header">
                  <h4>Recursion Tree (Naive)</h4>
                  <span>Root: U({gridRows - 1},{gridCols - 1}) | Depth: {uniqueTreeDepth} | Nodes: {uniqueTreeGraph.nodes.length}</span>
                </div>
                <div className="dp-recursion-context">
                  <span className="ctx root">Root</span>
                  <span className="ctx internal">Internal</span>
                  <span className="ctx leaf">Leaf / Base</span>
                  <span className="ctx left">Left branch (r-1,c)</span>
                  <span className="ctx right">Right branch (r,c-1)</span>
                  <span className="ctx value">Node value: dp[r][c]</span>
                </div>
                <div className="dp-recursion-tree-canvas">
                  <svg className="dp-recursion-svg" viewBox={`0 0 ${uniqueTreeGraph.width} ${uniqueTreeGraph.height}`}>
                    {uniqueTreeGraph.edges.map((edge) => (
                      <line
                        key={edge.id}
                        className={`dp-recursion-edge ${edge.side}`}
                        x1={edge.fromX}
                        y1={edge.fromY}
                        x2={edge.toX}
                        y2={edge.toY}
                      />
                    ))}
                    {uniqueTreeGraph.nodes.map((node) => (
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

            <div className="dp-matrix-wrap" aria-label="Unique paths DP matrix">
              <table className="dp-matrix-table">
                <tbody>
                  {uniquePaths.dp.map((row, rIdx) => (
                    <tr key={`r-${rIdx}`}>
                      {row.map((value, cIdx) => (
                        <td key={`c-${rIdx}-${cIdx}`}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {uniqueVisualMode === 'dryrun' && (
              <div className="dp-dry-run">
                <div className="dp-dry-run-header">
                  <h4>Detailed Dry Run</h4>
                  <span>Focus: internal cells (excluding first row/column)</span>
                </div>
                <div className="dp-dry-run-table-wrap">
                  <table className="dp-dry-run-table">
                    <thead>
                      <tr>
                        <th>Cell</th>
                        <th>From Top</th>
                        <th>From Left</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueDryRunRows.map((row) => (
                        <tr key={`${row.row}-${row.col}`} className="dp-dry-run-row done">
                          <td>dp[{row.row}][{row.col}]</td>
                          <td>{row.fromTop}</td>
                          <td>{row.fromLeft}</td>
                          <td>{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="dp-transitions">
              <h4>State Transitions</h4>
              <ul>
                {uniquePaths.transitions.slice(0, Math.min(uniquePaths.transitions.length, 12)).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="dp-code-stack" aria-label="Unique paths C plus plus solution">
            <section className="dp-code-section">
              <h4>C++ Tabulation</h4>
              <div className="dp-code-block">
                <pre>{uniquePathsCppSource}</pre>
              </div>
            </section>
          </div>
        )}
      </article>
      )}

      {selectedProblem === 'lcs' && (
      <article className="dp-problem-card" id="dp-problem-lcs">
        <div className="dp-problem-header">
          <h3>Problem 5: Longest Common Subsequence</h3>
          <span className="dp-problem-tag">2D DP</span>
        </div>

        <div className="dp-problem-nav-row">
          <button type="button" className="dp-problem-nav-btn" onClick={() => setSelectedProblem(null)}>
            Back to Problem List
          </button>
          <button type="button" className="dp-problem-nav-btn" onClick={() => handleSelectProblem('edit-distance')}>
            Go to Edit Distance
          </button>
        </div>

        <p className="dp-problem-description">
          Find the length of the longest subsequence common to two strings.
        </p>

        <section className="dp-explanation" aria-label="LCS explanation">
          <div className="dp-explanation-header">
            <h4>Explanation</h4>
            <button type="button" className="dp-explain-toggle" onClick={() => setShowLcsExplanation((prev) => !prev)}>
              {showLcsExplanation ? 'Hide' : 'Show'}
            </button>
          </div>
          {showLcsExplanation && (
            <div className="dp-explanation-grid">
              <article className="dp-explanation-card">
                <h5>Recurrence</h5>
                <p>If chars match: dp[i][j] = dp[i-1][j-1] + 1</p>
                <p>Else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])</p>
              </article>
              <article className="dp-explanation-card">
                <h5>Complexity</h5>
                <p>Time: O(n*m)</p>
                <p>Space: O(n*m)</p>
              </article>
            </div>
          )}
        </section>

        <div className="dp-view-toggle" role="tablist" aria-label="LCS problem view">
          <button type="button" className={`dp-view-btn ${lcsProblemView === 'visual' ? 'active' : ''}`} onClick={() => setLcsProblemView('visual')} aria-selected={lcsProblemView === 'visual'}>
            Visual Walkthrough
          </button>
          <button type="button" className={`dp-view-btn ${lcsProblemView === 'cpp' ? 'active' : ''}`} onClick={() => setLcsProblemView('cpp')} aria-selected={lcsProblemView === 'cpp'}>
            C++ Solution
          </button>
        </div>

        {lcsProblemView === 'visual' ? (
          <>
            <div className="dp-problem-controls">
              <label htmlFor="lcs-first">First string</label>
              <input id="lcs-first" type="text" className="dp-text-input" value={lcsFirst} onChange={(e) => setLcsFirst(e.target.value.slice(0, 12))} />
            </div>
            <div className="dp-problem-controls">
              <label htmlFor="lcs-second">Second string</label>
              <input id="lcs-second" type="text" className="dp-text-input" value={lcsSecond} onChange={(e) => setLcsSecond(e.target.value.slice(0, 12))} />
            </div>

            <div className="dp-answer">
              <span>LCS length:</span>
              <strong>{lcsResult.length}</strong>
            </div>

            <div className="dp-mode-toggle" role="tablist" aria-label="LCS visualization mode">
              <button
                type="button"
                className={`dp-mode-btn ${lcsVisualMode === 'dp' ? 'active' : ''}`}
                onClick={() => setLcsVisualMode('dp')}
                aria-selected={lcsVisualMode === 'dp'}
              >
                DP Mode
              </button>
              <button
                type="button"
                className={`dp-mode-btn ${lcsVisualMode === 'compare' ? 'active' : ''}`}
                onClick={() => setLcsVisualMode('compare')}
                aria-selected={lcsVisualMode === 'compare'}
              >
                Recursion vs DP
              </button>
              <button
                type="button"
                className={`dp-mode-btn ${lcsVisualMode === 'tree' ? 'active' : ''}`}
                onClick={() => setLcsVisualMode('tree')}
                aria-selected={lcsVisualMode === 'tree'}
              >
                Recursion Tree
              </button>
              <button
                type="button"
                className={`dp-mode-btn ${lcsVisualMode === 'dryrun' ? 'active' : ''}`}
                onClick={() => setLcsVisualMode('dryrun')}
                aria-selected={lcsVisualMode === 'dryrun'}
              >
                Dry Run
              </button>
            </div>

            {lcsVisualMode === 'compare' && (
              <div className="dp-compare-panel">
                <div className="dp-compare-cards">
                  <div className="dp-compare-card recursion">
                    <h5>Naive Recursion</h5>
                    <p>Estimated calls for ({lcsFirst.length}, {lcsSecond.length})</p>
                    <strong>{lcsRecCalls >= 1_000_000_000 ? '1B+' : lcsRecCalls}</strong>
                  </div>
                  <div className="dp-compare-card dynamic">
                    <h5>Dynamic Programming</h5>
                    <p>States + transitions used</p>
                    <strong>{lcsDpStates} states / {lcsDpTransitions} transitions</strong>
                  </div>
                  <div className="dp-compare-card highlight">
                    <h5>Efficiency Gain</h5>
                    <p>Approx call-to-state ratio</p>
                    <strong>{lcsImprovement}x</strong>
                  </div>
                </div>
              </div>
            )}

            {lcsVisualMode === 'tree' && (
              <section className="dp-recursion-tree-section" aria-label="LCS recursion tree">
                <div className="dp-recursion-tree-header">
                  <h4>Recursion Tree (Naive, Simplified)</h4>
                  <span>Root: L({lcsFirst.length},{lcsSecond.length}) | Depth: {lcsTreeDepth} | Nodes: {lcsTreeGraph.nodes.length}</span>
                </div>
                <div className="dp-recursion-context">
                  <span className="ctx root">Root</span>
                  <span className="ctx internal">Internal</span>
                  <span className="ctx leaf">Leaf / Base</span>
                  <span className="ctx left">Left branch (i-1,j)</span>
                  <span className="ctx right">Right branch (i,j-1)</span>
                  <span className="ctx value">Node value: dp[i][j]</span>
                </div>
                <div className="dp-recursion-tree-canvas">
                  <svg className="dp-recursion-svg" viewBox={`0 0 ${lcsTreeGraph.width} ${lcsTreeGraph.height}`}>
                    {lcsTreeGraph.edges.map((edge) => (
                      <line
                        key={edge.id}
                        className={`dp-recursion-edge ${edge.side}`}
                        x1={edge.fromX}
                        y1={edge.fromY}
                        x2={edge.toX}
                        y2={edge.toY}
                      />
                    ))}
                    {lcsTreeGraph.nodes.map((node) => (
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

            <div className="dp-matrix-wrap" aria-label="LCS DP matrix">
              <table className="dp-matrix-table">
                <tbody>
                  {lcsResult.dp.map((row, rIdx) => (
                    <tr key={`lcs-r-${rIdx}`}>
                      {row.map((value, cIdx) => (
                        <td key={`lcs-c-${rIdx}-${cIdx}`}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {lcsVisualMode === 'dryrun' && (
              <div className="dp-dry-run">
                <div className="dp-dry-run-header">
                  <h4>Detailed Dry Run</h4>
                  <span>{lcsFirst} vs {lcsSecond}</span>
                </div>
                <div className="dp-dry-run-table-wrap">
                  <table className="dp-dry-run-table">
                    <thead>
                      <tr>
                        <th>Cell</th>
                        <th>Chars</th>
                        <th>Top</th>
                        <th>Left</th>
                        <th>Diag</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lcsDryRunRows.map((row) => (
                        <tr key={`${row.row}-${row.col}`} className="dp-dry-run-row done">
                          <td>dp[{row.row}][{row.col}]</td>
                          <td>{row.charA}/{row.charB}</td>
                          <td>{row.fromTop}</td>
                          <td>{row.fromLeft}</td>
                          <td>{row.fromDiag}</td>
                          <td>{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="dp-transitions">
              <h4>State Transitions</h4>
              <ul>
                {lcsResult.transitions.slice(0, 14).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="dp-code-stack" aria-label="LCS C plus plus solution">
            <section className="dp-code-section">
              <h4>C++ Tabulation</h4>
              <div className="dp-code-block">
                <pre>{lcsCppSource}</pre>
              </div>
            </section>
          </div>
        )}
      </article>
      )}

      {selectedProblem === 'edit-distance' && (
      <article className="dp-problem-card" id="dp-problem-edit-distance">
        <div className="dp-problem-header">
          <h3>Problem 6: Edit Distance</h3>
          <span className="dp-problem-tag">2D DP</span>
        </div>

        <div className="dp-problem-nav-row">
          <button type="button" className="dp-problem-nav-btn" onClick={() => setSelectedProblem(null)}>
            Back to Problem List
          </button>
          <button type="button" className="dp-problem-nav-btn" onClick={() => handleSelectProblem('lcs')}>
            Go to LCS
          </button>
        </div>

        <p className="dp-problem-description">
          Compute minimum operations (insert, delete, replace) needed to convert one string to another.
        </p>

        <section className="dp-explanation" aria-label="Edit distance explanation">
          <div className="dp-explanation-header">
            <h4>Explanation</h4>
            <button type="button" className="dp-explain-toggle" onClick={() => setShowEditExplanation((prev) => !prev)}>
              {showEditExplanation ? 'Hide' : 'Show'}
            </button>
          </div>
          {showEditExplanation && (
            <div className="dp-explanation-grid">
              <article className="dp-explanation-card">
                <h5>Recurrence</h5>
                <p>If chars match: dp[i][j] = dp[i-1][j-1]</p>
                <p>Else: 1 + min(delete, insert, replace)</p>
              </article>
              <article className="dp-explanation-card">
                <h5>Complexity</h5>
                <p>Time: O(n*m)</p>
                <p>Space: O(n*m)</p>
              </article>
            </div>
          )}
        </section>

        <div className="dp-view-toggle" role="tablist" aria-label="Edit distance problem view">
          <button type="button" className={`dp-view-btn ${editProblemView === 'visual' ? 'active' : ''}`} onClick={() => setEditProblemView('visual')} aria-selected={editProblemView === 'visual'}>
            Visual Walkthrough
          </button>
          <button type="button" className={`dp-view-btn ${editProblemView === 'cpp' ? 'active' : ''}`} onClick={() => setEditProblemView('cpp')} aria-selected={editProblemView === 'cpp'}>
            C++ Solution
          </button>
        </div>

        {editProblemView === 'visual' ? (
          <>
            <div className="dp-problem-controls">
              <label htmlFor="edit-first">First string</label>
              <input id="edit-first" type="text" className="dp-text-input" value={editFirst} onChange={(e) => setEditFirst(e.target.value.slice(0, 12))} />
            </div>
            <div className="dp-problem-controls">
              <label htmlFor="edit-second">Second string</label>
              <input id="edit-second" type="text" className="dp-text-input" value={editSecond} onChange={(e) => setEditSecond(e.target.value.slice(0, 12))} />
            </div>

            <div className="dp-answer">
              <span>Edit distance:</span>
              <strong>{editDistanceResult.distance}</strong>
            </div>

            <div className="dp-mode-toggle" role="tablist" aria-label="Edit distance visualization mode">
              <button
                type="button"
                className={`dp-mode-btn ${editVisualMode === 'dp' ? 'active' : ''}`}
                onClick={() => setEditVisualMode('dp')}
                aria-selected={editVisualMode === 'dp'}
              >
                DP Mode
              </button>
              <button
                type="button"
                className={`dp-mode-btn ${editVisualMode === 'compare' ? 'active' : ''}`}
                onClick={() => setEditVisualMode('compare')}
                aria-selected={editVisualMode === 'compare'}
              >
                Recursion vs DP
              </button>
              <button
                type="button"
                className={`dp-mode-btn ${editVisualMode === 'tree' ? 'active' : ''}`}
                onClick={() => setEditVisualMode('tree')}
                aria-selected={editVisualMode === 'tree'}
              >
                Recursion Tree
              </button>
              <button
                type="button"
                className={`dp-mode-btn ${editVisualMode === 'dryrun' ? 'active' : ''}`}
                onClick={() => setEditVisualMode('dryrun')}
                aria-selected={editVisualMode === 'dryrun'}
              >
                Dry Run
              </button>
            </div>

            {editVisualMode === 'compare' && (
              <div className="dp-compare-panel">
                <div className="dp-compare-cards">
                  <div className="dp-compare-card recursion">
                    <h5>Naive Recursion</h5>
                    <p>Estimated calls for ({editFirst.length}, {editSecond.length})</p>
                    <strong>{editRecCalls >= 1_000_000_000 ? '1B+' : editRecCalls}</strong>
                  </div>
                  <div className="dp-compare-card dynamic">
                    <h5>Dynamic Programming</h5>
                    <p>States + transitions used</p>
                    <strong>{editDpStates} states / {editDpTransitions} transitions</strong>
                  </div>
                  <div className="dp-compare-card highlight">
                    <h5>Efficiency Gain</h5>
                    <p>Approx call-to-state ratio</p>
                    <strong>{editImprovement}x</strong>
                  </div>
                </div>
              </div>
            )}

            {editVisualMode === 'tree' && (
              <section className="dp-recursion-tree-section" aria-label="Edit distance recursion tree">
                <div className="dp-recursion-tree-header">
                  <h4>Recursion Tree (Naive, Simplified)</h4>
                  <span>Root: E({editFirst.length},{editSecond.length}) | Depth: {editTreeDepth} | Nodes: {editTreeGraph.nodes.length}</span>
                </div>
                <div className="dp-recursion-context">
                  <span className="ctx root">Root</span>
                  <span className="ctx internal">Internal</span>
                  <span className="ctx leaf">Leaf / Base</span>
                  <span className="ctx left">Left branch (i-1,j)</span>
                  <span className="ctx right">Right branch (i,j-1)</span>
                  <span className="ctx value">Node value: dp[i][j]</span>
                </div>
                <div className="dp-recursion-tree-canvas">
                  <svg className="dp-recursion-svg" viewBox={`0 0 ${editTreeGraph.width} ${editTreeGraph.height}`}>
                    {editTreeGraph.edges.map((edge) => (
                      <line
                        key={edge.id}
                        className={`dp-recursion-edge ${edge.side}`}
                        x1={edge.fromX}
                        y1={edge.fromY}
                        x2={edge.toX}
                        y2={edge.toY}
                      />
                    ))}
                    {editTreeGraph.nodes.map((node) => (
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

            <div className="dp-matrix-wrap" aria-label="Edit distance DP matrix">
              <table className="dp-matrix-table">
                <tbody>
                  {editDistanceResult.dp.map((row, rIdx) => (
                    <tr key={`edit-r-${rIdx}`}>
                      {row.map((value, cIdx) => (
                        <td key={`edit-c-${rIdx}-${cIdx}`}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {editVisualMode === 'dryrun' && (
              <div className="dp-dry-run">
                <div className="dp-dry-run-header">
                  <h4>Detailed Dry Run</h4>
                  <span>{editFirst} {'->'} {editSecond}</span>
                </div>
                <div className="dp-dry-run-table-wrap">
                  <table className="dp-dry-run-table">
                    <thead>
                      <tr>
                        <th>Cell</th>
                        <th>Chars</th>
                        <th>Insert</th>
                        <th>Delete</th>
                        <th>Replace</th>
                        <th>Chosen</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editDryRunRows.map((row) => (
                        <tr key={`${row.row}-${row.col}`} className="dp-dry-run-row done">
                          <td>dp[{row.row}][{row.col}]</td>
                          <td>{row.charA}/{row.charB}</td>
                          <td>{row.insertCost}</td>
                          <td>{row.deleteCost}</td>
                          <td>{row.replaceCost}</td>
                          <td>{row.value}</td>
                          <td>{row.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="dp-transitions">
              <h4>State Transitions</h4>
              <ul>
                {editDistanceResult.transitions.slice(0, 14).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="dp-code-stack" aria-label="Edit distance C plus plus solution">
            <section className="dp-code-section">
              <h4>C++ Tabulation</h4>
              <div className="dp-code-block">
                <pre>{editDistanceCppSource}</pre>
              </div>
            </section>
          </div>
        )}
      </article>
      )}

      {selectedProblem !== null && selectedProblem !== 'climbing' && selectedProblem !== 'house' && selectedProblem !== 'coin-change' && selectedProblem !== 'unique-paths' && selectedProblem !== 'lcs' && selectedProblem !== 'edit-distance' && (
      <article className="dp-problem-card" id="dp-problem-coming-soon">
        <div className="dp-problem-header">
          <h3>{selectedProblemInfo?.title ?? 'Problem'}</h3>
          <span className="dp-problem-tag">Coming Soon</span>
        </div>

        <div className="dp-problem-nav-row">
          <button
            type="button"
            className="dp-problem-nav-btn"
            onClick={() => setSelectedProblem(null)}
          >
            Back to Problem List
          </button>
          <button
            type="button"
            className="dp-problem-nav-btn"
            onClick={() => handleSelectProblem('climbing')}
          >
            Open Climbing Stairs
          </button>
          <button
            type="button"
            className="dp-problem-nav-btn"
            onClick={() => handleSelectProblem('house')}
          >
            Open House Robber
          </button>
        </div>

        <p className="dp-problem-description">
          This problem is not implemented yet. It will be added soon with full explanation,
          dry run, visualization modes, and C++ code.
        </p>
      </article>
      )}
    </section>
  )
}

export default DPSection
