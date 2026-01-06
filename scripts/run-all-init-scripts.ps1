# Run all initialization scripts that work with current auth
Write-Host "🚀 Running All Initialization Scripts" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

$successCount = 0
$failCount = 0
$skippedCount = 0

# Scripts that work with pb.admins.authWithPassword('owner@growyourneed.com', '12345678')
$workingScripts = @(
    'init-audit-logs-schema.js',
    'init-tenant-schema.js',
    'init-ab-testing.js',
    'init-advanced-owner-features.js',
    'init-ai-schema.js',
    'init-email-templates.js',
    'init-dashboard-builder.js',
    'init-security-features.js',
    'init-user-management.js',
    'init-incident-response.js',
    'init-tenant-cloning.js',
    'init-usage-schema.js',
    'init-feature-usage.js',
    'init-business-schema.js',
    'init-audit-schema.js',
    'init-events-schema.js',
    'init-help-schema.js',
    'init-hobbies-schema.js',
    'init-marketplace-schema.js',
    'init-media-schema.js',
    'init-messaging-schema.js',
    'init-religion-schema.js',
    'init-services-schema.js',
    'init-sport-schema.js',
    'init-studio-schema.js',
    'init-travel-schema.js'
)

foreach ($script in $workingScripts) {
    $scriptPath = "scripts\$script"
    
    if (-not (Test-Path $scriptPath)) {
        Write-Host "⏭️  Skipping $script (not found)" -ForegroundColor Yellow
        $skippedCount++
        continue
    }
    
    Write-Host "`n📋 Running: $script" -ForegroundColor White
    Write-Host ("=" * 60) -ForegroundColor Gray
    
    try {
        $output = node $scriptPath 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $script completed successfully" -ForegroundColor Green
            $successCount++
            
            # Show key output lines
            $output | Select-String -Pattern "(Created|✅|already exists|Authenticated)" | ForEach-Object {
                Write-Host "   $_" -ForegroundColor DarkGray
            }
        }
        else {
            Write-Host "❌ $script failed" -ForegroundColor Red
            $failCount++
            
            # Show error lines
            $output | Select-String -Pattern "(Error|Failed|❌)" | Select-Object -First 3 | ForEach-Object {
                Write-Host "   $_" -ForegroundColor DarkRed
            }
        }
    }
    catch {
        Write-Host "❌ Exception running $script : $_" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n" -ForegroundColor White
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "📊 Summary" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "✅ Successful: $successCount" -ForegroundColor Green
Write-Host "❌ Failed:     $failCount" -ForegroundColor Red
Write-Host "⏭️  Skipped:    $skippedCount" -ForegroundColor Yellow
Write-Host "📦 Total:      $($successCount + $failCount + $skippedCount)" -ForegroundColor White
Write-Host "`n"

if ($failCount -gt 0) {
    Write-Host "⚠️  Some scripts failed. Check the logs above for details." -ForegroundColor Yellow
}
else {
    Write-Host "🎉 All scripts completed successfully!" -ForegroundColor Green
}
