<?php
defined('ABSPATH') || exit;

add_action('rest_api_init', 'circum_register_rest_routes');

function circum_register_rest_routes(): void
{
    register_rest_route('circum/v1', '/news', [
        'methods'             => 'GET',
        'callback'            => 'circum_rest_news_list',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('circum/v1', '/news/(?P<id>[a-zA-Z0-9\-]+)', [
        'methods'             => 'GET',
        'callback'            => 'circum_rest_news_item',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('circum/v1', '/newsletter/issues', [
        'methods'             => 'GET',
        'callback'            => 'circum_rest_newsletter_issues',
        'permission_callback' => '__return_true',
    ]);
}

function circum_format_news_post(WP_Post $post): array
{
    $tag     = get_post_meta($post->ID, '_circum_tag', true) ?: 'Actualité';
    $variant = (int) (get_post_meta($post->ID, '_circum_variant', true) ?: 1);
    $date    = get_the_date('Y-m-d', $post);
    $thumb   = get_the_post_thumbnail_url($post, 'large');

    return [
        'id'          => (string) $post->ID,
        'title'       => get_the_title($post),
        'summary'     => get_post_meta($post->ID, '_circum_summary', true) ?: wp_trim_words($post->post_content, 30),
        'tag'         => $tag,
        'date'        => $date,
        'variant'     => $variant,
        'body_html'   => apply_filters('the_content', $post->post_content),
        'cover_image' => $thumb ?: '',
        'gallery'     => [],
    ];
}

function circum_rest_news_list(): WP_REST_Response
{
    $posts = get_posts([
        'post_type'      => 'circum_news',
        'post_status'    => 'publish',
        'posts_per_page' => 50,
        'orderby'        => 'date',
        'order'          => 'DESC',
    ]);

    $items = array_map('circum_format_news_post', $posts);
    return new WP_REST_Response($items, 200);
}

function circum_rest_news_item(WP_REST_Request $request): WP_REST_Response
{
    $id = $request->get_param('id');
    $post = get_post((int) $id);

    if (!$post || $post->post_type !== 'circum_news' || $post->post_status !== 'publish') {
        return new WP_REST_Response(['message' => 'Not found'], 404);
    }

    return new WP_REST_Response(circum_format_news_post($post), 200);
}

function circum_rest_newsletter_issues(): WP_REST_Response
{
    $posts = get_posts([
        'post_type'      => 'circum_newsletter',
        'post_status'    => 'publish',
        'posts_per_page' => 20,
        'orderby'        => 'date',
        'order'          => 'DESC',
    ]);

    $items = array_map(function (WP_Post $post) {
        return [
            'quarter' => get_post_meta($post->ID, '_circum_quarter', true) ?: 'Q1',
            'year'    => (int) (get_post_meta($post->ID, '_circum_year', true) ?: get_the_date('Y', $post)),
            'title'   => get_the_title($post),
            'summary' => get_post_meta($post->ID, '_circum_summary', true) ?: wp_trim_words($post->post_content, 25),
            'date'    => get_the_date('Y-m-d', $post),
            'link'    => get_post_meta($post->ID, '_circum_link', true) ?: '',
        ];
    }, $posts);

    return new WP_REST_Response(['items' => $items], 200);
}
