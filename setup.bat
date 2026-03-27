@echo off
REM Algorithm Visualizer Setup Script for Windows

echo.
echo 🚀 Algorithm Visualizer - AI Setup
echo ==================================

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js detected: %NODE_VERSION%

REM Frontend setup
echo.
echo 📦 Installing Frontend Dependencies...
call npm install

REM Backend setup
echo.
echo 📦 Installing Backend Dependencies...
cd backend
call npm install
cd ..

REM Database initialization
echo.
echo 🗄️  Initializing Database...
cd backend
call npm run db:init
cd ..

REM Environment setup
echo.
echo 🔑 Setting Up Environment Variables...
if not exist "backend\.env" (
    echo Creating backend\.env from template...
    copy backend\.env.example backend\.env
    echo ⚠️  IMPORTANT: Edit backend\.env and add your OpenAI API key
    echo   Get one at: https://platform.openai.com/api-keys
) else (
    echo ✅ backend\.env already exists
)

echo.
echo ==================================
echo ✅ Setup Complete!
echo.
echo Next Steps:
echo 1. Edit backend\.env with your OpenAI API key
echo 2. Terminal 1: npm run dev (frontend on http://localhost:5173)
echo 3. Terminal 2: cd backend ^&^& npm run dev (backend on http://localhost:5000)
echo.
echo Need help? Check AI_SETUP_GUIDE.md
echo.
pause
