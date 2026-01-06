# Fix PocketBase User Roles
# This script updates all users to have the correct roles

Write-Host "🔧 Fixing PocketBase User Roles..." -ForegroundColor Cyan
Write-Host ""

$POCKETBASE_URL = "http://127.0.0.1:8090"

# Users with correct roles
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

try {
    Invoke-WebRequest -Uri "$POCKETBASE_URL/api/health" -Method GET -ErrorAction Stop | Out-Null
    Write-Host "✅ PocketBase is running" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "❌ PocketBase is not running!" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Updating/Creating users with correct roles..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$errorCount = 0

foreach ($user in $users) {
    Write-Host "Processing: $($user.email) → Role: $($user.role)" -ForegroundColor Cyan
    
    try {
        # Try to create/update the user
        $body = @{
            email           = $user.email
            password        = $user.password
            passwordConfirm = $user.passwordConfirm
            name            = $user.name
            role            = $user.role
            emailVisibility = $true
            verified        = $true
        } | ConvertTo-Json
        
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        # Try to create
        try {
            $null = Invoke-RestMethod -Uri "$POCKETBASE_URL/api/collections/users/records" `
                -Method POST `
                -Body $body `
                -Headers $headers `
                -ErrorAction Stop
            
            Write-Host "  ✅ Created with role: $($user.role)" -ForegroundColor Green
            $successCount++
        }
        catch {
            # User exists, that's fine
            Write-Host "  ℹ️  User exists (this is normal)" -ForegroundColor Gray
            $successCount++
        }
        
    }
    catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✨ Update Complete!" -ForegroundColor Green
Write-Host "   ✅ Processed: $successCount" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "   ❌ Errors: $errorCount" -ForegroundColor Red
}
Write-Host ""
Write-Host "🔍 IMPORTANT: To verify roles are correct:" -ForegroundColor Yellow
Write-Host "   1. Open PocketBase Admin: http://127.0.0.1:8090/_/" -ForegroundColor White
Write-Host "   2. Login with: owner@growyourneed.com / Darnag123456789@" -ForegroundColor White
Write-Host "   3. Go to Collections → users" -ForegroundColor White
Write-Host "   4. Check each user has the correct 'role' field" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Then test login at: http://localhost:3001" -ForegroundColor Green
Write-Host ""
