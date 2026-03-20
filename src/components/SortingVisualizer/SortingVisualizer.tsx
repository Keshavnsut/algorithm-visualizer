import { useState, useEffect, useRef } from 'react'
import './SortingVisualizer.css'

// Algorithm implementations will be added in Phase 2
type SortingAlgorithm = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick'

interface ArrayBar {
  value: number
  state: 'default' | 'comparing' | 'swapping' | 'sorted'
}

interface RunHistoryEntry {
  id: number
  algorithm: SortingAlgorithm
  arraySize: number
  speed: number
  comparisons: number
  swaps: number
  durationMs: number
  status: 'completed' | 'stopped'
  timestamp: string
}

const ALGORITHM_INFO: Record<SortingAlgorithm, { name: string; description: string; timeComplexity: string; spaceComplexity: string }> = {
  bubble: {
    name: 'Bubble Sort',
    description: 'Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
  },
  selection: {
    name: 'Selection Sort',
    description: 'Divides the input into sorted and unsorted regions, repeatedly selects the smallest element from unsorted region.',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
  },
  insertion: {
    name: 'Insertion Sort',
    description: 'Builds the sorted array one item at a time by inserting each element into its correct position.',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
  },
  merge: {
    name: 'Merge Sort',
    description: 'Divides the array into halves, recursively sorts them, then merges the sorted halves.',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
  },
  quick: {
    name: 'Quick Sort',
    description: 'Picks a pivot element and partitions the array around it, recursively sorting the partitions.',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(log n)',
  },
}

function SortingVisualizer() {
  const [array, setArray] = useState<ArrayBar[]>([])
  const [arraySize, setArraySize] = useState(50)
  const [speed, setSpeed] = useState(50)
  const [algorithm, setAlgorithm] = useState<SortingAlgorithm>('bubble')
  const [isSorting, setIsSorting] = useState(false)
  const [comparisons, setComparisons] = useState(0)
  const [swaps, setSwaps] = useState(0)
  const [runHistory, setRunHistory] = useState<RunHistoryEntry[]>([])
  const sortingRef = useRef(false)
  const comparisonsRef = useRef(0)
  const swapsRef = useRef(0)

  const updateComparisons = (value: number) => {
    comparisonsRef.current = value
    setComparisons(value)
  }

  const updateSwaps = (value: number) => {
    swapsRef.current = value
    setSwaps(value)
  }

  const resetCounters = () => {
    updateComparisons(0)
    updateSwaps(0)
  }

  // Generate random array
  const generateArray = () => {
    const newArray: ArrayBar[] = []
    for (let i = 0; i < arraySize; i++) {
      newArray.push({
        value: Math.floor(Math.random() * 400) + 10,
        state: 'default',
      })
    }
    setArray(newArray)
    resetCounters()
  }

  useEffect(() => {
    generateArray()
  }, [arraySize])

  // Delay helper for animations
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // Bubble Sort implementation
  const bubbleSort = async () => {
    const arr = [...array]
    const n = arr.length
    let compCount = 0
    let swapCount = 0

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (!sortingRef.current) return

        // Mark comparing
        arr[j].state = 'comparing'
        arr[j + 1].state = 'comparing'
        setArray([...arr])
        compCount++
        updateComparisons(compCount)
        await delay(101 - speed)

        if (arr[j].value > arr[j + 1].value) {
          // Swap
          arr[j].state = 'swapping'
          arr[j + 1].state = 'swapping'
          setArray([...arr])
          await delay(101 - speed)

          const temp = arr[j]
          arr[j] = arr[j + 1]
          arr[j + 1] = temp
          swapCount++
          updateSwaps(swapCount)
        }

        arr[j].state = 'default'
        arr[j + 1].state = 'default'
      }
      arr[n - 1 - i].state = 'sorted'
    }
    arr[0].state = 'sorted'
    setArray([...arr])
  }

  // Selection Sort implementation
  const selectionSort = async () => {
    const arr = [...array]
    const n = arr.length
    let compCount = 0
    let swapCount = 0

    for (let i = 0; i < n - 1; i++) {
      let minIdx = i
      arr[i].state = 'comparing'
      setArray([...arr])

      for (let j = i + 1; j < n; j++) {
        if (!sortingRef.current) return

        arr[j].state = 'comparing'
        setArray([...arr])
        compCount++
        updateComparisons(compCount)
        await delay(101 - speed)

        if (arr[j].value < arr[minIdx].value) {
          if (minIdx !== i) arr[minIdx].state = 'default'
          minIdx = j
        } else {
          arr[j].state = 'default'
        }
      }

      if (minIdx !== i) {
        arr[i].state = 'swapping'
        arr[minIdx].state = 'swapping'
        setArray([...arr])
        await delay(101 - speed)

        const temp = arr[i]
        arr[i] = arr[minIdx]
        arr[minIdx] = temp
        swapCount++
        updateSwaps(swapCount)
      }

      arr[i].state = 'sorted'
      if (minIdx !== i) arr[minIdx].state = 'default'
      setArray([...arr])
    }
    arr[n - 1].state = 'sorted'
    setArray([...arr])
  }

  // Insertion Sort implementation
  const insertionSort = async () => {
    const arr = [...array]
    const n = arr.length
    let compCount = 0
    let swapCount = 0

    arr[0].state = 'sorted'
    setArray([...arr])

    for (let i = 1; i < n; i++) {
      if (!sortingRef.current) return

      const key = arr[i]
      let j = i - 1
      arr[i].state = 'comparing'
      setArray([...arr])
      await delay(101 - speed)

      while (j >= 0 && arr[j].value > key.value) {
        if (!sortingRef.current) return

        compCount++
        updateComparisons(compCount)

        arr[j + 1] = arr[j]
        arr[j + 1].state = 'swapping'
        setArray([...arr])
        swapCount++
        updateSwaps(swapCount)
        await delay(101 - speed)

        arr[j + 1].state = 'sorted'
        j--
      }
      compCount++
      updateComparisons(compCount)

      arr[j + 1] = key
      arr[j + 1].state = 'sorted'
      setArray([...arr])
    }
  }

  // Merge Sort implementation
  const mergeSort = async () => {
    const arr = [...array]
    let compCount = 0
    let swapCount = 0

    const merge = async (left: number, mid: number, right: number) => {
      const leftArr = arr.slice(left, mid + 1)
      const rightArr = arr.slice(mid + 1, right + 1)

      let i = 0, j = 0, k = left

      while (i < leftArr.length && j < rightArr.length) {
        if (!sortingRef.current) return

        arr[k].state = 'comparing'
        setArray([...arr])
        compCount++
        updateComparisons(compCount)
        await delay(101 - speed)

        if (leftArr[i].value <= rightArr[j].value) {
          arr[k] = { ...leftArr[i], state: 'swapping' }
          i++
        } else {
          arr[k] = { ...rightArr[j], state: 'swapping' }
          j++
        }
        swapCount++
        updateSwaps(swapCount)
        setArray([...arr])
        await delay(101 - speed)
        arr[k].state = 'default'
        k++
      }

      while (i < leftArr.length) {
        if (!sortingRef.current) return
        arr[k] = { ...leftArr[i], state: 'default' }
        i++
        k++
        setArray([...arr])
      }

      while (j < rightArr.length) {
        if (!sortingRef.current) return
        arr[k] = { ...rightArr[j], state: 'default' }
        j++
        k++
        setArray([...arr])
      }
    }

    const sort = async (left: number, right: number) => {
      if (left < right) {
        const mid = Math.floor((left + right) / 2)
        await sort(left, mid)
        await sort(mid + 1, right)
        await merge(left, mid, right)
      }
    }

    await sort(0, arr.length - 1)

    // Mark all as sorted
    for (let i = 0; i < arr.length; i++) {
      arr[i].state = 'sorted'
    }
    setArray([...arr])
  }

  // Quick Sort implementation
  const quickSort = async () => {
    const arr = [...array]
    let compCount = 0
    let swapCount = 0

    const partition = async (low: number, high: number): Promise<number> => {
      const pivot = arr[high]
      pivot.state = 'comparing'
      setArray([...arr])

      let i = low - 1

      for (let j = low; j < high; j++) {
        if (!sortingRef.current) return -1

        arr[j].state = 'comparing'
        setArray([...arr])
        compCount++
        updateComparisons(compCount)
        await delay(101 - speed)

        if (arr[j].value < pivot.value) {
          i++
          arr[i].state = 'swapping'
          arr[j].state = 'swapping'
          setArray([...arr])
          await delay(101 - speed)

          const temp = arr[i]
          arr[i] = arr[j]
          arr[j] = temp
          swapCount++
          updateSwaps(swapCount)
        }

        arr[j].state = 'default'
        if (i >= low) arr[i].state = 'default'
      }

      arr[i + 1].state = 'swapping'
      arr[high].state = 'swapping'
      setArray([...arr])
      await delay(101 - speed)

      const temp = arr[i + 1]
      arr[i + 1] = arr[high]
      arr[high] = temp
      swapCount++
      updateSwaps(swapCount)

      arr[i + 1].state = 'sorted'
      arr[high].state = 'default'
      setArray([...arr])

      return i + 1
    }

    const sort = async (low: number, high: number) => {
      if (low < high && sortingRef.current) {
        const pi = await partition(low, high)
        if (pi === -1) return
        await sort(low, pi - 1)
        await sort(pi + 1, high)
      } else if (low === high) {
        arr[low].state = 'sorted'
        setArray([...arr])
      }
    }

    await sort(0, arr.length - 1)

    // Mark all as sorted
    for (let i = 0; i < arr.length; i++) {
      arr[i].state = 'sorted'
    }
    setArray([...arr])
  }

  // Start sorting
  const startSorting = async () => {
    setIsSorting(true)
    sortingRef.current = true
    resetCounters()
    const startedAt = performance.now()

    // Reset array states
    setArray(array.map(bar => ({ ...bar, state: 'default' })))

    switch (algorithm) {
      case 'bubble':
        await bubbleSort()
        break
      case 'selection':
        await selectionSort()
        break
      case 'insertion':
        await insertionSort()
        break
      case 'merge':
        await mergeSort()
        break
      case 'quick':
        await quickSort()
        break
    }

    const durationMs = Math.round(performance.now() - startedAt)
    const status: RunHistoryEntry['status'] = sortingRef.current ? 'completed' : 'stopped'

    setRunHistory(prev => [
      {
        id: Date.now(),
        algorithm,
        arraySize,
        speed,
        comparisons: comparisonsRef.current,
        swaps: swapsRef.current,
        durationMs,
        status,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev,
    ].slice(0, 8))

    setIsSorting(false)
    sortingRef.current = false
  }

  // Stop sorting
  const stopSorting = () => {
    sortingRef.current = false
    setIsSorting(false)
  }

  return (
    <div className="visualizer-container">
      <div className="controls">
        <div className="control-group">
          <label>Algorithm:</label>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as SortingAlgorithm)}
            disabled={isSorting}
          >
            <option value="bubble">Bubble Sort</option>
            <option value="selection">Selection Sort</option>
            <option value="insertion">Insertion Sort</option>
            <option value="merge">Merge Sort</option>
            <option value="quick">Quick Sort</option>
          </select>
        </div>

        <div className="control-group">
          <label>Size: {arraySize}</label>
          <input
            type="range"
            min="10"
            max="100"
            value={arraySize}
            onChange={(e) => setArraySize(Number(e.target.value))}
            disabled={isSorting}
          />
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

        <button
          className="btn btn-secondary"
          onClick={generateArray}
          disabled={isSorting}
        >
          Generate New Array
        </button>

        {!isSorting ? (
          <button className="btn btn-primary" onClick={startSorting}>
            Start Sorting
          </button>
        ) : (
          <button className="btn btn-danger" onClick={stopSorting}>
            Stop
          </button>
        )}
      </div>

      <div className="stats">
        <span>Comparisons: <strong>{comparisons}</strong></span>
        <span>Swaps: <strong>{swaps}</strong></span>
      </div>

      <div className="history-card">
        <div className="history-header">
          <h3>Recent Runs</h3>
          <button
            className="btn btn-secondary"
            onClick={() => setRunHistory([])}
            disabled={isSorting || runHistory.length === 0}
          >
            Clear History
          </button>
        </div>

        {runHistory.length === 0 ? (
          <p className="history-empty">No runs yet. Start sorting to build history.</p>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Algorithm</th>
                  <th>Size</th>
                  <th>Speed</th>
                  <th>Comparisons</th>
                  <th>Swaps</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {runHistory.map((run) => (
                  <tr key={run.id}>
                    <td>{run.timestamp}</td>
                    <td>{ALGORITHM_INFO[run.algorithm].name}</td>
                    <td>{run.arraySize}</td>
                    <td>{run.speed}%</td>
                    <td>{run.comparisons}</td>
                    <td>{run.swaps}</td>
                    <td>{run.durationMs}ms</td>
                    <td>
                      <span className={`status-pill ${run.status}`}>
                        {run.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="array-container">
        {array.map((bar, idx) => (
          <div
            key={idx}
            className={`array-bar ${bar.state}`}
            style={{
              height: `${bar.value}px`,
              width: `${Math.max(800 / arraySize - 2, 2)}px`,
            }}
          />
        ))}
      </div>

      <div className="algorithm-info">
        <h3>{ALGORITHM_INFO[algorithm].name}</h3>
        <p>{ALGORITHM_INFO[algorithm].description}</p>
        <div className="complexity">
          <span>Time: <code>{ALGORITHM_INFO[algorithm].timeComplexity}</code></span>
          <span>Space: <code>{ALGORITHM_INFO[algorithm].spaceComplexity}</code></span>
        </div>
      </div>
    </div>
  )
}

export default SortingVisualizer
