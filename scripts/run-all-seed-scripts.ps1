#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run all seed data scripts to populate collections
#>

Write-Host "🌱 Running All Seed Data Scripts" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

$scripts = @(
    "seed-data.js",
    "seed-ai-data.js",
    "seed-business-data.js",
    "seed-communication-data.js",
    "seed-crm-data.js",
    "seed-gamification-media.js",
    "seed-help-sport-travel.js",
    "seed-marketplace-data.js",
    "seed-marketing-data.js",
    "seed-platform-owner-data.js",
    "seed-religion-data.js",
    "seed-wellness-tools-data.js"
)

$successCount = 0
$failCount = 0
$skipCount = 0

foreach ($script in $scripts) {
    $scriptPath = Join-Path "scripts" $script
    
    if (-not (Test-Path $scriptPath)) {
        Write-Host "⏭️  Skipping: $script (not found)" -ForegroundColor Yellow
        $skipCount++
        continue
    }

    Write-Host "`n📋 Running: $script" -ForegroundColor Blue
    Write-Host "============================================================"
    
    $output = node $scriptPath 2>&1 | Out-String
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $script completed successfully" -ForegroundColor Green
        # Show success lines
        $output -split "`n" | Where-Object { 
            $_ -match "✅|✓|Created|Seeded|Successfully" 
        } | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Gray
        }
        $successCount++
    }
    else {
        Write-Host "❌ $script failed" -ForegroundColor Red
        # Show first 3 error lines
        $errors = $output -split "`n" | Where-Object { 
            $_ -match "Error|Failed|❌" -and $_ -notmatch "node_modules"
        } | Select-Object -First 3
        $errors | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Red
        }
        $failCount++
    }
}

Write-Host "`n`n============================================================"
Write-Host "📊 Summary" -ForegroundColor Cyan
Write-Host "============================================================"
Write-Host "✅ Successful: $successCount" -ForegroundColor Green
Write-Host "❌ Failed:     $failCount" -ForegroundColor Red
Write-Host "⏭️  Skipped:    $skipCount" -ForegroundColor Yellow
Write-Host "📦 Total:      $($scripts.Count)" -ForegroundColor Cyan

if ($failCount -gt 0) {
    Write-Host "`n⚠️  Some scripts failed. Check the logs above for details." -ForegroundColor Yellow
    exit 1
}
else {
    Write-Host "`n🎉 All seed data scripts completed successfully!" -ForegroundColor Green
    exit 0
}
