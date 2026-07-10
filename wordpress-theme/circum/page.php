<?php
/**
 * Page fallback — le contenu vit dans les templates Circum, pas dans l'éditeur.
 */
defined('ABSPATH') || exit;

$page_slug = get_post_field('post_name', get_queried_object_id());
if (is_string($page_slug) && $page_slug !== '') {
    $path = circum_page_template_path($page_slug);
    if ($path) {
        include $path;
        return;
    }
}

get_header();
?>
<main class="page-content section">
<div class="container">
<?php
while (have_posts()) {
    the_post();
    the_content();
}
?>
</div>
</main>
<?php
get_footer();
