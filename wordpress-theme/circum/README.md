# Circum Life Sciences — Thème WordPress

## Installation (2 minutes)

1. **Téléversez** le fichier `circum.zip` dans WordPress :  
   `Apparence → Thèmes → Ajouter → Téléverser un thème`

2. **Activez** le thème « Circum Life Sciences »  
   → Les pages du site sont créées automatiquement (accueil, à propos, contact, etc.)

3. **Réglez les permaliens** : `Réglages → Permaliens → Nom de l'article` (recommandé)

4. **Configurez l'email** : `Réglages → Général` (réception des formulaires)

## Fonctionnalités incluses

- 13 pages converties en templates PHP
- Formulaires : newsletter, contact B2B, candidatures (CV)
- Traductions FR / EN / DE / IT
- Actualités dynamiques (optionnel via l'admin)
- Archives newsletter (optionnel via l'admin)

## Admin WordPress

| Menu | Usage |
|---|---|
| Soumissions formulaires | Toutes les demandes reçues |
| Actualités | Remplace les news statiques si publiées |
| Éditions newsletter | Archives affichées sur la page Newsletter |

## Regénérer le thème après modification du site statique

Depuis la racine du dépôt :

```powershell
powershell -ExecutionPolicy Bypass -File wordpress-theme\build-theme.ps1
Compress-Archive -Path wordpress-theme\circum -DestinationPath wordpress-theme\circum.zip -Force
```

## Support formulaires

Les emails partent vers l'adresse admin WordPress. Pour les rediriger :

```php
// functions.php du thème enfant
add_filter('circum_form_recipient', function ($email, $type) {
    if ($type === 'careers') return 'rh@circumlifesciences.com';
    return $email;
}, 10, 2);
```
