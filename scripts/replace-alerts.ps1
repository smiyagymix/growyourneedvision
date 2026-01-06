# Replace all alert() calls with toast notifications for MULTIVERSE-Ω CONTROL compliance
# This script systematically replaces alert() with proper UI feedback

$files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts" | 
Where-Object { (Get-Content $_.FullName -Raw) -match '\balert\(' -and
    (Get-Content $_.FullName -Raw) -notmatch 'createIncidentAlert|sendAlert|AlertData' }

$totalFiles = $files.Count
$processedFiles = 0

Write-Host "Found $totalFiles files with alert() calls to replace" -ForegroundColor Cyan

foreach ($file in $files) {
    $processedFiles++
    $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
    Write-Host "[$processedFiles/$totalFiles] Processing: $relativePath" -ForegroundColor Yellow
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $hasToast = $content -match "useToast|import.*ToastProvider"
    
    # Replace common alert patterns with toast notifications
    # Pattern 1: alert('string') -> showToast('string', 'info')
    $content = $content -replace "alert\('([^']+)'\);", "showToast('`$1', 'info');"
    
    # Pattern 2: alert('error message') -> showToast('error message', 'error')  
    $content = $content -replace "alert\('(Failed|Error|Invalid)[^']*'\);", "showToast('`$1', 'error');"
    
    # Pattern 3: alert("string") -> showToast("string", "info")
    $content = $content -replace 'alert\("([^"]+)"\);', "showToast('`$1', 'info');"
    
    # Pattern 4: alert(variable) -> showToast(variable, 'info')
    $content = $content -replace 'alert\(([a-zA-Z_][a-zA-Z0-9_\.]*)\);', "showToast(`$1, 'info');"
    
    # Pattern 5: alert(template literal) -> showToast(template, 'info')
    $content = $content -replace 'alert\((`[^`]*`)\);', "showToast(`$1, 'info');"
    
    # Add useToast import if not present and file was modified
    if ($content -ne $originalContent -and -not $hasToast) {
        # Find existing imports section
        if ($content -match "import.*from\s+['`"]react['`"];") {
            $content = $content -replace "(import.*from\s+['`"]react['`"];)", "`$1`nimport { useToast } from '../hooks/useToast';"
        }
        elseif ($content -match "^import") {
            $content = "import { useToast } from '../hooks/useToast';`n" + $content
        }
        
        # Add const { showToast } = useToast(); in component
        if ($content -match "const\s+\w+.*=.*\(") {
            $content = $content -replace "(const\s+\w+.*=.*\(\)\s*=>\s*\{)", "`$1`n  const { showToast } = useToast();"
        }
    }
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  ✓ Replaced alert() calls" -ForegroundColor Green
    }
    else {
        Write-Host "  - No changes needed" -ForegroundColor Gray
    }
}

Write-Host "`n✅ Alert replacement complete! Processed $totalFiles files" -ForegroundColor Green
Write-Host "⚠️  Manual review recommended for complex cases" -ForegroundColor Yellow
