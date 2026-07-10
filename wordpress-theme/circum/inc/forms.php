<?php
defined('ABSPATH') || exit;

foreach (['newsletter', 'contact', 'careers'] as $form) {
    add_action('wp_ajax_circum_' . $form, 'circum_handle_' . $form);
    add_action('wp_ajax_nopriv_circum_' . $form, 'circum_handle_' . $form);
}

function circum_verify_nonce(string $action): void
{
    $nonce = isset($_POST['nonce']) ? sanitize_text_field(wp_unslash($_POST['nonce'])) : '';
    if (!wp_verify_nonce($nonce, 'circum_' . $action)) {
        wp_send_json_error(['message' => __('Jeton de sécurité invalide. Rechargez la page.', 'circum')], 403);
    }
}

function circum_honeypot_check(): void
{
    if (!empty($_POST['website'])) {
        wp_send_json_success(['message' => 'OK']);
    }
}

function circum_rate_limit(string $key, int $max, int $seconds = 3600): void
{
    $ip  = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : 'unknown';
    $tid = 'circum_rl_' . $key . '_' . md5($ip);
    $count = (int) get_transient($tid);
    if ($count >= $max) {
        wp_send_json_error(['message' => __('Trop de tentatives. Réessayez plus tard.', 'circum')], 429);
    }
    set_transient($tid, $count + 1, $seconds);
}

function circum_save_entry(string $type, string $title, array $meta): int
{
    $post_id = wp_insert_post([
        'post_type'   => 'circum_entry',
        'post_status' => 'private',
        'post_title'  => $title,
    ], true);

    if (is_wp_error($post_id)) {
        return 0;
    }

    update_post_meta($post_id, '_circum_form_type', $type);
    foreach ($meta as $k => $v) {
        update_post_meta($post_id, '_circum_' . $k, $v);
    }

    return (int) $post_id;
}

function circum_handle_upload(string $field, array $allowed_mimes, int $max_bytes): ?array
{
    if (empty($_FILES[$field]['name'])) {
        return null;
    }

    require_once ABSPATH . 'wp-admin/includes/file.php';

    if (!empty($_FILES[$field]['size']) && (int) $_FILES[$field]['size'] > $max_bytes) {
        wp_send_json_error(['message' => __('Fichier trop volumineux.', 'circum')], 400);
    }

    $upload = wp_handle_upload($_FILES[$field], [
        'test_form' => false,
        'mimes'     => $allowed_mimes,
    ]);

    if (isset($upload['error'])) {
        wp_send_json_error(['message' => $upload['error']], 400);
    }

    return $upload;
}

function circum_notify(string $form_type, string $subject, string $body): void
{
    $to = circum_mail_recipient($form_type);
    wp_mail($to, $subject, $body, ['Content-Type: text/plain; charset=UTF-8']);
}

function circum_handle_newsletter(): void
{
    circum_verify_nonce('newsletter');
    circum_honeypot_check();
    circum_rate_limit('newsletter', 10);

    $email = isset($_POST['email']) ? sanitize_email(wp_unslash($_POST['email'])) : '';
    if (!is_email($email)) {
        wp_send_json_error(['message' => __('Adresse email invalide.', 'circum')], 400);
    }

    $implicit = isset($_POST['implicit_consent']) && $_POST['implicit_consent'] === '1';
    $consent  = !empty($_POST['consent']) || $implicit;
    if (!$consent) {
        wp_send_json_error(['message' => __('Veuillez accepter de recevoir la newsletter.', 'circum')], 400);
    }

    $firstname = sanitize_text_field(wp_unslash($_POST['firstname'] ?? ''));
    $lastname  = sanitize_text_field(wp_unslash($_POST['lastname'] ?? ''));
    if (!$firstname && $email) {
        $firstname = strstr($email, '@', true) ?: $email;
    }
    if (!$lastname) {
        $lastname = '-';
    }

    $interests = [];
    if (!empty($_POST['interests']) && is_array($_POST['interests'])) {
        $interests = array_map('sanitize_text_field', wp_unslash($_POST['interests']));
    }

    $data = [
        'firstname' => $firstname,
        'lastname'  => $lastname,
        'email'     => $email,
        'company'   => sanitize_text_field(wp_unslash($_POST['company'] ?? '')),
        'role'      => sanitize_text_field(wp_unslash($_POST['role'] ?? '')),
        'lang'      => sanitize_text_field(wp_unslash($_POST['lang'] ?? 'fr')),
        'interests' => implode(', ', $interests),
        'consent'   => 'yes',
    ];

    circum_save_entry('newsletter', 'Newsletter · ' . $email, $data);

    $body = "Nouvelle inscription newsletter\n\n" . print_r($data, true);
    circum_notify('newsletter', '[Circum] Newsletter · ' . $email, $body);

    wp_send_json_success(['message' => __('Merci, vous êtes inscrit à la newsletter.', 'circum')]);
}

function circum_handle_contact(): void
{
    circum_verify_nonce('contact');
    circum_honeypot_check();
    circum_rate_limit('contact', 20);

    $required = ['firstname', 'lastname', 'email', 'company', 'country', 'type', 'message'];
    foreach ($required as $field) {
        if (empty($_POST[$field])) {
            wp_send_json_error(['message' => __('Veuillez compléter les champs obligatoires.', 'circum')], 400);
        }
    }

    if (empty($_POST['consent'])) {
        wp_send_json_error(['message' => __('Veuillez accepter le traitement de vos données.', 'circum')], 400);
    }

    $email = sanitize_email(wp_unslash($_POST['email']));
    if (!is_email($email)) {
        wp_send_json_error(['message' => __('Adresse email invalide.', 'circum')], 400);
    }

    $data = [
        'firstname'   => sanitize_text_field(wp_unslash($_POST['firstname'])),
        'lastname'    => sanitize_text_field(wp_unslash($_POST['lastname'])),
        'email'       => $email,
        'phone'       => sanitize_text_field(wp_unslash($_POST['phone'] ?? '')),
        'company'     => sanitize_text_field(wp_unslash($_POST['company'])),
        'role'        => sanitize_text_field(wp_unslash($_POST['role'] ?? '')),
        'country'     => sanitize_text_field(wp_unslash($_POST['country'])),
        'size'        => sanitize_text_field(wp_unslash($_POST['size'] ?? '')),
        'type'        => sanitize_text_field(wp_unslash($_POST['type'])),
        'class'       => sanitize_text_field(wp_unslash($_POST['class'] ?? '')),
        'stage'       => sanitize_text_field(wp_unslash($_POST['stage'] ?? '')),
        'volume'      => sanitize_text_field(wp_unslash($_POST['volume'] ?? '')),
        'timeline'    => sanitize_text_field(wp_unslash($_POST['timeline'] ?? '')),
        'message'     => sanitize_textarea_field(wp_unslash($_POST['message'])),
        'nda_request' => !empty($_POST['nda_request']) ? 'yes' : 'no',
        'lang'        => sanitize_text_field(wp_unslash($_POST['lang'] ?? 'fr')),
    ];

    $upload = circum_handle_upload('attachment', [
        'pdf'  => 'application/pdf',
        'doc'  => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'zip'  => 'application/zip',
    ], 20 * 1024 * 1024);

    if ($upload) {
        $data['attachment'] = $upload['url'];
    }

    circum_save_entry('contact', 'Contact · ' . $data['company'], $data);
    circum_notify('contact', '[Circum] Contact B2B · ' . $data['company'], print_r($data, true));

    wp_send_json_success(['message' => __('Merci, votre demande a bien été envoyée.', 'circum')]);
}

function circum_handle_careers(): void
{
    circum_verify_nonce('careers');
    circum_honeypot_check();
    circum_rate_limit('careers', 5);

    $required = ['firstname', 'lastname', 'email', 'position'];
    foreach ($required as $field) {
        if (empty($_POST[$field])) {
            wp_send_json_error(['message' => __('Veuillez compléter les champs obligatoires.', 'circum')], 400);
        }
    }

    if (empty($_POST['consent'])) {
        wp_send_json_error(['message' => __('Veuillez accepter le traitement de vos données.', 'circum')], 400);
    }

    $email = sanitize_email(wp_unslash($_POST['email']));
    if (!is_email($email)) {
        wp_send_json_error(['message' => __('Adresse email invalide.', 'circum')], 400);
    }

    if (empty($_FILES['cv']['name'])) {
        wp_send_json_error(['message' => __('Veuillez joindre votre CV.', 'circum')], 400);
    }

    $upload = circum_handle_upload('cv', [
        'pdf'  => 'application/pdf',
        'doc'  => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ], 10 * 1024 * 1024);

    $data = [
        'firstname'    => sanitize_text_field(wp_unslash($_POST['firstname'])),
        'lastname'     => sanitize_text_field(wp_unslash($_POST['lastname'])),
        'email'        => $email,
        'phone'        => sanitize_text_field(wp_unslash($_POST['phone'] ?? '')),
        'position'     => sanitize_text_field(wp_unslash($_POST['position'])),
        'location'     => sanitize_text_field(wp_unslash($_POST['location'] ?? '')),
        'experience'   => sanitize_text_field(wp_unslash($_POST['experience'] ?? '')),
        'availability' => sanitize_text_field(wp_unslash($_POST['availability'] ?? '')),
        'message'      => sanitize_textarea_field(wp_unslash($_POST['message'] ?? '')),
        'lang'         => sanitize_text_field(wp_unslash($_POST['lang'] ?? 'fr')),
        'cv'           => $upload['url'] ?? '',
    ];

    circum_save_entry('careers', 'Candidature · ' . $data['firstname'] . ' ' . $data['lastname'], $data);
    circum_notify('careers', '[Circum] Candidature · ' . $data['position'], print_r($data, true));

    wp_send_json_success(['message' => __('Merci, votre candidature a bien été envoyée.', 'circum')]);
}
