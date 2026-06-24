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
        '<div class="stat"><div class="stat-value" id="dash-stat-leads" data-testid="stat-leads">—</div><div class="stat-label">Abonnés newsletter</div></div>' +
        '<div class="stat"><div class="stat-value" id="dash-stat-contact" data-testid="stat-contact">—</div><div class="stat-label">Demandes contact</div></div>' +
        '<div class="stat"><div class="stat-value" id="dash-stat-apps" data-testid="stat-apps">—</div><div class="stat-label">Candidatures carrières</div></div>' +
        '<div class="stat"><div class="stat-value" id="dash-stat-admins" data-testid="stat-admins">—</div><div class="stat-label">Admins autorisés</div></div>' +
      '</div>' +

      '<div class="panel" data-testid="panel-contact">' +
        '<div class="panel-head">' +
          '<h2>Formulaire Contact</h2>' +
          '<div class="actions">' +
            '<button class="btn-mini" id="dl-contact-csv" data-testid="dl-contact-csv">Télécharger CSV</button>' +
            '<button class="btn-mini pink" id="dl-contact-json" data-testid="dl-contact-json">Télécharger JSON</button>' +
          '</div>' +
        '</div>' +
        '<div id="contact-table" class="table-wrap"><div class="empty">Chargement…</div></div>' +
      '</div>' +

      '<div class="panel" data-testid="panel-apps">' +
        '<div class="panel-head">' +
          '<h2>Formulaire Carrières</h2>' +
          '<div class="actions">' +
            '<button class="btn-mini" id="dl-apps-csv" data-testid="dl-apps-csv">Télécharger CSV</button>' +
            '<button class="btn-mini pink" id="dl-apps-json" data-testid="dl-apps-json">Télécharger JSON</button>' +
          '</div>' +
        '</div>' +
        '<div id="apps-table" class="table-wrap"><div class="empty">Chargement…</div></div>' +
      '</div>' +

      '<div class="panel" data-testid="panel-leads">' +
        '<div class="panel-head">' +
          '<h2>Inscriptions Newsletter</h2>' +
          '<div class="actions">' +
            '<button class="btn-mini" id="dl-leads-csv" data-testid="dl-leads-csv">Télécharger CSV</button>' +
            '<button class="btn-mini pink" id="dl-leads-json" data-testid="dl-leads-json">Télécharger JSON</button>' +
          '</div>' +
        '</div>' +
        '<div id="leads-table" class="table-wrap"><div class="empty">Chargement…</div></div>' +
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
        '<div class="news-admin-wrap">' +
          '<div class="panel news-admin-list-panel" data-testid="panel-news-list">' +
            '<div class="panel-head">' +
              '<h2>Actualités</h2>' +
              '<div class="actions">' +
                '<button type="button" class="btn-mini pink" id="news-new-btn" data-testid="news-new-btn">+ Nouvelle actualité</button>' +
              '</div>' +
            '</div>' +
            '<p class="news-admin-hint">Publiez des articles avec une image de couverture (visible sur la page News) et un contenu complet consultable au clic.</p>' +
            '<div id="news-admin-list" class="news-admin-list"><div class="empty">Chargement…</div></div>' +
          '</div>' +
          '<div class="panel news-admin-editor-panel" id="news-editor-panel" hidden data-testid="panel-news-editor">' +
            '<div class="panel-head">' +
              '<h2 id="news-editor-heading">Nouvelle actualité</h2>' +
            '</div>' +
            '<form id="news-editor-form" class="news-editor-form" data-testid="news-editor-form">' +
              '<input type="hidden" id="news-edit-id" value=""/>' +
              '<label class="news-field">Titre<input type="text" id="news-form-title" required maxlength="240" data-testid="news-form-title"/></label>' +
              '<div class="news-field-row">' +
                '<label class="news-field">Catégorie<input type="text" id="news-form-tag" required maxlength="80" placeholder="Inauguration, Certification, Salon…" data-testid="news-form-tag"/></label>' +
                '<label class="news-field">Date de publication<input type="date" id="news-form-date" required data-testid="news-form-date"/></label>' +
              '</div>' +
              '<label class="news-field">Accroche (texte visible sur la carte News)<textarea id="news-form-summary" required maxlength="800" rows="3" data-testid="news-form-summary"></textarea></label>' +
              '<label class="news-field">Image de couverture <span class="news-field-note" id="news-cover-note">(obligatoire)</span>' +
                '<input type="file" id="news-form-cover" accept="image/jpeg,image/png,image/webp" data-testid="news-form-cover"/>' +
                '<div id="news-cover-preview" class="news-cover-preview"></div>' +
              '</label>' +
              '<label class="news-field">Contenu de l\'article (HTML)' +
                '<textarea id="news-form-body" rows="14" placeholder="<p>Votre texte…</p>" data-testid="news-form-body"></textarea>' +
                '<small class="news-field-help">Balises autorisées : p, br, strong, em, u, h2, h3, ul, ol, li, a, img, blockquote. Vous pouvez coller du HTML simple.</small>' +
              '</label>' +
              '<label class="news-field">Galerie d\'images (optionnel, affichée en bas de l\'article)' +
                '<input type="file" id="news-form-gallery" accept="image/jpeg,image/png,image/webp" multiple data-testid="news-form-gallery"/>' +
              '</label>' +
              '<div id="news-existing-gallery" class="news-existing-gallery"></div>' +
              '<div class="news-form-actions">' +
                '<button type="button" class="btn-mini ghost" id="news-cancel-btn" data-testid="news-cancel-btn">Annuler</button>' +
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
            '<span class="visual-editor-hint">Cliquez sur un texte dans l\'aperçu, puis formatez-le avec la barre ci-dessous</span>' +
            '<div class="visual-editor-actions">' +
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
              '<button type="button" class="btn-mini pink" id="content-save-btn" data-testid="content-save-btn">Enregistrer</button>' +
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
        }
      });
    });

    document.getElementById('dl-leads-csv').addEventListener('click', function () { triggerDownload('/admin/leads.csv'); });
    document.getElementById('dl-leads-json').addEventListener('click', function () { triggerDownload('/admin/leads.json'); });
    document.getElementById('dl-apps-csv').addEventListener('click', function () { triggerDownload('/admin/applications.csv'); });
    document.getElementById('dl-apps-json').addEventListener('click', function () { triggerDownload('/admin/applications.json'); });
    document.getElementById('dl-contact-csv').addEventListener('click', function () { triggerDownload('/admin/contact.csv'); });
    document.getElementById('dl-contact-json').addEventListener('click', function () { triggerDownload('/admin/contact.json'); });
    document.getElementById('allow-add-form').addEventListener('submit', addAdmin);

    initNewsAdmin();

    loadContact();
    loadApps();
    loadLeads();
    loadAllowlist();
  }

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

  function loadContact() {
    api('/admin/contact').then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (data) {
      setStatCount('dash-stat-contact', data.count);
      var c = document.getElementById('contact-table');
      if (!c) return;
      var items = data.items || [];
      if (!items.length) { c.innerHTML = '<div class="empty">Aucune demande contact pour le moment.</div>'; return; }
      var rows = items.map(function (m) {
        var preview = (m.message || '').slice(0, 120) + ((m.message || '').length > 120 ? '…' : '');
        return '<tr data-testid="contact-row">' +
          '<td><strong>' + escapeHTML(m.firstname || '') + ' ' + escapeHTML(m.lastname || '') + '</strong><br/><small style="color:var(--text-muted)">' + escapeHTML(m.email) + (m.phone ? ' · ' + escapeHTML(m.phone) : '') + '</small></td>' +
          '<td>' + escapeHTML(m.company || '—') + '<br/><small style="color:var(--text-muted)">' + escapeHTML(m.country || '') + (m.role ? ' · ' + escapeHTML(m.role) : '') + '</small></td>' +
          '<td>' + escapeHTML(m.contact_type || '—') + '<br/><small style="color:var(--text-muted)">' + escapeHTML(m.stage || '—') + ' · ' + escapeHTML(m.timeline || '—') + '</small></td>' +
          '<td class="muted" style="max-width:280px">' + escapeHTML(preview) + '</td>' +
          '<td>' + (m.attachment_filename ? '<button type="button" class="btn-mini" data-att-id="' + escapeHTML(m.id) + '" data-testid="dl-att-btn">Pièce ↓</button>' : '<span class="muted">—</span>') + '</td>' +
          '<td class="muted">' + escapeHTML(fmtDate(m.created_at)) + '</td>' +
          '<td><button class="btn-mini danger" data-id="' + escapeHTML(m.id) + '" data-testid="del-contact-btn">×</button></td>' +
        '</tr>';
      }).join('');
      c.innerHTML = '<table class="admin-tbl"><thead><tr><th>Contact</th><th>Entreprise</th><th>Projet</th><th>Message</th><th>Fichier</th><th>Date</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
      c.querySelectorAll('button[data-testid="del-contact-btn"]').forEach(function (btn) {
        btn.addEventListener('click', function () { deleteContact(btn.getAttribute('data-id')); });
      });
      c.querySelectorAll('button[data-testid="dl-att-btn"]').forEach(function (btn) {
        btn.addEventListener('click', function () { downloadContactAttachment(btn.getAttribute('data-att-id')); });
      });
    }).catch(function () {
      setStatCount('dash-stat-contact', 0);
      var c = document.getElementById('contact-table');
      if (c) c.innerHTML = '<div class="empty">Aucune demande contact pour le moment.</div>';
    });
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

  function deleteContact(id) {
    if (!confirm('Supprimer cette demande contact ?')) return;
    api('/admin/contact/' + encodeURIComponent(id), { method: 'DELETE' }).then(function (r) {
      if (r.ok) { toast('Demande supprimée'); loadContact(); }
      else toast('Erreur ' + r.status, true);
    });
  }

  function loadLeads() {
    api('/admin/leads').then(function (r) { return r.json(); }).then(function (data) {
      setStatCount('dash-stat-leads', data.count);
      var c = document.getElementById('leads-table');
      if (!data.items.length) { c.innerHTML = '<div class="empty">Aucun abonné pour le moment.</div>'; return; }
      var rows = data.items.map(function (l) {
        return '<tr data-testid="lead-row">' +
          '<td><strong>' + escapeHTML(l.firstname || '') + ' ' + escapeHTML(l.lastname || '') + '</strong></td>' +
          '<td>' + escapeHTML(l.email) + '</td>' +
          '<td>' + escapeHTML(l.company || '—') + '</td>' +
          '<td>' + escapeHTML(l.role || '—') + '</td>' +
          '<td><span class="pill">' + escapeHTML((l.lang || 'fr').toUpperCase()) + '</span></td>' +
          '<td class="muted">' + escapeHTML(fmtDate(l.created_at)) + '</td>' +
          '<td><button class="btn-mini danger" data-id="' + escapeHTML(l.id) + '" data-testid="del-lead-btn">×</button></td>' +
        '</tr>';
      }).join('');
      c.innerHTML = '<table class="admin-tbl"><thead><tr><th>Nom</th><th>Email</th><th>Société</th><th>Fonction</th><th>Langue</th><th>Date</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
      c.querySelectorAll('button[data-testid="del-lead-btn"]').forEach(function (btn) {
        btn.addEventListener('click', function () { deleteLead(btn.getAttribute('data-id')); });
      });
    });
  }

  function deleteLead(id) {
    if (!confirm('Supprimer ce lead ?')) return;
    api('/admin/leads/' + encodeURIComponent(id), { method: 'DELETE' }).then(function (r) {
      if (r.ok) { toast('Lead supprimé'); loadLeads(); }
      else toast('Erreur ' + r.status, true);
    });
  }

  function loadApps() {
    api('/admin/applications').then(function (r) { return r.json(); }).then(function (data) {
      setStatCount('dash-stat-apps', data.count);
      var c = document.getElementById('apps-table');
      if (!data.items.length) { c.innerHTML = '<div class="empty">Aucune candidature pour le moment.</div>'; return; }
      var rows = data.items.map(function (a) {
        return '<tr data-testid="app-row">' +
          '<td><strong>' + escapeHTML(a.firstname || '') + ' ' + escapeHTML(a.lastname || '') + '</strong><br/><small style="color:var(--text-muted)">' + escapeHTML(a.email) + (a.phone ? ' · ' + escapeHTML(a.phone) : '') + '</small></td>' +
          '<td>' + escapeHTML(a.position || '—') + '<br/><small style="color:var(--text-muted)">' + escapeHTML(a.location || '—') + '</small></td>' +
          '<td>' + escapeHTML(a.experience || '—') + '<br/><small style="color:var(--text-muted)">Dispo: ' + escapeHTML(a.availability || '—') + '</small></td>' +
          '<td>' + (a.cv_filename ? '<button type="button" class="btn-mini" data-cv-id="' + escapeHTML(a.id) + '" data-testid="dl-cv-btn">CV ↓</button>' : '<span class="muted">—</span>') + '</td>' +
          '<td class="muted">' + escapeHTML(fmtDate(a.created_at)) + '</td>' +
          '<td><button class="btn-mini danger" data-id="' + escapeHTML(a.id) + '" data-testid="del-app-btn">×</button></td>' +
        '</tr>';
      }).join('');
      c.innerHTML = '<table class="admin-tbl"><thead><tr><th>Candidat</th><th>Poste</th><th>Expérience</th><th>CV</th><th>Date</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
      c.querySelectorAll('button[data-testid="del-app-btn"]').forEach(function (btn) {
        btn.addEventListener('click', function () { deleteApp(btn.getAttribute('data-id')); });
      });
      c.querySelectorAll('button[data-testid="dl-cv-btn"]').forEach(function (btn) {
        btn.addEventListener('click', function () { downloadCv(btn.getAttribute('data-cv-id')); });
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

  function deleteApp(id) {
    if (!confirm('Supprimer cette candidature (et son CV) ?')) return;
    api('/admin/applications/' + encodeURIComponent(id), { method: 'DELETE' }).then(function (r) {
      if (r.ok) { toast('Candidature supprimée'); loadApps(); }
      else toast('Erreur ' + r.status, true);
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

  function loadContentBaseline() {
    return api('/admin/content?page=' + encodeURIComponent(contentState.page) + '&lang=' + encodeURIComponent(contentState.lang))
      .then(function (r) {
        if (!r.ok) throw new Error('Erreur ' + r.status);
        return r.json();
      })
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
      if (d.value === base) delete contentState.pending[d.key];
      else contentState.pending[d.key] = d.value;
      updateContentSaveBar();
    } else if (d.type === 'circum-fmt-state') {
      syncAdminFmtToolbar(d);
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

  function saveContentChanges() {
    var keys = Object.keys(contentState.pending);
    if (!keys.length) return;
    var updates = keys.map(function (key) {
      return { key: key, lang: contentState.lang, value: contentState.pending[key] };
    });
    var btn = document.getElementById('content-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement…'; }
    api('/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: updates })
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (j) { throw new Error(j.detail || 'Erreur'); });
      return r.json();
    }).then(function () {
      contentState.pending = {};
      updateContentSaveBar();
      toast('Contenu enregistré — visible immédiatement sur le site');
      reloadPreviewFrame();
    }).catch(function (err) {
      toast(err.message || 'Erreur', true);
    }).finally(function () {
      if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer'; }
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
          : '<span class="news-admin-no-thumb">Sans image</span>';
        return '' +
          '<div class="news-admin-row" data-testid="news-row-' + escapeHTML(item.id) + '">' +
            '<div class="news-admin-row-cover">' + thumb + '</div>' +
            '<div class="news-admin-row-body">' +
              '<strong>' + escapeHTML(item.title) + '</strong>' +
              '<small>' + escapeHTML(item.tag) + ' · ' + escapeHTML(item.date) + '</small>' +
              '<p>' + escapeHTML(item.summary) + '</p>' +
            '</div>' +
            '<div class="news-admin-row-actions">' +
              '<button type="button" class="btn-mini" data-edit-news="' + escapeHTML(item.id) + '">Modifier</button>' +
              '<a class="btn-mini ghost" href="/news-article.html?id=' + encodeURIComponent(item.id) + '" target="_blank" rel="noopener">Voir</a>' +
            '</div>' +
          '</div>';
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
    if (!panel) return;

    document.getElementById('news-edit-id').value = id || '';
    document.getElementById('news-form-title').value = '';
    document.getElementById('news-form-tag').value = '';
    document.getElementById('news-form-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('news-form-summary').value = '';
    document.getElementById('news-form-body').value = '';
    if (coverInput) { coverInput.value = ''; coverInput.required = !id; }
    document.getElementById('news-form-gallery').value = '';
    if (coverPreview) coverPreview.innerHTML = '';
    if (galleryExisting) galleryExisting.innerHTML = '';
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
      document.getElementById('news-form-body').value = item.body_html || '';
      if (item.cover_image && coverPreview) {
        coverPreview.innerHTML = '<img src="' + escapeHTML(newsMediaUrl(item.cover_image)) + '" alt="Couverture actuelle"/>';
      }
      if (item.gallery && item.gallery.length && galleryExisting) {
        galleryExisting.innerHTML = '<div class="news-existing-gallery-title">Images de la galerie</div>' +
          item.gallery.map(function (name) {
            return '' +
              '<label class="news-gallery-remove">' +
                '<input type="checkbox" value="' + escapeHTML(name) + '"/>' +
                '<img src="' + escapeHTML(newsMediaUrl(name)) + '" alt=""/>' +
                '<span>Supprimer</span>' +
              '</label>';
          }).join('');
      }
    } else {
      newsState.editing = null;
      heading.textContent = 'Nouvelle actualité';
      deleteBtn.hidden = true;
    }

    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function closeNewsEditor() {
    var panel = document.getElementById('news-editor-panel');
    if (panel) panel.hidden = true;
    newsState.editing = null;
  }

  function saveNewsArticle(e) {
    e.preventDefault();
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
    }).then(function () {
      toast(id ? 'Actualité mise à jour' : 'Actualité publiée');
      closeNewsEditor();
      loadNewsAdminList();
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
      if (!r.ok) return r.json().then(function (j) { throw new Error(j.detail || 'Erreur'); });
      toast('Actualité supprimée');
      closeNewsEditor();
      loadNewsAdminList();
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
