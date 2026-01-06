# PocketBase User Initialization Script (PowerShell)
# 
# This script creates all required user accounts for the application
# Run this after starting PocketBase server
#
# Usage: .\init-users.ps1

Write-Host "🚀 PocketBase User Initialization Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# PocketBase URL
$POCKETBASE_URL = "http://127.0.0.1:8090"

# Admin credentials for authentication
$ADMIN_EMAIL = "owner@growyourneed.com"
$ADMIN_PASSWORD = "Darnag123456789@"

# Users to create
$users = @(
    @{
        email       = "owner@growyourneed.com"
        password    = "Darnag12345678@"
        name        = "Platform Owner"
        role        = "Owner"
        description = "Super admin with full platform access"
    },
    @{
        email       = "admin@school.com"
        password    = "12345678"
        name        = "School Administrator"
        role        = "Admin"
        description = "School administrator with school management access"
    },
    @{
        email       = "teacher@school.com"
        password    = "123456789"
        name        = "Teacher Account"
        role        = "Teacher"
        description = "Teacher with classroom management access"
    },
    @{
        email       = "student@school.com"
        password    = "12345678"
        name        = "Student Account"
        role        = "Student"
        description = "Student with learning access"
    },
    @{
        email       = "parent@school.com"
        password    = "123456788"
        name        = "Parent Account"
        role        = "Parent"
        description = "Parent with child monitoring access"
    },
    @{
        email       = "individual@individual.com"
        password    = "12345678"
        name        = "Individual User"
        role        = "Individual"
        description = "Individual user account"
    }
)

# Check if PocketBase is running
Write-Host "🔍 Checking if PocketBase is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$POCKETBASE_URL/api/health" -Method GET -ErrorAction Stop
    Write-Host "✅ PocketBase is running!" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "❌ PocketBase is not running!" -ForegroundColor Red
    Write-Host "   Please start PocketBase first:" -ForegroundColor Yellow
    Write-Host "   cd pocketbase" -ForegroundColor White
    Write-Host "   .\pocketbase.exe serve" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Authenticate as admin
Write-Host "🔐 Authenticating as admin..." -ForegroundColor Yellow
$authBody = @{
    identity = $ADMIN_EMAIL
    password = $ADMIN_PASSWORD
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "$POCKETBASE_URL/api/admins/auth-with-password" -Method POST -Body $authBody -ContentType "application/json"
    $token = $authResponse.token
    Write-Host "✅ Admin authentication successful!" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "❌ Failed to authenticate as admin" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Create headers with auth token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

# Create or update each user
$successCount = 0
$errorCount = 0

foreach ($user in $users) {
    Write-Host "📝 Processing: $($user.email) ($($user.role))" -ForegroundColor Cyan
    
    # Check if user exists
    try {
        $filter = "email='$($user.email)'"
        $checkUrl = "$POCKETBASE_URL/api/collections/users/records?filter=$([System.Web.HttpUtility]::UrlEncode($filter))"
        $existingUsers = Invoke-RestMethod -Uri $checkUrl -Method GET -Headers $headers
        
        if ($existingUsers.items.Count -gt 0) {
            Write-Host "   ⚠️  User already exists, skipping..." -ForegroundColor Yellow
            $successCount++
        }
        else {
            # Create new user
            $userBody = @{
                email           = $user.email
                password        = $user.password
                passwordConfirm = $user.password
                name            = $user.name
                role            = $user.role
                emailVisibility = $true
                verified        = $true
            } | ConvertTo-Json
            
            $createResponse = Invoke-RestMethod -Uri "$POCKETBASE_URL/api/collections/users/records" -Method POST -Body $userBody -Headers $headers
            Write-Host "   ✅ Created successfully!" -ForegroundColor Green
            $successCount++
        }
        
        Write-Host "   📋 Role: $($user.role)" -ForegroundColor Gray
        Write-Host "   📝 Description: $($user.description)" -ForegroundColor Gray
        Write-Host ""
    }
    catch {
        Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        $errorCount++
    }
}

# Summary
Write-Host ""
Write-Host "✨ User initialization complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Success: $successCount" -ForegroundColor Green
Write-Host "   ❌ Failed: $errorCount" -ForegroundColor Red
Write-Host ""
Write-Host "📋 Account List:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

foreach ($user in $users) {
    $roleFormatted = $user.role.PadRight(12)
    $emailFormatted = $user.email.PadRight(30)
    Write-Host "$roleFormatted | $emailFormatted | $($user.password)" -ForegroundColor White
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 You can now login with any of these accounts!" -ForegroundColor Green
Write-Host "🌐 Start the app with: npm run dev" -ForegroundColor Yellow
Write-Host ""
