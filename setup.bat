@echo off
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║   ⚡ SureRoute Setup - First Time Installation           ║
echo ║                                                           ║
╚═══════════════════════════════════════════════════════════╝
echo.
echo 📦 Installing dependencies for all services...
echo.

echo [1/4] Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install root dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [3/4] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [4/4] Installing relay server dependencies...
cd relay-server
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install relay dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║   ✅ Installation complete!                               ║
echo ║                                                           ║
echo ║   To start the application:                              ║
echo ║   1. Run: npm run dev                                    ║
echo ║   2. Open: http://localhost:3000                         ║
echo ║                                                           ║
echo ║   📖 See README.md for full documentation                ║
echo ║   🎬 See DEMO_SCRIPT.md for presentation guide           ║
echo ║                                                           ║
╚═══════════════════════════════════════════════════════════╝
echo.
pause
