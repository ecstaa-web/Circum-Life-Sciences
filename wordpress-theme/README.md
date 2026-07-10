# Migration WordPress — Circum Life Sciences

Ce dossier contient le thème WordPress prêt à recevoir le site statique.

## 1. Installer le thème

1. Copiez **tout le contenu** du dépôt (HTML, `css/`, `js/`, `assets/`, `sw.js`) dans :
   ```
   wp-content/themes/circum/
   ```
2. Copiez aussi le dossier `wordpress-theme/circum/` (fichiers PHP) au même endroit — les fichiers PHP se mélangent avec les assets statiques.
3. Dans l’admin WordPress : **Apparence → Thèmes → Activer « Circum Life Sciences »**.

Structure finale du thème :

```
wp-content/themes/circum/
├── style.css          ← en-tête WordPress (requis)
├── functions.php
├── index.php
├── header.php
├── footer.php
├── inc/
│   ├── enqueue.php    ← charge css/, js/, injecte circumWp
│   ├── forms.php      ← newsletter, contact, candidatures
│   ├── rest-api.php   ← actualités & archives newsletter
│   └── post-types.php
├── index.html         ← à convertir en front-page.php
├── contact.html       ← à convertir en page-contact.php
├── css/
├── js/
├── assets/
└── sw.js
```

## 2. Formulaires (déjà prêts côté JS)

Le fichier `js/main.js` envoie les formulaires vers WordPress via `admin-ajax.php` lorsque `circumWp` est injecté par le thème.

| Formulaire | Attribut HTML | Action WordPress |
|---|---|---|
| Newsletter (bandeau + page) | `data-form="newsletter"` | `circum_newsletter` |
| Contact B2B | `data-form="contact"` | `circum_contact` |
| Candidatures | `data-form="careers"` | `circum_careers` |

Chaque soumission :
- est enregistrée dans **Soumissions formulaires** (CPT privé `circum_entry`)
- envoie un email à l’admin WordPress (`Réglages → Général`)

Pour changer le destinataire :
```php
add_filter('circum_form_recipient', function ($email, $form_type) {
    if ($form_type === 'careers') return 'rh@circumlifesciences.com';
    return $email;
}, 10, 2);
```

## 3. Convertir les pages HTML en templates PHP

Pour chaque page :

1. Renommer `index.html` → `front-page.php`
2. Remplacer le `<head>` par `<?php get_header(); ?>`
3. Remplacer la fin `</body></html>` par `<?php get_footer(); ?>`
4. Supprimer les balises `<script src="js/...">` — `inc/enqueue.php` les charge automatiquement selon la page
5. Conserver `data-page="..."` sur `<body>` (ou laisser `circum_body_page_slug()` le gérer)

Exemple minimal `front-page.php` :

```php
<?php get_header(); ?>
<!-- contenu de index.html (sans head/scripts) -->
<?php get_footer(); ?>
```

Créez une page WordPress par slug (`apropos`, `contact`, `carrieres`, etc.) et assignez le template correspondant.

## 4. Actualités & newsletter (optionnel)

Le JS charge dynamiquement depuis l’API REST WordPress si des contenus existent :

- `GET /wp-json/circum/v1/news` — type `circum_news`
- `GET /wp-json/circum/v1/newsletter/issues` — type `circum_newsletter`

Sans contenu WordPress, le site garde les **données de secours** déjà intégrées dans `js/main.js`.

Métadonnées utiles pour une actualité :
- `_circum_tag` (ex. « Salon »)
- `_circum_summary`
- `_circum_variant` (1–6, variante visuelle)

Pour une édition newsletter :
- `_circum_quarter` (Q1, Q2…)
- `_circum_year`
- `_circum_summary`
- `_circum_link` (URL PDF externe)

## 5. Prérequis serveur

- PHP 8.0+
- WordPress 6.0+
- Envoi d’emails configuré (`wp_mail` — SMTP recommandé en production)
- Limite upload PHP ≥ 20 Mo (pièces jointes contact)

## 6. Test en local

1. Installez WordPress (Local WP, MAMP, etc.)
2. Copiez le thème comme décrit ci-dessus
3. Activez le thème
4. Ouvrez une page avec formulaire — l’envoi doit afficher le message de succès
5. Vérifiez **Soumissions formulaires** dans l’admin

Hors WordPress (fichiers HTML ouverts directement), les formulaires affichent : *« Les formulaires seront actifs une fois le site publié sur WordPress. »*
