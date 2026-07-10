<?php
defined('ABSPATH') || exit;

add_action('wp_enqueue_scripts', 'circum_enqueue_assets');

function circum_enqueue_assets(): void
{
    $uri = get_template_directory_uri();
    $dir = get_template_directory();
    $slug = circum_page_slug();

    wp_enqueue_style(
        'circum-main',
        $uri . '/css/main.css',
        [],
        file_exists($dir . '/css/main.css') ? (string) filemtime($dir . '/css/main.css') : CIRCUM_THEME_VERSION
    );

    if ($slug === 'apropos' && file_exists($dir . '/css/apropos.css')) {
        wp_enqueue_style('circum-apropos', $uri . '/css/apropos.css', ['circum-main'], (string) filemtime($dir . '/css/apropos.css'));
    }

    $deps = [];
    $i18n_base = [
        'circum-i18n-common' => '/js/i18n/common.js',
        'circum-i18n-global' => '/js/i18n/page-i18n-global.js',
        'circum-i18n-loader' => '/js/i18n/loader.js',
    ];
    foreach ($i18n_base as $handle => $rel) {
        if (!file_exists($dir . $rel)) {
            continue;
        }
        wp_enqueue_script($handle, $uri . $rel, $deps, (string) filemtime($dir . $rel), true);
        $deps[] = $handle;
    }

    $page_i18n = [
        'home'         => ['page-home.js'],
        'apropos'      => ['page-apropos.js', 'page-fondateurs.js', 'page-apropos-extra.js'],
        'design'       => ['page-design.js', 'page-design-hover.js'],
        'fabrication'  => ['page-fabrication.js', 'page-fabrication-hover.js'],
        'clients'      => ['page-clients.js'],
        'news'         => ['page-news.js', 'page-news-extra.js'],
        'newsletter'   => ['page-newsletter.js', 'page-newsletter-extra.js'],
        'carrieres'    => ['page-carrieres.js', 'page-carrieres-extra.js'],
        'contact'      => ['page-contact.js', 'page-contact-extra.js'],
        'legal-notice' => ['page-legal.js'],
        'privacy-policy' => ['page-privacy.js'],
        'cookies'      => ['page-cookies.js'],
    ];

    if (isset($page_i18n[$slug])) {
        foreach ($page_i18n[$slug] as $file) {
            $rel = '/js/i18n/' . $file;
            if (!file_exists($dir . $rel)) {
                continue;
            }
            $handle = 'circum-i18n-' . sanitize_title($file);
            wp_enqueue_script($handle, $uri . $rel, $deps, (string) filemtime($dir . $rel), true);
            $deps[] = $handle;
        }
    }

    if ($slug === 'design' && file_exists($dir . '/js/design-vmodel-snippet.js')) {
        wp_enqueue_script('circum-vmodel', $uri . '/js/design-vmodel-snippet.js', $deps, (string) filemtime($dir . '/js/design-vmodel-snippet.js'), true);
        $deps[] = 'circum-vmodel';
    }

    if (file_exists($dir . '/js/hero-video.js')) {
        wp_enqueue_script('circum-hero-video', $uri . '/js/hero-video.js', $deps, (string) filemtime($dir . '/js/hero-video.js'), true);
        $deps[] = 'circum-hero-video';
    }

    if (file_exists($dir . '/js/main.js')) {
        wp_enqueue_script('circum-main', $uri . '/js/main.js', $deps, (string) filemtime($dir . '/js/main.js'), true);
        wp_localize_script('circum-main', 'circumWp', [
            'ajaxUrl'         => admin_url('admin-ajax.php'),
            'restUrl'         => esc_url_raw(rest_url()),
            'uploadsUrl'      => esc_url_raw(wp_upload_dir()['baseurl'] . '/'),
            'newsArticleBase' => esc_url_raw(circum_url('news-article')),
            'nonces'          => [
                'newsletter' => wp_create_nonce('circum_newsletter'),
                'contact'    => wp_create_nonce('circum_contact'),
                'careers'    => wp_create_nonce('circum_careers'),
            ],
            'isWp'            => true,
        ]);
    }

    if (file_exists($dir . '/js/lenis-init.mjs')) {
        wp_enqueue_script('circum-lenis', $uri . '/js/lenis-init.mjs', [], (string) filemtime($dir . '/js/lenis-init.mjs'), true);
        wp_script_add_data('circum-lenis', 'type', 'module');
    }
}

add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
});
