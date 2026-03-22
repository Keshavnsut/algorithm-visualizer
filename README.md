# Algorithm Visualizer

Interactive algorithm learning platform built with React + TypeScript + Vite.

![React](https://img.shields.io/badge/React-18-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-5-2f74c0)
![Vite](https://img.shields.io/badge/Vite-7-f2b022)
![Status](https://img.shields.io/badge/Status-Active%20Development-2d9b5f)

---

## Project Overview

This project currently has three major learning sections:

- Sorting Visualizer
- Pathfinding Visualizer
- Dynamic Programming Hub

Each section includes algorithm controls, visual states, and educational overlays to help users understand how the algorithm evolves step by step.

---

## Current State Dashboard

| Section | Status | Highlights |
|---|---|---|
| Sorting | Implemented | 7 sorting algorithms, speed and size controls, quick-sort pivot strategy, run history panel |
| Pathfinding | Implemented | BFS, DFS, Dijkstra, A*, editable weighted graph, presets, drag and edit interactions |
| Dynamic Programming | Implemented (Phase 1+) | Climbing Stairs and House Robber with visual walkthrough, compare mode, recursion tree mode, dry run, C++ tabulation and memoization |

### Progress Snapshot

- Sorting: Completed core feature set
- Pathfinding: Completed core feature set
- Dynamic Programming: Strong foundation completed, expanding problem library

---

## Section Details

### 1) Sorting Visualizer

#### Algorithms Available

- Bubble Sort
- Selection Sort
- Insertion Sort
- Merge Sort
- Quick Sort
- Heap Sort
- Shell Sort

#### Key Interactions

- Adjustable array size and speed
- Quick Sort pivot strategy selector:
	- First element
	- Last element
	- Random element
	- Median of three
- Real-time metrics:
	- Comparisons
	- Swaps
- Recent run history with timing and configuration snapshot

---

### 2) Pathfinding Visualizer

#### Algorithms Available

- Breadth-First Search (BFS)
- Depth-First Search (DFS)
- Dijkstra
- A*

#### Graph Features

- Preset graph layouts
- Add / move / delete nodes
- Add weighted edges
- Select custom start and end nodes
- Visual state updates for visited path and final shortest path

---

### 3) Dynamic Programming Hub

#### Problems Added

- Climbing Stairs
- House Robber

#### Learning Modes (per problem)

- DP Mode
- Recursion vs DP Mode
- Recursion Tree Mode

#### Educational Layers

- Interactive walkthrough controls (play, pause, next, previous, reset)
- Visual explanation cards
- State transitions
- Detailed dry run table
- C++ code section with:
	- Tabulation
	- Memoization

---

## Roadmap (Future Additions)

### Near-Term

- Add more DP problems (Coin Change, Unique Paths, LCS)
- Improve recursion tree with color-coded edge meaning and depth controls
- Add code copy buttons for all language blocks
- Add speed presets for DP animation

### Mid-Term

- Side-by-side algorithm comparison mode in Sorting and DP
- Performance charting for multiple runs
- Export dry run as CSV
- URL-shareable state (problem, mode, step)

### Long-Term

- Additional algorithm categories:
	- Graph algorithms (MST, Bellman-Ford)
	- Greedy problems
	- Backtracking visualizer
- In-browser code execution sandbox for selected snippets
- Guided challenge mode with problem prompts and validation

---

## Tech Stack

- React 18
- TypeScript
- Vite
- CSS3

---

## Run Locally

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/Keshavnsut/algorithm-visualizer.git
cd algorithm-visualizer
npm install
npm run dev
```

Open: http://localhost:5173

### Production Build

```bash
npm run build
```

---

## Repository Structure

```text
algorithm-visualizer/
	src/
		components/
			SortingVisualizer/
			PathfindingVisualizer/
			DPSection/
				cpp/
		App.tsx
		App.css
		index.css
		main.tsx
	public/
	package.json
	vite.config.ts
```

---

## Contribution

1. Fork the repository
2. Create a branch
3. Commit your changes
4. Push to your branch
5. Open a pull request
