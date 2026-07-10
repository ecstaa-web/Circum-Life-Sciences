<?php
defined('ABSPATH') || exit;

add_action('init', 'circum_register_post_types');

function circum_register_post_types(): void
{
    register_post_type('circum_news', [
        'labels' => [
            'name'          => __('Actualités', 'circum'),
            'singular_name' => __('Actualité', 'circum'),
        ],
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'menu_icon'    => 'dashicons-megaphone',
        'supports'     => ['title', 'editor', 'thumbnail', 'custom-fields'],
        'show_in_rest' => true,
    ]);

    register_post_type('circum_newsletter', [
        'labels' => [
            'name'          => __('Éditions newsletter', 'circum'),
            'singular_name' => __('Édition newsletter', 'circum'),
        ],
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'menu_icon'    => 'dashicons-email-alt',
        'supports'     => ['title', 'editor', 'custom-fields'],
        'show_in_rest' => true,
    ]);

    register_post_type('circum_entry', [
        'labels' => [
            'name'          => __('Soumissions formulaires', 'circum'),
            'singular_name' => __('Soumission', 'circum'),
        ],
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'menu_icon'    => 'dashicons-forms',
        'supports'     => ['title', 'custom-fields'],
    ]);
}
