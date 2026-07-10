# Dossier thème WordPress

Le site au **format WordPress** est ici :

```
wordpress-theme/circum/
```

C'est un thème WP complet (PHP, CSS, JS, assets). Tu peux le zipper tel quel pour l'installer sur un WordPress plus tard.

## Prévisualiser dans Cursor

Le thème PHP **ne s'affiche pas** dans un navigateur sans WordPress.

Pour voir le site dans Cursor, ouvre les fichiers HTML à la **racine du projet** :

- `index.html` → accueil
- `apropos.html`, `contact.html`, etc.

## Reconstruire le thème après modification du site statique

```powershell
powershell -ExecutionPolicy Bypass -File wordpress-theme\build-theme.ps1
```

Le script recopie `css/`, `js/`, `assets/` et régénère les templates PHP depuis les HTML.

## Zipper pour WordPress (quand tu en auras besoin)

```powershell
Compress-Archive -Path wordpress-theme\circum -DestinationPath wordpress-theme\circum.zip -Force
```
