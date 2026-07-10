<?php
/**
 * Template minimal requis par WordPress.
 * Remplacez par vos templates page-*.php lors de la conversion HTML → PHP.
 */
get_header();
?>
<main>
  <?php
  if (have_posts()) {
      while (have_posts()) {
          the_post();
          the_content();
      }
  }
  ?>
</main>
<?php
get_footer();
