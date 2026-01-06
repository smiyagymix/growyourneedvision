# Script to generate self-signed SSL certificates for local development
# Usage: ./generate-ssl.ps1

$CertDir = "certs"
if (-not (Test-Path $CertDir)) {
    New-Item -ItemType Directory -Path $CertDir | Out-Null
}

Write-Host "Generating self-signed certificate for localhost..." -ForegroundColor Cyan

# Generate Key and Certificate using OpenSSL (if available) or PowerShell
if (Get-Command openssl -ErrorAction SilentlyContinue) {
    openssl req -x509 -newkey rsa:4096 -keyout "$CertDir/key.pem" -out "$CertDir/cert.pem" -days 365 -nodes -subj "/CN=localhost"
    Write-Host "✅ Certificates generated in $CertDir/" -ForegroundColor Green
}
else {
    Write-Warning "OpenSSL not found. Attempting to use PowerShell to generate self-signed cert (Note: This might not export PEM files easily without extra steps)."
    
    # PowerShell native way usually puts it in the store, exporting to PEM is complex.
    # We'll just output a message telling them to install OpenSSL or use a tool.
    Write-Error "Please install OpenSSL to generate PEM files for Nginx."
    Write-Host "Download Git for Windows (includes OpenSSL) or install via 'winget install ShiningLight.OpenSSL'"
}
