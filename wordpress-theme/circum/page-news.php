<?php
/**
 * Template Name: News
 * Page template: news
 */
defined('ABSPATH') || exit;

get_header();
?>
<main class="page-content">
<section class="hero-video-wrap">
<video autoplay="" class="hero-video-bg" fetchpriority="high" loop="" muted="" playsinline="" preload="auto" src="<?php echo esc_url( circum_asset('assets/video/news-hero.mp4') ); ?>"></video>
<div class="hero-video-overlay"></div>
<div class="hero-video-content">
<div class="hero-eyebrow reveal" data-i18n="news.page_hero_eyebrow.1">Actualités &amp; communiqués</div>
<h1 class="hero-title reveal" data-i18n-html="news.page_hero_title.2">News &amp; <em>Media.</em></h1>
<p class="hero-subtitle reveal" data-i18n="news.page_hero_subtitle.3">Inaugurations, certifications, publications scientifiques, salons internationaux : suivez l'actualité de Circum Life Sciences.</p>
</div>
</section>
<section class="section">
<div class="container">
<div class="news-grid">
<p class="news-grid-loading">Chargement des actualités…</p>
</div>
</div>
</section>
</main>
<?php get_footer();
