# Demarre Circum en local - SANS Node.js, SANS droits admin, SANS MongoDB

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$VenvPython = Join-Path $Root ".venv\Scripts\python.exe"
$Uv = Join-Path $env:USERPROFILE ".local\bin\uv.exe"
$ServeScript = Join-Path $Root "scripts\serve_frontend.py"
$BackendDir = Join-Path $Root "backend"

function Ensure-Python {
    if (Test-Path $VenvPython) { return $VenvPython }
    if (-not (Test-Path $Uv)) {
        Write-Host "uv introuvable. Installez-le : https://docs.astral.sh/uv/" -ForegroundColor Red
        exit 1
    }
    Write-Host "Premiere installation (Python 3.12 + dependances)..."
    Set-Location $Root
    & $Uv python install 3.12
    & $Uv venv --python 3.12 .venv
    & $Uv pip install -r (Join-Path $Root "backend\requirements.txt")
    return $VenvPython
}

$Python = Ensure-Python

$envFile = Join-Path $Root "backend\.env"
$envExample = Join-Path $Root "backend\.env.example"
if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
}

Write-Host ""
Write-Host "=== Circum - demarrage local ===" -ForegroundColor Cyan
Write-Host ""

function Stop-PortListener([int]$Port) {
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        if ($c.OwningProcess -gt 0) {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "Arret des anciens serveurs (ports 8000, 3000)..."
Stop-PortListener 8000
Stop-PortListener 3000
Start-Sleep -Seconds 1

$backendProc = Start-Process -FilePath $Python `
    -ArgumentList "-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", "8000" `
    -WorkingDirectory $BackendDir `
    -WindowStyle Minimized `
    -PassThru

Start-Sleep -Seconds 4

try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health" -TimeoutSec 8
    Write-Host "Backend OK ($($health.status))" -ForegroundColor Green
} catch {
    Write-Host "Backend indisponible - verifiez la fenetre Python minimisee." -ForegroundColor Red
}

Write-Host ""
Write-Host "  Site  : http://127.0.0.1:3000/index.html" -ForegroundColor Green
Write-Host "  Admin : http://127.0.0.1:3000/admin.html" -ForegroundColor Green
Write-Host "  Email : stag3@circumlifesciences.com"
Write-Host "  Mot de passe : Stag3Admin2026!"
Write-Host ""
Write-Host "Ouverture du navigateur..."
Start-Process "http://127.0.0.1:3000/admin.html"
Write-Host "Fermez cette fenetre (Ctrl+C) pour arreter le site."
Write-Host ""

$env:BACKEND_URL = "http://127.0.0.1:8000"
$env:PORT = "3000"
$env:HOST = "127.0.0.1"

try {
    & $Python $ServeScript
} finally {
    if ($backendProc -and -not $backendProc.HasExited) {
        Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
    }
}
