$ErrorActionPreference = "Stop"

Write-Host "Activando Node 20.19.0 para Gasto Facil MVP..." -ForegroundColor Cyan
nvm use 20.19.0
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

function Get-Node20Paths {
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCommand) {
        return @{
            NodeExe = $nodeCommand.Source
            NpmCmd = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
        }
    }

    $settingsPath = Join-Path $env:APPDATA "nvm\settings.txt"
    if (-not (Test-Path $settingsPath)) {
        throw "No se encontro settings.txt de nvm en $settingsPath"
    }

    $nvmRootLine = Get-Content $settingsPath | Where-Object { $_ -like "root:*" } | Select-Object -First 1
    if (-not $nvmRootLine) {
        throw "No se pudo leer la ruta root de nvm."
    }

    $nvmRoot = ($nvmRootLine -replace "^root:\s*", "").Trim()
    $nodeDir = Join-Path $nvmRoot "v20.19.0"
    $nodeExe = Join-Path $nodeDir "node.exe"
    $npmCmd = Join-Path $nodeDir "npm.cmd"

    if (-not (Test-Path $nodeExe)) {
        throw "Node 20 no quedo disponible ni en PATH ni en $nodeExe"
    }

    $env:Path = "$nodeDir;$env:Path"

    return @{
        NodeExe = $nodeExe
        NpmCmd = $npmCmd
    }
}

$nodeTools = Get-Node20Paths
& $nodeTools.NodeExe -v

Write-Host "Iniciando backend NestJS..." -ForegroundColor Green
Set-Location "$PSScriptRoot\..\backend-api"
& $nodeTools.NpmCmd install
& $nodeTools.NpmCmd run start:dev
