<?php
/**
 * Circum Life Sciences — thème WordPress
 */

defined('ABSPATH') || exit;

define('CIRCUM_THEME_VERSION', '1.0.1');

require_once get_template_directory() . '/inc/helpers.php';
require_once get_template_directory() . '/inc/post-types.php';
require_once get_template_directory() . '/inc/enqueue.php';
require_once get_template_directory() . '/inc/forms.php';
require_once get_template_directory() . '/inc/rest-api.php';

function circum_mail_recipient(string $form_type): string
{
    $defaults = [
        'newsletter' => get_option('admin_email'),
        'contact'    => get_option('admin_email'),
        'careers'    => get_option('admin_email'),
    ];
    $email = $defaults[$form_type] ?? get_option('admin_email');
    return (string) apply_filters('circum_form_recipient', $email, $form_type);
}
