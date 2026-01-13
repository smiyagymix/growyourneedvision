# Fix PocketBase collection permissions using REST API

Write-Host "Fixing PocketBase collection permissions..." -ForegroundColor Cyan

$pbUrl = "http://127.0.0.1:8090"
$collections_to_fix = @("platform_settings", "feature_flags", "settings", "branding", "branding_settings")

try {
    # Get all collections
    Write-Host "Fetching collections..." -ForegroundColor Blue
    $response = Invoke-WebRequest -Uri "$pbUrl/api/collections" -Method Get -ContentType "application/json"
    $collections = $response.Content | ConvertFrom-Json
    
    Write-Host "Found $($collections.Count) collections" -ForegroundColor Yellow

    foreach ($collection in $collections) {
        if ($collections_to_fix -contains $collection.name) {
            Write-Host "Updating '$($collection.name)'..." -ForegroundColor Blue
            
            try {
                # Update collection with public read permissions
                $body = @{
                    listRule   = $null
                    viewRule   = $null
                    createRule = '@request.auth.role = "admin"'
                    updateRule = '@request.auth.role = "admin"'
                    deleteRule = '@request.auth.role = "admin"'
                } | ConvertTo-Json
                
                $updateResponse = Invoke-WebRequest -Uri "$pbUrl/api/collections/$($collection.id)" `
                    -Method Patch `
                    -ContentType "application/json" `
                    -Body $body `
                    -ErrorAction Stop
                
                Write-Host "OK: Updated '$($collection.name)'" -ForegroundColor Green
            }
            catch {
                Write-Host "WARNING: Could not update '$($collection.name)': $_" -ForegroundColor Yellow
            }
        }
    }

    Write-Host "Permission fix complete!" -ForegroundColor Green
}
catch {
    Write-Host "Fatal error: $_" -ForegroundColor Red
    exit 1
}
