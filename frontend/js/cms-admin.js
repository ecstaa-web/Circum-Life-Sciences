/**

 * Circum CMS, Gestion des pages (textes uniquement)

 */

(function (global) {

  'use strict';



  var THUMB_CLASS = {
    home: 'thumb-home',
    apropos: 'thumb-apropos',
    design: 'thumb-design',
    fabrication: 'thumb-fabrication',
    clients: 'thumb-clients',
    news: 'thumb-news',
    newsletter: 'thumb-newsletter',
    carrieres: 'thumb-carrieres',
    contact: 'thumb-contact'
  };

  var state = {

    api: null,

    toast: null,

    escapeHTML: null,

    fmtDate: null,

    userRole: 'editor',

    pages: [],

    media: [],

    navigate: null

  };



  function $(sel, root) {

    return (root || document).querySelector(sel);

  }



  function api(path, opts) {

    return state.api(path, opts);

  }



  function toast(msg, err) {

    state.toast(msg, err);

  }



  function esc(s) {

    return state.escapeHTML(s);

  }



  function slugify(str) {

    return String(str || '')

      .toLowerCase()

      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')

      .replace(/[^a-z0-9]+/g, '-')

      .replace(/^-|-$/g, '')

      .slice(0, 80);

  }



  function pagePreviewUrl(p) {

    if (p.page_type === 'static' && p.linked_html) return '/' + p.linked_html;

    return '/p/' + encodeURIComponent(p.slug || '');

  }



  function pageThumbClass(p) {
    return THUMB_CLASS[p.page_id] || 'thumb-default';
  }

  function pageThumbHtml(p) {
    var thumb = pageThumbClass(p);
    var path = p.page_type === 'static' ? (p.linked_html || p.slug) : ('p/' + p.slug);
    return (
      '<div class="cms-page-card-preview ' + thumb + '">' +
        '<div class="cms-page-thumb-browser">' +
          '<div class="cms-page-thumb-chrome">' +
            '<span class="cms-page-thumb-dots"><i></i><i></i><i></i></span>' +
            '<span class="cms-page-thumb-url">' + esc(path) + '</span>' +
          '</div>' +
          '<div class="cms-page-thumb-site">' +
            '<div class="cms-page-thumb-nav"></div>' +
            '<div class="cms-page-thumb-hero"></div>' +
            '<div class="cms-page-thumb-lines"><span></span><span></span></div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  var searchDebounce = null;



  function renderPagesList(container) {

    container.innerHTML =

      '<div class="cms-pages-view">' +

        '<header class="cms-pages-hero studio-reveal">' +

          '<div class="cms-pages-hero-bg" aria-hidden="true">' +

            '<span class="cms-hero-orb cms-hero-orb-1"></span>' +

            '<span class="cms-hero-orb cms-hero-orb-2"></span>' +

            '<span class="cms-hero-grid"></span>' +

          '</div>' +

          '<div class="cms-pages-hero-content">' +

            '<span class="cms-pages-eyebrow">Circum STUDIO · Pages</span>' +

            '<h1>Gérez les textes de votre site</h1>' +

            '<p>Ajoutez, supprimez et modifiez le contenu textuel de chaque page.</p>' +

            '<div class="cms-pages-hero-actions">' +

              '<button type="button" class="cms-btn cms-btn-primary cms-btn-glow" id="cms-new-page">+ Ajouter une page</button>' +

              '<button type="button" class="cms-btn cms-btn-ghost-light" data-action="editor">Éditeur visuel →</button>' +

            '</div>' +

          '</div>' +

          '<div class="cms-pages-hero-stat" id="cms-pages-count">…</div>' +

        '</header>' +

        '<div class="cms-pages-toolbar studio-reveal studio-reveal-delay-1">' +

          '<div class="cms-pages-search-wrap">' +

            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +

            '<input type="search" id="cms-pages-search" placeholder="Rechercher une page…" autocomplete="off"/>' +

          '</div>' +

        '</div>' +

        '<div id="cms-pages-grid" class="cms-pages-grid studio-reveal studio-reveal-delay-2">' +

          '<div class="cms-empty">Chargement…</div>' +

        '</div>' +

      '</div>';



    $('#cms-new-page').addEventListener('click', openNewPageModal);

    container.querySelector('[data-action="editor"]').addEventListener('click', function () {

      if (state.navigate) state.navigate('content');

    });

    var search = $('#cms-pages-search');

    if (search) {
      search.addEventListener('input', function () {
        clearTimeout(searchDebounce);
        var q = search.value.trim().toLowerCase();
        searchDebounce = setTimeout(function () { renderPagesGrid(q); }, 180);
      });
    }

    loadPagesList();

  }



  function loadPagesList() {

    var grid = $('#cms-pages-grid');

    if (grid) grid.innerHTML = '<div class="cms-empty">Chargement…</div>';

    api('/admin/cms/pages').then(function (r) {

      if (!r.ok) {

        return r.text().then(function (text) {

          var msg = 'Erreur ' + r.status;

          try {

            var j = JSON.parse(text);

            if (j && j.detail) msg = typeof j.detail === 'string' ? j.detail : msg;

          } catch (e) { /* ignore */ }

          throw new Error(msg);

        });

      }

      return r.json();

    }).then(function (data) {

      state.pages = data.items || [];

      var countEl = $('#cms-pages-count');

      if (countEl) countEl.textContent = state.pages.length + ' page' + (state.pages.length !== 1 ? 's' : '');

      renderPagesGrid('');

    }).catch(function (e) {

      if (grid) {

        grid.innerHTML =

          '<div class="cms-empty cms-empty-err">' +

            'Impossible de charger les pages. Vérifiez que le backend API tourne (port 8000).' +

          '</div>';

      }

      toast(e.message || 'Erreur chargement des pages', true);

    });

  }



  function renderPagesGrid(query) {

    var grid = $('#cms-pages-grid');

    if (!grid) return;

    var pages = state.pages.slice().sort(function (a, b) {

      if (a.page_type === 'static' && b.page_type !== 'static') return -1;

      if (b.page_type === 'static' && a.page_type !== 'static') return 1;

      return String(a.title || '').localeCompare(String(b.title || ''), 'fr');

    });

    if (query) {

      pages = pages.filter(function (p) {

        return String(p.title || '').toLowerCase().indexOf(query) >= 0 ||

          String(p.slug || '').toLowerCase().indexOf(query) >= 0;

      });

    }

    if (!pages.length) {

      grid.innerHTML = '<div class="cms-empty">' +

        (query ? 'Aucune page ne correspond à votre recherche.' : 'Aucune page disponible.') +

      '</div>';

      return;

    }

    grid.innerHTML = pages.map(function (p) {

      var previewUrl = pagePreviewUrl(p);

      var pathLabel = p.page_type === 'static'

        ? '/' + esc(p.linked_html || p.slug)

        : '/p/' + esc(p.slug);

      var canEdit = !!p.page_id;

      return (
        '<article class="cms-page-card-v2" data-id="' + esc(p.id) + '">' +
          pageThumbHtml(p) +
          '<div class="cms-page-card-body">' +

            '<div class="cms-page-card-meta">' +

              '<span class="cms-page-type">' + (p.page_type === 'static' ? 'Page du site' : 'Page CMS') + '</span>' +

            '</div>' +

            '<h3>' + esc(p.title) + '</h3>' +

            '<p class="cms-page-slug">' + pathLabel + '</p>' +

            '<div class="cms-page-card-actions">' +

              (canEdit

                ? '<button type="button" class="cms-btn cms-btn-sm cms-btn-primary cms-btn-glow" data-action="texts" data-id="' + esc(p.id) + '">Modifier les textes</button>'

                : '<button type="button" class="cms-btn cms-btn-sm" data-action="preview" data-url="' + esc(previewUrl) + '">Ouvrir la page</button>') +

              '<button type="button" class="cms-btn cms-btn-sm" data-action="preview" data-url="' + esc(previewUrl) + '">Aperçu</button>' +

              (p.page_type !== 'static'

                ? '<button type="button" class="cms-btn cms-btn-sm cms-btn-danger" data-action="del" data-id="' + esc(p.id) + '">Supprimer</button>'

                : '') +

            '</div>' +

          '</div>' +

        '</article>'

      );

    }).join('');



    grid.querySelectorAll('[data-action]').forEach(function (btn) {

      btn.addEventListener('click', function () {

        var action = btn.getAttribute('data-action');

        var id = btn.getAttribute('data-id');

        var page = state.pages.find(function (p) { return p.id === id; });

        if (action === 'texts' && page) editPageTexts(page);

        else if (action === 'preview') window.open(btn.getAttribute('data-url'), '_blank');

        else if (action === 'del') deletePage(id);

      });

    });

  }



  function editPageTexts(page) {

    if (!page.page_id) {

      toast('Cette page s\'ouvre en aperçu. Les textes des pages du site se modifient via l\'éditeur visuel.', true);

      return;

    }

    if (state.navigate) {

      state.navigate('content', { contentPage: page.page_id });

    }

  }



  function openNewPageModal() {

    var modal = document.createElement('div');

    modal.className = 'cms-modal-bg cms-modal-bg-premium';

    modal.innerHTML =

      '<div class="cms-modal cms-modal-premium" role="dialog">' +

        '<div class="cms-modal-head"><h2>Nouvelle page</h2><button type="button" class="cms-modal-close">&times;</button></div>' +

        '<p class="cms-modal-intro">Créez une page supplémentaire. Vous pourrez ensuite modifier ses textes depuis l\'éditeur visuel.</p>' +

        '<form id="cms-new-form" class="cms-form">' +

          '<label>Titre<input type="text" name="title" required placeholder="Ma nouvelle page"/></label>' +

          '<label>Slug (URL)<input type="text" name="slug" placeholder="ma-nouvelle-page"/></label>' +

          '<div class="cms-form-actions">' +

            '<button type="button" class="cms-btn cms-modal-cancel">Annuler</button>' +

            '<button type="submit" class="cms-btn cms-btn-primary cms-btn-glow">Créer</button>' +

          '</div>' +

        '</form>' +

      '</div>';

    document.body.appendChild(modal);

    var titleInp = modal.querySelector('[name=title]');

    var slugInp = modal.querySelector('[name=slug]');

    titleInp.addEventListener('input', function () {

      if (!slugInp.dataset.touched) slugInp.value = slugify(titleInp.value);

    });

    slugInp.addEventListener('input', function () { slugInp.dataset.touched = '1'; });

    function close() { modal.remove(); }

    modal.querySelector('.cms-modal-close').addEventListener('click', close);

    modal.querySelector('.cms-modal-cancel').addEventListener('click', close);

    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });

    modal.querySelector('#cms-new-form').addEventListener('submit', function (e) {

      e.preventDefault();

      var title = titleInp.value.trim();

      var slug = slugify(slugInp.value || title);

      api('/admin/cms/pages', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ title: title, slug: slug })

      }).then(function (r) { return r.json(); }).then(function () {

        toast('Page créée');

        close();

        loadPagesList();

      }).catch(function (err) { toast(err.message, true); });

    });

    titleInp.focus();

  }



  function deletePage(id) {

    if (!confirm('Supprimer définitivement cette page ?')) return;

    api('/admin/cms/pages/' + id, { method: 'DELETE' })

      .then(function () { toast('Page supprimée'); loadPagesList(); })

      .catch(function (e) { toast(e.message, true); });

  }



  function loadMediaLibrary() {

    return api('/admin/cms/media').then(function (r) { return r.json(); }).then(function (data) {

      state.media = data.items || [];

    }).catch(function () { state.media = []; });

  }



  function renderMediaView(container) {

    container.innerHTML =

      '<div class="cms-media-view">' +

        '<header class="cms-pages-hero studio-reveal">' +

          '<div class="cms-pages-hero-bg" aria-hidden="true">' +

            '<span class="cms-hero-orb cms-hero-orb-1"></span>' +

            '<span class="cms-hero-orb cms-hero-orb-2"></span>' +

            '<span class="cms-hero-grid"></span>' +

          '</div>' +

          '<div class="cms-pages-hero-content">' +

            '<span class="cms-pages-eyebrow">Circum STUDIO · Médias</span>' +

            '<h1>Bibliothèque d\'images</h1>' +

            '<p>Importez, rognez et supprimez vos visuels pour le site.</p>' +

            '<label class="cms-btn cms-btn-primary cms-btn-glow cms-upload-label">' +

              '+ Importer des images<input type="file" id="cms-media-upload" accept="image/*" multiple hidden/>' +

            '</label>' +

          '</div>' +

          '<div class="cms-pages-hero-stat" id="cms-media-count">…</div>' +

        '</header>' +

        '<div id="cms-media-grid" class="cms-media-grid cms-media-grid-v2 studio-reveal studio-reveal-delay-1">' +

          '<div class="cms-empty">Chargement…</div>' +

        '</div>' +

      '</div>';

    $('#cms-media-upload').addEventListener('change', uploadMediaFiles);

    refreshMediaGrid();

  }



  function refreshMediaGrid() {

    loadMediaLibrary().then(function () {

      var grid = $('#cms-media-grid');

      var countEl = $('#cms-media-count');

      if (countEl) countEl.textContent = state.media.length + ' image' + (state.media.length !== 1 ? 's' : '');

      if (!grid) return;

      if (!state.media.length) {

        grid.innerHTML = '<div class="cms-empty cms-empty-wide">Aucun média. Importez une image pour commencer.</div>';

        return;

      }

      grid.innerHTML = state.media.map(function (m) {

        var canCrop = m.mime !== 'image/svg+xml' && m.mime !== 'image/gif';

        return (

          '<figure class="cms-media-item cms-media-item-v2" data-id="' + esc(m.id) + '">' +

            '<div class="cms-media-thumb">' +

              '<img src="' + esc(m.url) + '?v=' + esc(String(m.size || '')) + '" alt="' + esc(m.alt || '') + '" loading="lazy"/>' +

              '<div class="cms-media-overlay">' +

                (canCrop ? '<button type="button" class="cms-media-act" data-act="crop" data-id="' + esc(m.id) + '" title="Rogner">✂</button>' : '') +

                '<button type="button" class="cms-media-act cms-media-act-danger" data-act="del" data-id="' + esc(m.id) + '" title="Supprimer">×</button>' +

              '</div>' +

            '</div>' +

            '<figcaption>' + esc(m.filename || m.original_name || 'Image') + '</figcaption>' +

          '</figure>'

        );

      }).join('');



      grid.querySelectorAll('[data-act]').forEach(function (btn) {

        btn.addEventListener('click', function (ev) {

          ev.stopPropagation();

          var id = btn.getAttribute('data-id');

          var item = state.media.find(function (m) { return m.id === id; });

          if (!item) return;

          if (btn.getAttribute('data-act') === 'del') {

            if (!confirm('Supprimer cette image ?')) return;

            api('/admin/cms/media/' + id, { method: 'DELETE' })

              .then(function () { toast('Image supprimée'); refreshMediaGrid(); })

              .catch(function (e) { toast(e.message, true); });

          } else if (btn.getAttribute('data-act') === 'crop') {

            openCropModal(item);

          }

        });

      });
    });
  }



  function openCropModal(media) {

    var modal = document.createElement('div');

    modal.className = 'cms-modal-bg cms-modal-bg-premium';

    modal.innerHTML =

      '<div class="cms-modal cms-modal-wide cms-modal-premium cms-crop-modal" role="dialog">' +

        '<div class="cms-modal-head"><h2>Rogner l\'image</h2><button type="button" class="cms-modal-close">&times;</button></div>' +

        '<p class="cms-modal-intro">Déplacez et redimensionnez la zone de sélection, puis validez.</p>' +

        '<div class="crop-toolbar">' +

          '<button type="button" class="cms-chip crop-ratio active" data-ratio="free">Libre</button>' +

          '<button type="button" class="cms-chip crop-ratio" data-ratio="1">1:1</button>' +

          '<button type="button" class="cms-chip crop-ratio" data-ratio="1.777">16:9</button>' +

          '<button type="button" class="cms-chip crop-ratio" data-ratio="1.333">4:3</button>' +

        '</div>' +

        '<div class="crop-stage" id="crop-stage">' +

          '<img class="crop-img" id="crop-img" alt="" draggable="false"/>' +

          '<div class="crop-box" id="crop-box"><span class="crop-handle crop-handle-se"></span></div>' +

        '</div>' +

        '<div class="cms-form-actions">' +

          '<button type="button" class="cms-btn cms-modal-cancel">Annuler</button>' +

          '<button type="button" class="cms-btn cms-btn-primary cms-btn-glow" id="crop-apply">Appliquer le rognage</button>' +

        '</div>' +

      '</div>';

    document.body.appendChild(modal);



    var cropState = {

      ratio: null,

      nx: 0.1, ny: 0.1, nw: 0.8, nh: 0.8,

      drag: null,

      imgW: 0, imgH: 0,

      dispW: 0, dispH: 0, dispX: 0, dispY: 0

    };



    var stage = modal.querySelector('#crop-stage');

    var imgEl = modal.querySelector('#crop-img');

    var boxEl = modal.querySelector('#crop-box');

    var img = new Image();

    img.crossOrigin = 'anonymous';



    function close() { modal.remove(); }



    function layoutCrop() {

      if (!cropState.dispW) return;

      var bx = cropState.dispX + cropState.nx * cropState.dispW;

      var by = cropState.dispY + cropState.ny * cropState.dispH;

      var bw = cropState.nw * cropState.dispW;

      var bh = cropState.nh * cropState.dispH;

      boxEl.style.left = bx + 'px';

      boxEl.style.top = by + 'px';

      boxEl.style.width = bw + 'px';

      boxEl.style.height = bh + 'px';

    }



    function layoutImage() {

      var sw = stage.clientWidth;

      var sh = Math.min(420, stage.clientWidth * 0.65);

      stage.style.height = sh + 'px';

      if (!cropState.imgW) return;

      var scale = Math.min(sw / cropState.imgW, sh / cropState.imgH);

      cropState.dispW = cropState.imgW * scale;

      cropState.dispH = cropState.imgH * scale;

      cropState.dispX = (sw - cropState.dispW) / 2;

      cropState.dispY = (sh - cropState.dispH) / 2;

      imgEl.style.width = cropState.dispW + 'px';

      imgEl.style.height = cropState.dispH + 'px';

      imgEl.style.left = cropState.dispX + 'px';

      imgEl.style.top = cropState.dispY + 'px';

      layoutCrop();

    }



    function clampCrop() {

      cropState.nx = Math.max(0, Math.min(1 - cropState.nw, cropState.nx));

      cropState.ny = Math.max(0, Math.min(1 - cropState.nh, cropState.ny));

      cropState.nw = Math.max(0.08, Math.min(1 - cropState.nx, cropState.nw));

      cropState.nh = Math.max(0.08, Math.min(1 - cropState.ny, cropState.nh));

      if (cropState.ratio) {

        cropState.nh = cropState.nw / cropState.ratio * (cropState.dispW / cropState.dispH);

        if (cropState.ny + cropState.nh > 1) {

          cropState.nh = 1 - cropState.ny;

          cropState.nw = cropState.nh * cropState.ratio * (cropState.dispH / cropState.dispW);

        }

      }

      layoutCrop();

    }



    function pointerPos(e) {

      var r = stage.getBoundingClientRect();

      var x = (e.clientX || (e.touches && e.touches[0].clientX)) - r.left;

      var y = (e.clientY || (e.touches && e.touches[0].clientY)) - r.top;

      return { x: x, y: y };

    }



    boxEl.addEventListener('mousedown', function (e) {

      if (e.target.classList.contains('crop-handle-se')) {

        cropState.drag = { mode: 'resize', sx: e.clientX, sy: e.clientY, ox: cropState.nx, oy: cropState.ny, ow: cropState.nw, oh: cropState.nh };

      } else {

        cropState.drag = { mode: 'move', sx: e.clientX, sy: e.clientY, ox: cropState.nx, oy: cropState.ny };

      }

      e.preventDefault();

    });



    function onMove(e) {

      if (!cropState.drag || !cropState.dispW) return;

      var dx = (e.clientX - cropState.drag.sx) / cropState.dispW;

      var dy = (e.clientY - cropState.drag.sy) / cropState.dispH;

      if (cropState.drag.mode === 'move') {

        cropState.nx = cropState.drag.ox + dx;

        cropState.ny = cropState.drag.oy + dy;

      } else {

        cropState.nw = Math.max(0.08, cropState.drag.ow + dx);

        cropState.nh = Math.max(0.08, cropState.drag.oh + dy);

        if (cropState.ratio) {

          cropState.nh = cropState.nw / cropState.ratio * (cropState.dispW / cropState.dispH);

        }

      }

      clampCrop();

    }



    function onUp() { cropState.drag = null; }

    document.addEventListener('mousemove', onMove);

    document.addEventListener('mouseup', onUp);



    modal.querySelectorAll('.crop-ratio').forEach(function (btn) {

      btn.addEventListener('click', function () {

        modal.querySelectorAll('.crop-ratio').forEach(function (b) { b.classList.remove('active'); });

        btn.classList.add('active');

        var r = btn.getAttribute('data-ratio');

        cropState.ratio = r === 'free' ? null : parseFloat(r);

        clampCrop();

      });

    });



    img.onload = function () {

      cropState.imgW = img.naturalWidth;

      cropState.imgH = img.naturalHeight;

      imgEl.src = img.src;

      layoutImage();

    };

    img.onerror = function () { toast('Impossible de charger l\'image', true); close(); };

    img.src = media.url + (media.url.indexOf('?') >= 0 ? '&' : '?') + 'crop=' + Date.now();



    modal.querySelector('.cms-modal-close').addEventListener('click', function () { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); close(); });

    modal.querySelector('.cms-modal-cancel').addEventListener('click', function () { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); close(); });

    modal.addEventListener('click', function (e) {

      if (e.target === modal) {

        document.removeEventListener('mousemove', onMove);

        document.removeEventListener('mouseup', onUp);

        close();

      }

    });



    modal.querySelector('#crop-apply').addEventListener('click', function () {

      var cx = Math.round(cropState.nx * cropState.imgW);

      var cy = Math.round(cropState.ny * cropState.imgH);

      var cw = Math.round(cropState.nw * cropState.imgW);

      var ch = Math.round(cropState.nh * cropState.imgH);

      var canvas = document.createElement('canvas');

      canvas.width = Math.max(1, cw);

      canvas.height = Math.max(1, ch);

      var ctx = canvas.getContext('2d');

      ctx.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);

      canvas.toBlob(function (blob) {

        if (!blob) { toast('Erreur lors du rognage', true); return; }

        var fd = new FormData();

        fd.append('file', blob, 'cropped.jpg');

        api('/admin/cms/media/' + media.id, { method: 'PUT', body: fd })

          .then(function (r) {

            if (!r.ok) return r.json().then(function (j) { throw new Error(j.detail || 'Erreur'); });

            return r.json();

          })

          .then(function () {

            toast('Image rognée');

            document.removeEventListener('mousemove', onMove);

            document.removeEventListener('mouseup', onUp);

            close();

            refreshMediaGrid();

          })

          .catch(function (e) { toast(e.message || 'Erreur rognage', true); });

      }, 'image/jpeg', 0.92);

    });



    window.addEventListener('resize', layoutImage);

    modal.addEventListener('remove', function () { window.removeEventListener('resize', layoutImage); });

  }



  function uploadMediaFiles(e) {

    var files = e.target.files;

    if (!files || !files.length) return;

    Array.from(files).forEach(function (file) {

      var fd = new FormData();

      fd.append('file', file);

      fd.append('alt', file.name);

      api('/admin/cms/media', { method: 'POST', body: fd })

        .then(function () { refreshMediaGrid(); toast('Image importée'); })

        .catch(function (err) { toast(err.message, true); });

    });

    e.target.value = '';

  }



  function switchToView(view, internal) {

    if (state.navigate && !internal) {

      state.navigate(view);

      return;

    }

    document.querySelectorAll('.admin-nav-item').forEach(function (t) {

      t.classList.toggle('active', t.getAttribute('data-view') === view);

    });

    document.querySelectorAll('.admin-view').forEach(function (v) {

      v.classList.toggle('active', v.id === 'view-' + view);

    });

    var shell = document.getElementById('admin-shell');

    if (shell) {

      shell.classList.toggle('admin-wide', view === 'content');

    }

    var container = $('#view-' + view);

    if (!container) return;

    if (view === 'cms-pages') renderPagesList(container);
    else if (view === 'cms-media') renderMediaView(container);
    if (global.CircumDecor) global.CircumDecor.refresh();

  }



  function init(deps) {

    state.api = deps.api;

    state.toast = deps.toast;

    state.escapeHTML = deps.escapeHTML;

    state.fmtDate = deps.fmtDate;

    state.userRole = deps.userRole || 'editor';

    state.navigate = deps.navigate || null;



    var pagesView = $('#view-cms-pages');

    if (pagesView && !pagesView.dataset.cmsReady) {

      pagesView.dataset.cmsReady = '1';

      renderPagesList(pagesView);

    }

  }



  global.CircumAdmin = { navigate: function (v, o) { if (state.navigate) state.navigate(v, o); } };



  global.CircumCms = {
    init: init,
    switchToView: switchToView
  };

})(window);

