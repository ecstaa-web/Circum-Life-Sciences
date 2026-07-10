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
<div class="topbar">
<div class="topbar-inner">
<a data-i18n="topbar.email" href="<?php echo esc_url( circum_url('contact') ); ?>">contact@circumlifesciences.com</a>
<span class="topbar-divider"></span>
<a data-i18n="topbar.newsletter" href="<?php echo esc_url( circum_url('newsletter') ); ?>">Newsletter</a>
<span class="topbar-divider"></span>
<a data-i18n="topbar.careers" href="<?php echo esc_url( circum_url('carrieres') ); ?>">Carrières</a>
</div>
</div>
<nav class="nav">
<div class="nav-inner">
<a aria-current="page" class="nav-logo" href="<?php echo esc_url( circum_url('home') ); ?>">
<img alt="Circum Life Sciences Logo" class="nav-logo-img" data-i18n-alt="logo.alt" decoding="async" src="<?php echo esc_url( circum_asset('assets/img/circum-logo.png') ); ?>"/>
</a>
<ul class="nav-links">
<li class="nav-item">
<a class="nav-link" href="<?php echo esc_url( circum_url('apropos') ); ?>"><span data-i18n="nav.about">À propos</span> <span class="nav-link-chev">▾</span></a>
<div class="nav-submenu">
<a data-i18n="nav.sub.values" href="<?php echo esc_url( circum_url('apropos', '#valeurs') ); ?>">Nos valeurs</a>
<a data-i18n="nav.sub.founders" href="<?php echo esc_url( circum_url('apropos', '#founders') ); ?>">Les trois fondateurs</a>
<a data-i18n="nav.sub.board" href="<?php echo esc_url( circum_url('apropos', '#board') ); ?>">Board &amp; Conseil stratégique</a>
<a data-i18n="nav.sub.environment" href="<?php echo esc_url( circum_url('apropos', '#environnement') ); ?>">Politique environnementale</a>
</div>
</li>
<li class="nav-item">
<a class="nav-link" href="<?php echo esc_url( circum_url('design') ); ?>"><span data-i18n="nav.design">Design &amp; Développement</span> <span class="nav-link-chev">▾</span></a>
<div class="nav-submenu">
<a data-i18n="nav.sub.conception" href="<?php echo esc_url( circum_url('design', '#conception') ); ?>">Conception</a>
<a data-i18n="nav.sub.qara" href="<?php echo esc_url( circum_url('design', '#qara') ); ?>">Qualité &amp; Affaires Réglementaires</a>
</div>
</li>
<li class="nav-item">
<a class="nav-link" href="<?php echo esc_url( circum_url('fabrication') ); ?>"><span data-i18n="nav.manufacturing">Fabrication</span> <span class="nav-link-chev">▾</span></a>
<div class="nav-submenu">
<a data-i18n="nav.sub.forceone" href="<?php echo esc_url( circum_url('fabrication', '#force-one') ); ?>">Force One</a>
<a data-i18n="nav.sub.molding" href="<?php echo esc_url( circum_url('fabrication', '#flux') ); ?>">Flux de production</a>
</div>
</li>
<li class="nav-item"><a class="nav-link" data-i18n="nav.clients" href="<?php echo esc_url( circum_url('clients') ); ?>">Clients</a></li>
<li class="nav-item">
<a class="nav-link" href="<?php echo esc_url( circum_url('news') ); ?>"><span data-i18n="nav.news">News</span> <span class="nav-link-chev">▾</span></a>
<div class="nav-submenu">
<a data-i18n="nav.sub.newsletter" href="<?php echo esc_url( circum_url('newsletter') ); ?>">Newsletter</a>
</div>
</li>
<li class="nav-item"><a class="nav-link" data-i18n="nav.careers" href="<?php echo esc_url( circum_url('carrieres') ); ?>">Carrières</a></li>
</ul>
<div class="nav-cta-group">
<a class="nav-cta-btn" data-i18n="nav.contact" href="<?php echo esc_url( circum_url('contact') ); ?>">Contact</a>
<div class="lang-switch">
<button class="lang-btn active" data-lang="fr">FR</button>
<span class="lang-divider">/</span>
<button class="lang-btn" data-lang="en">EN</button>
<span class="lang-divider">/</span>
<button class="lang-btn" data-lang="de">DE</button>
<span class="lang-divider">/</span>
<button class="lang-btn" data-lang="it">IT</button>
</div>
<button aria-label="Menu" class="nav-toggle"><span></span><span></span><span></span></button>
</div>
</div>
</nav>
<div class="nav-mobile">
<div class="nav-mobile-section">
<div class="nav-mobile-title" data-i18n="mobile.title.about">À propos</div>
