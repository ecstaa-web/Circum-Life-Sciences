# Build upload-ready WordPress theme from static HTML
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Src = $Root
$Theme = Join-Path $Root "wordpress-theme\circum"

$Pages = [ordered]@{
    "index.html"         = @("front-page.php", "home")
    "apropos.html"       = @("page-apropos.php", "apropos")
    "design.html"        = @("page-design.php", "design")
    "fabrication.html"   = @("page-fabrication.php", "fabrication")
    "clients.html"       = @("page-clients.php", "clients")
    "news.html"          = @("page-news.php", "news")
    "news-article.html"  = @("page-news-article.php", "news-article")
    "newsletter.html"    = @("page-newsletter.php", "newsletter")
    "carrieres.html"     = @("page-carrieres.php", "carrieres")
    "contact.html"       = @("page-contact.php", "contact")
    "privacy-policy.html"= @("page-privacy-policy.php", "privacy-policy")
    "legal-notice.html"  = @("page-legal-notice.php", "legal-notice")
    "cookies.html"       = @("page-cookies.php", "cookies")
}

function Sync-Assets {
    foreach ($folder in @("css", "js", "assets")) {
        $s = Join-Path $Src $folder
        $d = Join-Path $Theme $folder
        if (Test-Path $s) {
            if (Test-Path $d) { Remove-Item -Recurse -Force $d }
            Copy-Item -Recurse $s $d
        }
    }
    $sw = Join-Path $Src "sw.js"
    if (Test-Path $sw) { Copy-Item $sw (Join-Path $Theme "sw.js") -Force }
}

function Wp-Url([string]$page, [string]$hash = "") {
    if ($hash) {
        return "<?php echo esc_url( circum_url('$page', '$hash') ); ?>"
    }
    return "<?php echo esc_url( circum_url('$page') ); ?>"
}

function Wp-Asset([string]$path) {
    return "<?php echo esc_url( circum_asset('assets/$path') ); ?>"
}

function Transform-Content([string]$html) {
    $html = [regex]::Replace($html, 'href="([a-z0-9\-]+)\.html(#[^"]*)?"', {
        param($m)
        $page = $m.Groups[1].Value.ToLower()
        $hash = $m.Groups[2].Value
        $slug = if ($page -eq "index") { "home" } else { $page }
        return "href=`"$(Wp-Url $slug $hash)`""
    }, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

    $html = [regex]::Replace($html, '(src|href)="assets/([^"]+)"', {
        param($m)
        return "$($m.Groups[1].Value)=`"$(Wp-Asset $m.Groups[2].Value)`""
    }, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

    $html = [regex]::Replace($html, '<script[\s\S]*?</script>', '', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    $html = [regex]::Replace($html, '<link href="css/[^"]+" rel="stylesheet"/>\s*', '')
    $html = [regex]::Replace($html, '<link as="image" href="[^"]+" rel="preload"/>\s*', '')
    $html = [regex]::Replace($html, '<link as="fetch" crossorigin="" href="[^"]+" rel="preload" type="video/mp4"/>\s*', '')
    return $html.Trim()
}

function Get-Body([string]$html) {
    $m = [regex]::Match($html, '<body[^>]*>([\s\S]*)</body>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($m.Success) { return $m.Groups[1].Value }
    return $html
}

function Get-Shell {
    param([string]$html)
    $m = [regex]::Match($html, '(?s)(<div class="topbar">.*?</div>\s*</div>\s*<nav class="nav">.*?</nav>\s*<div class="nav-mobile">.*?</div>)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if (-not $m.Success) { throw "Could not extract site shell (topbar/nav)" }
    return $m.Groups[1].Value.Trim()
}

function Get-Main([string]$html) {
    $m = [regex]::Match($html, '(?s)(<main[\s\S]*?</main>)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if (-not $m.Success) { throw "Could not extract <main> block" }
    return $m.Groups[1].Value.Trim()
}

function Get-BottomFooter([string]$html) {
    $body = Get-Body $html
    $nl = $body.IndexOf('<section class="newsletter-strip">')
    $ft = $body.IndexOf("<footer")
    $bottom = ""
    if ($nl -ge 0 -and $ft -ge 0) { $bottom = $body.Substring($nl, $ft - $nl).Trim() }
    $footer = ""
    if ($ft -ge 0) {
        $footerPart = $body.Substring($ft)
        $footer = ($footerPart -split "<script")[0].Trim()
    }
    return @($bottom, $footer)
}

function Get-HeadStyles([string]$html) {
    $m = [regex]::Match($html, '<style>[\s\S]*?</style>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($m.Success) { return $m.Value }
    return ""
}

function Write-Utf8NoBom([string]$Path, [string]$Content) {
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

function Write-Template([string]$phpName, [string]$slug, [string]$templateTitle, [string]$main, [string]$inlineStyle) {
    $main = Transform-Content $main
    $styleHook = ""
    if ($inlineStyle) {
        $escaped = $inlineStyle.Replace("\", "\\").Replace("'", "\'")
        $styleHook = @"

<?php add_action('wp_head', static function () { echo '$escaped'; }, 20); ?>

"@
    }
    $tpl = @"
<?php
/**
 * Template Name: $templateTitle
 * Page template: $slug
 */
defined('ABSPATH') || exit;
$styleHook
get_header();
?>
$main
<?php get_footer();

"@
    Write-Utf8NoBom (Join-Path $Theme $phpName) $tpl
}

function Build-Header {
    $raw = Get-Content (Join-Path $Src "index.html") -Raw -Encoding UTF8
    $shell = Transform-Content (Get-Shell $raw)

    return @"
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<?php circum_head_meta(); ?>
<?php circum_page_preloads(); ?>
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?> data-page="<?php echo esc_attr( circum_page_slug() ); ?>">
<?php wp_body_open(); ?>
$shell

"@
}

function Build-Footer([string]$bottom, [string]$footer) {
    $bottom = Transform-Content $bottom
    $footer = Transform-Content $footer
    return @"
<?php if ( circum_show_bottom_sections() ) : ?>
$bottom
<?php endif; ?>
$footer
<?php wp_footer(); ?>
</body>
</html>

"@
}

New-Item -ItemType Directory -Force -Path $Theme | Out-Null
Sync-Assets

$index = Get-Content (Join-Path $Src "index.html") -Raw -Encoding UTF8
$parts = Get-BottomFooter $index
Write-Utf8NoBom (Join-Path $Theme "header.php") (Build-Header)
Write-Utf8NoBom (Join-Path $Theme "footer.php") (Build-Footer $parts[0] $parts[1])

$Titles = @{
    "home" = "Accueil"
    "apropos" = "À propos"
    "design" = "Design & Développement"
    "fabrication" = "Fabrication"
    "clients" = "Clients"
    "news" = "News"
    "news-article" = "Article"
    "newsletter" = "Newsletter"
    "carrieres" = "Carrières"
    "contact" = "Contact"
    "privacy-policy" = "Confidentialité"
    "legal-notice" = "Mentions légales"
    "cookies" = "Cookies"
}

foreach ($entry in $Pages.GetEnumerator()) {
    $htmlPath = Join-Path $Src $entry.Key
    if (-not (Test-Path $htmlPath)) { continue }
    $html = Get-Content $htmlPath -Raw -Encoding UTF8
    $slug = $entry.Value[1]
    $title = if ($Titles.Contains($slug)) { $Titles[$slug] } else { $slug }
    Write-Template $entry.Value[0] $slug $title (Get-Main $html) (Get-HeadStyles $html)
}

Get-ChildItem (Join-Path $Theme "*.html") -ErrorAction SilentlyContinue | Remove-Item -Force
Write-Host "Theme built: $Theme"
