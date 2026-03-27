# Algorithm Visualizer - AI-Powered Learning Platform

A comprehensive algorithm learning platform with **visual demonstrations**, **code execution engine**, and **AI-powered assistance**.

## 🚀 Features

### Frontend
- **Sorting Visualizer** - Bubble, Selection, Insertion, Merge, Quick, Heap, Shell Sort
- **Pathfinding Visualizer** - BFS, DFS, Dijkstra, A* algorithms
- **Dynamic Programming Hub** - 6 problems with visual walkthroughs, recursion trees, dry runs
- **C++ Code References** - Implementations for all algorithms
- **Interactive Controls** - Step-by-step execution, speed control, pattern generation

### Backend & AI
- **Code Explanation** - AI-powered analysis of submitted code
- **Intelligent Hints** - Graduated hint system (3 levels)
- **Algorithm Q&A** - Chat interface for algorithm questions
- **Code Optimization** - AI suggestions for improving efficiency
- **Error Validation** - Explanations for compilation/runtime errors
- **History Tracking** - Save and retrieve past interactions

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API Key ([get one here](https://platform.openai.com/api-keys))

## 🛠️ Setup

### 1. Clone & Install Frontend
```bash
npm install
```

### 2. Set Up Backend
```bash
cd backend
npm install
```

### 3. Configure OpenAI
```bash
# Create .env in backend directory
cp .env.example .env
```

Edit `backend/.env` and add:
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
FRONTEND_URL=http://localhost:5173
```

### 4. Initialize Database
```bash
cd backend
npm run db:init
```

## 🚀 Running the App

### Development Mode (Both Services)

**Terminal 1 - Frontend:**
```bash
npm run dev
```
Runs on http://localhost:5173

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```
Runs on http://localhost:5000

### Production Build
```bash
# Frontend
npm run build

# Backend
cd backend
npm run build
npm start
```

## 📚 Project Structure

```
algorithm-visualizer/
├── src/
│   ├── components/
│   │   ├── SortingVisualizer/
│   │   ├── PathfindingVisualizer/
│   │   ├── DPSection/
│   │   └── AIAssistant/           ← NEW: AI Features
│   ├── App.tsx
│   └── main.tsx
├── backend/                        ← NEW: Express Backend
│   ├── src/
│   │   ├── services/
│   │   │   └── openai.service.ts  ← AI Integration
│   │   ├── routes/
│   │   │   └── ai.routes.ts       ← API Endpoints
│   │   ├── db/
│   │   │   └── database.ts        ← SQLite
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── index.html
├── package.json
├── vite.config.ts
└── docker-compose.yml
```

## 🤖 API Endpoints

### Explanations
**POST** `/api/ai/explain`
```json
{
  "code": "your code",
  "language": "python",
  "problemName": "Climbing Stairs"
}
```

### Hints
**POST** `/api/ai/hint`
```json
{
  "problemName": "Climbing Stairs",
  "difficulty": "medium",
  "hintLevel": 1
}
```

### Chat
**POST** `/api/ai/chat`
```json
{
  "messages": [{"role": "user", "content": "What is DP?"}],
  "problemName": "Climbing Stairs"
}
```

### Code Optimization
**POST** `/api/ai/optimize`
```json
{
  "code": "your code",
  "language": "python"
}
```

### Error Validation
**POST** `/api/ai/validate`
```json
{
  "code": "your code",
  "language": "cpp",
  "error": "error message"
}
```

## 🔧 Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- CSS3 (responsive design)

**Backend:**
- Node.js + Express
- TypeScript
- OpenAI API (GPT-3.5-turbo/GPT-4)
- SQLite (better-sqlite3)

## 📖 Problem Categories

### DP Problems (6 implemented)
1. **Climbing Stairs** - 1D DP, recursion tree, dry run
2. **House Robber** - 1D DP with choices
3. **Coin Change** - 1D DP with comparison mode
4. **Unique Paths** - 2D DP with grid visualization
5. **Longest Common Subsequence** - 2D DP string matching
6. **Edit Distance** - 2D DP string transformation

### Sorting Algorithms (7)
- Bubble Sort
- Selection Sort
- Insertion Sort
- Merge Sort
- Quick Sort (with pivot strategies)
- Heap Sort
- Shell Sort

### Pathfinding Algorithms (4)
- BFS (Breadth-First Search)
- DFS (Depth-First Search)
- Dijkstra's Algorithm
- A* Algorithm

## 🎯 Using AI Features

### 1. Code Explanation
Click **Explain** tab → Paste code → Get detailed walkthrough

### 2. Getting Hints
Click **Hint** tab → Choose level (1-3) → Get graduated guidance

### 3. Algorithm Q&A
Click **Chat** tab → Ask questions → Get AI responses with context

### 4. Optimize Code
Click **Optimize** tab → Get improvement suggestions

## 🐛 Troubleshooting

### Backend not running
```bash
# Check if port 5000 is free
# Kill existing process or change PORT in .env
```

### OpenAI API errors
- Verify API key in `.env`
- Check API key permissions
- Ensure sufficient quota/balance

### Database errors
```bash
rm -rf backend/data  # Reset database
npm run db:init      # Reinitialize
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please check [CONTRIBUTING.md](CONTRIBUTING.md)

## 📞 Support

For issues or questions, open an issue on GitHub.

---

**Happy Learning!** 🎓
