# Production Startup & Health Check Script for Windows
# Ensures all services are running and properly configured
# Usage: .\startup-production.ps1

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  GROW YOUR NEED - PRODUCTION STARTUP                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PB_PORT = 8090
$SERVER_PORT = 3001
$AI_PORT = 8000
$MAX_RETRIES = 30
$RETRY_DELAY = 1

# Colors
function Write-Success {
    Write-Host "✓ $args" -ForegroundColor Green
}

function Write-Error-Custom {
    Write-Host "✗ $args" -ForegroundColor Red
}

function Write-Warn {
    Write-Host "⚠ $args" -ForegroundColor Yellow
}

function Write-Info {
    Write-Host "ℹ $args" -ForegroundColor Cyan
}

# Function to check if port is in use
function Test-PortInUse {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return $connection
    }
    catch {
        return $false
    }
}

# Function to wait for service health
function Wait-ForService {
    param(
        [string]$ServiceName,
        [string]$HealthUrl,
        [int]$Port,
        [int]$MaxRetries = $MAX_RETRIES
    )
    
    Write-Info "Waiting for $ServiceName on port $Port..."
    
    $retries = 0
    while ($retries -lt $MaxRetries) {
        try {
            $response = Invoke-WebRequest -Uri $HealthUrl -Method Get -TimeoutSec 2 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200 -or $response.StatusCode -lt 500) {
                Write-Success "$ServiceName is ready"
                return $true
            }
        }
        catch {
            # Service not ready yet
        }
        
        $retries++
        Write-Host -NoNewline "."
        Start-Sleep -Seconds $RETRY_DELAY
    }
    
    Write-Host ""
    return $false
}

# ============================================================================
# STEP 1: Environment Check
# ============================================================================
Write-Host ""
Write-Host "▶ STEP 1: Environment Configuration" -ForegroundColor Cyan
Write-Host "────────────────────────────────────" -ForegroundColor Cyan

# Load .env file
if (Test-Path -Path ".env") {
    Get-Content .env | ForEach-Object {
        if ($_ -and -not $_.StartsWith('#')) {
            $parts = $_.Split('=', 2)
            if ($parts.Count -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim()
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
    Write-Success "Environment loaded from .env"
}
else {
    Write-Warn ".env file not found"
}

# Check required environment variables
$requiredVars = @(
    "POCKETBASE_URL",
    "POCKETBASE_SERVICE_TOKEN",
    "NODE_ENV"
)

$missingVars = @()
foreach ($varName in $requiredVars) {
    $value = [Environment]::GetEnvironmentVariable($varName)
    if (-not $value) {
        $missingVars += $varName
    }
}

if ($missingVars.Count -gt 0) {
    Write-Error-Custom "Missing required environment variables: $($missingVars -join ', ')"
    Write-Host ""
    exit 1
}

Write-Success "Environment configuration OK"
Write-Host ""

# ============================================================================
# STEP 2: Check Service Status
# ============================================================================
Write-Host "▶ STEP 2: Checking Service Status" -ForegroundColor Cyan
Write-Host "────────────────────────────────────" -ForegroundColor Cyan

$pbRunning = Test-PortInUse -Port $PB_PORT
$serverRunning = Test-PortInUse -Port $SERVER_PORT
$aiRunning = Test-PortInUse -Port $AI_PORT

if ($pbRunning) {
    Write-Success "PocketBase is running on port $PB_PORT"
}
else {
    Write-Warn "PocketBase is NOT running on port $PB_PORT"
}

if ($serverRunning) {
    Write-Success "Payment Server is running on port $SERVER_PORT"
}
else {
    Write-Warn "Payment Server is NOT running on port $SERVER_PORT"
}

if ($aiRunning) {
    Write-Success "AI Service is running on port $AI_PORT"
}
else {
    Write-Warn "AI Service is NOT running (optional)"
}

Write-Host ""

# ============================================================================
# STEP 3: Start Missing Services
# ============================================================================
if (-not $pbRunning -or -not $serverRunning) {
    Write-Host "▶ STEP 3: Starting Missing Services" -ForegroundColor Cyan
    Write-Host "────────────────────────────────────" -ForegroundColor Cyan
    
    if (-not $pbRunning) {
        Write-Info "Starting PocketBase..."
        try {
            Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd pocketbase; .\pocketbase.exe serve" -WindowStyle Normal
            if (Wait-ForService -ServiceName "PocketBase" -HealthUrl "http://localhost:8090/api/health" -Port $PB_PORT) {
                Write-Success "PocketBase started successfully"
            }
            else {
                Write-Error-Custom "PocketBase failed to start"
                exit 1
            }
        }
        catch {
            Write-Error-Custom "Failed to start PocketBase: $_"
            exit 1
        }
    }
    
    if (-not $serverRunning) {
        Write-Info "Starting Payment Server..."
        try {
            Start-Process pwsh -ArgumentList "-NoExit", "-Command", "pnpm run server" -WindowStyle Normal
            if (Wait-ForService -ServiceName "Payment Server" -HealthUrl "http://localhost:3001/api/health" -Port $SERVER_PORT) {
                Write-Success "Payment Server started successfully"
            }
            else {
                Write-Warn "Payment Server may still be starting..."
            }
        }
        catch {
            Write-Error-Custom "Failed to start Payment Server: $_"
            exit 1
        }
    }
    
    Write-Host ""
}

# ============================================================================
# STEP 4: Health Checks
# ============================================================================
Write-Host "▶ STEP 4: Running Health Checks" -ForegroundColor Cyan
Write-Host "────────────────────────────────────" -ForegroundColor Cyan

$allHealthy = $true

try {
    $pbResponse = Invoke-WebRequest -Uri "http://localhost:8090/api/health" -Method Get -TimeoutSec 3 -WarningAction SilentlyContinue
    if ($pbResponse.StatusCode -eq 200) {
        Write-Success "PocketBase: Healthy"
    }
    else {
        Write-Warn "PocketBase: Responding but unhealthy ($($pbResponse.StatusCode))"
    }
}
catch {
    Write-Error-Custom "PocketBase: Unreachable"
    $allHealthy = $false
}

try {
    $serverResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method Get -TimeoutSec 3 -WarningAction SilentlyContinue
    if ($serverResponse.StatusCode -eq 200) {
        Write-Success "Payment Server: Healthy"
    }
    else {
        Write-Warn "Payment Server: Responding but unhealthy ($($serverResponse.StatusCode))"
    }
}
catch {
    Write-Error-Custom "Payment Server: Unreachable"
    $allHealthy = $false
}

try {
    $aiResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 3 -WarningAction SilentlyContinue
    Write-Success "AI Service: Healthy"
}
catch {
    Write-Warn "AI Service: Not available (optional)"
}

Write-Host ""

# ============================================================================
# STEP 5: Final Status
# ============================================================================
if ($allHealthy) {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  ✓ ALL SYSTEMS GO - PRODUCTION READY                       ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Info "Frontend:     http://localhost:3001"
    Write-Info "Admin Panel:  http://localhost:8090/_/"
    Write-Info "API Health:   http://localhost:3001/api/health"
    Write-Info "Metrics:      http://localhost:3001/api/metrics"
    Write-Host ""
}
else {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║  ✗ SOME SERVICES NOT READY - Please check above           ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    Write-Warn "Make sure to start PocketBase and Payment Server manually if needed"
    exit 1
}
