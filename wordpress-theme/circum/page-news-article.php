<?php
/**
 * Template Name: Article
 * Page template: news-article
 */
defined('ABSPATH') || exit;

get_header();
?>
<main class="page-content">
<section class="section news-article-section">
<div class="container news-article-container">
<a class="news-article-back" href="<?php echo esc_url( circum_url('news') ); ?>">← Retour aux actualités</a>
<div id="news-article-root">
<p class="news-grid-loading">Chargement de l'article…</p>
</div>
</div>
</section>
</main>
<?php get_footer();
