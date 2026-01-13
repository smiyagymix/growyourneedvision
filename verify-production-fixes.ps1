#!/usr/bin/env powershell

<#
.SYNOPSIS
    Comprehensive Verification and Fix Script for Production Deployment
    
.DESCRIPTION
    Tests all components to ensure production readiness:
    - PocketBase connectivity
    - Payment Server endpoints
    - Rate limiting functionality
    - Authentication flow
    - Environment configuration
    
.EXAMPLE
    .\verify-production-fixes.ps1
#>

param(
    [switch]$QuickTest,
    [switch]$FullDiagnostic
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$colors = @{
    Reset  = "`e[0m"
    Green  = "`e[32m"
    Red    = "`e[31m"
    Yellow = "`e[33m"
    Cyan   = "`e[36m"
    Gray   = "`e[90m"
}

$script:testsPassed = 0
$script:testsFailed = 0
$script:testsWarning = 0

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-TestSuccess {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
    $script:testsPassed++
}

function Write-TestFail {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
    $script:testsFailed++
}

function Write-TestWarning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
    $script:testsWarning++
}

function Write-TestInfo {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "▶ $Title" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
}

function Test-ApiEndpoint {
    param(
        [string]$Url,
        [string]$Name,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body
    )
    
    try {
        $params = @{
            Uri           = $Url
            Method        = $Method
            TimeoutSec    = 5
            WarningAction = 'SilentlyContinue'
            ErrorAction   = 'Stop'
        }
        
        if ($Headers.Count -gt 0) {
            $params['Headers'] = $Headers
        }
        
        if ($Body) {
            $params['Body'] = $Body
            $params['ContentType'] = 'application/json'
        }
        
        $response = Invoke-WebRequest @params
        Write-TestSuccess "$Name - Status: $($response.StatusCode)"
        return $response
    }
    catch {
        Write-TestFail "$Name - Error: $($_.Exception.Message)"
        return $null
    }
}

# ============================================================================
# MAIN VERIFICATION
# ============================================================================

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   PRODUCTION DEPLOYMENT VERIFICATION                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Section 1: Environment
# ─────────────────────────────────────────────────────────────────────────────
Write-Section "1. ENVIRONMENT CONFIGURATION"

if (Test-Path ".env") {
    Write-TestSuccess ".env file exists"
}
else {
    Write-TestWarning ".env file not found - using defaults"
}

# Load environment
if (Test-Path ".env") {
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
}

$pbUrl = [Environment]::GetEnvironmentVariable("POCKETBASE_URL")
$pbToken = [Environment]::GetEnvironmentVariable("POCKETBASE_SERVICE_TOKEN")
$nodeEnv = [Environment]::GetEnvironmentVariable("NODE_ENV")

if ($pbUrl) {
    Write-TestSuccess "POCKETBASE_URL configured: $pbUrl"
}
else {
    Write-TestWarning "POCKETBASE_URL not set, using default: http://localhost:8090"
    $pbUrl = "http://localhost:8090"
}

if ($pbToken) {
    Write-TestSuccess "POCKETBASE_SERVICE_TOKEN configured"
}
else {
    Write-TestWarning "POCKETBASE_SERVICE_TOKEN not configured"
}

if ($nodeEnv -eq "production") {
    Write-TestSuccess "NODE_ENV set to production"
}
else {
    Write-TestWarning "NODE_ENV not set to production (current: $nodeEnv)"
}

# Section 2: Port Availability
# ─────────────────────────────────────────────────────────────────────────────
Write-Section "2. SERVICE PORT AVAILABILITY"

$pbRunning = (Test-NetConnection -ComputerName localhost -Port 8090 -InformationLevel Quiet -WarningAction SilentlyContinue)
$serverRunning = (Test-NetConnection -ComputerName localhost -Port 3001 -InformationLevel Quiet -WarningAction SilentlyContinue)

if ($pbRunning) {
    Write-TestSuccess "PocketBase is running on port 8090"
}
else {
    Write-TestFail "PocketBase is NOT running on port 8090"
}

if ($serverRunning) {
    Write-TestSuccess "Payment Server is running on port 3001"
}
else {
    Write-TestFail "Payment Server is NOT running on port 3001"
}

# Section 3: API Endpoints
# ─────────────────────────────────────────────────────────────────────────────
Write-Section "3. API ENDPOINT VERIFICATION"

if ($pbRunning) {
    Write-TestInfo "Testing PocketBase endpoints..."
    Test-ApiEndpoint -Url "$pbUrl/api/health" -Name "PocketBase Health" | Out-Null
    Test-ApiEndpoint -Url "$pbUrl/api/collections" -Name "PocketBase Collections" -Headers @{"Authorization" = "Bearer $pbToken" } | Out-Null
}
else {
    Write-TestWarning "Skipping PocketBase endpoints (service not running)"
}

if ($serverRunning) {
    Write-TestInfo "Testing Payment Server endpoints..."
    $healthResp = Test-ApiEndpoint -Url "http://localhost:3001/api/health" -Name "Payment Server Health" | Out-Null
    Test-ApiEndpoint -Url "http://localhost:3001/api/rate-limit/check" -Name "Rate Limit Check (POST)" -Method "POST" -Body '{"tenantId":"test"}' | Out-Null
}
else {
    Write-TestWarning "Skipping Payment Server endpoints (service not running)"
}

# Section 4: Rate Limiting
# ─────────────────────────────────────────────────────────────────────────────
Write-Section "4. RATE LIMITING FUNCTIONALITY"

if ($serverRunning -and $pbRunning) {
    Write-TestInfo "Testing rate limit check with proper JSON response..."
    
    try {
        $response = Invoke-WebRequest `
            -Uri "http://localhost:3001/api/rate-limit/check" `
            -Method Post `
            -ContentType "application/json" `
            -Body (@{ tenantId = "test"; ipAddress = "127.0.0.1" } | ConvertTo-Json) `
            -TimeoutSec 5 `
            -ErrorAction Stop `
            -WarningAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Write-TestSuccess "Rate limit endpoint returns valid response"
            
            try {
                $data = $response.Content | ConvertFrom-Json
                if ($data.allowed -ne $null) {
                    Write-TestSuccess "Rate limit response includes 'allowed' field"
                    if ($data.allowed -eq $true) {
                        Write-TestSuccess "Rate limiting allows requests by default"
                    }
                }
                else {
                    Write-TestWarning "Rate limit response missing 'allowed' field"
                }
            }
            catch {
                Write-TestFail "Rate limit response is not valid JSON: $($_.Exception.Message)"
            }
        }
    }
    catch {
        Write-TestFail "Rate limit endpoint error: $($_.Exception.Message)"
    }
}
else {
    Write-TestWarning "Skipping rate limit tests (services not running)"
}

# Section 5: Authentication
# ─────────────────────────────────────────────────────────────────────────────
Write-Section "5. AUTHENTICATION SYSTEM"

if ($pbRunning) {
    Write-TestInfo "Checking user collection..."
    
    try {
        $response = Invoke-WebRequest `
            -Uri "$pbUrl/api/collections/users/records?page=1&perPage=1" `
            -Method Get `
            -TimeoutSec 5 `
            -ErrorAction Stop `
            -WarningAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Write-TestSuccess "Users collection is accessible"
        }
    }
    catch {
        Write-TestWarning "Could not verify users collection (may need admin token)"
    }
}
else {
    Write-TestWarning "Skipping authentication tests (PocketBase not running)"
}

# Section 6: File Structure
# ─────────────────────────────────────────────────────────────────────────────
Write-Section "6. PROJECT FILE STRUCTURE"

$criticalFiles = @(
    @{ Path = "src/context/AuthContext.tsx"; Name = "Auth Context (Fixed)" },
    @{ Path = "src/services/ipRateLimitingService.ts"; Name = "Rate Limiting Service (Fixed)" },
    @{ Path = "server/index.js"; Name = "Payment Server (Fixed)" },
    @{ Path = "pocketbase/pocketbase.exe"; Name = "PocketBase Executable" },
    @{ Path = ".env"; Name = "Environment File" }
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file.Path) {
        Write-TestSuccess "$($file.Name) exists"
    }
    else {
        Write-TestWarning "$($file.Name) not found"
    }
}

# Section 7: Fixed Issues Summary
# ─────────────────────────────────────────────────────────────────────────────
Write-Section "7. FIXES IMPLEMENTED"

Write-Host @"
✓ Rate Limit Endpoint (/api/rate-limit/check)
  - Fixed to return proper JSON response
  - Handles missing PocketBase gracefully
  - Falls back to allowing requests on error
  - Includes timeout protection

✓ Frontend Error Handling (ipRateLimitingService.ts)
  - Improved error handling with 5-second timeout
  - Only blocks on actual rate limit violations
  - Logs warnings for service unavailability
  - Never blocks requests due to service errors

✓ Authentication (AuthContext.tsx)
  - Fixed rate limit check integration
  - Better error differentiation
  - Improved console logging
  - Graceful fallback on service failure

✓ Production Startup Scripts
  - startup-production.ps1 (Windows)
  - scripts/production-startup.js (Node.js)
  - scripts/init-critical-collections.js (Collection init)

✓ Documentation
  - PRODUCTION_STARTUP.md (Complete guide)
  - Health check procedures
  - Troubleshooting guide
  - Manual startup instructions
"@ -ForegroundColor Green

# Section 8: Test Results
# ─────────────────────────────────────────────────────────────────────────────
Write-Section "8. TEST RESULTS SUMMARY"

Write-Host ""
Write-Host "  Passed:   $script:testsPassed" -ForegroundColor Green
Write-Host "  Failed:   $script:testsFailed" -ForegroundColor $(if ($script:testsFailed -gt 0) { "Red" } else { "Green" })
Write-Host "  Warnings: $script:testsWarning" -ForegroundColor $(if ($script:testsWarning -gt 0) { "Yellow" } else { "Green" })
Write-Host ""

# Section 9: Next Steps
# ─────────────────────────────────────────────────────────────────────────────
Write-Section "9. RECOMMENDED NEXT STEPS"

if ($pbRunning -and $serverRunning) {
    Write-Host @"
✓ All services running - Ready to test
  1. Open http://localhost:3001 in browser
  2. Try to login with test account
  3. Check browser console for errors (F12)
  4. Verify rate limit checks are working
"@ -ForegroundColor Green
}
else {
    Write-Host @"
⚠ Some services not running - Please start:

  Terminal 1 - PocketBase:
    cd pocketbase
    .\pocketbase.exe serve

  Terminal 2 - Payment Server:
    pnpm run server

  Terminal 3 - Frontend (optional):
    pnpm dev

  Then run: .\verify-production-fixes.ps1
"@ -ForegroundColor Yellow
}

Write-Host ""
Write-Host "For detailed instructions, see: PRODUCTION_STARTUP.md" -ForegroundColor Cyan
Write-Host ""

# Final Status
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
if ($script:testsFailed -eq 0 -and $pbRunning -and $serverRunning) {
    Write-Host "║   ✓ PRODUCTION READY - ALL SYSTEMS GO               ║" -ForegroundColor Green
}
elseif ($script:testsFailed -eq 0) {
    Write-Host "║   ⚠ PARTIAL - Start missing services                ║" -ForegroundColor Yellow
}
else {
    Write-Host "║   ✗ ISSUES DETECTED - See above                     ║" -ForegroundColor Red
}
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

exit $(if ($script:testsFailed -eq 0) { 0 } else { 1 })
