# Copie les fichiers statiques du site dans le dossier thème WordPress.
# Usage (PowerShell) : .\wordpress-theme\sync-theme-assets.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Theme = Join-Path $PSScriptRoot "circum"

$dirs = @("css", "js", "assets")
foreach ($d in $dirs) {
    $src = Join-Path $Root $d
    $dst = Join-Path $Theme $d
    if (Test-Path $src) {
        if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
        Copy-Item -Recurse $src $dst
        Write-Host "Copied $d/"
    }
}

$files = @("sw.js", "index.html", "apropos.html", "design.html", "fabrication.html",
           "clients.html", "news.html", "news-article.html", "newsletter.html",
           "carrieres.html", "contact.html", "fondateurs.html",
           "privacy-policy.html", "legal-notice.html", "cookies.html")
foreach ($f in $files) {
    $src = Join-Path $Root $f
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $Theme $f) -Force
        Write-Host "Copied $f"
    }
}

Write-Host ""
Write-Host "Theme assets synced to wordpress-theme/circum/" -ForegroundColor Green
Write-Host "Upload this folder to wp-content/themes/circum/ and activate the theme."
