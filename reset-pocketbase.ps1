# Reset PocketBase and Setup Schema (Final Debug)
# This script wipes the DB, creates a superuser via CLI, updates schema, and creates users.

Write-Host "🧨 Resetting PocketBase (Final Debug)..." -ForegroundColor Red
Write-Host ""

$POCKETBASE_URL = "http://127.0.0.1:8090"
$ADMIN_EMAIL = "admin@growyourneed.com"
$ADMIN_PASS = "1234567890"

# 1. Stop PocketBase if running
Write-Host "DEBUG: Checking running processes..." -ForegroundColor Gray
$pbProcesses = Get-Process pocketbase -ErrorAction SilentlyContinue
if ($pbProcesses) {
    Write-Host "🛑 Stopping PocketBase..." -ForegroundColor Yellow
    $pbProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# 2. Delete pb_data
if (Test-Path "pocketbase/pb_data") {
    Write-Host "🗑️  Deleting pb_data..." -ForegroundColor Yellow
    try {
        Remove-Item -Path "pocketbase/pb_data" -Recurse -Force -ErrorAction Stop
    }
    catch {
        Write-Host "❌ Failed to delete pb_data. Is it open?" -ForegroundColor Red
        exit 1
    }
}

if (Test-Path "pocketbase/pb_data") {
    Write-Host "❌ pb_data still exists!" -ForegroundColor Red
    exit 1
}

# 3. Create Superuser via CLI
Write-Host "🔑 Creating Superuser via CLI..." -ForegroundColor Cyan
# pocketbase superuser create email password
# Use array for arguments to avoid quoting issues
$args = @("superuser", "create", $ADMIN_EMAIL, $ADMIN_PASS)
$createProcess = Start-Process -FilePath "pocketbase/pocketbase.exe" -ArgumentList $args -NoNewWindow -Wait -PassThru

if ($createProcess.ExitCode -ne 0) {
    Write-Host "❌ Failed to create superuser via CLI (Exit Code: $($createProcess.ExitCode))." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Superuser created." -ForegroundColor Green

# 4. Start PocketBase in background
Write-Host "🚀 Starting PocketBase..." -ForegroundColor Cyan
$pbProcess = Start-Process -FilePath "pocketbase/pocketbase.exe" -ArgumentList "serve", "--http=127.0.0.1:8090" -PassThru

# Wait for it to be ready
Write-Host "⏳ Waiting for PocketBase to initialize..." -ForegroundColor Yellow
$retries = 0
$maxRetries = 20
$connected = $false

while ($retries -lt $maxRetries) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", 8090)
        $tcp.Close()
        $connected = $true
        break
    }
    catch {
        Start-Sleep -Seconds 1
        $retries++
        Write-Host "." -NoNewline
    }
}
Write-Host ""

if (-not $connected) {
    Write-Host "❌ PocketBase failed to start (port 8090 not reachable)!" -ForegroundColor Red
    Stop-Process -Id $pbProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "✅ PocketBase is listening on port 8090!" -ForegroundColor Green
Start-Sleep -Seconds 2

try {
    # 5. Authenticate as Superuser
    Write-Host "🔐 Authenticating..." -ForegroundColor Cyan
    $authBody = @{
        identity = $ADMIN_EMAIL
        password = $ADMIN_PASS
    } | ConvertTo-Json

    $authUrl = "$POCKETBASE_URL/api/collections/_superusers/auth-with-password"
    Write-Host "POST $authUrl" -ForegroundColor Gray
    
    $authResponse = Invoke-RestMethod -Uri $authUrl `
        -Method POST `
        -Body $authBody `
        -Headers @{ "Content-Type" = "application/json" } `
        -ErrorAction Stop
    
    $token = $authResponse.token
    $headers = @{
        "Content-Type"  = "application/json"
        "Authorization" = $token
    }
    Write-Host "✅ Authenticated." -ForegroundColor Green

    # 6. Update Users Collection Schema
    Write-Host "📝 Updating Users Schema (adding 'role' field)..." -ForegroundColor Cyan
    
    # Get all collections to find 'users'
    $collectionsUrl = "$POCKETBASE_URL/api/collections"
    Write-Host "GET $collectionsUrl" -ForegroundColor Gray
    
    $collections = Invoke-RestMethod -Uri $collectionsUrl `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    $usersCollection = $null
    foreach ($col in $collections.items) {
        if ($col.name -eq "users") {
            $usersCollection = $col
            break
        }
    }

    if ($null -eq $usersCollection) {
        Write-Host "❌ 'users' collection NOT FOUND!" -ForegroundColor Red
        exit 1
    }

    # Check if role field already exists
    $roleExists = $false
    foreach ($field in $usersCollection.schema) {
        if ($field.name -eq "role") {
            $roleExists = $true
            break
        }
    }

    if (-not $roleExists) {
        # Add role field
        $newField = @{
            system      = $false
            id          = "field_role"
            name        = "role"
            type        = "select"
            required    = $true
            presentable = $false
            unique      = $false
            options     = @{
                maxSelect = 1
                values    = @("Owner", "Admin", "Teacher", "Student", "Parent", "Individual")
            }
        }
        
        # Append to schema
        $usersCollection.schema += $newField
        
        # Update collection using ID
        $updateBody = @{
            schema = $usersCollection.schema
        } | ConvertTo-Json -Depth 10

        $updateUrl = "$POCKETBASE_URL/api/collections/$($usersCollection.id)"
        Write-Host "PATCH $updateUrl" -ForegroundColor Gray

        $null = Invoke-RestMethod -Uri $updateUrl `
            -Method PATCH `
            -Body $updateBody `
            -Headers $headers `
            -ErrorAction Stop
            
        Write-Host "✅ Schema Updated!" -ForegroundColor Green
    }
    else {
        Write-Host "ℹ️  Role field already exists." -ForegroundColor Gray
    }

    # 7. Create Users
    Write-Host "👥 Creating Users..." -ForegroundColor Cyan
    
    $users = @(
        @{ email = "owner@growyourneed.com"; pass = "Darnag12345678@"; role = "Owner"; name = "Platform Owner" },
        @{ email = "admin@school.com"; pass = "12345678"; role = "Admin"; name = "School Administrator" },
        @{ email = "teacher@school.com"; pass = "123456789"; role = "Teacher"; name = "Teacher Account" },
        @{ email = "student@school.com"; pass = "12345678"; role = "Student"; name = "Student Account" },
        @{ email = "parent@school.com"; pass = "123456788"; role = "Parent"; name = "Parent Account" },
        @{ email = "individual@individual.com"; pass = "12345678"; role = "Individual"; name = "Individual User" }
    )

    foreach ($u in $users) {
        $body = @{
            email           = $u.email
            password        = $u.pass
            passwordConfirm = $u.pass
            name            = $u.name
            role            = $u.role
            emailVisibility = $true
            verified        = $true
        } | ConvertTo-Json

        try {
            $null = Invoke-RestMethod -Uri "$POCKETBASE_URL/api/collections/users/records" `
                -Method POST `
                -Body $body `
                -Headers @{ "Content-Type" = "application/json" } `
                -ErrorAction Stop
            Write-Host "  ✅ Created $($u.role): $($u.email)" -ForegroundColor Green
        }
        catch {
            $msg = $_.Exception.Message
            if ($_.Exception.Response) {
                try {
                    $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
                    $responseBody = $reader.ReadToEnd()
                    $msg = "$msg - $responseBody"
                }
                catch {}
            }
            Write-Host "  ❌ Failed $($u.email): $msg" -ForegroundColor Red
        }
    }

}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody" -ForegroundColor Red
        }
        catch {}
    }
}
finally {
    # Stop PocketBase
    Write-Host "🛑 Stopping PocketBase..." -ForegroundColor Yellow
    Stop-Process -Id $pbProcess.Id -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "✨ Reset Complete! You can now run 'pnpm dev'" -ForegroundColor Green
