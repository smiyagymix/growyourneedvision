Write-Host "🚀 STARTING LOCAL DEVELOPMENT ENVIRONMENT: GROW YOUR NEED MULTIVERSE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Check Prerequisites
Write-Host "🔍 Checking Prerequisites..."
if (-not (Get-Command "python" -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Python is not installed or not in PATH."
    exit 1
}
if (-not (Get-Command "ollama" -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Ollama is not installed or not in PATH."
    exit 1
}
$pbPath = "..\pocketbase\pocketbase.exe"
if (-not (Test-Path $pbPath)) {
    # Try current dir relative
    $pbPath = ".\pocketbase\pocketbase.exe"
}
if (-not (Test-Path $pbPath)) {
    Write-Error "❌ PocketBase executable not found at $pbPath"
    exit 1
}
# Convert to absolute path to avoid issues if we change directory later
$pbPath = (Resolve-Path $pbPath).Path

# 2. Start Ollama
Write-Host "🦙 Starting Ollama..."
if (-not (Get-Process "ollama" -ErrorAction SilentlyContinue)) {
    Start-Process "ollama" -ArgumentList "serve" -NoNewWindow
    Write-Host "   Ollama started."
}
else {
    Write-Host "   Ollama is already running."
}

# Wait for Ollama
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
} while ($retries -lt 5)
Write-Host "`n   ✅ Ollama is Ready."

# 3. Configure PocketBase Admin
Write-Host "👤 Configuring PocketBase Admin..."
$envPath = ".env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath
    $adminEmail = $null
    $adminPass = $null
    
    foreach ($line in $envContent) {
        if ($line -match "^POCKETBASE_ADMIN_EMAIL=(.*)") { $adminEmail = $matches[1].Trim() }
        if ($line -match "^POCKETBASE_ADMIN_PASSWORD=(.*)") { $adminPass = $matches[1].Trim() }
    }

    if ($adminEmail -and $adminPass) {
        Write-Host "   Ensuring admin account exists for $adminEmail..."
        # We run this blindly; if it fails (already exists), we ignore it.
        # We use Invoke-Expression or direct call.
        try {
            $createOutput = & $pbPath admin create $adminEmail $adminPass 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Admin account created/verified."
            }
            else {
                # Check if it failed because it exists
                if ($createOutput -match "already exists") {
                    Write-Host "   ℹ️ Admin account already exists."
                }
                else {
                    Write-Host "   ⚠️ Could not create admin (might already exist or DB locked): $createOutput"
                }
            }
        }
        catch {
            Write-Host "   ⚠️ Error running admin create command: $_"
        }
    }
    else {
        Write-Warning "   POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD not found in .env"
    }
}

# 4. Start PocketBase
Write-Host "🗄️ Starting PocketBase..."
$pbProcess = $null
if (-not (Get-Process "pocketbase" -ErrorAction SilentlyContinue)) {
    $pbProcess = Start-Process -FilePath $pbPath -ArgumentList "serve" -NoNewWindow -PassThru
    Write-Host "   PocketBase started (PID: $($pbProcess.Id))."
}
else {
    Write-Host "   PocketBase is already running."
}
Start-Sleep -Seconds 2

# 5. Start AI Service
Write-Host "🧠 Starting AI Service..."
if (Test-Path "ai_service") {
    Set-Location "ai_service"
}

# Create/Activate Virtual Environment
if (-not (Test-Path ".venv")) {
    Write-Host "   Creating virtual environment..."
    python -m venv .venv
}

# Determine Python path in venv
if ($IsWindows) {
    $venvPython = ".\.venv\Scripts\python.exe"
}
else {
    $venvPython = "./.venv/bin/python"
}

Write-Host "   Installing/Verifying Python dependencies..."
# Upgrade pip first to ensure we get wheels for newer Pythons
& $venvPython -m pip install --upgrade pip

# Install requirements
& $venvPython -m pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Failed to install dependencies. Please check the error log above."
    Write-Warning "   Note: If you are on Python 3.13, some packages might not have wheels yet."
    exit 1
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🎉 SYSTEM READY" -ForegroundColor Green
Write-Host "   - AI Service: http://localhost:8000"
Write-Host "   - PocketBase: http://localhost:8090/_/"
Write-Host "   - Ollama: http://localhost:11434"
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   Launching Uvicorn (Press Ctrl+C to stop)..."

try {
    # Run Uvicorn using the venv python
    # Removed --reload to ensure stability in script execution
    & $venvPython -m uvicorn main:app --host 0.0.0.0 --port 8000
}
finally {
    Write-Host "`n🛑 Stopping services..."
    if ($pbProcess) {
        Stop-Process -Id $pbProcess.Id -ErrorAction SilentlyContinue
        Write-Host "   PocketBase stopped."
    }
    # We generally leave Ollama running as it might be used by other things
    Write-Host "   Done."
}
