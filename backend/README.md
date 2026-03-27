# Algorithm Visualizer Backend

Express server with OpenAI integration for AI-powered algorithm learning features.

## Features

- **Code Explanations**: AI-powered code walkthrough and analysis
- **Intelligent Hints**: Graduated hint system (3 levels)
- **Algorithm Q&A**: Chat interface for algorithm questions
- **Error Explanations**: AI guidance on compilation/runtime errors
- **Code Optimization**: Suggestions for improving solution efficiency
- **History Tracking**: Save and retrieve past interactions

## Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

### 3. Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add it to your `.env` file

### 4. Initialize Database
```bash
npm run db:init
```

### 5. Start Development Server
```bash
npm run dev
```

Server will run on `http://localhost:5000`

## API Endpoints

### POST `/api/ai/explain`
Explain submitted code
```json
{
  "code": "your code here",
  "language": "python",
  "problemName": "Climbing Stairs"
}
```

### POST `/api/ai/hint`
Get graduated hints
```json
{
  "problemName": "Climbing Stairs",
  "difficulty": "medium",
  "hintLevel": 1
}
```

### POST `/api/ai/chat`
Chat about algorithms
```json
{
  "messages": [
    {"role": "user", "content": "What is dynamic programming?"}
  ],
  "problemName": "Climbing Stairs"
}
```

### GET `/api/ai/chat-history/:problemId`
Get conversation history

### POST `/api/ai/validate`
Explain compilation errors
```json
{
  "code": "your code",
  "language": "cpp",
  "error": "error message"
}
```

### POST `/api/ai/optimize`
Get optimization suggestions
```json
{
  "code": "your code",
  "language": "python",
  "problemName": "Climbing Stairs"
}
```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `OPENAI_MODEL` - Model to use (default: gpt-3.5-turbo)
- `DATABASE_PATH` - SQLite database location
- `FRONTEND_URL` - Frontend origin for CORS

## Database

SQLite database with tables for:
- Chat history
- Explanation history
- Hint history
- AI usage tracking
