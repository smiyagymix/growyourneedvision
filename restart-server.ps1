# Restart Payment Server Script
# This script stops the current server and starts a new one with the latest code

Write-Host "🔄 Restarting Payment Server..." -ForegroundColor Cyan

# Find and stop existing server process on port 3001
Write-Host "`n📍 Finding process on port 3001..." -ForegroundColor Yellow
$connection = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($connection) {
    $processId = $connection.OwningProcess
    Write-Host "   Found process: $processId" -ForegroundColor Green
    
    Write-Host "`n⏹️  Stopping existing server..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "   Server stopped" -ForegroundColor Green
} else {
    Write-Host "   No process found on port 3001" -ForegroundColor Gray
}

# Change to server directory
Write-Host "`n📂 Changing to server directory..." -ForegroundColor Yellow
Push-Location server

# Start new server instance
Write-Host "`n🚀 Starting new server instance..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node index.js" -WorkingDirectory (Get-Location)

Pop-Location

# Wait for server to start
Write-Host "`n⏳ Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Check if server is running
$newConnection = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($newConnection) {
    Write-Host "`n✅ Server successfully restarted!" -ForegroundColor Green
    Write-Host "   Server is listening on http://localhost:3001" -ForegroundColor Cyan
    
    # Show process info
    $newProcess = Get-Process -Id $newConnection.OwningProcess -ErrorAction SilentlyContinue
    if ($newProcess) {
        Write-Host "   Process ID: $($newProcess.Id)" -ForegroundColor Gray
        Write-Host "   Started: $($newProcess.StartTime)" -ForegroundColor Gray
    }
} else {
    Write-Host "`n❌ Server failed to start. Check the server logs." -ForegroundColor Red
    exit 1
}

Write-Host "`n✨ Ready for testing!" -ForegroundColor Green
