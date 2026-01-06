# Update PocketBase User Roles
# This script explicitly UPDATES existing users with the correct roles

Write-Host "🔧 Updating PocketBase User Roles..." -ForegroundColor Cyan
Write-Host ""

$POCKETBASE_URL = "http://127.0.0.1:8090"

# Users to update
$users = @(
    @{ email = "owner@growyourneed.com"; role = "Owner" },
    @{ email = "admin@school.com"; role = "Admin" },
    @{ email = "teacher@school.com"; role = "Teacher" },
    @{ email = "student@school.com"; role = "Student" },
    @{ email = "parent@school.com"; role = "Parent" },
    @{ email = "individual@individual.com"; role = "Individual" }
)

# Authenticate as Admin first (needed to list/update users)
# We'll try to use the owner account as it should be an admin if created properly, 
# otherwise we might need to use the actual admin credentials if you have them.
# For now, let's assume we can list users if we are authenticated.
# Actually, let's try to find the user by email (using list with filter) and then update.

try {
    Invoke-WebRequest -Uri "$POCKETBASE_URL/api/health" -Method GET -ErrorAction Stop | Out-Null
    Write-Host "✅ PocketBase is running" -ForegroundColor Green
}
catch {
    Write-Host "❌ PocketBase is not running!" -ForegroundColor Red
    exit 1
}

# We need an admin token to update other users usually, OR we can try to update if we know the ID.
# But we don't know the ID.
# Let's try to login as the user themselves and update their own profile? 
# No, users can usually only update their own profile if allowed.
# But we want to set the role, which might be protected.

# Let's try to use the "owner" account to update itself first.
# But wait, if I can't login as admin via script easily (without knowing admin pass), 
# I should probably ask the user to do it manually OR use the `pb_data` manipulation if possible (no).

# Wait, the user provided: PocketBase Admin: owner@growyourneed.com / Darnag123456789@
# Let's use that to authenticate as admin!

$adminEmail = "owner@growyourneed.com"
$adminPass = "Darnag123456789@" # Note: User said Darnag123456789@ for admin, but Darnag12345678@ for dashboard owner.

Write-Host "🔑 Authenticating as Admin ($adminEmail)..." -ForegroundColor Yellow

try {
    $authBody = @{
        identity = $adminEmail
        password = $adminPass
    } | ConvertTo-Json

    $authResponse = Invoke-RestMethod -Uri "$POCKETBASE_URL/api/admins/auth-with-password" `
        -Method POST `
        -Body $authBody `
        -Headers @{ "Content-Type" = "application/json" } `
        -ErrorAction Stop

    $token = $authResponse.token
    Write-Host "✅ Admin authentication successful!" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Admin login failed with provided credentials." -ForegroundColor Yellow
    Write-Host "   Trying to authenticate as the user themselves to update (might fail if role is protected)..." -ForegroundColor Gray
    # Fallback logic or exit?
    # Let's try to list users without admin token? No, usually forbidden.
    # Let's try to use the 'owner' user credentials (dashboard owner)
    try {
        $authBody = @{
            identity = "owner@growyourneed.com"
            password = "Darnag12345678@"
        } | ConvertTo-Json
        
        $authResponse = Invoke-RestMethod -Uri "$POCKETBASE_URL/api/collections/users/auth-with-password" `
            -Method POST `
            -Body $authBody `
            -Headers @{ "Content-Type" = "application/json" } `
            -ErrorAction Stop
            
        $token = $authResponse.token
        Write-Host "✅ Authenticated as Owner user." -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Could not authenticate." -ForegroundColor Red
        exit 1
    }
}

$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = $token
}

foreach ($u in $users) {
    Write-Host "Processing: $($u.email)..." -NoNewline
    
    try {
        # 1. Find user ID
        $filter = "email='$($u.email)'"
        $records = Invoke-RestMethod -Uri "$POCKETBASE_URL/api/collections/users/records?filter=$filter" `
            -Method GET `
            -Headers $headers `
            -ErrorAction Stop
            
        if ($records.items.Count -eq 0) {
            Write-Host " ❌ User not found" -ForegroundColor Red
            continue
        }
        
        $userId = $records.items[0].id
        $currentRole = $records.items[0].role
        
        if ($currentRole -eq $u.role) {
            Write-Host " ✅ Role already set to '$currentRole'" -ForegroundColor Gray
            continue
        }
        
        # 2. Update user
        $updateBody = @{
            role = $u.role
        } | ConvertTo-Json
        
        $null = Invoke-RestMethod -Uri "$POCKETBASE_URL/api/collections/users/records/$userId" `
            -Method PATCH `
            -Body $updateBody `
            -Headers $headers `
            -ErrorAction Stop
            
        Write-Host " ✅ Updated role to '$($u.role)'" -ForegroundColor Green
        
    }
    catch {
        Write-Host " ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Green
