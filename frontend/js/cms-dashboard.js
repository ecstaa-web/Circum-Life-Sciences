/**
 * Circum CMS, Page d'accueil / tableau de bord central
 */
(function (global) {
  'use strict';

  var state = { api: null, navigate: null, escapeHTML: null };

  var MODULES = [
    { view: 'cms-pages', icon: 'pages', title: 'Pages', desc: 'Ajouter, supprimer et modifier les textes des pages.', color: '' },
    { view: 'content', icon: 'edit', title: 'Éditeur visuel', desc: 'Modifier les textes directement sur le site.', color: 'pink' },
    { view: 'cms-media', icon: 'media', title: 'Médias', desc: 'Bibliothèque d\'images réutilisables partout.', color: '' },
    { view: 'news', icon: 'news', title: 'Actualités', desc: 'Articles blog et numéros newsletter.', color: 'pink' },
    { view: 'leads', icon: 'leads', title: 'Formulaires', desc: 'Contact, candidatures et abonnés.', color: '' },
    { view: 'users', icon: 'users', title: 'Utilisateurs', desc: 'Accès admin et rôles éditeur.', color: 'pink' },
    { view: 'settings', icon: 'settings', title: 'Paramètres', desc: 'Configuration et liens utiles.', color: '' }
  ];

  var ICONS = {
    pages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    news: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2z"/></svg>',
    leads: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>'
  };

  function esc(s) { return state.escapeHTML(s); }

  function go(view, opts) {
    if (state.navigate) state.navigate(view, opts || {});
  }

  function renderHome(container, user) {
    var name = (user && (user.name || user.email)) || 'Admin';
    var firstName = name.split(/[\s@]/)[0];

    container.innerHTML =
      '<div class="cms-home">' +
        '<section class="cms-home-hero studio-reveal">' +
          '<div class="cms-home-hero-inner">' +
            '<div class="cms-home-eyebrow">Circum STUDIO</div>' +
            '<h1>Bonjour, ' + esc(firstName) + '</h1>' +
            '<p>Gérez les pages, textes, images et formulaires de votre site.</p>' +
          '</div>' +
        '</section>' +

        '<div class="cms-home-stats studio-reveal studio-reveal-delay-1" id="cms-home-stats">' +
          statCard('home-stat-pages', '…', 'Pages', 'cms-pages') +
          statCard('home-stat-media', '…', 'Médias', 'cms-media') +
          statCard('home-stat-leads', '…', 'Demandes', 'leads', true) +
          statCard('home-stat-news', '…', 'Articles', 'news') +
        '</div>' +

        '<h2 class="cms-home-section-title studio-reveal studio-reveal-delay-2">Actions rapides</h2>' +
        '<div class="cms-home-actions studio-reveal studio-reveal-delay-2">' +
          actionBtn('➕', 'Ajouter une page', 'Créer une nouvelle page', 'cms-pages', { action: 'new-page' }) +
          actionBtn('✏️', 'Modifier les textes', 'Modifier sur la page', 'content') +
          actionBtn('🖼', 'Importer média', 'Ajouter une image', 'cms-media') +
          actionBtn('📰', 'Nouvel article', 'Publier une actualité', 'news', { action: 'new-article' }) +
        '</div>' +

        '<h2 class="cms-home-section-title studio-reveal studio-reveal-delay-3">Tous les modules</h2>' +
        '<div class="cms-home-modules studio-reveal studio-reveal-delay-3">' +
          MODULES.map(function (m) {
            return (
              '<button type="button" class="cms-home-module" data-view="' + m.view + '">' +
                '<div class="cms-home-module-icon' + (m.color === 'pink' ? ' pink' : '') + '">' + (ICONS[m.icon] || '') + '</div>' +
                '<div><h3>' + esc(m.title) + '</h3><p>' + esc(m.desc) + '</p></div>' +
              '</button>'
            );
          }).join('') +
        '</div>' +
      '</div>';

    container.querySelectorAll('[data-view]').forEach(function (el) {
      el.addEventListener('click', function () {
        var view = el.getAttribute('data-view');
        var action = el.getAttribute('data-action');
        go(view, action ? { action: action } : {});
      });
    });

    loadStats();
    if (global.CircumDecor) global.CircumDecor.refresh();
  }

  function statCard(id, val, label, view, accent) {
    return (
      '<button type="button" class="cms-home-stat' + (accent ? ' accent' : '') + '" data-view="' + view + '" id="' + id + '">' +
        '<div class="cms-home-stat-value">' + esc(val) + '</div>' +
        '<div class="cms-home-stat-label">' + esc(label) + '</div>' +
      '</button>'
    );
  }

  function actionBtn(emoji, title, desc, view, opts) {
    opts = opts || {};
    return (
      '<button type="button" class="cms-home-action" data-view="' + view + '"' +
        (opts.action ? ' data-action="' + opts.action + '"' : '') + '>' +
        '<span class="cms-home-action-icon">' + emoji + '</span>' +
        '<strong>' + esc(title) + '</strong>' +
        '<span>' + esc(desc) + '</span>' +
      '</button>'
    );
  }

  function setStat(id, val) {
    var el = document.getElementById(id);
    if (!el) return;
    var v = el.querySelector('.cms-home-stat-value');
    if (v) v.textContent = val;
  }

  function loadStats() {
    if (!state.api) return;
    Promise.all([
      state.api('/admin/cms/pages').then(function (r) { return r.ok ? r.json() : { items: [] }; }),
      state.api('/admin/cms/media').then(function (r) { return r.ok ? r.json() : { items: [] }; }),
      state.api('/admin/contact').then(function (r) { return r.ok ? r.json() : { count: 0 }; }),
      state.api('/admin/applications').then(function (r) { return r.ok ? r.json() : { count: 0 }; }),
      state.api('/admin/leads').then(function (r) { return r.ok ? r.json() : { count: 0 }; }),
      state.api('/admin/news').then(function (r) { return r.ok ? r.json() : { items: [] }; })
    ]).then(function (res) {
      setStat('home-stat-pages', (res[0].items || []).length);
      setStat('home-stat-media', (res[1].items || []).length);
      var leadsTotal = (res[2].count || 0) + (res[3].count || 0) + (res[4].count || 0);
      setStat('home-stat-leads', leadsTotal);
      setStat('home-stat-news', (res[5].items || []).length);
    }).catch(function () {});
  }

  function renderSettings(container) {
    container.innerHTML =
      '<div class="cms-view-header">' +
        '<h1>Paramètres</h1>' +
        '<p>Configuration de Circum STUDIO et accès rapides.</p>' +
      '</div>' +
      '<div class="cms-settings-grid">' +
        settingsCard('Site public', 'Ouvrir le site tel que vos visiteurs le voient.', '<a class="cms-btn cms-btn-primary" href="/" target="_blank" rel="noopener">Voir le site →</a>') +
        settingsCard('Langues', 'Le site est disponible en FR, EN, DE et IT. Modifiez les textes par langue dans l\'éditeur visuel.', '') +
        settingsCard('API contenu', 'Endpoint public pour les surcharges de texte et pages CMS.', '<code style="font-size:12px;color:#205a99">/api/content/overrides</code>') +
        settingsCard('Sécurité', 'Accès réservé aux emails autorisés. Déconnectez-vous sur les postes partagés.', '<button type="button" class="cms-btn" id="cms-settings-logout">Se déconnecter</button>') +
      '</div>';

    var logoutBtn = document.getElementById('cms-settings-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        var btn = document.getElementById('logout-btn');
        if (btn) btn.click();
      });
    }
  }

  function settingsCard(title, desc, html) {
    return (
      '<div class="cms-settings-card">' +
        '<h3>' + esc(title) + '</h3>' +
        '<p>' + esc(desc) + '</p>' +
        (html || '') +
      '</div>'
    );
  }

  function init(deps) {
    state.api = deps.api;
    state.navigate = deps.navigate;
    state.escapeHTML = deps.escapeHTML;
  }

  function refreshHome(user) {
    var el = document.getElementById('view-home');
    if (el) renderHome(el, user);
  }

  global.CircumDashboard = {
    init: init,
    renderHome: renderHome,
    renderSettings: renderSettings,
    refreshHome: refreshHome,
    loadStats: loadStats
  };
})(window);
