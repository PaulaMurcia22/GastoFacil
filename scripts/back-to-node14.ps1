$ErrorActionPreference = "Stop"

Write-Host "Volviendo a Node 14.21.3 para tu proyecto antiguo..." -ForegroundColor Yellow
nvm use 14.21.3
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
