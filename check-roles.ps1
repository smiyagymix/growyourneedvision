# Check and Fix PocketBase User Roles
# This script verifies all users have the correct roles

Write-Host "🔍 Checking PocketBase User Roles..." -ForegroundColor Cyan
Write-Host ""

$POCKETBASE_URL = "http://127.0.0.1:8090"

# Expected roles for each user
$expectedRoles = @{
    "owner@growyourneed.com"    = "Owner"
    "admin@school.com"          = "Admin"
    "teacher@school.com"        = "Teacher"
    "student@school.com"        = "Student"
    "parent@school.com"         = "Parent"
    "individual@individual.com" = "Individual"
}

try {
    # Get all users
    $response = Invoke-RestMethod -Uri "$POCKETBASE_URL/api/collections/users/records?perPage=100" -Method GET
    
    Write-Host "📋 Current User Roles:" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    foreach ($user in $response.items) {
        $expectedRole = $expectedRoles[$user.email]
        $status = if ($user.role -eq $expectedRole) { "✅" } else { "❌" }
        
        Write-Host "$status $($user.email.PadRight(35)) | Current: $($user.role.PadRight(12)) | Expected: $expectedRole" -ForegroundColor $(if ($user.role -eq $expectedRole) { "Green" } else { "Red" })
        
        # Show what needs to be fixed
        if ($user.role -ne $expectedRole) {
            Write-Host "   ⚠️  NEEDS UPDATE: $($user.email) should be '$expectedRole' not '$($user.role)'" -ForegroundColor Yellow
        }
    }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 To fix incorrect roles:" -ForegroundColor Cyan
    Write-Host "   1. Open PocketBase Admin: http://127.0.0.1:8090/_/" -ForegroundColor White
    Write-Host "   2. Go to Collections → users" -ForegroundColor White
    Write-Host "   3. Edit each user and set the correct 'role' field" -ForegroundColor White
    Write-Host ""
    
}
catch {
    Write-Host "❌ Failed to fetch users: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure PocketBase is running!" -ForegroundColor Yellow
}
