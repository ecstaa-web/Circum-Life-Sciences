<?php
/**
 * Fallback template
 */
get_header();
?>
<main class="page-content section">
<div class="container">
<?php
if (have_posts()) {
    while (have_posts()) {
        the_post();
        the_content();
    }
} else {
    echo '<p>' . esc_html__('Page introuvable.', 'circum') . '</p>';
}
?>
</div>
</main>
<?php
get_footer();
