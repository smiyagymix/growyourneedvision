# Launch Script for Grow Your Need Platform
# This script starts both PocketBase and the development server

Write-Host "🚀 Grow Your Need - Platform Launcher" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
    return $connection
}

# Check if PocketBase is already running
if (Test-Port -Port 8090) {
    Write-Host "✅ PocketBase is already running on port 8090" -ForegroundColor Green
}
else {
    Write-Host "🔄 Starting PocketBase server..." -ForegroundColor Yellow
    
    # Start PocketBase in a new window
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd pocketbase; .\pocketbase.exe serve" -WindowStyle Normal
    
    Write-Host "⏳ Waiting for PocketBase to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    # Verify PocketBase started
    $maxRetries = 10
    $retryCount = 0
    while (-not (Test-Port -Port 8090) -and $retryCount -lt $maxRetries) {
        Start-Sleep -Seconds 1
        $retryCount++
        Write-Host "   Retry $retryCount/$maxRetries..." -ForegroundColor Gray
    }
    
    if (Test-Port -Port 8090) {
        Write-Host "✅ PocketBase started successfully!" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Failed to start PocketBase" -ForegroundColor Red
        Write-Host "   Please start it manually: cd pocketbase && .\pocketbase.exe serve" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# Check if users are initialized
Write-Host "🔍 Checking user accounts..." -ForegroundColor Yellow

# Try to make a request to PocketBase
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8090/api/health" -Method GET -ErrorAction Stop
    Write-Host "✅ PocketBase is healthy" -ForegroundColor Green
    
    # Ask if user wants to initialize/re-initialize users
    Write-Host ""
    Write-Host "Do you want to initialize user accounts? (Y/N)" -ForegroundColor Cyan
    $initUsers = Read-Host
    
    if ($initUsers -eq "Y" -or $initUsers -eq "y") {
        Write-Host ""
        Write-Host "🔄 Initializing users..." -ForegroundColor Yellow
        & .\init-users.ps1
    }
}
catch {
    Write-Host "⚠️  Could not connect to PocketBase" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔄 Starting development server..." -ForegroundColor Yellow

# Check if dev server is already running
if (Test-Port -Port 5173) {
    Write-Host "✅ Development server is already running on port 5173" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Application is ready!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "📱 App URL:      http://localhost:5173" -ForegroundColor White
    Write-Host "🗄️  PocketBase:  http://127.0.0.1:8090/_/" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}
else {
    # Start dev server
    Write-Host "🚀 Launching development server..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "📱 App URL:      http://localhost:5173" -ForegroundColor White
    Write-Host "🗄️  PocketBase:  http://127.0.0.1:8090/_/" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Test Accounts (see CREDENTIALS.md for full list):" -ForegroundColor Cyan
    Write-Host "   Owner:  owner@growyourneed.com / Darnag12345678@" -ForegroundColor Gray
    Write-Host "   Admin:  admin@school.com / 12345678" -ForegroundColor Gray
    Write-Host "   Teacher: teacher@school.com / 123456789" -ForegroundColor Gray
    Write-Host ""
    
    # Start the dev server in current window
    npm run dev
}
