import { useState, useEffect, useRef } from 'react'
import './SortingVisualizer.css'
import bubbleSortCppSource from './cpp/bubble_sort.cpp?raw'
import selectionSortCppSource from './cpp/selection_sort.cpp?raw'
import insertionSortCppSource from './cpp/insertion_sort.cpp?raw'
import mergeSortCppSource from './cpp/merge_sort.cpp?raw'
import quickSortCppSource from './cpp/quick_sort.cpp?raw'
import heapSortCppSource from './cpp/heap_sort.cpp?raw'
import shellSortCppSource from './cpp/shell_sort.cpp?raw'

type SortingAlgorithm = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick' | 'heap' | 'shell'
type PivotStrategy = 'last' | 'first' | 'random' | 'median3'
type SortingView = 'visual' | 'cpp'

interface ArrayBar {
  value: number
  state: 'default' | 'comparing' | 'swapping' | 'sorted'
}

interface RunHistoryEntry {
  id: number
  algorithm: SortingAlgorithm
  pivotStrategy?: PivotStrategy
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
    description: 'Picks a pivot using the selected strategy and partitions the array around it, recursively sorting the partitions.',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(log n)',
  },
  heap: {
    name: 'Heap Sort',
    description: 'Builds a max heap, repeatedly moves the root to the end, and restores heap structure.',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(1)',
  },
  shell: {
    name: 'Shell Sort',
    description: 'Performs insertion sort on elements separated by shrinking gaps to reduce large inversions early.',
    timeComplexity: 'O(n log n) to O(n²)',
    spaceComplexity: 'O(1)',
  },
}

const PIVOT_LABELS: Record<PivotStrategy, string> = {
  last: 'Last Element',
  first: 'First Element',
  random: 'Random Element',
  median3: 'Median of Three',
}

const SORTING_CPP_IMPLEMENTATIONS: Record<SortingAlgorithm, { title: string; source: string }> = {
  bubble: { title: 'Bubble Sort', source: bubbleSortCppSource },
  selection: { title: 'Selection Sort', source: selectionSortCppSource },
  insertion: { title: 'Insertion Sort', source: insertionSortCppSource },
  merge: { title: 'Merge Sort', source: mergeSortCppSource },
  quick: { title: 'Quick Sort (Pivot Strategies Included)', source: quickSortCppSource },
  heap: { title: 'Heap Sort', source: heapSortCppSource },
  shell: { title: 'Shell Sort', source: shellSortCppSource },
}

function SortingVisualizer() {
  const [array, setArray] = useState<ArrayBar[]>([])
  const [arraySize, setArraySize] = useState(50)
  const [speed, setSpeed] = useState(50)
  const [algorithm, setAlgorithm] = useState<SortingAlgorithm>('bubble')
  const [pivotStrategy, setPivotStrategy] = useState<PivotStrategy>('last')
  const [view, setView] = useState<SortingView>('visual')
  const [cppAlgorithm, setCppAlgorithm] = useState<SortingAlgorithm>('bubble')
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

    const choosePivotIndex = (low: number, high: number): number => {
      switch (pivotStrategy) {
        case 'first':
          return low
        case 'random':
          return Math.floor(Math.random() * (high - low + 1)) + low
        case 'median3': {
          const mid = Math.floor((low + high) / 2)
          const a = arr[low].value
          const b = arr[mid].value
          const c = arr[high].value

          if ((a <= b && b <= c) || (c <= b && b <= a)) return mid
          if ((b <= a && a <= c) || (c <= a && a <= b)) return low
          return high
        }
        case 'last':
        default:
          return high
      }
    }

    const partition = async (low: number, high: number): Promise<number> => {
      const pivotIndex = choosePivotIndex(low, high)

      if (pivotIndex !== high) {
        arr[pivotIndex].state = 'swapping'
        arr[high].state = 'swapping'
        setArray([...arr])
        await delay(101 - speed)

        const pivotSwapTemp = arr[pivotIndex]
        arr[pivotIndex] = arr[high]
        arr[high] = pivotSwapTemp
        swapCount++
        updateSwaps(swapCount)

        arr[pivotIndex].state = 'default'
        arr[high].state = 'default'
      }

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

  // Heap Sort implementation
  const heapSort = async () => {
    const arr = [...array]
    const n = arr.length
    let compCount = 0
    let swapCount = 0

    const heapify = async (size: number, root: number): Promise<void> => {
      if (!sortingRef.current) return

      let largest = root
      const left = 2 * root + 1
      const right = 2 * root + 2

      if (left < size) {
        arr[root].state = 'comparing'
        arr[left].state = 'comparing'
        setArray([...arr])
        compCount++
        updateComparisons(compCount)
        await delay(101 - speed)

        if (arr[left].value > arr[largest].value) {
          largest = left
        }

        arr[root].state = 'default'
        arr[left].state = 'default'
      }

      if (right < size) {
        arr[root].state = 'comparing'
        arr[right].state = 'comparing'
        setArray([...arr])
        compCount++
        updateComparisons(compCount)
        await delay(101 - speed)

        if (arr[right].value > arr[largest].value) {
          largest = right
        }

        arr[root].state = 'default'
        arr[right].state = 'default'
      }

      if (largest !== root) {
        arr[root].state = 'swapping'
        arr[largest].state = 'swapping'
        setArray([...arr])
        await delay(101 - speed)

        const temp = arr[root]
        arr[root] = arr[largest]
        arr[largest] = temp
        swapCount++
        updateSwaps(swapCount)

        arr[root].state = 'default'
        arr[largest].state = 'default'
        setArray([...arr])

        await heapify(size, largest)
      }
    }

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      if (!sortingRef.current) return
      await heapify(n, i)
    }

    for (let i = n - 1; i > 0; i--) {
      if (!sortingRef.current) return

      arr[0].state = 'swapping'
      arr[i].state = 'swapping'
      setArray([...arr])
      await delay(101 - speed)

      const temp = arr[0]
      arr[0] = arr[i]
      arr[i] = temp
      swapCount++
      updateSwaps(swapCount)

      arr[i].state = 'sorted'
      arr[0].state = 'default'
      setArray([...arr])

      await heapify(i, 0)
    }

    arr[0].state = 'sorted'
    setArray([...arr])
  }

  // Shell Sort implementation
  const shellSort = async () => {
    const arr = [...array]
    const n = arr.length
    let compCount = 0
    let swapCount = 0

    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
      for (let i = gap; i < n; i++) {
        if (!sortingRef.current) return

        const temp = arr[i]
        let j = i

        arr[i].state = 'comparing'
        setArray([...arr])
        await delay(101 - speed)

        while (j >= gap) {
          if (!sortingRef.current) return

          compCount++
          updateComparisons(compCount)

          arr[j - gap].state = 'comparing'
          setArray([...arr])
          await delay(101 - speed)

          if (arr[j - gap].value > temp.value) {
            arr[j - gap].state = 'swapping'
            arr[j].state = 'swapping'
            setArray([...arr])
            await delay(101 - speed)

            arr[j] = arr[j - gap]
            swapCount++
            updateSwaps(swapCount)
            setArray([...arr])

            arr[j].state = 'default'
            arr[j - gap].state = 'default'
            j -= gap
          } else {
            arr[j - gap].state = 'default'
            break
          }
        }

        arr[j] = temp
        arr[j].state = 'default'
        setArray([...arr])
      }
    }

    for (let i = 0; i < n; i++) {
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
      case 'heap':
        await heapSort()
        break
      case 'shell':
        await shellSort()
        break
    }

    const durationMs = Math.round(performance.now() - startedAt)
    const status: RunHistoryEntry['status'] = sortingRef.current ? 'completed' : 'stopped'

    setRunHistory(prev => [
      {
        id: Date.now(),
        algorithm,
        pivotStrategy: algorithm === 'quick' ? pivotStrategy : undefined,
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
            onChange={(e) => {
              const selected = e.target.value as SortingAlgorithm
              setAlgorithm(selected)
              setCppAlgorithm(selected)
            }}
            disabled={isSorting}
          >
            <option value="bubble">Bubble Sort</option>
            <option value="selection">Selection Sort</option>
            <option value="insertion">Insertion Sort</option>
            <option value="merge">Merge Sort</option>
            <option value="quick">Quick Sort</option>
            <option value="heap">Heap Sort</option>
            <option value="shell">Shell Sort</option>
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

        {algorithm === 'quick' && (
          <div className="control-group">
            <label>Pivot:</label>
            <select
              value={pivotStrategy}
              onChange={(e) => setPivotStrategy(e.target.value as PivotStrategy)}
              disabled={isSorting}
            >
              <option value="last">Last Element</option>
              <option value="first">First Element</option>
              <option value="random">Random Element</option>
              <option value="median3">Median of Three</option>
            </select>
          </div>
        )}

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

      <div className="sorting-view-toggle" role="tablist" aria-label="Sorting section view">
        <button
          type="button"
          className={`sorting-view-btn ${view === 'visual' ? 'active' : ''}`}
          onClick={() => setView('visual')}
          aria-selected={view === 'visual'}
        >
          Visualization
        </button>
        <button
          type="button"
          className={`sorting-view-btn ${view === 'cpp' ? 'active' : ''}`}
          onClick={() => setView('cpp')}
          aria-selected={view === 'cpp'}
        >
          C++ Code
        </button>
      </div>

      {view === 'visual' ? (
        <>
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
                      <th>Pivot</th>
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
                        <td>{run.pivotStrategy ? PIVOT_LABELS[run.pivotStrategy] : '-'}</td>
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
        </>
      ) : (
        <section className="sorting-code-section" aria-label="C plus plus implementations for sorting algorithms">
          <div className="sorting-code-header">
            <h3>C++ Implementations</h3>
            <span>Includes all sorting algorithms used in this visualizer.</span>
          </div>

          <div className="sorting-code-toolbar">
            <label>Algorithm:</label>
            <select
              value={cppAlgorithm}
              onChange={(e) => setCppAlgorithm(e.target.value as SortingAlgorithm)}
            >
              <option value="bubble">Bubble Sort</option>
              <option value="selection">Selection Sort</option>
              <option value="insertion">Insertion Sort</option>
              <option value="merge">Merge Sort</option>
              <option value="quick">Quick Sort</option>
              <option value="heap">Heap Sort</option>
              <option value="shell">Shell Sort</option>
            </select>
          </div>

          <div className="sorting-code-stack">
            <article className="sorting-code-card">
              <h4>{SORTING_CPP_IMPLEMENTATIONS[cppAlgorithm].title}</h4>
              <div className="sorting-code-block">
                <pre>{SORTING_CPP_IMPLEMENTATIONS[cppAlgorithm].source}</pre>
              </div>
            </article>
          </div>
        </section>
      )}
    </div>
  )
}

export default SortingVisualizer
