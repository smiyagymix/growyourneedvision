# Stop all running dev servers and PocketBase instances
Write-Host "🛑 Stopping all dev servers..." -ForegroundColor Yellow
Write-Host ""

# Stop all node processes related to the project
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js processes" -ForegroundColor Cyan
    $nodeProcesses | Stop-Process -Force
    Write-Host "✅ Stopped all Node.js processes" -ForegroundColor Green
}
else {
    Write-Host "ℹ️  No Node.js processes running" -ForegroundColor Gray
}

# Stop PocketBase
$pbProcesses = Get-Process pocketbase -ErrorAction SilentlyContinue
if ($pbProcesses) {
    Write-Host "Found $($pbProcesses.Count) PocketBase processes" -ForegroundColor Cyan
    $pbProcesses | Stop-Process -Force
    Write-Host "✅ Stopped all PocketBase processes" -ForegroundColor Green
}
else {
    Write-Host "ℹ️  No PocketBase processes running" -ForegroundColor Gray
}

# Stop Python AI Service
$pyProcesses = Get-Process python -ErrorAction SilentlyContinue
if ($pyProcesses) {
    Write-Host "Found $($pyProcesses.Count) Python processes (checking for AI service)" -ForegroundColor Cyan
    # This is a bit aggressive, but effective for dev environment
    $pyProcesses | Stop-Process -Force 
    Write-Host "✅ Stopped all Python processes" -ForegroundColor Green
}

Write-Host ""
Write-Host "✨ All processes stopped!" -ForegroundColor Green
Write-Host ""
Write-Host "To start fresh, run: pnpm dev" -ForegroundColor Yellow
