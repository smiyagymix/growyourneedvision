#!/usr/bin/env pwsh

Write-Host "🚀 Initializing PocketBase for the first time..." -ForegroundColor Cyan
Write-Host ""

# Start PocketBase
Write-Host "Starting PocketBase on http://127.0.0.1:8090..." -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Open http://127.0.0.1:8090/_/ in your browser" -ForegroundColor White
Write-Host "2. Create your admin account (email: owner@growyourneed.com, pass: Darnag123456789@)" -ForegroundColor White
Write-Host "3. Stop this process (Ctrl+C)" -ForegroundColor White
Write-Host "4. Run 'node init-collections.js' to automatically create all schemas" -ForegroundColor White
Write-Host "5. Run 'node init-users.js' to create default users" -ForegroundColor White
Write-Host "6. Run 'node seed-crm.js' to populate data" -ForegroundColor White
Write-Host ""
Write-Host "7. Finally, run 'npm run dev' to start the full stack!" -ForegroundColor White
Write-Host ""

cd pocketbase
./pocketbase.exe serve --http=127.0.0.1:8090
