<?php
defined('ABSPATH') || exit;

const CIRCUM_PAGES = [
    'home'            => ['title' => 'Accueil', 'template' => 'front-page.php'],
    'apropos'         => ['title' => 'À propos', 'template' => 'page-apropos.php'],
    'design'          => ['title' => 'Design & Développement', 'template' => 'page-design.php'],
    'fabrication'     => ['title' => 'Fabrication', 'template' => 'page-fabrication.php'],
    'clients'         => ['title' => 'Clients', 'template' => 'page-clients.php'],
    'news'            => ['title' => 'News', 'template' => 'page-news.php'],
    'news-article'    => ['title' => 'Article', 'template' => 'page-news-article.php'],
    'newsletter'      => ['title' => 'Newsletter', 'template' => 'page-newsletter.php'],
    'carrieres'       => ['title' => 'Carrières', 'template' => 'page-carrieres.php'],
    'contact'         => ['title' => 'Contact', 'template' => 'page-contact.php'],
    'privacy-policy'  => ['title' => 'Confidentialité', 'template' => 'page-privacy-policy.php'],
    'legal-notice'    => ['title' => 'Mentions légales', 'template' => 'page-legal-notice.php'],
    'cookies'         => ['title' => 'Cookies', 'template' => 'page-cookies.php'],
];

function circum_page_slug(): string
{
    if (is_front_page()) {
        return 'home';
    }
    if (is_page()) {
        $slug = get_post_field('post_name', get_queried_object_id());
        if (!is_string($slug) || $slug === '') {
            return '';
        }
        if ($slug === 'accueil') {
            return 'home';
        }
        return $slug;
    }
    return '';
}

function circum_page_template_path(string $page_slug): ?string
{
    foreach (CIRCUM_PAGES as $key => $cfg) {
        $expected = $key === 'home' ? 'accueil' : $key;
        if ($page_slug === $expected || $page_slug === $key) {
            $path = get_template_directory() . '/' . $cfg['template'];
            if (file_exists($path)) {
                return $path;
            }
        }
    }
    return null;
}

add_filter('template_include', 'circum_resolve_page_template', 99);

function circum_resolve_page_template(string $template): string
{
    if (is_front_page()) {
        $path = get_template_directory() . '/front-page.php';
        if (file_exists($path)) {
            return $path;
        }
    }

    if (!is_page()) {
        return $template;
    }

    $page_slug = get_post_field('post_name', get_queried_object_id());
    if (!is_string($page_slug) || $page_slug === '') {
        return $template;
    }

    $resolved = circum_page_template_path($page_slug);
    return $resolved ?? $template;
}

function circum_is_page(string $slug): bool
{
    return circum_page_slug() === $slug;
}

function circum_url(string $page = 'home', string $hash = ''): string
{
    if ($page === 'home') {
        $url = home_url('/');
    } else {
        $obj = get_page_by_path($page);
        $url = $obj ? get_permalink($obj) : home_url('/' . $page . '/');
    }
    return $hash ? $url . $hash : $url;
}

function circum_asset(string $path): string
{
    return trailingslashit(get_template_directory_uri()) . ltrim($path, '/');
}

function circum_show_bottom_sections(): bool
{
    return !in_array(circum_page_slug(), ['legal-notice', 'privacy-policy', 'cookies', 'news-article'], true);
}

function circum_head_meta(): void
{
    if (!is_page() && !is_front_page()) {
        return;
    }
    echo '<meta name="description" content="Circum Life Sciences — CDMO dispositifs médicaux. Suisse · France · Tunisie.">' . "\n";
}

function circum_page_preloads(): void
{
    $preloads = [
        'home'         => ['video' => 'assets/video/hero.mp4', 'image' => 'assets/img/circum-logo.png'],
        'apropos'      => ['video' => 'assets/video/apropos-hero.mp4', 'image' => 'assets/img/circum-logo.png'],
        'design'       => ['video' => 'assets/video/design-hero.mp4', 'image' => 'assets/img/design-lab-hover.jpg'],
        'fabrication'  => ['video' => 'assets/video/fabrication-hero.mp4', 'image' => 'assets/img/force-one-facade.jpg'],
        'clients'      => ['video' => 'assets/video/clients-hero.mp4', 'image' => 'assets/img/circum-logo.png'],
        'contact'      => ['video' => 'assets/video/contact-hero.mp4', 'image' => 'assets/img/circum-logo.png'],
        'news'         => ['video' => 'assets/video/news-hero.mp4', 'image' => 'assets/img/circum-logo.png'],
        'newsletter'   => ['video' => 'assets/video/clients-hero.mp4', 'image' => 'assets/img/circum-logo.png'],
        'carrieres'    => ['video' => 'assets/video/fabrication-hero.mp4', 'image' => 'assets/img/circum-logo.png'],
    ];
    $slug = circum_page_slug();
    if (!isset($preloads[$slug])) {
        echo '<link rel="preload" as="image" href="' . esc_url(circum_asset('assets/img/circum-logo.png')) . '">' . "\n";
        return;
    }
    $p = $preloads[$slug];
    if (!empty($p['video'])) {
        echo '<link rel="preload" as="fetch" href="' . esc_url(circum_asset($p['video'])) . '" crossorigin type="video/mp4">' . "\n";
    }
    if (!empty($p['image'])) {
        echo '<link rel="preload" as="image" href="' . esc_url(circum_asset($p['image'])) . '">' . "\n";
    }
}

add_action('after_switch_theme', 'circum_install_pages');
add_action('after_setup_theme', 'circum_maybe_sync_pages', 20);

function circum_maybe_sync_pages(): void
{
    if (get_option('circum_theme_pages_v') === CIRCUM_THEME_VERSION) {
        return;
    }
    circum_install_pages();
    update_option('circum_theme_pages_v', CIRCUM_THEME_VERSION);
}

function circum_install_pages(): void
{
    $front_id = 0;

    foreach (CIRCUM_PAGES as $slug => $cfg) {
        $post_name = $slug === 'home' ? 'accueil' : $slug;
        $existing = get_page_by_path($post_name);

        if ($existing) {
            $page_id = (int) $existing->ID;
            update_post_meta($page_id, '_wp_page_template', $cfg['template']);
            if ($slug === 'home') {
                $front_id = $page_id;
            }
            continue;
        }

        $page_id = wp_insert_post([
            'post_title'   => $cfg['title'],
            'post_name'    => $post_name,
            'post_status'  => 'publish',
            'post_type'    => 'page',
            'post_content' => '',
        ], true);

        if (is_wp_error($page_id)) {
            continue;
        }

        update_post_meta($page_id, '_wp_page_template', $cfg['template']);

        if ($slug === 'home') {
            $front_id = (int) $page_id;
        }
    }

    if ($front_id) {
        update_option('show_on_front', 'page');
        update_option('page_on_front', $front_id);
    }

    flush_rewrite_rules();
}

add_filter('document_title_parts', 'circum_document_title');

function circum_document_title(array $parts): array
{
    $slug = circum_page_slug();
    $titles = [
        'home'         => 'Circum Life Sciences · Laboratoire CDMO intégré',
        'apropos'      => 'À propos · Circum Life Sciences',
        'design'       => 'Design & Développement · Circum Life Sciences',
        'fabrication'  => 'Fabrication · Circum Life Sciences',
        'clients'      => 'Clients · Circum Life Sciences',
        'news'         => 'News · Circum Life Sciences',
        'news-article' => 'Actualité · Circum Life Sciences',
        'newsletter'   => 'Newsletter · Circum Life Sciences',
        'carrieres'    => 'Carrières · Circum Life Sciences',
        'contact'      => 'Contact · Circum Life Sciences',
        'legal-notice' => 'Mentions légales · Circum Life Sciences',
        'privacy-policy' => 'Confidentialité · Circum Life Sciences',
        'cookies'      => 'Cookies · Circum Life Sciences',
    ];
    if (isset($titles[$slug])) {
        $parts['title'] = $titles[$slug];
    }
    return $parts;
}
