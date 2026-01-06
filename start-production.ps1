Write-Host "🚀 STARTING PRODUCTION ENVIRONMENT: GROW YOUR NEED MULTIVERSE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Check Prerequisites
Write-Host "🔍 Checking Prerequisites..."
if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Docker is not installed or not in PATH."
    exit 1
}
if (-not (Get-Command "ollama" -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Ollama is not installed or not in PATH."
    exit 1
}

# 2. Start Ollama (Local)
Write-Host "🦙 Starting Ollama (Local Intelligence)..."
# Check if already running
$ollamaRunning = Get-Process "ollama" -ErrorAction SilentlyContinue
if (-not $ollamaRunning) {
    Start-Process "ollama" -ArgumentList "serve" -NoNewWindow
    Write-Host "   Ollama started."
}
else {
    Write-Host "   Ollama is already running."
}

# Wait for Ollama to be ready
Write-Host "   Waiting for Ollama API..."
$retries = 0
do {
    try {
        $resp = Invoke-WebRequest "http://localhost:11434/api/tags" -Method Get -ErrorAction Stop
        if ($resp.StatusCode -eq 200) { break }
    }
    catch {
        Start-Sleep -Seconds 2
        $retries++
        Write-Host -NoNewline "."
    }
} while ($retries -lt 10)

if ($retries -ge 10) {
    Write-Warning "⚠️ Ollama might not be ready, but proceeding..."
}
else {
    Write-Host "`n   ✅ Ollama is Ready."
}

# 3. Start Docker Services (PocketBase + AI Service + Others)
Write-Host "🐳 Starting Docker Services..."
docker-compose up -d --build ai-service pocketbase

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Docker Compose failed."
    exit 1
}

Write-Host "   ✅ Docker Services Started."

# 4. Verify AI Service Health
Write-Host "🧠 Verifying AI Service Health..."
Start-Sleep -Seconds 5 # Give it a moment to boot
try {
    $health = Invoke-WebRequest "http://localhost:8000/" -Method Get -ErrorAction Stop
    if ($health.StatusCode -eq 200) {
        Write-Host "   ✅ AI Service is ONLINE at http://localhost:8000"
    }
}
catch {
    Write-Warning "⚠️ AI Service health check failed. Check logs: docker-compose logs ai-service"
}

# 5. Verify PocketBase
Write-Host "🗄️ Verifying PocketBase..."
try {
    $pb = Invoke-WebRequest "http://localhost:8090/api/health" -Method Get -ErrorAction Stop
    if ($pb.StatusCode -eq 200) {
        Write-Host "   ✅ PocketBase is ONLINE at http://localhost:8090"
    }
}
catch {
    # PocketBase might not have a /health endpoint in older versions, try root
    try {
        $pb = Invoke-WebRequest "http://localhost:8090/_/" -Method Get -ErrorAction Stop
        Write-Host "   ✅ PocketBase is ONLINE."
    }
    catch {
        Write-Warning "⚠️ PocketBase check failed. Check logs: docker-compose logs pocketbase"
    }
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🎉 SYSTEM READY FOR PRODUCTION USE" -ForegroundColor Green
Write-Host "   - Frontend: http://localhost:3040 (Run 'npm run dev' if not in docker)"
Write-Host "   - AI Service: http://localhost:8000"
Write-Host "   - PocketBase: http://localhost:8090/_/"
Write-Host "   - Ollama: http://localhost:11434"
Write-Host "============================================================" -ForegroundColor Cyan
