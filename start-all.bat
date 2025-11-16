@echo off
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║   ⚡ SureRoute - Starting All Services                    ║
echo ║                                                           ║
╚═══════════════════════════════════════════════════════════╝
echo.
echo 🚀 Starting services...
echo.
echo This will open 3 terminal windows:
echo   - Backend Server (Port 5000)
echo   - Relay Server (Port 5001)
echo   - Frontend UI (Port 3000)
echo.
echo Press Ctrl+C in each window to stop services
echo.

start "SureRoute Backend" cmd /k "cd backend && npm run dev"
timeout /t 2 /nobreak > nul

start "SureRoute Relay" cmd /k "cd relay-server && npm run dev"
timeout /t 2 /nobreak > nul

start "SureRoute Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 5 /nobreak > nul

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║   ✅ All services started!                                ║
echo ║                                                           ║
echo ║   🌐 Open: http://localhost:3000                          ║
echo ║                                                           ║
echo ║   Close this window when done                            ║
echo ║                                                           ║
╚═══════════════════════════════════════════════════════════╝
echo.

start http://localhost:3000

pause
