#!/bin/bash

# Algorithm Visualizer Setup Script

echo "🚀 Algorithm Visualizer - AI Setup"
echo "=================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js detected: $(node --version)"

# Frontend setup
echo ""
echo "📦 Installing Frontend Dependencies..."
npm install

# Backend setup
echo ""
echo "📦 Installing Backend Dependencies..."
cd backend
npm install
cd ..

# Database initialization
echo ""
echo "🗄️ Initializing Database..."
cd backend
npm run db:init
cd ..

# Environment setup
echo ""
echo "🔑 Setting Up Environment Variables..."
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from template..."
    cp backend/.env.example backend/.env
    echo "⚠️  IMPORTANT: Edit backend/.env and add your OpenAI API key"
    echo "   Get one at: https://platform.openai.com/api-keys"
else
    echo "✅ backend/.env already exists"
fi

echo ""
echo "=================================="
echo "✅ Setup Complete!"
echo ""
echo "Next Steps:"
echo "1. Edit backend/.env with your OpenAI API key"
echo "2. Terminal 1: npm run dev (frontend on http://localhost:5173)"
echo "3. Terminal 2: cd backend && npm run dev (backend on http://localhost:5000)"
echo ""
echo "Need help? Check AI_SETUP_GUIDE.md"
