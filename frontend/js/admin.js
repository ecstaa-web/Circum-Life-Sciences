(function () {
  var API = (window.CIRCUM_API_BASE != null ? window.CIRCUM_API_BASE : '') + '/api';
  var csrfToken = null;
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  var REDIRECT_URL = window.location.origin + '/admin.html';

  var mainZone = document.getElementById('main-zone');
  var userZone = document.getElementById('user-zone');
  var toastEl = document.getElementById('toast');

  function toast(msg, isErr) {
    toastEl.textContent = msg;
    toastEl.className = 'toast show' + (isErr ? ' err' : '');
    setTimeout(function () { toastEl.classList.remove('show'); }, 3000);
  }

  function escapeHTML(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function apiErrorMessage(j, fallback) {
    if (!j) return fallback || 'Erreur';
    if (typeof j === 'string') return j;
    if (j.detail == null) return fallback || 'Erreur';
    if (typeof j.detail === 'string') return j.detail;
    if (Array.isArray(j.detail)) {
      return j.detail.map(function (e) {
        return (e && e.msg) ? e.msg : String(e);
      }).join(', ');
    }
    return fallback || 'Erreur';
  }

  function parseApiResponse(r) {
    return r.text().then(function (text) {
      var j = null;
      if (text) {
        try { j = JSON.parse(text); } catch (e) { j = { detail: text.slice(0, 200) }; }
      }
      if (!r.ok) throw new Error(apiErrorMessage(j, 'Erreur ' + r.status));
      return j || {};
    });
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try {
      var d = new Date(iso);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return iso; }
  }

  function isFileProtocol() {
    return window.location.protocol === 'file:';
  }

  function devSetupHint() {
    if (isFileProtocol()) {
      return 'Ouvrez cette page via un serveur web : <strong>http://localhost:3000/admin</strong> (pas en double-cliquant le fichier HTML). Lancez le serveur avec <code>scripts\\start-local.ps1</code> ou <code>cd frontend &amp;&amp; npm start</code>.';
    }
    return 'Le backend API ne répond pas. Vérifiez que FastAPI tourne sur le port 8000 et que MongoDB est démarré (<code>scripts\\start-local.ps1</code>).';
  }

  function api(path, opts) {
    opts = opts || {};
    opts.credentials = 'include';
    opts.headers = opts.headers || {};
    var method = (opts.method || 'GET').toUpperCase();
    if (csrfToken && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      opts.headers['X-Circum-CSRF'] = csrfToken;
    }
    return fetch(API + path, opts);
  }

  function setDashboardShell(on) {
    var shell = document.getElementById('admin-shell');
    var brand = document.getElementById('admin-brand');
    if (shell) shell.classList.toggle('is-dashboard', !!on);
    if (brand) brand.style.display = on ? 'none' : '';
  }

  function renderLogin(deniedEmail, loginError) {
    setDashboardShell(false);
    userZone.innerHTML = '';
    var setupHint = (isFileProtocol() && !loginError)
      ? '<div class="access-denied" style="background:#fff8e6;border-color:#f0d78c;color:#7d6608;margin-bottom:16px;text-align:left;font-size:13px;line-height:1.5" data-testid="dev-hint">' + devSetupHint() + '</div>'
      : '';
    mainZone.innerHTML =
      '<div class="login-card" data-testid="login-card">' +
        setupHint +
        '<h1>Espace réservé.</h1>' +
        '<p>Connectez-vous pour gérer les abonnés, candidatures, demandes contact et le contenu du site.</p>' +
        '<button class="gbtn" id="login-btn" data-testid="login-btn">' +
          '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/></svg>' +
          '<span>Se connecter avec Google</span>' +
        '</button>' +
        '<div class="login-divider"><span>ou</span></div>' +
        '<form class="login-form" id="login-form" data-testid="login-form">' +
          '<input type="email" name="email" required placeholder="email@exemple.com" data-testid="login-email"/>' +
          '<div class="pw-wrap">' +
            '<input type="password" name="password" required placeholder="Mot de passe" data-testid="login-password"/>' +
            '<button type="button" class="pw-eye" data-target="password" aria-label="Afficher" data-testid="login-eye">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>' +
            '</button>' +
          '</div>' +
          '<button type="submit" class="btn-login" data-testid="login-submit">Se connecter</button>' +
          '<button type="button" class="link-forgot" id="forgot-btn" data-testid="forgot-btn">Mot de passe oublié ?</button>' +
          (loginError ? '<div class="login-error" data-testid="login-error">' + escapeHTML(loginError) + '</div>' : '') +
        '</form>' +
        (deniedEmail ? '<div class="access-denied" data-testid="access-denied">Accès refusé pour <strong>' + escapeHTML(deniedEmail) + '</strong>. Cet email n\'est pas dans la liste blanche admin.</div>' : '') +
      '</div>';
    document.getElementById('login-btn').addEventListener('click', function () {
      // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
      window.location.href = 'https://auth.emergentagent.com/?redirect=' + encodeURIComponent(REDIRECT_URL);
    });
    document.getElementById('login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      var btn = f.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Connexion…';
      api('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: f.email.value, password: f.password.value })
      }).then(function (r) {
        if (r.ok) {
          return r.json().then(function (j) {
            csrfToken = j.csrf_token || csrfToken;
            checkAuth();
          });
        }
        return r.json().then(function (j) {
          var msg = (j && j.detail) ? j.detail : ('Erreur ' + r.status);
          renderLogin('', msg);
        });
      }).catch(function () { renderLogin('', 'Impossible de joindre l\'API. ' + devSetupHint()); });
    });
    // Eye toggle on login form
    var loginEye = document.querySelector('[data-testid="login-eye"]');
    if (loginEye) {
      loginEye.addEventListener('click', function () {
        var inp = document.querySelector('[data-testid="login-password"]');
        if (!inp) return;
        var showing = inp.type === 'text';
        inp.type = showing ? 'password' : 'text';
        loginEye.classList.toggle('on', !showing);
      });
    }
    // Forgot password
    var forgotBtn = document.getElementById('forgot-btn');
    if (forgotBtn) forgotBtn.addEventListener('click', openForgotModal);
  }

  function openForgotModal() {
    var modal = document.createElement('div');
    modal.className = 'modal-bg';
    modal.setAttribute('data-testid', 'forgot-modal');
    modal.innerHTML =
      '<div class="modal" style="max-width:460px">' +
        '<h3>Mot de passe oublié</h3>' +
        '<p style="font-size:13px;color:var(--text-soft);margin-bottom:10px">Entrez votre email admin. Si l\'adresse est reconnue, vous recevrez un lien de réinitialisation valable 1 heure.</p>' +
        '<form id="forgot-form" data-testid="forgot-form">' +
          '<label>Email<input type="email" name="email" required data-testid="forgot-email"/></label>' +
          '<div class="modal-actions">' +
            '<button type="button" class="btn-mini ghost" id="forgot-cancel" data-testid="forgot-cancel">Annuler</button>' +
            '<button type="submit" class="btn-mini pink" data-testid="forgot-submit">Envoyer le lien</button>' +
          '</div>' +
        '</form>' +
      '</div>';
    document.body.appendChild(modal);
    modal.querySelector('#forgot-cancel').addEventListener('click', function () { modal.remove(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
    modal.querySelector('#forgot-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      var btn = f.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Envoi…';
      api('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: f.email.value })
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          modal.remove();
          // Always show same message regardless to avoid email enumeration
          toast('Si l\'adresse est reconnue, un email vous a été envoyé.');
        }).catch(function () { toast('Erreur réseau', true); });
    });
  }

  // ============ Éditeur visuel (prévisualisation du site) ============
  var contentState = { page: 'home', lang: 'fr', items: [], pending: {}, pages: [], baseline: {}, editorReady: false };

  var CONTENT_PAGE_URLS = {
    home: '/index.html',
    apropos: '/apropos.html',
    design: '/design.html',
    fabrication: '/fabrication.html',
    clients: '/clients.html',
    news: '/news.html',
    newsletter: '/newsletter.html',
    carrieres: '/carrieres.html',
    contact: '/contact.html',
    fondateurs: '/apropos.html#founders',
    common: '/index.html'
  };

  function contentPageUrl(pageId) {
    return CONTENT_PAGE_URLS[pageId] || '/index.html';
  }

  function hrefToContentPage(href) {
    var path = (href || '').split('#')[0].split('?')[0].replace(/^\//, '');
    if (!path || path === 'index.html') return 'home';
    var name = path.replace(/\.html$/, '');
    var map = {
      apropos: 'apropos', design: 'design', fabrication: 'fabrication',
      clients: 'clients', news: 'news', newsletter: 'newsletter',
      carrieres: 'carrieres', contact: 'contact'
    };
    return map[name] || 'home';
  }

  function renderDashboard(user) {
    setDashboardShell(true);
    userZone.innerHTML =
      '<div class="admin-user" data-testid="admin-user">' +
        (user.picture ? '<img src="' + escapeHTML(user.picture) + '" alt=""/>' : '') +
        '<div class="who"><strong>' + escapeHTML(user.name || user.email) + '</strong><small>' + escapeHTML(user.email) + '</small></div>' +
        '<button class="logout" id="logout-btn" data-testid="logout-btn">Déconnexion</button>' +
      '</div>';
    document.getElementById('logout-btn').addEventListener('click', logout);

    mainZone.innerHTML =
      '<aside class="admin-sidebar" data-testid="admin-sidebar">' +
        '<div class="admin-sidebar-brand">' +
          '<img alt="Circum" src="/assets/img/circum-logo.png"/>' +
          '<span>Administration</span>' +
        '</div>' +
        '<nav class="admin-sidebar-nav" data-testid="admin-tabs">' +
          '<button type="button" class="admin-nav-item active" data-view="dashboard" data-testid="tab-dashboard">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' +
            'Tableau de bord' +
          '</button>' +
          '<button type="button" class="admin-nav-item" data-view="news" data-testid="tab-news">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6z"/></svg>' +
            'Actualités' +
          '</button>' +
          '<button type="button" class="admin-nav-item" data-view="content" data-testid="tab-content">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>' +
            'Éditeur visuel' +
          '</button>' +
        '</nav>' +
      '</aside>' +
      '<div class="admin-main">' +

      '<div class="admin-view active" id="view-dashboard" data-testid="view-dashboard">' +
      '<div class="stat-row" data-testid="stats-row">' +
        '<button type="button" class="stat stat-click" data-leads-tab="newsletter" data-testid="stat-leads">' +
          '<div class="stat-value" id="dash-stat-leads">—</div><div class="stat-label">Newsletter</div></button>' +
        '<button type="button" class="stat stat-click" data-leads-tab="contact" data-testid="stat-contact">' +
          '<div class="stat-value" id="dash-stat-contact">—</div><div class="stat-label">Contact</div></button>' +
        '<button type="button" class="stat stat-click" data-leads-tab="careers" data-testid="stat-apps">' +
          '<div class="stat-value" id="dash-stat-apps">—</div><div class="stat-label">Carrières</div></button>' +
        '<div class="stat"><div class="stat-value" id="dash-stat-admins" data-testid="stat-admins">—</div><div class="stat-label">Admins</div></div>' +
      '</div>' +

      '<div class="panel leads-hub" data-testid="leads-hub">' +
        '<div class="panel-head">' +
          '<div><h2>Leads & formulaires</h2><p class="panel-sub">Demandes contact, candidatures et abonnés newsletter en temps réel.</p></div>' +
          '<div class="leads-tabs" role="tablist">' +
            '<button type="button" class="leads-tab active" data-leads-tab="contact" data-testid="leads-tab-contact">Contact</button>' +
            '<button type="button" class="leads-tab" data-leads-tab="careers" data-testid="leads-tab-careers">Carrières</button>' +
            '<button type="button" class="leads-tab" data-leads-tab="newsletter" data-testid="leads-tab-newsletter">Newsletter</button>' +
          '</div>' +
        '</div>' +
        '<div class="leads-toolbar">' +
          '<div class="leads-search-wrap">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>' +
            '<input type="search" id="leads-search" placeholder="Rechercher par nom, email, société…" autocomplete="off"/>' +
          '</div>' +
          '<div class="actions" id="leads-export-actions">' +
            '<button class="btn-mini" id="leads-dl-csv" type="button">Export CSV</button>' +
            '<button class="btn-mini pink" id="leads-dl-json" type="button">Export JSON</button>' +
          '</div>' +
        '</div>' +
        '<div id="leads-cards" class="leads-cards"><div class="empty">Chargement…</div></div>' +
      '</div>' +

      '<div class="panel" data-testid="panel-admins">' +
        '<div class="panel-head">' +
          '<h2>Gestion des admins</h2>' +
        '</div>' +
        '<div id="allowlist-list"></div>' +
        '<form class="allow-add" id="allow-add-form" data-testid="allow-add-form">' +
          '<input type="email" id="allow-add-email" data-testid="allow-add-email" placeholder="nouveau.admin@circumlifesciences.com" required/>' +
          '<button class="btn-mini" type="submit" data-testid="allow-add-btn">Ajouter admin</button>' +
        '</form>' +
      '</div>' +
      '</div>' +

      '<div class="admin-view" id="view-news" data-testid="view-news">' +
        '<div class="news-studio">' +
          '<div class="news-studio-header">' +
            '<div><h2 class="news-studio-title">Actualités & newsletter</h2><p class="news-studio-sub">Articles du site et numéros trimestriels de la newsletter.</p></div>' +
          '</div>' +
          '<div class="news-studio-tabs" role="tablist">' +
            '<button type="button" class="news-studio-tab active" data-news-tab="articles" data-testid="news-tab-articles">Articles</button>' +
            '<button type="button" class="news-studio-tab" data-news-tab="issues" data-testid="news-tab-issues">Numéros newsletter</button>' +
          '</div>' +
          '<div id="news-panel-articles" class="news-tab-panel active" data-testid="news-panel-articles">' +
            '<div class="news-studio-toolbar">' +
              '<button type="button" class="btn-mini pink" id="news-new-btn" data-testid="news-new-btn">+ Nouvelle actualité</button>' +
            '</div>' +
            '<div id="news-admin-list" class="adm-news-grid"><div class="empty">Chargement…</div></div>' +
          '</div>' +
          '<div id="news-panel-issues" class="news-tab-panel" hidden data-testid="news-panel-issues">' +
            '<div class="news-studio-toolbar">' +
              '<button type="button" class="btn-mini pink" id="issue-new-btn" data-testid="issue-new-btn">+ Nouveau numéro</button>' +
            '</div>' +
            '<div id="issues-admin-list" class="adm-news-grid"><div class="empty">Chargement…</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="news-editor-drawer" id="issue-editor-panel" hidden data-testid="panel-issue-editor">' +
          '<div class="news-editor-drawer-inner">' +
            '<div class="news-editor-drawer-head">' +
              '<h2 id="issue-editor-heading">Nouveau numéro</h2>' +
              '<button type="button" class="news-drawer-close" id="issue-cancel-btn" aria-label="Fermer">&times;</button>' +
            '</div>' +
            '<form id="issue-editor-form" class="news-editor-form" data-testid="issue-editor-form">' +
              '<input type="hidden" id="issue-edit-id" value=""/>' +
              '<div class="news-editor-grid">' +
                '<div class="news-editor-main">' +
                  '<label class="news-field">Trimestre<select id="issue-form-quarter" required data-testid="issue-form-quarter">' +
                    '<option value="Q1">Q1</option><option value="Q2">Q2</option><option value="Q3">Q3</option><option value="Q4">Q4</option>' +
                  '</select></label>' +
                  '<label class="news-field">Année<input type="number" id="issue-form-year" required min="2000" max="2100" data-testid="issue-form-year"/></label>' +
                  '<label class="news-field">Date de publication<input type="date" id="issue-form-date" required data-testid="issue-form-date"/></label>' +
                  '<label class="news-field">Titre<input type="text" id="issue-form-title" required maxlength="240" data-testid="issue-form-title" placeholder="Titre du numéro"/></label>' +
                  '<label class="news-field">Résumé<textarea id="issue-form-summary" required maxlength="1500" rows="4" data-testid="issue-form-summary" placeholder="Texte visible sur la page Newsletter"></textarea></label>' +
                  '<label class="news-field">Lien (PDF ou page externe, optionnel)<input type="url" id="issue-form-link" maxlength="500" data-testid="issue-form-link" placeholder="https://…"/></label>' +
                '</div>' +
              '</div>' +
              '<div class="news-form-actions">' +
                '<button type="button" class="btn-mini err" id="issue-delete-btn" hidden data-testid="issue-delete-btn">Supprimer</button>' +
                '<button type="submit" class="btn-mini pink" id="issue-save-btn" data-testid="issue-save-btn">Publier</button>' +
              '</div>' +
            '</form>' +
          '</div>' +
        '</div>' +
        '<div class="news-editor-drawer" id="news-editor-panel" hidden data-testid="panel-news-editor">' +
          '<div class="news-editor-drawer-inner">' +
            '<div class="news-editor-drawer-head">' +
              '<h2 id="news-editor-heading">Nouvelle actualité</h2>' +
              '<button type="button" class="news-drawer-close" id="news-cancel-btn" aria-label="Fermer">&times;</button>' +
            '</div>' +
            '<form id="news-editor-form" class="news-editor-form" data-testid="news-editor-form">' +
              '<input type="hidden" id="news-edit-id" value=""/>' +
              '<div class="news-editor-grid">' +
                '<div class="news-editor-main">' +
                  '<label class="news-field">Titre<input type="text" id="news-form-title" required maxlength="240" data-testid="news-form-title" placeholder="Titre de l\'article"/></label>' +
                  '<label class="news-field">Accroche<textarea id="news-form-summary" required maxlength="800" rows="3" data-testid="news-form-summary" placeholder="Texte visible sur la carte News"></textarea></label>' +
                  '<div class="news-field">' +
                    '<span>Contenu de l\'article</span>' +
                    '<div class="news-rich-toolbar" id="news-rich-toolbar">' +
                      '<button type="button" data-cmd="bold"><b>B</b></button>' +
                      '<button type="button" data-cmd="italic"><em>I</em></button>' +
                      '<button type="button" data-cmd="underline"><u>U</u></button>' +
                      '<button type="button" data-cmd="insertUnorderedList">• Liste</button>' +
                      '<button type="button" data-cmd="formatBlock" data-val="h2">H2</button>' +
                      '<button type="button" data-cmd="formatBlock" data-val="h3">H3</button>' +
                      '<button type="button" data-cmd="createLink">Lien</button>' +
                    '</div>' +
                    '<div id="news-form-body-editable" class="news-rich-editor" contenteditable="true" data-placeholder="Rédigez votre article…"></div>' +
                    '<textarea id="news-form-body" hidden data-testid="news-form-body"></textarea>' +
                  '</div>' +
                '</div>' +
                '<aside class="news-editor-side">' +
                  '<label class="news-field">Catégorie<input type="text" id="news-form-tag" required maxlength="80" placeholder="Salon, Certification…" data-testid="news-form-tag"/></label>' +
                  '<label class="news-field">Date<input type="date" id="news-form-date" required data-testid="news-form-date"/></label>' +
                  '<label class="news-field">Couverture <span class="news-field-note" id="news-cover-note">(obligatoire)</span>' +
                    '<input type="file" id="news-form-cover" accept="image/jpeg,image/png,image/webp" data-testid="news-form-cover"/>' +
                    '<div id="news-cover-preview" class="news-cover-preview"></div>' +
                  '</label>' +
                  '<label class="news-field">Galerie (images supplémentaires)' +
                    '<input type="file" id="news-form-gallery" accept="image/jpeg,image/png,image/webp" multiple data-testid="news-form-gallery"/>' +
                  '</label>' +
                  '<div id="news-existing-gallery" class="news-gallery-grid"></div>' +
                  '<div id="news-new-gallery-preview" class="news-gallery-grid"></div>' +
                '</aside>' +
              '</div>' +
              '<div class="news-form-actions">' +
                '<button type="button" class="btn-mini err" id="news-delete-btn" hidden data-testid="news-delete-btn">Supprimer</button>' +
                '<button type="submit" class="btn-mini pink" id="news-save-btn" data-testid="news-save-btn">Publier</button>' +
              '</div>' +
            '</form>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="admin-view" id="view-content" data-testid="view-content">' +
        '<div class="visual-editor-shell" data-testid="panel-content">' +
          '<div class="visual-editor-toolbar">' +
            '<label>Page<select id="content-page-select" data-testid="content-page-select"></select></label>' +
            '<label>Langue<select id="content-lang-select" data-testid="content-lang-select">' +
              '<option value="fr">Français</option><option value="en">English</option><option value="de">Deutsch</option><option value="it">Italiano</option>' +
            '</select></label>' +
            '<span class="visual-editor-hint">Cliquez sur un texte dans l\'aperçu pour le modifier — puis <strong>Valider</strong> pour publier en direct</span>' +
            '<div class="visual-editor-actions">' +
              '<button type="button" class="btn-mini ghost" id="content-open-site-btn" data-testid="content-open-site-btn">Voir le site</button>' +
              '<button type="button" class="btn-mini ghost" id="content-reload-btn" data-testid="content-reload-btn">Recharger</button>' +
            '</div>' +
          '</div>' +
          '<div class="visual-editor-fmt is-idle" id="content-fmt-toolbar" role="toolbar" data-testid="content-fmt-toolbar">' +
            '<div class="fmt-grp">' +
              '<button type="button" class="fmt-btn" data-cmd="bold" title="Gras"><b>B</b></button>' +
              '<button type="button" class="fmt-btn" data-cmd="italic" title="Italique"><em>I</em></button>' +
              '<button type="button" class="fmt-btn" data-cmd="underline" title="Souligné"><u>U</u></button>' +
              '<button type="button" class="fmt-btn" data-cmd="strikeThrough" title="Barré"><s>S</s></button>' +
            '</div>' +
            '<div class="fmt-grp">' +
              '<span class="fmt-label">Police</span>' +
              '<select class="fmt-select" data-fmt="font" title="Police">' +
                '<option value="\'Gill Sans\', Calibri, sans-serif">Gill Sans (site)</option>' +
                '<option value="Inter, sans-serif">Inter (navigation)</option>' +
                '<option value="Georgia, serif">Georgia (serif)</option>' +
                '<option value="Arial, Helvetica, sans-serif">Arial</option>' +
                '<option value="\'Times New Roman\', Times, serif">Times New Roman</option>' +
              '</select>' +
              '<select class="fmt-select" data-fmt="size" title="Taille">' +
                '<option value="12px">12px</option><option value="14px">14px</option><option value="16px" selected>16px</option>' +
                '<option value="18px">18px</option><option value="20px">20px</option><option value="24px">24px</option>' +
                '<option value="28px">28px</option><option value="32px">32px</option><option value="36px">36px</option>' +
                '<option value="42px">42px</option><option value="48px">48px</option>' +
              '</select>' +
            '</div>' +
            '<div class="fmt-grp">' +
              '<span class="fmt-label">Couleur</span>' +
              '<input type="color" class="fmt-color" data-fmt="foreColor" value="#205a99" title="Couleur du texte"/>' +
              '<input type="color" class="fmt-color" data-fmt="backColor" value="#fff8e6" title="Surbrillance"/>' +
            '</div>' +
            '<div class="fmt-grp">' +
              '<button type="button" class="fmt-btn" data-cmd="removeFormat" title="Effacer la mise en forme">&#10005;</button>' +
            '</div>' +
          '</div>' +
          '<div class="visual-editor-frame-wrap">' +
            '<div class="visual-editor-scale" id="visual-editor-scale">' +
            '<iframe id="content-preview-frame" class="visual-editor-frame" title="Aperçu du site" data-testid="content-preview-frame"></iframe>' +
            '</div>' +
          '</div>' +
          '<div class="content-save-bar" id="content-save-bar" data-testid="content-save-bar">' +
            '<span class="count" id="content-pending-count">0 modification(s)</span>' +
            '<div style="display:flex;gap:8px">' +
              '<button type="button" class="btn-mini ghost" id="content-discard-btn" data-testid="content-discard-btn">Annuler</button>' +
              '<button type="button" class="btn-mini pink" id="content-save-btn" data-testid="content-save-btn">Valider</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '</div>';

    document.querySelectorAll('.admin-nav-item').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var view = tab.getAttribute('data-view');
        document.querySelectorAll('.admin-nav-item').forEach(function (t) { t.classList.toggle('active', t === tab); });
        document.querySelectorAll('.admin-view').forEach(function (v) {
          v.classList.toggle('active', v.id === 'view-' + view);
        });
        var shell = document.getElementById('admin-shell');
        if (shell) shell.classList.toggle('admin-wide', view === 'content');
        if (view === 'content') {
          if (!contentState.editorReady) initContentEditor();
          else setTimeout(fitVisualEditorFrame, 50);
        } else if (view === 'news') {
          loadNewsAdminList();
          loadNewsletterIssuesList();
        }
      });
    });

    initLeadsHub();
    initNewsAdmin();
    initNewsletterIssuesAdmin();
    document.getElementById('allow-add-form').addEventListener('submit', addAdmin);

    loadAllLeads();
    loadAllowlist();
  }

  // ============ Leads hub (contact, carrières, newsletter) ============
  var leadsState = { tab: 'contact', contact: [], careers: [], newsletter: [], search: '' };

  var LEADS_EXPORT = {
    contact: { csv: '/admin/contact.csv', json: '/admin/contact.json' },
    careers: { csv: '/admin/applications.csv', json: '/admin/applications.json' },
    newsletter: { csv: '/admin/leads.csv', json: '/admin/leads.json' }
  };

  function initLeadsHub() {
    document.querySelectorAll('.leads-tab, .stat-click[data-leads-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchLeadsTab(btn.getAttribute('data-leads-tab'));
      });
    });
    var search = document.getElementById('leads-search');
    if (search) {
      search.addEventListener('input', function () {
        leadsState.search = search.value.trim().toLowerCase();
        renderLeadsCards();
      });
    }
    var csvBtn = document.getElementById('leads-dl-csv');
    var jsonBtn = document.getElementById('leads-dl-json');
    if (csvBtn) csvBtn.addEventListener('click', function () {
      var p = LEADS_EXPORT[leadsState.tab];
      if (p) triggerDownload(p.csv);
    });
    if (jsonBtn) jsonBtn.addEventListener('click', function () {
      var p = LEADS_EXPORT[leadsState.tab];
      if (p) triggerDownload(p.json);
    });
  }

  function switchLeadsTab(tab) {
    if (!tab) return;
    leadsState.tab = tab;
    document.querySelectorAll('.leads-tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-leads-tab') === tab);
    });
    renderLeadsCards();
  }

  function loadAllLeads() {
    Promise.all([
      api('/admin/contact').then(function (r) { return r.ok ? r.json() : { items: [], count: 0 }; }),
      api('/admin/applications').then(function (r) { return r.ok ? r.json() : { items: [], count: 0 }; }),
      api('/admin/leads').then(function (r) { return r.ok ? r.json() : { items: [], count: 0 }; })
    ]).then(function (results) {
      leadsState.contact = results[0].items || [];
      leadsState.careers = results[1].items || [];
      leadsState.newsletter = results[2].items || [];
      setStatCount('dash-stat-contact', results[0].count);
      setStatCount('dash-stat-apps', results[1].count);
      setStatCount('dash-stat-leads', results[2].count);
      renderLeadsCards();
    }).catch(function () {
      renderLeadsCards();
    });
  }

  function filterLeadsItems(items, type) {
    var q = leadsState.search;
    if (!q) return items;
    return items.filter(function (item) {
      var hay = [
        item.firstname, item.lastname, item.email, item.company, item.role,
        item.phone, item.position, item.location, item.message, item.contact_type
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function renderLeadsCards() {
    var el = document.getElementById('leads-cards');
    if (!el) return;
    var tab = leadsState.tab;
    var items = filterLeadsItems(leadsState[tab] || [], tab);
    if (!items.length) {
      var emptyMsg = {
        contact: 'Aucune demande contact.',
        careers: 'Aucune candidature.',
        newsletter: 'Aucun abonné newsletter.'
      };
      el.innerHTML = '<div class="leads-empty"><div class="leads-empty-icon">📭</div><p>' + emptyMsg[tab] + '</p></div>';
      return;
    }
    el.innerHTML = items.map(function (item) {
      return buildLeadCard(item, tab);
    }).join('');
    el.querySelectorAll('[data-lead-detail]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openLeadDetail(btn.getAttribute('data-lead-detail'), btn.getAttribute('data-lead-type'));
      });
    });
    el.querySelectorAll('[data-lead-delete]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        deleteLeadItem(btn.getAttribute('data-lead-delete'), btn.getAttribute('data-lead-type'));
      });
    });
    el.querySelectorAll('[data-lead-dl]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-lead-dl');
        var kind = btn.getAttribute('data-lead-dl-kind');
        if (kind === 'cv') downloadCv(id);
        else if (kind === 'att') downloadContactAttachment(id);
      });
    });
  }

  function buildLeadCard(item, type) {
    var id = item.id || item._id;
    var name = escapeHTML((item.firstname || '') + ' ' + (item.lastname || '')).trim() || '—';
    var email = escapeHTML(item.email || '');
    var date = escapeHTML(fmtDate(item.created_at));
    var badge = type === 'newsletter' ? 'Newsletter' : type === 'careers' ? 'Carrières' : 'Contact';
    var badgeClass = 'lead-badge lead-badge--' + type;
    var meta = '';
    var actions = '';
    if (type === 'contact') {
      meta = escapeHTML(item.company || '—') + (item.contact_type ? ' · ' + escapeHTML(item.contact_type) : '');
      if (item.attachment_filename) {
        actions = '<button type="button" class="lead-card-action" data-lead-dl="' + escapeHTML(id) + '" data-lead-dl-kind="att">Pièce jointe</button>';
      }
    } else if (type === 'careers') {
      meta = escapeHTML(item.position || '—') + (item.location ? ' · ' + escapeHTML(item.location) : '');
      if (item.cv_filename) {
        actions = '<button type="button" class="lead-card-action" data-lead-dl="' + escapeHTML(id) + '" data-lead-dl-kind="cv">Télécharger CV</button>';
      }
    } else {
      meta = escapeHTML(item.company || '—') + (item.role ? ' · ' + escapeHTML(item.role) : '');
      actions = '<span class="pill">' + escapeHTML((item.lang || 'fr').toUpperCase()) + '</span>';
    }
    return '' +
      '<article class="lead-card" data-testid="lead-card">' +
        '<div class="lead-card-top">' +
          '<span class="' + badgeClass + '">' + badge + '</span>' +
          '<time class="lead-card-date">' + date + '</time>' +
        '</div>' +
        '<h3 class="lead-card-name">' + name + '</h3>' +
        '<p class="lead-card-email">' + email + '</p>' +
        '<p class="lead-card-meta">' + meta + '</p>' +
        '<div class="lead-card-actions">' +
          actions +
          '<button type="button" class="lead-card-action primary" data-lead-detail="' + escapeHTML(id) + '" data-lead-type="' + type + '">Voir détail</button>' +
          '<button type="button" class="lead-card-action danger" data-lead-delete="' + escapeHTML(id) + '" data-lead-type="' + type + '">Supprimer</button>' +
        '</div>' +
      '</article>';
  }

  function openLeadDetail(id, type) {
    var list = leadsState[type] || [];
    var item = list.find(function (x) { return (x.id || x._id) === id; });
    if (!item) return;
    var rows = [];
    Object.keys(item).forEach(function (k) {
      if (k === 'id' || k === '_id') return;
      var val = item[k];
      if (val == null || val === '') return;
      rows.push('<dt>' + escapeHTML(k) + '</dt><dd>' + escapeHTML(String(val)) + '</dd>');
    });
    var modal = document.createElement('div');
    modal.className = 'modal-bg lead-detail-modal';
    modal.innerHTML =
      '<div class="modal lead-detail">' +
        '<div class="lead-detail-head">' +
          '<h3>' + escapeHTML((item.firstname || '') + ' ' + (item.lastname || '')) + '</h3>' +
          '<button type="button" class="news-drawer-close" id="lead-detail-close">&times;</button>' +
        '</div>' +
        '<dl class="lead-detail-grid">' + rows.join('') + '</dl>' +
        '<div class="modal-actions">' +
          (type === 'careers' && item.cv_filename ? '<button type="button" class="btn-mini" id="lead-detail-cv">CV ↓</button>' : '') +
          (type === 'contact' && item.attachment_filename ? '<button type="button" class="btn-mini" id="lead-detail-att">Pièce jointe ↓</button>' : '') +
          '<button type="button" class="btn-mini err" id="lead-detail-del">Supprimer</button>' +
          '<button type="button" class="btn-mini pink" id="lead-detail-close2">Fermer</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    function close() { modal.remove(); }
    modal.querySelector('#lead-detail-close').addEventListener('click', close);
    modal.querySelector('#lead-detail-close2').addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    var cvBtn = modal.querySelector('#lead-detail-cv');
    if (cvBtn) cvBtn.addEventListener('click', function () { downloadCv(id); });
    var attBtn = modal.querySelector('#lead-detail-att');
    if (attBtn) attBtn.addEventListener('click', function () { downloadContactAttachment(id); });
    modal.querySelector('#lead-detail-del').addEventListener('click', function () {
      close();
      deleteLeadItem(id, type);
    });
  }

  function deleteLeadItem(id, type) {
    var labels = { contact: 'cette demande contact', careers: 'cette candidature', newsletter: 'cet abonné' };
    if (!confirm('Supprimer ' + (labels[type] || 'cet élément') + ' ?')) return;
    var paths = {
      contact: '/admin/contact/',
      careers: '/admin/applications/',
      newsletter: '/admin/leads/'
    };
    api(paths[type] + encodeURIComponent(id), { method: 'DELETE' }).then(function (r) {
      if (r.ok) { toast('Supprimé'); loadAllLeads(); }
      else r.json().then(function (j) { toast(apiErrorMessage(j, 'Erreur ' + r.status), true); });
    });
  }

  function loadContact() { loadAllLeads(); }
  function loadLeads() { loadAllLeads(); }
  function loadApps() { loadAllLeads(); }

  function triggerDownload(path) {
    // Use fetch to ensure credentials/cookie are sent, then create blob URL
    api(path).then(function (r) {
      if (r.status === 401 || r.status === 403) { toast('Session expirée', true); return null; }
      if (!r.ok) { toast('Erreur ' + r.status, true); return null; }
      return r.blob().then(function (blob) {
        var disp = r.headers.get('content-disposition') || '';
        var match = /filename="?([^"]+)"?/.exec(disp);
        var filename = match ? match[1] : path.split('/').pop();
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 0);
        toast('Téléchargement: ' + filename);
      });
    });
  }

  function setStatCount(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = (value == null || value === '') ? '0' : String(value);
  }

  function fitVisualEditorFrame() {
    var wrap = document.querySelector('.visual-editor-frame-wrap');
    var scaleEl = document.getElementById('visual-editor-scale');
    var frame = document.getElementById('content-preview-frame');
    if (!wrap || !scaleEl || !frame) return;
    var baseW = 1280;
    var avail = Math.max(320, wrap.clientWidth - 32);
    var scale = Math.min(1, avail / baseW);
    frame.style.width = baseW + 'px';
    frame.style.height = Math.max(560, window.innerHeight - 260) + 'px';
    frame.style.transform = 'scale(' + scale + ')';
    frame.style.transformOrigin = 'top center';
    scaleEl.style.width = Math.round(baseW * scale) + 'px';
    scaleEl.style.height = Math.round(parseFloat(frame.style.height) * scale) + 'px';
    scaleEl.style.margin = '0 auto';
  }

  function downloadContactAttachment(id) {
    if (!id) return;
    api('/contact/attachment/' + encodeURIComponent(id)).then(function (r) {
      if (r.status === 401 || r.status === 403) { toast('Session expirée', true); return null; }
      if (!r.ok) { toast('Erreur ' + r.status, true); return null; }
      return r.blob().then(function (blob) {
        var disp = r.headers.get('content-disposition') || '';
        var match = /filename="?([^"]+)"?/.exec(disp);
        var filename = match ? match[1] : 'piece-jointe';
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 0);
      });
    });
  }


  function downloadCv(id) {
    if (!id) return;
    api('/careers/cv/' + encodeURIComponent(id)).then(function (r) {
      if (r.status === 401 || r.status === 403) { toast('Session expirée', true); return null; }
      if (!r.ok) { toast('Erreur ' + r.status, true); return null; }
      return r.blob().then(function (blob) {
        var disp = r.headers.get('content-disposition') || '';
        var match = /filename="?([^"]+)"?/.exec(disp);
        var filename = match ? match[1] : 'cv.pdf';
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 0);
      });
    });
  }


  function loadAllowlist() {
    api('/admin/allowlist').then(function (r) { return r.json(); }).then(function (data) {
      setStatCount('dash-stat-admins', data.count);
      var c = document.getElementById('allowlist-list');
      c.innerHTML = data.items.map(function (a) {
        return '<div class="allow-row" data-testid="allow-row">' +
          '<div class="who"><strong>' + escapeHTML(a.email) + '</strong><small>ajouté par ' + escapeHTML(a.added_by || '—') + ' · ' + escapeHTML(fmtDate(a.created_at)) + '</small></div>' +
          '<button class="btn-mini" data-email="' + escapeHTML(a.email) + '" data-testid="set-password-btn">Mot de passe</button>' +
          '<button class="btn-mini danger" data-email="' + escapeHTML(a.email) + '" data-testid="allow-remove-btn">Retirer</button>' +
        '</div>';
      }).join('');
      c.querySelectorAll('button[data-testid="allow-remove-btn"]').forEach(function (btn) {
        btn.addEventListener('click', function () { removeAdmin(btn.getAttribute('data-email')); });
      });
      c.querySelectorAll('button[data-testid="set-password-btn"]').forEach(function (btn) {
        btn.addEventListener('click', function () { openPasswordModal(btn.getAttribute('data-email')); });
      });
    });
  }

  function openPasswordModal(email) {
    var modal = document.createElement('div');
    modal.className = 'modal-bg';
    modal.setAttribute('data-testid', 'password-modal');
    modal.innerHTML =
      '<div class="modal" style="max-width:420px">' +
        '<h3>Mot de passe — ' + escapeHTML(email) + '</h3>' +
        '<form id="pw-form" data-testid="password-form">' +
          '<label>Nouveau mot de passe (12 caractères minimum, maj/min/chiffre)' +
            '<div class="pw-wrap">' +
              '<input type="password" name="password" required minlength="12" autocomplete="new-password" data-testid="password-input"/>' +
              '<button type="button" class="pw-eye" data-target="password" aria-label="Afficher" data-testid="password-eye">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>' +
              '</button>' +
            '</div>' +
          '</label>' +
          '<label>Confirmer le mot de passe' +
            '<div class="pw-wrap">' +
              '<input type="password" name="confirm" required minlength="12" autocomplete="new-password" data-testid="password-confirm"/>' +
              '<button type="button" class="pw-eye" data-target="confirm" aria-label="Afficher" data-testid="password-confirm-eye">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>' +
              '</button>' +
            '</div>' +
          '</label>' +
          '<div class="modal-actions">' +
            '<button type="button" class="btn-mini ghost" id="pw-cancel" data-testid="password-cancel">Annuler</button>' +
            '<button type="submit" class="btn-mini pink" data-testid="password-save">Enregistrer</button>' +
          '</div>' +
        '</form>' +
      '</div>';
    document.body.appendChild(modal);
    modal.querySelector('#pw-cancel').addEventListener('click', function () { modal.remove(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
    modal.querySelectorAll('.pw-eye').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var name = btn.getAttribute('data-target');
        var inp = modal.querySelector('input[name="' + name + '"]');
        if (!inp) return;
        var showing = inp.type === 'text';
        inp.type = showing ? 'password' : 'text';
        btn.classList.toggle('on', !showing);
      });
    });
    modal.querySelector('#pw-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      if (f.password.value !== f.confirm.value) {
        toast('Les deux mots de passe ne correspondent pas', true);
        return;
      }
      api('/admin/allowlist/' + encodeURIComponent(email) + '/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: f.password.value })
      }).then(function (r) {
        if (!r.ok) return r.json().then(function (j) { throw new Error(j.detail || 'Erreur'); });
        return r.json();
      }).then(function () {
        modal.remove();
        toast('Mot de passe mis à jour pour ' + email);
      }).catch(function (err) { toast(err.message || 'Erreur', true); });
    });
  }

  function addAdmin(e) {
    e.preventDefault();
    var input = document.getElementById('allow-add-email');
    var email = input.value.trim();
    if (!email) return;
    api('/admin/allowlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    }).then(function (r) {
      if (!r.ok) { return r.json().then(function (j) { throw new Error(j.detail || 'error'); }); }
      return r.json();
    }).then(function (res) {
      input.value = '';
      toast(res.already_present ? 'Déjà admin' : 'Admin ajouté');
      loadAllowlist();
    }).catch(function (err) { toast(err.message || 'Erreur', true); });
  }

  function removeAdmin(email) {
    if (!confirm('Retirer ' + email + ' des admins ?')) return;
    api('/admin/allowlist/' + encodeURIComponent(email), { method: 'DELETE' })
      .then(function (r) {
        if (!r.ok) { return r.json().then(function (j) { throw new Error(j.detail || 'error'); }); }
        return r.json();
      })
      .then(function () { toast('Admin retiré'); loadAllowlist(); })
      .catch(function (err) { toast(err.message || 'Erreur', true); });
  }

  function logout() {
    csrfToken = null;
    api('/auth/logout', { method: 'POST' }).finally(function () {
      window.location.href = '/admin.html';
    });
  }

  function updateContentSaveBar() {
    var n = Object.keys(contentState.pending).length;
    var bar = document.getElementById('content-save-bar');
    var count = document.getElementById('content-pending-count');
    if (!bar) return;
    bar.classList.toggle('show', n > 0);
    if (count) count.textContent = n + ' modification(s)';
  }

  function normalizeContentValue(v) {
    if (v == null) return '';
    return String(v).trim()
      .replace(/<br\s*\/?>/gi, '<br/>')
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><');
  }

  function loadContentBaseline() {
    return api('/admin/content?page=' + encodeURIComponent(contentState.page) + '&lang=' + encodeURIComponent(contentState.lang))
      .then(parseApiResponse)
      .then(function (data) {
        contentState.items = data.items || [];
        contentState.baseline = {};
        contentState.items.forEach(function (item) {
          contentState.baseline[item.key] = item.value;
        });
        return contentState.baseline;
      });
  }

  function getPreviewFrame() {
    return document.getElementById('content-preview-frame');
  }

  function postToFrame(msg) {
    var frame = getPreviewFrame();
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage(msg, window.location.origin);
  }

  function postFmtToFrame(payload) {
    postToFrame(Object.assign({ type: 'circum-fmt-exec' }, payload));
  }

  function syncAdminFmtToolbar(state) {
    var bar = document.getElementById('content-fmt-toolbar');
    if (!bar) return;
    bar.classList.toggle('is-idle', !state || !state.active);
    if (!state || !state.state) return;
    bar.querySelectorAll('[data-cmd]').forEach(function (btn) {
      var cmd = btn.getAttribute('data-cmd');
      if (cmd === 'removeFormat') return;
      btn.classList.toggle('on', !!state.state[cmd]);
    });
  }

  function initFormatToolbar() {
    var bar = document.getElementById('content-fmt-toolbar');
    if (!bar || bar.dataset.bound) return;
    bar.dataset.bound = '1';

    bar.addEventListener('mousedown', function (e) {
      e.preventDefault();
      postToFrame({ type: 'circum-fmt-save-selection' });
    });

    bar.querySelectorAll('[data-cmd]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        postFmtToFrame({ cmd: btn.getAttribute('data-cmd') });
      });
    });

    var fontSel = bar.querySelector('[data-fmt="font"]');
    if (fontSel) {
      fontSel.addEventListener('change', function () {
        postFmtToFrame({ action: 'inlineStyle', prop: 'font-family', value: fontSel.value });
      });
    }

    var sizeSel = bar.querySelector('[data-fmt="size"]');
    if (sizeSel) {
      sizeSel.addEventListener('change', function () {
        postFmtToFrame({ action: 'inlineStyle', prop: 'font-size', value: sizeSel.value });
      });
    }

    bar.querySelectorAll('[data-fmt="foreColor"], [data-fmt="backColor"]').forEach(function (input) {
      input.addEventListener('input', function () {
        postFmtToFrame({
          cmd: input.getAttribute('data-fmt') === 'foreColor' ? 'foreColor' : 'backColor',
          value: input.value
        });
      });
    });
  }

  function sendEditorInit() {
    var frame = getPreviewFrame();
    if (!frame || !frame.contentWindow) return;
    loadContentBaseline().then(function (baseline) {
      frame.contentWindow.postMessage({
        type: 'circum-editor-init',
        lang: contentState.lang,
        baseline: baseline,
        pending: contentState.pending
      }, window.location.origin);
    }).catch(function (err) {
      toast(err.message || 'Impossible de charger le contenu', true);
    });
  }

  function openLiveSiteTab() {
    var raw = contentPageUrl(contentState.page);
    var hashIdx = raw.indexOf('#');
    var hash = hashIdx >= 0 ? raw.slice(hashIdx) : '';
    var path = hashIdx >= 0 ? raw.slice(0, hashIdx) : raw;
    window.open(path + '?_=' + Date.now() + hash, '_blank', 'noopener');
  }

  function reloadPreviewFrame() {
    var frame = getPreviewFrame();
    if (!frame) return;
    var url = contentPageUrl(contentState.page);
    var hash = '';
    var hashIdx = url.indexOf('#');
    if (hashIdx >= 0) {
      hash = url.slice(hashIdx);
      url = url.slice(0, hashIdx);
    }
    frame.src = url + '?circum_edit=1&_=' + Date.now() + hash;
    frame.onload = function () { fitVisualEditorFrame(); };
    fitVisualEditorFrame();
  }

  function onEditorMessage(e) {
    if (e.origin !== window.location.origin) return;
    var d = e.data;
    if (!d || !d.type) return;

    if (d.type === 'circum-editor-ready') {
      sendEditorInit();
    } else if (d.type === 'circum-content-change') {
      if (!d.key) return;
      var base = contentState.baseline[d.key];
      if (normalizeContentValue(d.value) === normalizeContentValue(base)) delete contentState.pending[d.key];
      else contentState.pending[d.key] = d.value;
      updateContentSaveBar();
    } else if (d.type === 'circum-fmt-state') {
      syncAdminFmtToolbar(d);
    } else if (d.type === 'circum-editor-baseline') {
      if (d.baseline) {
        Object.keys(d.baseline).forEach(function (k) {
          contentState.baseline[k] = d.baseline[k];
        });
      }
    } else if (d.type === 'circum-navigate') {
      var nextPage = hrefToContentPage(d.href);
      if (nextPage === contentState.page) return;
      if (Object.keys(contentState.pending).length && !confirm('Modifications non enregistrées. Changer de page ?')) return;
      contentState.pending = {};
      contentState.page = nextPage;
      updateContentSaveBar();
      var sel = document.getElementById('content-page-select');
      if (sel) sel.value = nextPage;
      reloadPreviewFrame();
    }
  }

  function initContentEditor() {
    if (contentState.editorReady) {
      reloadPreviewFrame();
      return;
    }
    contentState.editorReady = true;
    window.addEventListener('message', onEditorMessage);

    api('/admin/content/pages').then(function (r) { return r.json(); }).then(function (data) {
      contentState.pages = data.items || [];
      var sel = document.getElementById('content-page-select');
      if (sel) {
        sel.innerHTML = contentState.pages.map(function (p) {
          return '<option value="' + escapeHTML(p.id) + '">' + escapeHTML(p.label) + '</option>';
        }).join('');
        sel.value = contentState.page;
        sel.addEventListener('change', function () {
          if (Object.keys(contentState.pending).length && !confirm('Modifications non enregistrées. Continuer ?')) {
            sel.value = contentState.page;
            return;
          }
          contentState.pending = {};
          contentState.page = sel.value;
          updateContentSaveBar();
          reloadPreviewFrame();
        });
      }
      var langSel = document.getElementById('content-lang-select');
      if (langSel) {
        langSel.value = contentState.lang;
        langSel.addEventListener('change', function () {
          if (Object.keys(contentState.pending).length && !confirm('Modifications non enregistrées. Continuer ?')) {
            langSel.value = contentState.lang;
            return;
          }
          contentState.pending = {};
          contentState.lang = langSel.value;
          updateContentSaveBar();
          reloadPreviewFrame();
        });
      }
      var openSiteBtn = document.getElementById('content-open-site-btn');
      if (openSiteBtn) openSiteBtn.addEventListener('click', openLiveSiteTab);
      var reloadBtn = document.getElementById('content-reload-btn');
      if (reloadBtn) reloadBtn.addEventListener('click', function () {
        contentState.pending = {};
        updateContentSaveBar();
        reloadPreviewFrame();
      });
      var saveBtn = document.getElementById('content-save-btn');
      if (saveBtn) saveBtn.addEventListener('click', saveContentChanges);
      var discardBtn = document.getElementById('content-discard-btn');
      if (discardBtn)       discardBtn.addEventListener('click', function () {
        contentState.pending = {};
        updateContentSaveBar();
        reloadPreviewFrame();
      });
      initFormatToolbar();
      window.addEventListener('resize', fitVisualEditorFrame);
      reloadPreviewFrame();
    });
  }

  function notifyContentUpdated(patch, lang) {
    try {
      localStorage.setItem('circum-content-rev', String(Date.now()));
    } catch (e) { /* ignore */ }
    if (typeof BroadcastChannel === 'undefined') return;
    try {
      var bc = new BroadcastChannel('circum-content');
      bc.postMessage({ type: 'updated', patch: patch || null, lang: lang || contentState.lang, ts: Date.now() });
      bc.close();
    } catch (e) { /* ignore */ }
  }

  function requestFrameFlush() {
    return new Promise(function (resolve) {
      var done = false;
      function handler(e) {
        if (e.origin !== window.location.origin || done) return;
        if (!e.data || e.data.type !== 'circum-editor-flush-done') return;
        done = true;
        window.removeEventListener('message', handler);
        resolve();
      }
      window.addEventListener('message', handler);
      postToFrame({ type: 'circum-editor-flush' });
      setTimeout(function () {
        if (!done) {
          done = true;
          window.removeEventListener('message', handler);
          resolve();
        }
      }, 400);
    });
  }

  function refreshContentPreviewAfterSave(patch) {
    return loadContentBaseline().then(function (baseline) {
      postToFrame({
        type: 'circum-editor-apply',
        lang: contentState.lang,
        baseline: baseline,
        patch: patch || {}
      });
    });
  }

  function saveContentChanges() {
    var btn = document.getElementById('content-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Validation…'; }
    var savedOk = false;
    requestFrameFlush().then(function () {
      var keys = Object.keys(contentState.pending);
      if (!keys.length) {
        toast('Aucune modification à enregistrer', true);
        return Promise.reject(new Error('empty'));
      }
      var updates = keys.map(function (key) {
        return { key: key, lang: contentState.lang, value: contentState.pending[key] };
      });
      return api('/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: updates })
      }).then(parseApiResponse);
    }).then(function (res) {
      if (!res) return;
      savedOk = true;
      var patch = {};
      if (res.values) {
        res.values.forEach(function (item) {
          if (item.lang === contentState.lang) patch[item.key] = item.value;
          contentState.baseline[item.key] = item.value;
        });
      }
      contentState.pending = {};
      updateContentSaveBar();
      notifyContentUpdated(patch, contentState.lang);
      return refreshContentPreviewAfterSave(patch);
    }).then(function () {
      if (savedOk) toast('Modifications validées — visibles en direct sur le site');
    }).catch(function (err) {
      if (err && err.message === 'empty') return;
      if (savedOk) {
        toast('Enregistré — rechargez l\'aperçu si le texte n\'a pas bougé', true);
        return;
      }
      toast(err.message || 'Erreur', true);
    }).finally(function () {
      if (btn) { btn.disabled = false; btn.textContent = 'Valider'; }
    });
  }

  // ============ Gestion des actualités ============
  var newsState = { items: [], editing: null };

  function newsMediaUrl(filename) {
    if (!filename) return '';
    return API + '/news/media/' + encodeURIComponent(filename);
  }

  function initNewsAdmin() {
    var newBtn = document.getElementById('news-new-btn');
    var cancelBtn = document.getElementById('news-cancel-btn');
    var deleteBtn = document.getElementById('news-delete-btn');
    var form = document.getElementById('news-editor-form');
    var coverInput = document.getElementById('news-form-cover');
    var galleryInput = document.getElementById('news-form-gallery');
    var richEditor = document.getElementById('news-form-body-editable');
    var richToolbar = document.getElementById('news-rich-toolbar');
    if (newBtn) newBtn.addEventListener('click', function () { openNewsEditor(null); });
    if (cancelBtn) cancelBtn.addEventListener('click', closeNewsEditor);
    if (deleteBtn) deleteBtn.addEventListener('click', deleteNewsArticle);
    if (form) form.addEventListener('submit', saveNewsArticle);
    if (coverInput) {
      coverInput.addEventListener('change', function () {
        var preview = document.getElementById('news-cover-preview');
        if (!preview || !coverInput.files || !coverInput.files[0]) return;
        preview.innerHTML = '<img src="' + URL.createObjectURL(coverInput.files[0]) + '" alt="Aperçu couverture"/>';
      });
    }
    if (galleryInput) {
      galleryInput.addEventListener('change', function () {
        var wrap = document.getElementById('news-new-gallery-preview');
        if (!wrap || !galleryInput.files) return;
        wrap.innerHTML = Array.prototype.map.call(galleryInput.files, function (f) {
          return '<img src="' + URL.createObjectURL(f) + '" alt=""/>';
        }).join('');
      });
    }
    if (richToolbar && richEditor) {
      richToolbar.querySelectorAll('button').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          richEditor.focus();
          var cmd = btn.getAttribute('data-cmd');
          var val = btn.getAttribute('data-val');
          if (cmd === 'createLink') {
            var url = window.prompt('URL du lien :', 'https://');
            if (url) document.execCommand('createLink', false, url);
          } else if (cmd === 'formatBlock' && val) {
            document.execCommand('formatBlock', false, val);
          } else if (cmd) {
            document.execCommand(cmd, false, null);
          }
          syncNewsBodyField();
        });
      });
      richEditor.addEventListener('input', syncNewsBodyField);
    }
  }

  function syncNewsBodyField() {
    var rich = document.getElementById('news-form-body-editable');
    var hidden = document.getElementById('news-form-body');
    if (rich && hidden) hidden.value = rich.innerHTML.trim();
  }

  function loadNewsAdminList() {
    var el = document.getElementById('news-admin-list');
    if (!el) return;
    el.innerHTML = '<div class="empty">Chargement…</div>';
    api('/admin/news').then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (data) {
      newsState.items = data.items || [];
      if (!newsState.items.length) {
        el.innerHTML = '<div class="empty">Aucune actualité publiée. Cliquez sur « Nouvelle actualité ».</div>';
        return;
      }
      el.innerHTML = newsState.items.map(function (item) {
        var thumb = item.cover_image
          ? '<img src="' + escapeHTML(newsMediaUrl(item.cover_image)) + '" alt=""/>'
          : '<div class="adm-news-placeholder">' + escapeHTML(item.tag || 'News') + '</div>';
        var galleryCount = (item.gallery && item.gallery.length) ? item.gallery.length : 0;
        return '' +
          '<article class="adm-news-card" data-testid="news-row-' + escapeHTML(item.id) + '">' +
            '<div class="adm-news-media">' + thumb +
              (galleryCount ? '<span class="adm-news-gallery-badge">' + galleryCount + ' photo' + (galleryCount > 1 ? 's' : '') + '</span>' : '') +
            '</div>' +
            '<div class="adm-news-body">' +
              '<span class="adm-news-tag">' + escapeHTML(item.tag) + '</span>' +
              '<h3>' + escapeHTML(item.title) + '</h3>' +
              '<p>' + escapeHTML(item.summary) + '</p>' +
              '<time>' + escapeHTML(item.date) + '</time>' +
            '</div>' +
            '<div class="adm-news-actions">' +
              '<button type="button" class="btn-mini" data-edit-news="' + escapeHTML(item.id) + '">Modifier</button>' +
              '<a class="btn-mini ghost" href="/news-article.html?id=' + encodeURIComponent(item.id) + '" target="_blank" rel="noopener">Aperçu</a>' +
            '</div>' +
          '</article>';
      }).join('');
      el.querySelectorAll('[data-edit-news]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          openNewsEditor(btn.getAttribute('data-edit-news'));
        });
      });
    }).catch(function () {
      el.innerHTML = '<div class="empty">Impossible de charger les actualités.</div>';
    });
  }

  function openNewsEditor(id) {
    var panel = document.getElementById('news-editor-panel');
    var heading = document.getElementById('news-editor-heading');
    var deleteBtn = document.getElementById('news-delete-btn');
    var coverInput = document.getElementById('news-form-cover');
    var coverNote = document.getElementById('news-cover-note');
    var coverPreview = document.getElementById('news-cover-preview');
    var galleryExisting = document.getElementById('news-existing-gallery');
    var richEditor = document.getElementById('news-form-body-editable');
    var newGallery = document.getElementById('news-new-gallery-preview');
    if (!panel) return;

    document.getElementById('news-edit-id').value = id || '';
    document.getElementById('news-form-title').value = '';
    document.getElementById('news-form-tag').value = '';
    document.getElementById('news-form-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('news-form-summary').value = '';
    document.getElementById('news-form-body').value = '';
    if (richEditor) richEditor.innerHTML = '';
    if (coverInput) { coverInput.value = ''; coverInput.required = !id; }
    document.getElementById('news-form-gallery').value = '';
    if (coverPreview) coverPreview.innerHTML = '';
    if (galleryExisting) galleryExisting.innerHTML = '';
    if (newGallery) newGallery.innerHTML = '';
    if (coverNote) coverNote.textContent = id ? '(laisser vide pour conserver l\'actuelle)' : '(obligatoire)';

    if (id) {
      var item = newsState.items.find(function (n) { return n.id === id; });
      if (!item) {
        toast('Article introuvable', true);
        return;
      }
      newsState.editing = item;
      heading.textContent = 'Modifier l\'actualité';
      deleteBtn.hidden = false;
      document.getElementById('news-form-title').value = item.title || '';
      document.getElementById('news-form-tag').value = item.tag || '';
      document.getElementById('news-form-date').value = item.date || '';
      document.getElementById('news-form-summary').value = item.summary || '';
      var bodyHtml = item.body_html || '';
      document.getElementById('news-form-body').value = bodyHtml;
      if (richEditor) richEditor.innerHTML = bodyHtml;
      if (item.cover_image && coverPreview) {
        coverPreview.innerHTML = '<img src="' + escapeHTML(newsMediaUrl(item.cover_image)) + '" alt="Couverture actuelle"/>';
      }
      if (item.gallery && item.gallery.length && galleryExisting) {
        galleryExisting.innerHTML = item.gallery.map(function (name) {
          return '' +
            '<label class="news-gallery-tile">' +
              '<input type="checkbox" value="' + escapeHTML(name) + '"/>' +
              '<img src="' + escapeHTML(newsMediaUrl(name)) + '" alt=""/>' +
              '<span class="news-gallery-tile-del">Supprimer</span>' +
            '</label>';
        }).join('');
      }
    } else {
      newsState.editing = null;
      heading.textContent = 'Nouvelle actualité';
      deleteBtn.hidden = true;
    }

    panel.hidden = false;
    document.body.classList.add('news-editor-open');
  }

  function closeNewsEditor() {
    var panel = document.getElementById('news-editor-panel');
    if (panel) panel.hidden = true;
    if (!document.getElementById('issue-editor-panel') || document.getElementById('issue-editor-panel').hidden) {
      document.body.classList.remove('news-editor-open');
    }
    newsState.editing = null;
  }

  function saveNewsArticle(e) {
    e.preventDefault();
    syncNewsBodyField();
    var id = document.getElementById('news-edit-id').value;
    var coverInput = document.getElementById('news-form-cover');
    var saveBtn = document.getElementById('news-save-btn');
    var fd = new FormData();
    fd.append('title', document.getElementById('news-form-title').value.trim());
    fd.append('summary', document.getElementById('news-form-summary').value.trim());
    fd.append('tag', document.getElementById('news-form-tag').value.trim());
    fd.append('date', document.getElementById('news-form-date').value);
    fd.append('body_html', document.getElementById('news-form-body').value);

    if (!id && (!coverInput.files || !coverInput.files[0])) {
      toast('L\'image de couverture est obligatoire', true);
      return;
    }
    if (coverInput.files && coverInput.files[0]) {
      fd.append('cover', coverInput.files[0]);
    }

    var galleryInput = document.getElementById('news-form-gallery');
    if (galleryInput.files && galleryInput.files.length) {
      for (var i = 0; i < galleryInput.files.length; i++) {
        fd.append('gallery', galleryInput.files[i]);
      }
    }

    if (id) {
      var remove = [];
      document.querySelectorAll('#news-existing-gallery input[type=checkbox]:checked').forEach(function (cb) {
        remove.push(cb.value);
      });
      if (remove.length) fd.append('remove_gallery', remove.join(','));
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Enregistrement…';
    var path = id ? '/admin/news/' + encodeURIComponent(id) : '/admin/news';
    api(path, { method: id ? 'PUT' : 'POST', body: fd }).then(function (r) {
      if (!r.ok) return r.json().then(function (j) { throw new Error(j.detail || ('Erreur ' + r.status)); });
      return r.json();
    }).then(function (res) {
      toast(id ? 'Actualité mise à jour' : 'Actualité publiée');
      closeNewsEditor();
      loadNewsAdminList();
      var savedId = (res && res.id) || id;
      if (savedId) {
        setTimeout(function () {
          var card = document.querySelector('[data-testid="news-row-' + savedId + '"]');
          if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 400);
      }
    }).catch(function (err) {
      toast(err.message || 'Erreur', true);
    }).finally(function () {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Publier';
    });
  }

  function deleteNewsArticle() {
    var id = document.getElementById('news-edit-id').value;
    if (!id || !window.confirm('Supprimer définitivement cette actualité ?')) return;
    var deleteBtn = document.getElementById('news-delete-btn');
    deleteBtn.disabled = true;
    api('/admin/news/' + encodeURIComponent(id), { method: 'DELETE' }).then(function (r) {
      if (!r.ok) return r.json().then(function (j) { throw new Error(apiErrorMessage(j, 'Erreur')); });
      toast('Actualité supprimée');
      closeNewsEditor();
      loadNewsAdminList();
    }).catch(function (err) {
      toast(err.message || 'Erreur', true);
    }).finally(function () {
      deleteBtn.disabled = false;
    });
  }

  // ============ Gestion des numéros newsletter ============
  var issuesState = { items: [], editing: null, tab: 'articles' };

  function switchNewsStudioTab(tab) {
    issuesState.tab = tab;
    document.querySelectorAll('.news-studio-tab').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-news-tab') === tab);
    });
    var articlesPanel = document.getElementById('news-panel-articles');
    var issuesPanel = document.getElementById('news-panel-issues');
    if (articlesPanel) {
      articlesPanel.classList.toggle('active', tab === 'articles');
      articlesPanel.hidden = tab !== 'articles';
    }
    if (issuesPanel) {
      issuesPanel.classList.toggle('active', tab === 'issues');
      issuesPanel.hidden = tab !== 'issues';
    }
    if (tab === 'issues') loadNewsletterIssuesList();
  }

  function initNewsletterIssuesAdmin() {
    document.querySelectorAll('.news-studio-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchNewsStudioTab(btn.getAttribute('data-news-tab'));
      });
    });
    var newBtn = document.getElementById('issue-new-btn');
    var cancelBtn = document.getElementById('issue-cancel-btn');
    var deleteBtn = document.getElementById('issue-delete-btn');
    var form = document.getElementById('issue-editor-form');
    if (newBtn) newBtn.addEventListener('click', function () { openIssueEditor(null); });
    if (cancelBtn) cancelBtn.addEventListener('click', closeIssueEditor);
    if (deleteBtn) deleteBtn.addEventListener('click', deleteNewsletterIssue);
    if (form) form.addEventListener('submit', saveNewsletterIssue);
  }

  function loadNewsletterIssuesList() {
    var el = document.getElementById('issues-admin-list');
    if (!el) return;
    el.innerHTML = '<div class="empty">Chargement…</div>';
    api('/admin/newsletter/issues').then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (data) {
      var items = Array.isArray(data) ? data : (data.items || []);
      issuesState.items = items;
      if (!items.length) {
        el.innerHTML = '<div class="empty">Aucun numéro publié. Cliquez sur « Nouveau numéro ».</div>';
        return;
      }
      el.innerHTML = items.map(function (item) {
        return '' +
          '<article class="adm-news-card adm-issue-card" data-testid="issue-row-' + escapeHTML(item.id) + '">' +
            '<div class="adm-news-media adm-issue-badge">' +
              '<strong>' + escapeHTML(item.quarter || '') + '</strong>' +
              '<span>' + escapeHTML(String(item.year || '')) + '</span>' +
            '</div>' +
            '<div class="adm-news-body">' +
              '<time>' + escapeHTML(item.date || '') + '</time>' +
              '<h3>' + escapeHTML(item.title || '') + '</h3>' +
              '<p>' + escapeHTML(item.summary || '') + '</p>' +
              (item.link ? '<a class="adm-news-ext-link" href="' + escapeHTML(item.link) + '" target="_blank" rel="noopener">Voir le numéro →</a>' : '') +
            '</div>' +
            '<div class="adm-news-actions">' +
              '<button type="button" class="btn-mini" data-edit-issue="' + escapeHTML(item.id) + '">Modifier</button>' +
              '<a class="btn-mini ghost" href="/newsletter.html" target="_blank" rel="noopener">Aperçu site</a>' +
            '</div>' +
          '</article>';
      }).join('');
      el.querySelectorAll('[data-edit-issue]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          openIssueEditor(btn.getAttribute('data-edit-issue'));
        });
      });
    }).catch(function () {
      el.innerHTML = '<div class="empty">Impossible de charger les numéros newsletter.</div>';
    });
  }

  function openIssueEditor(id) {
    var panel = document.getElementById('issue-editor-panel');
    var heading = document.getElementById('issue-editor-heading');
    var deleteBtn = document.getElementById('issue-delete-btn');
    if (!panel) return;

    document.getElementById('issue-edit-id').value = id || '';
    document.getElementById('issue-form-quarter').value = 'Q1';
    document.getElementById('issue-form-year').value = new Date().getFullYear();
    document.getElementById('issue-form-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('issue-form-title').value = '';
    document.getElementById('issue-form-summary').value = '';
    document.getElementById('issue-form-link').value = '';

    if (id) {
      var item = issuesState.items.find(function (n) { return n.id === id; });
      if (!item) {
        toast('Numéro introuvable', true);
        return;
      }
      issuesState.editing = item;
      heading.textContent = 'Modifier le numéro';
      deleteBtn.hidden = false;
      document.getElementById('issue-form-quarter').value = item.quarter || 'Q1';
      document.getElementById('issue-form-year').value = item.year || new Date().getFullYear();
      document.getElementById('issue-form-date').value = item.date || '';
      document.getElementById('issue-form-title').value = item.title || '';
      document.getElementById('issue-form-summary').value = item.summary || '';
      document.getElementById('issue-form-link').value = item.link || '';
    } else {
      issuesState.editing = null;
      heading.textContent = 'Nouveau numéro';
      deleteBtn.hidden = true;
    }

    panel.hidden = false;
    document.body.classList.add('news-editor-open');
  }

  function closeIssueEditor() {
    var panel = document.getElementById('issue-editor-panel');
    if (panel) panel.hidden = true;
    if (!document.getElementById('news-editor-panel') || document.getElementById('news-editor-panel').hidden) {
      document.body.classList.remove('news-editor-open');
    }
    issuesState.editing = null;
  }

  function saveNewsletterIssue(e) {
    e.preventDefault();
    var id = document.getElementById('issue-edit-id').value;
    var saveBtn = document.getElementById('issue-save-btn');
    var payload = {
      quarter: document.getElementById('issue-form-quarter').value,
      year: parseInt(document.getElementById('issue-form-year').value, 10),
      date: document.getElementById('issue-form-date').value,
      title: document.getElementById('issue-form-title').value.trim(),
      summary: document.getElementById('issue-form-summary').value.trim(),
      link: document.getElementById('issue-form-link').value.trim() || null
    };

    saveBtn.disabled = true;
    saveBtn.textContent = 'Enregistrement…';
    var path = id ? '/admin/newsletter/issues/' + encodeURIComponent(id) : '/admin/newsletter/issues';
    api(path, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (j) { throw new Error(apiErrorMessage(j, 'Erreur ' + r.status)); });
      return r.json();
    }).then(function () {
      toast(id ? 'Numéro mis à jour' : 'Numéro publié');
      closeIssueEditor();
      loadNewsletterIssuesList();
    }).catch(function (err) {
      toast(err.message || 'Erreur', true);
    }).finally(function () {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Publier';
    });
  }

  function deleteNewsletterIssue() {
    var id = document.getElementById('issue-edit-id').value;
    if (!id || !window.confirm('Supprimer définitivement ce numéro ?')) return;
    var deleteBtn = document.getElementById('issue-delete-btn');
    deleteBtn.disabled = true;
    api('/admin/newsletter/issues/' + encodeURIComponent(id), { method: 'DELETE' }).then(function (r) {
      if (!r.ok) return r.json().then(function (j) { throw new Error(apiErrorMessage(j, 'Erreur')); });
      toast('Numéro supprimé');
      closeIssueEditor();
      loadNewsletterIssuesList();
    }).catch(function (err) {
      toast(err.message || 'Erreur', true);
    }).finally(function () {
      deleteBtn.disabled = false;
    });
  }

  // ============ Boot ============
  function exchangeSessionId(sessionId) {
    return api('/auth/google/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
  }

  function checkAuth() {
    api('/auth/me').then(function (r) {
      if (r.ok) {
        return r.json().then(function (user) {
          csrfToken = user.csrf_token || csrfToken;
          renderDashboard(user);
        }).catch(function () { csrfToken = null; renderLogin('', 'Erreur de session'); });
      }
      csrfToken = null;
      renderLogin();
    }).catch(function () { csrfToken = null; renderLogin('', 'Impossible de joindre l\'API. ' + devSetupHint()); });
  }

  function renderResetForm(token) {
    userZone.innerHTML = '';
    mainZone.innerHTML =
      '<div class="login-card" data-testid="reset-card">' +
        '<h1>Nouveau mot de passe</h1>' +
        '<p>Choisissez un nouveau mot de passe (minimum 12 caractères, majuscule, minuscule et chiffre).</p>' +
        '<form class="login-form" id="reset-form" data-testid="reset-form">' +
          '<div class="pw-wrap">' +
            '<input type="password" name="password" required minlength="12" placeholder="Nouveau mot de passe" autocomplete="new-password" data-testid="reset-password"/>' +
            '<button type="button" class="pw-eye" data-target="password" aria-label="Afficher" data-testid="reset-eye"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>' +
          '</div>' +
          '<div class="pw-wrap">' +
            '<input type="password" name="confirm" required minlength="12" placeholder="Confirmer" autocomplete="new-password" data-testid="reset-confirm"/>' +
            '<button type="button" class="pw-eye" data-target="confirm" aria-label="Afficher"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>' +
          '</div>' +
          '<button type="submit" class="btn-login" data-testid="reset-submit">Valider</button>' +
          '<div class="form-message" id="reset-msg"></div>' +
        '</form>' +
      '</div>';
    document.querySelectorAll('[data-testid="reset-card"] .pw-eye').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var name = btn.getAttribute('data-target');
        var inp = document.querySelector('[data-testid="reset-card"] input[name="' + name + '"]');
        if (!inp) return;
        var showing = inp.type === 'text';
        inp.type = showing ? 'password' : 'text';
        btn.classList.toggle('on', !showing);
      });
    });
    document.getElementById('reset-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      var msg = document.getElementById('reset-msg');
      if (f.password.value !== f.confirm.value) {
        msg.textContent = 'Les deux mots de passe ne correspondent pas';
        msg.style.color = 'var(--error)';
        return;
      }
      var btn = f.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Mise à jour…';
      api('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, password: f.password.value })
      }).then(function (r) {
        if (r.ok) {
          history.replaceState(null, '', window.location.pathname);
          toast('Mot de passe mis à jour. Connectez-vous.');
          setTimeout(function () { renderLogin(); }, 800);
        } else {
          return r.json().then(function (j) {
            msg.textContent = (j && j.detail) ? j.detail : ('Erreur ' + r.status);
            msg.style.color = 'var(--error)';
            btn.disabled = false; btn.textContent = 'Valider';
          });
        }
      }).catch(function () {
        msg.textContent = 'Erreur réseau';
        msg.style.color = 'var(--error)';
        btn.disabled = false; btn.textContent = 'Valider';
      });
    });
  }

  // 0) Handle reset token from URL query string
  var resetMatch = /[?&]reset=([^&]+)/.exec(window.location.search);
  if (resetMatch) {
    renderResetForm(decodeURIComponent(resetMatch[1]));
    return;
  }

  // 1) Handle session_id from URL fragment (returning from Google auth)
  if (window.location.hash && window.location.hash.indexOf('session_id=') !== -1) {
    var sid = window.location.hash.replace(/^#/, '').split('&').reduce(function (acc, kv) {
      var p = kv.split('='); acc[p[0]] = decodeURIComponent(p[1] || ''); return acc;
    }, {}).session_id;
    // clean URL immediately
    history.replaceState(null, '', window.location.pathname);
    if (sid) {
      exchangeSessionId(sid).then(function (r) {
        if (r.ok) {
          return r.json().then(function (j) {
            csrfToken = j.csrf_token || csrfToken;
            checkAuth();
          });
        } else {
          return r.json().then(function (j) {
            if (r.status === 403) {
              renderLogin('');
            } else { renderLogin(); }
          }).catch(function () { renderLogin(); });
        }
      }).catch(function () { renderLogin(); });
      return;
    }
  }

  // 2) Otherwise check existing session
  checkAuth();
})();
