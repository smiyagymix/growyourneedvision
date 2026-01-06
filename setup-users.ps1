# PocketBase User Setup Script
# This script creates user accounts directly via PocketBase API

Write-Host "🚀 PocketBase User Setup" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

$POCKETBASE_URL = "http://127.0.0.1:8090"

# Users to create
$users = @(
    @{
        email           = "owner@growyourneed.com"
        password        = "Darnag12345678@"
        passwordConfirm = "Darnag12345678@"
        name            = "Platform Owner"
        role            = "Owner"
    },
    @{
        email           = "admin@school.com"
        password        = "12345678"
        passwordConfirm = "12345678"
        name            = "School Administrator"
        role            = "Admin"
    },
    @{
        email           = "teacher@school.com"
        password        = "123456789"
        passwordConfirm = "123456789"
        name            = "Teacher Account"
        role            = "Teacher"
    },
    @{
        email           = "student@school.com"
        password        = "12345678"
        passwordConfirm = "12345678"
        name            = "Student Account"
        role            = "Student"
    },
    @{
        email           = "parent@school.com"
        password        = "123456788"
        passwordConfirm = "123456788"
        name            = "Parent Account"
        role            = "Parent"
    },
    @{
        email           = "individual@individual.com"
        password        = "12345678"
        passwordConfirm = "12345678"
        name            = "Individual User"
        role            = "Individual"
    }
)

# Check if PocketBase is running
Write-Host "🔍 Checking PocketBase connection..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "$POCKETBASE_URL/api/health" -Method GET -ErrorAction Stop | Out-Null
    Write-Host "✅ Connected to PocketBase!" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "❌ Cannot connect to PocketBase" -ForegroundColor Red
    Write-Host "   Make sure PocketBase is running: npm run dev" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "📝 Creating user accounts..." -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$errorCount = 0

foreach ($user in $users) {
    Write-Host "Processing: $($user.email) ($($user.role))" -ForegroundColor White
    
    try {
        $body = @{
            email           = $user.email
            password        = $user.password
            passwordConfirm = $user.passwordConfirm
            name            = $user.name
            role            = $user.role
            emailVisibility = $true
        } | ConvertTo-Json
        
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        # Try to create the user
        $response = Invoke-RestMethod -Uri "$POCKETBASE_URL/api/collections/users/records" `
            -Method POST `
            -Body $body `
            -Headers $headers `
            -ErrorAction Stop
        
        Write-Host "  ✅ Created successfully" -ForegroundColor Green
        $successCount++
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 400) {
            # User might already exist
            Write-Host "  ⚠️  Already exists (or validation error)" -ForegroundColor Yellow
            $successCount++
        }
        else {
            Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
            $errorCount++
        }
    }
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host "   ✅ Success: $successCount" -ForegroundColor Green
Write-Host "   ❌ Failed: $errorCount" -ForegroundColor Red
Write-Host ""
Write-Host "📋 Login Credentials:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

foreach ($user in $users) {
    $roleFormatted = $user.role.PadRight(10)
    $emailFormatted = $user.email.PadRight(32)
    Write-Host "$roleFormatted | $emailFormatted | $($user.password)" -ForegroundColor White
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Open the app: http://localhost:5173" -ForegroundColor Green
Write-Host "🔐 Login with any of the credentials above" -ForegroundColor Yellow
Write-Host ""
