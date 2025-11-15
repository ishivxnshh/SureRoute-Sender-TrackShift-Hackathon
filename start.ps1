Write-Host "SureRoute - Starting all services..." -ForegroundColor Cyan
Write-Host ""

# Kill old node processes on our ports (ignore errors)
Write-Host "Cleaning up old processes..."
$ports = @(4000, 4600, 5173)
foreach ($port in $ports) {
    $procs = netstat -ano | findstr ":$port" | ForEach-Object {
        if ($_ -match '\s+(\d+)$') { $matches[1] }
    } | Select-Object -Unique
    foreach ($procId in $procs) {
        try {
            taskkill /F /PID $procId 2>&1 | Out-Null
            Write-Host "  Killed process $procId on port $port" -ForegroundColor Yellow
        } catch {}
    }
}

Start-Sleep -Seconds 2

# Start services in separate windows
Write-Host ""
Write-Host "Starting services in separate windows..." -ForegroundColor Green
Write-Host ""

# Simulator - try 4500, fallback to 4501
$simPort = 4500
$testSim = netstat -ano | findstr ":$simPort"
if ($testSim) {
    Write-Host "  Port 4500 in use, using 4501 for simulator" -ForegroundColor Yellow
    $simPort = 4501
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd simulator; Write-Host 'Simulator on port $simPort' -ForegroundColor Cyan; `$env:PORT=$simPort; npm start"

# Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; Write-Host 'Backend on port 4000' -ForegroundColor Cyan; npm start"

# Relay
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd relay; Write-Host 'Relay on port 4600' -ForegroundColor Cyan; npm start"

# Agents
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd agents/monitor; Write-Host 'Agent Monitor' -ForegroundColor Cyan; npm start"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd agents/scheduler; Write-Host 'Agent Scheduler' -ForegroundColor Cyan; npm start"

# Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; Write-Host 'Frontend on port 5173' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "Services starting in separate windows..." -ForegroundColor Green
Write-Host ""
Write-Host "Endpoints:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:5173"
Write-Host "  Backend:   http://localhost:4000/health"
Write-Host "  Simulator: http://localhost:$simPort/conditions"
Write-Host "  Relay:     http://localhost:4600"
Write-Host ""
Write-Host "Press any key to exit this window (services will keep running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

