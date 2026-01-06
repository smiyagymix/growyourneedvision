# PocketBase Diagnostic Script
$POCKETBASE_URL = "http://127.0.0.1:8090"

Write-Host "🔍 Diagnosing PocketBase at $POCKETBASE_URL" -ForegroundColor Cyan

function Test-Endpoint ($path, $method = "GET") {
    $url = "$POCKETBASE_URL$path"
    Write-Host "Testing $method $url ... " -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $url -Method $method -ErrorAction Stop
        Write-Host "✅ $($response.StatusCode)" -ForegroundColor Green
        # Write-Host "   Content: $($response.Content)" -ForegroundColor Gray
    }
    catch {
        if ($_.Exception.Response) {
            Write-Host "❌ $($_.Exception.Response.StatusCode)" -ForegroundColor Red
            # Write-Host "   Content: $($_.Exception.Response.StatusCode)" -ForegroundColor Gray
        }
        else {
            Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Test-Endpoint "/"
Test-Endpoint "/_/"
Test-Endpoint "/api/health"
Test-Endpoint "/api/admins"
Test-Endpoint "/api/collections"
Test-Endpoint "/api/collections/users/records"
Test-Endpoint "/api/collections/_superusers/records"
Test-Endpoint "/api/collections/_superusers/auth-with-password" "POST"
