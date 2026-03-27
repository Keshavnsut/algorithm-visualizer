# 🤖 AI Assistant - Quick Start

## 5-Minute Setup

### Step 1: Get OpenAI API Key
1. Visit: https://platform.openai.com/api-keys
2. Sign up/login
3. Create new API key
4. Copy the key (save it, you won't see it again!)

### Step 2: Run Setup Script
**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

Or manually:
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend
npm install

# Initialize database
npm run db:init

# Create .env file
cp .env.example .env
# Edit .env and paste your API key
```

### Step 3: Start Both Services

**Terminal 1 - Frontend:**
```bash
npm run dev
```
→ Opens http://localhost:5173

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```
→ Runs on http://localhost:5000

### Step 4: Use AI Features

Look for the **🤖 button** in bottom-right corner of your screen

- **Explain** - Paste code, get AI explanation
- **Hint** - Get graduated hints (level 1-3)
- **Chat** - Ask algorithm questions
- **Optimize** - Get code improvement suggestions

## Troubleshooting

### "Cannot find module 'openai'"
```bash
cd backend
npm install openai
```

### "OPENAI_API_KEY is not set"
1. Check `backend/.env` exists
2. Verify API key is there (not empty)
3. Restart backend server

### Port 5000/5173 already in use
```bash
# Change port in backend/.env
PORT=5001

# Or kill existing process (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Database errors
```bash
rm -rf backend/data
cd backend
npm run db:init
```

## Features Overview

| Feature | How It Works |
|---------|-------------|
| **Explain** | Paste your code → AI analyzes it → Get walkthrough |
| **Hint** | Choose problem → Select level → Get guidance |
| **Chat** | Ask questions → Get AI answers with context |
| **Optimize** | Submit code → Get improvement suggestions |

## Tips

- 💡 Use hints before asking for explanations
- 💬 Chat works best with specific algorithm questions
- 🔄 The AI can explain errors - just paste the error message
- 📱 Works on mobile (responsive design)

## Next Steps

- Explore the DP problems with AI help
- Try different algorithms
- Check error explanations
- Ask the AI about complexity analysis

---

**Need help?** Check [AI_SETUP_GUIDE.md](AI_SETUP_GUIDE.md) for detailed documentation.
