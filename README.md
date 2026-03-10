# Algorithm Visualizer

An interactive web application to visualize popular sorting and pathfinding algorithms. Built with React + TypeScript.

![Algorithm Visualizer](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-5-yellow)

## Features

### Sorting Algorithms
- **Bubble Sort** - Simple comparison-based sorting
- **Selection Sort** - In-place comparison sorting
- **Insertion Sort** - Builds sorted array one element at a time
- **Merge Sort** - Efficient divide-and-conquer algorithm
- **Quick Sort** - Fast partition-based sorting

### Pathfinding Algorithms
- **Breadth-First Search (BFS)** - Guarantees shortest path in unweighted graphs
- **Depth-First Search (DFS)** - Explores paths deeply before backtracking
- **Dijkstra's Algorithm** - Finds shortest path in weighted graphs
- **A* Search** - Uses heuristics for efficient pathfinding

### Interactive Controls
- Adjust visualization speed
- Change array size (sorting)
- Draw walls and set start/end points (pathfinding)
- Generate random arrays or mazes
- Step-by-step execution with color-coded states

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/algorithm-visualizer.git

# Navigate to project directory
cd algorithm-visualizer

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

### Build for Production

```bash
npm run build
```

## Project Structure

```
algorithm-visualizer/
├── src/
│   ├── components/
│   │   ├── SortingVisualizer/
│   │   │   ├── SortingVisualizer.tsx
│   │   │   └── SortingVisualizer.css
│   │   └── PathfindingVisualizer/
│   │       ├── PathfindingVisualizer.tsx
│   │       └── PathfindingVisualizer.css
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## How It Works

### Sorting Visualizer
- Each bar represents an array element
- **Purple**: Default state
- **Yellow**: Being compared
- **Red**: Being swapped
- **Green**: Sorted position

### Pathfinding Visualizer
- Click and drag to draw walls
- **Green**: Start node
- **Red**: End node
- **Purple**: Visited nodes
- **Yellow**: Final path

## Algorithm Complexity

| Algorithm | Time (Best) | Time (Average) | Time (Worst) | Space |
|-----------|-------------|----------------|--------------|-------|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) |

## Technologies Used

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **CSS3** - Styling with CSS variables

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the need to visualize algorithms for learning
- Built as a portfolio project
