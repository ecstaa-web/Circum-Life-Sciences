/**
 * Circum STUDIO — Page Builder (MVP premium)
 * Bibliothèque · Canvas · Aperçu + Propriétés
 */
(function (global) {
  'use strict';

  var deps = {};
  var page = null;
  var selectedId = null;
  var paletteFocus = null;
  var dirty = false;
  var viewport = 'desktop';
  var zoom = 100;
  var undoStack = [];
  var redoStack = [];
  var dropIndex = null;
  var inspectorTab = 'preview';
  var templatesCache = null;

  var CATEGORIES = [
    { id: 'all', label: 'Tous' },
    { id: 'sections', label: 'Sections' },
    { id: 'content', label: 'Contenu' },
    { id: 'media', label: 'Média' },
    { id: 'layout', label: 'Layout' },
    { id: 'conversion', label: 'Conversion' }
  ];

  var CATALOG = {
    hero: { cat: 'sections', label: 'Hero', desc: 'Grande bannière d\'accroche avec titre, texte et bouton d\'action.', thumb: 'hero' },
    header: { cat: 'sections', label: 'En-tête', desc: 'Barre de navigation avec logo et liens.', thumb: 'header' },
    text: { cat: 'content', label: 'Texte riche', desc: 'Paragraphes, listes et mise en forme HTML.', thumb: 'text' },
    card: { cat: 'content', label: 'Carte', desc: 'Bloc visuel avec image, titre et lien.', thumb: 'card' },
    columns: { cat: 'layout', label: 'Grille', desc: 'Colonnes de contenu côte à côte (2 ou 3).', thumb: 'columns' },
    image: { cat: 'media', label: 'Image', desc: 'Image pleine largeur avec légende optionnelle.', thumb: 'image' },
    gallery: { cat: 'media', label: 'Galerie', desc: 'Grille d\'images responsive.', thumb: 'gallery' },
    video: { cat: 'media', label: 'Vidéo', desc: 'Lecteur vidéo intégré.', thumb: 'video' },
    button: { cat: 'conversion', label: 'Bouton', desc: 'Bouton d\'action isolé, style primary ou outline.', thumb: 'button' },
    cta: { cat: 'conversion', label: 'Appel à action', desc: 'Section conversion avec titre et bouton.', thumb: 'cta' },
    form: { cat: 'conversion', label: 'Formulaire', desc: 'Formulaire de contact simple.', thumb: 'form' },
    footer: { cat: 'sections', label: 'Pied de page', desc: 'Footer avec liens et copyright.', thumb: 'footer' },
    divider: { cat: 'layout', label: 'Séparateur', desc: 'Ligne de séparation décorative.', thumb: 'divider' },
    spacer: { cat: 'layout', label: 'Espacement', desc: 'Espace vertical réglable.', thumb: 'spacer' }
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function api(path, opts) { return deps.api(path, opts); }
  function toast(msg, err) { deps.toast(msg, err); }
  function esc(s) { return deps.esc(s); }

  function genId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  function thumbSvg(type) {
    var svgs = {
      hero: '<svg viewBox="0 0 48 36"><rect width="48" height="36" rx="4" fill="#163d6b"/><rect x="6" y="10" width="20" height="3" rx="1" fill="#f365b4"/><rect x="6" y="16" width="30" height="4" rx="1" fill="#fff" opacity=".9"/><rect x="6" y="24" width="14" height="5" rx="2.5" fill="#f365b4"/></svg>',
      header: '<svg viewBox="0 0 48 36"><rect width="48" height="36" rx="4" fill="#fff" stroke="#e0e0e0"/><rect x="6" y="14" width="12" height="3" rx="1" fill="#205a99"/><rect x="28" y="14" width="6" height="2" rx="1" fill="#ccc"/><rect x="36" y="14" width="6" height="2" rx="1" fill="#ccc"/></svg>',
      text: '<svg viewBox="0 0 48 36"><rect width="48" height="36" rx="4" fill="#fff" stroke="#e0e0e0"/><rect x="6" y="10" width="36" height="2" rx="1" fill="#ccc"/><rect x="6" y="16" width="32" height="2" rx="1" fill="#ccc"/><rect x="6" y="22" width="28" height="2" rx="1" fill="#ccc"/></svg>',
      card: '<svg viewBox="0 0 48 36"><rect width="48" height="36" rx="4" fill="#fff" stroke="#e0e0e0"/><rect x="8" y="6" width="32" height="14" rx="3" fill="#eef0f4"/><rect x="8" y="24" width="20" height="2" rx="1" fill="#205a99"/></svg>',
      columns: '<svg viewBox="0 0 48 36"><rect width="48" height="36" rx="4" fill="#fff" stroke="#e0e0e0"/><rect x="5" y="8" width="17" height="20" rx="2" fill="#eef0f4"/><rect x="26" y="8" width="17" height="20" rx="2" fill="#eef0f4"/></svg>',
      image: '<svg viewBox="0 0 48 36"><rect width="48" height="36" rx="4" fill="#eef0f4" stroke="#e0e0e0"/><circle cx="16" cy="14" r="4" fill="#205a99" opacity=".3"/><path d="M6 28l10-10 8 8 6-6 12 12H6z" fill="#205a99" opacity=".25"/></svg>',
      gallery: '<svg viewBox="0 0 48 36"><rect width="48" height="36" rx="4" fill="#fff" stroke="#e0e0e0"/><rect x="5" y="7" width="11" height="10" rx="2" fill="#eef0f4"/><rect x="18" y="7" width="11" height="10" rx="2" fill="#eef0f4"/><rect x="31" y="7" width="11" height="10" rx="2" fill="#eef0f4"/><rect x="5" y="19" width="11" height="10" rx="2" fill="#eef0f4"/><rect x="18" y="19" width="11" height="10" rx="2" fill="#eef0f4"/><rect x="31" y="19" width="11" height="10" rx="2" fill="#eef0f4"/></svg>',
      video: '<svg viewBox="0 0 48 36"><rect width="48" height="36" rx="4" fill="#1d1d1f"/><polygon points="20,12 20,24 32,18" fill="#fff" opacity=".8"/></svg>',
      button: '<svg viewBox="0 0 48 36"><rect width="48" height="36" rx="4" fill="#fff" stroke="#e0e0e0"/><rect x="12" y="14" width="24" height="8" rx="4" fill="#205a99"/></svg>',
      cta: '<svg viewBox="0 0 48 36"><rect width="48" height="36" rx="4" fill="url(#g)"/><defs><linearGradient id="g" x1="0" y1="0" x2="48" y2="36"><stop stop-color="#f0f5fb"/><stop offset="1" stop-color="#fef3f8"/></linearGradient></defs><rect x="10" y="12" width="28" height="3" rx="1" fill="#205a99"/><rect x="16" y="22" width="16" height="6" rx="3" fill="#f365b4"/></svg>',
      form: '<svg viewBox="0 0 48 36"><rect width="48" height="36" rx="4" fill="#fff" stroke="#e0e0e0"/><rect x="8" y="8" width="32" height="4" rx="2" fill="#f5f5f7"/><rect x="8" y="16" width="32" height="4" rx="2" fill="#f5f5f7"/><rect x="8" y="24" width="32" height="6" rx="2" fill="#f5f5f7"/></svg>',
      footer: '<svg viewBox="0 0 48 36"><rect width="48" height="36" rx="4" fill="#163d6b"/><rect x="10" y="14" width="28" height="2" rx="1" fill="#fff" opacity=".5"/><rect x="14" y="22" width="8" height="2" rx="1" fill="#fff" opacity=".3"/><rect x="26" y="22" width="8" height="2" rx="1" fill="#fff" opacity=".3"/></svg>',
      divider: '<svg viewBox="0 0 48 36"><rect width="48" height="36" rx="4" fill="#fff" stroke="#e0e0e0"/><line x1="6" y1="18" x2="42" y2="18" stroke="#ccc" stroke-width="1"/></svg>',
      spacer: '<svg viewBox="0 0 48 36"><rect width="48" height="36" rx="4" fill="#fff" stroke="#e0e0e0" stroke-dasharray="3 2"/><rect x="6" y="16" width="36" height="4" rx="1" fill="#eef0f4"/></svg>'
    };
    return svgs[type] || svgs.text;
  }

  function snapshot() {
    return JSON.stringify(page.blocks || []);
  }

  function pushUndo() {
    undoStack.push(snapshot());
    if (undoStack.length > 40) undoStack.shift();
    redoStack = [];
    updateUndoButtons();
  }

  function applySnapshot(json) {
    try { page.blocks = JSON.parse(json); } catch (e) { /* ignore */ }
    dirty = true;
    updateSaveBadge();
    renderCanvas();
    renderInspector();
    updateUndoButtons();
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    applySnapshot(undoStack.pop());
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    applySnapshot(redoStack.pop());
  }

  function updateUndoButtons() {
    var u = $('#studio-undo-btn');
    var r = $('#studio-redo-btn');
    if (u) u.disabled = !undoStack.length;
    if (r) r.disabled = !redoStack.length;
  }

  function markDirty() {
    dirty = true;
    updateSaveBadge();
  }

  function markSaved() {
    dirty = false;
    updateSaveBadge();
  }

  function updateSaveBadge() {
    var b = $('#studio-save-badge');
    if (!b) return;
    b.textContent = dirty ? 'Modifications non enregistrées' : 'Enregistré';
    b.classList.toggle('is-dirty', dirty);
  }

  function getBlock(id) {
    return (page.blocks || []).find(function (b) { return b.id === id; });
  }

  function fetchTemplates() {
    if (templatesCache) return Promise.resolve(templatesCache);
    return api('/admin/cms/block-templates').then(function (r) { return r.json(); }).then(function (data) {
      templatesCache = data.templates || {};
      return templatesCache;
    });
  }

  function cloneTemplate(type) {
    return fetchTemplates().then(function (tpls) {
      var tpl = tpls[type];
      if (!tpl) throw new Error('Bloc inconnu');
      var block = JSON.parse(JSON.stringify(tpl));
      block.id = genId();
      return block;
    });
  }

  function addBlock(type, atIndex) {
    pushUndo();
    return cloneTemplate(type).then(function (block) {
      page.blocks = page.blocks || [];
      if (atIndex == null || atIndex < 0 || atIndex > page.blocks.length) {
        page.blocks.push(block);
      } else {
        page.blocks.splice(atIndex, 0, block);
      }
      markDirty();
      selectedId = block.id;
      paletteFocus = null;
      inspectorTab = 'props';
      renderCanvas();
      renderLibrary();
      renderInspector();
      toast('Bloc ajouté');
    }).catch(function (e) { toast(e.message, true); });
  }

  function removeBlock(id) {
    pushUndo();
    page.blocks = (page.blocks || []).filter(function (b) { return b.id !== id; });
    if (selectedId === id) selectedId = null;
    markDirty();
    renderCanvas();
    renderInspector();
  }

  function moveBlock(id, dir) {
    var blocks = page.blocks || [];
    var idx = blocks.findIndex(function (b) { return b.id === id; });
    var next = idx + dir;
    if (idx < 0 || next < 0 || next >= blocks.length) return;
    pushUndo();
    var tmp = blocks[idx];
    blocks[idx] = blocks[next];
    blocks[next] = tmp;
    markDirty();
    renderCanvas();
  }

  function reorderBlock(draggedId, targetId, after) {
    if (draggedId === targetId) return;
    var blocks = page.blocks || [];
    var from = blocks.findIndex(function (b) { return b.id === draggedId; });
    var to = blocks.findIndex(function (b) { return b.id === targetId; });
    if (from < 0 || to < 0) return;
    pushUndo();
    var item = blocks.splice(from, 1)[0];
    var insertAt = to + (after ? 1 : 0);
    if (from < insertAt) insertAt--;
    blocks.splice(insertAt, 0, item);
    markDirty();
    renderCanvas();
  }

  function renderBlockHtml(block, editable) {
    if (!block) return '';
    var t = block.type;
    var align = block.align ? ' align-' + block.align : '';
    if (t === 'hero') {
      var bg = block.bg_image ? ' style="background-image:url(' + esc(block.bg_image) + ')"' : '';
      return '<div class="studio-render-hero"' + bg + '>' +
        '<small contenteditable="' + !!editable + '" data-prop="eyebrow">' + esc(block.eyebrow || '') + '</small>' +
        '<h2 contenteditable="' + !!editable + '" data-prop="title">' + esc(block.title || '') + '</h2>' +
        '<div contenteditable="' + !!editable + '" data-prop="subtitle">' + (block.subtitle || '') + '</div>' +
        (block.cta_label ? '<span class="studio-render-btn primary">' + esc(block.cta_label) + '</span>' : '') +
      '</div>';
    }
    if (t === 'header') {
      var cls = block.style === 'dark' ? ' studio-render-header dark' : ' studio-render-header';
      var links = (block.links || []).map(function (l) {
        return '<span>' + esc(l.label || '') + '</span>';
      }).join('');
      return '<div class="' + cls.trim() + '"><strong>' + esc(block.brand || '') + '</strong><nav>' + links + '</nav></div>';
    }
    if (t === 'text') {
      return '<div class="studio-render-text' + align + '" contenteditable="' + !!editable + '" data-prop="content">' + (block.content || '') + '</div>';
    }
    if (t === 'image') {
      return block.src
        ? '<div class="studio-render-image"><img src="' + esc(block.src) + '" alt="' + esc(block.alt || '') + '"/></div>'
        : '<div class="studio-render-placeholder">Choisir une image</div>';
    }
    if (t === 'gallery') {
      var cols = block.columns || '3';
      var cells = (block.images || []).map(function (img) {
        return img.src
          ? '<div class="g-cell"><img src="' + esc(img.src) + '" alt=""/></div>'
          : '<div class="g-cell">Image</div>';
      }).join('');
      return '<div class="studio-render-gallery cols-' + esc(cols) + '">' + cells + '</div>';
    }
    if (t === 'button') {
      var bcls = block.style === 'outline' ? 'outline' : 'primary';
      return '<div class="studio-render-btn-wrap' + align + '"><span class="studio-render-btn ' + bcls + '">' + esc(block.label || 'Bouton') + '</span></div>';
    }
    if (t === 'card') {
      return '<div class="studio-render-card">' +
        (block.image ? '<div class="card-img" style="background-image:url(' + esc(block.image) + ')"></div>' : '<div class="card-img"></div>') +
        '<div class="card-body"><h3>' + esc(block.title || '') + '</h3><div>' + (block.text || '') + '</div></div></div>';
    }
    if (t === 'columns') {
      return '<div class="studio-render-columns cols-' + esc(block.layout || '2') + '">' +
        (block.columns || []).map(function (c) { return '<div>' + (c.content || '') + '</div>'; }).join('') + '</div>';
    }
    if (t === 'cta') {
      return '<div class="studio-render-cta"><h3>' + esc(block.title || '') + '</h3><p>' + (block.text || '') + '</p>' +
        '<span class="studio-render-btn primary">' + esc(block.btn_label || '') + '</span></div>';
    }
    if (t === 'form') {
      var fields = (block.fields || ['name', 'email', 'message']).map(function () {
        return '<div class="f-field"></div>';
      }).join('');
      return '<div class="studio-render-form"><h3>' + esc(block.title || '') + '</h3><p>' + esc(block.subtitle || '') + '</p>' + fields +
        '<div class="studio-render-btn primary studio-render-btn" style="margin-top:12px;display:inline-block">' + esc(block.submit_label || 'Envoyer') + '</div></div>';
    }
    if (t === 'footer') {
      var flinks = (block.links || []).map(function (l) { return '<span>' + esc(l.label || '') + '</span>'; }).join('');
      return '<div class="studio-render-footer"><p>' + esc(block.text || '') + '</p><nav>' + flinks + '</nav><small>' + esc(block.copyright || '') + '</small></div>';
    }
    if (t === 'spacer') {
      return '<div class="studio-render-spacer" style="height:' + (block.height || 48) + 'px"></div>';
    }
    if (t === 'divider') {
      return '<hr class="studio-render-divider ' + esc(block.style || 'line') + '"/>';
    }
    if (t === 'video') {
      return block.src
        ? '<div class="studio-render-video"><video src="' + esc(block.src) + '" controls></video></div>'
        : '<div class="studio-render-placeholder">Ajouter une vidéo</div>';
    }
    return '<div class="studio-render-placeholder">' + esc(t) + '</div>';
  }

  function renderDemoBlock(type) {
    return fetchTemplates().then(function (tpls) {
      var demo = tpls[type] ? JSON.parse(JSON.stringify(tpls[type])) : { type: type };
      return renderBlockHtml(demo, false);
    });
  }

  function renderLibrary() {
    var list = $('#studio-block-list');
    if (!list) return;
    var cat = list.getAttribute('data-cat') || 'all';
    var types = Object.keys(CATALOG).filter(function (type) {
      return cat === 'all' || CATALOG[type].cat === cat;
    });
    list.innerHTML = types.map(function (type) {
      var c = CATALOG[type];
      var focused = paletteFocus === type ? ' is-focused' : '';
      return '<button type="button" class="studio-block-item' + focused + '" draggable="true" data-block-type="' + type + '">' +
        '<span class="studio-block-thumb">' + thumbSvg(type) + '</span>' +
        '<span class="studio-block-meta"><strong>' + esc(c.label) + '</strong><span>' + esc(c.desc.slice(0, 42)) + '…</span></span>' +
      '</button>';
    }).join('');

    list.querySelectorAll('.studio-block-item').forEach(function (item) {
      var type = item.getAttribute('data-block-type');
      item.addEventListener('click', function () {
        paletteFocus = type;
        selectedId = null;
        inspectorTab = 'preview';
        renderLibrary();
        renderInspector();
      });
      item.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/cms-block-type', type);
        e.dataTransfer.effectAllowed = 'copy';
      });
      item.addEventListener('dblclick', function () { addBlock(type); });
    });
  }

  function renderCanvas() {
    var inner = $('#studio-canvas-inner');
    var frame = $('#studio-canvas-frame');
    if (!inner || !page) return;

    var blocks = page.blocks || [];
    var html = '';
    if (!blocks.length) {
      html = '<div class="studio-drop-hint">Glissez un bloc depuis la bibliothèque<br/><small>ou sélectionnez un design à droite puis « Ajouter »</small></div>';
    }
    blocks.forEach(function (block, idx) {
      if (dropIndex === idx) html += '<div class="studio-drop-line is-visible"></div>';
      var sel = selectedId === block.id ? ' is-selected' : '';
      html += '<div class="studio-block' + sel + '" data-block-id="' + esc(block.id) + '" data-index="' + idx + '" draggable="true">' +
        '<div class="studio-block-bar">' +
          '<span class="studio-block-handle">⠿</span>' +
          '<span>' + esc(CATALOG[block.type] ? CATALOG[block.type].label : block.type) + '</span>' +
          '<button type="button" data-act="up" title="Monter">↑</button>' +
          '<button type="button" data-act="down" title="Descendre">↓</button>' +
          '<button type="button" data-act="del" title="Supprimer">×</button>' +
        '</div>' +
        '<div class="studio-block-body">' + renderBlockHtml(block, true) + '</div>' +
      '</div>';
    });
    if (dropIndex === blocks.length) html += '<div class="studio-drop-line is-visible"></div>';
    inner.innerHTML = html;

    if (frame) {
      frame.className = 'studio-canvas-frame vp-' + viewport;
    }
    var scaler = $('#studio-canvas-scaler');
    if (scaler) scaler.style.transform = 'scale(' + (zoom / 100) + ')';

    bindCanvasEvents(inner);
  }

  function bindCanvasEvents(inner) {
    inner.querySelectorAll('.studio-block').forEach(function (el) {
      var id = el.getAttribute('data-block-id');
      el.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        selectedId = id;
        paletteFocus = null;
        inspectorTab = 'props';
        renderCanvas();
        renderLibrary();
        renderInspector();
      });
      el.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/cms-block-id', id);
        e.dataTransfer.effectAllowed = 'move';
      });
      el.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var rect = el.getBoundingClientRect();
        var after = e.clientY > rect.top + rect.height / 2;
        var idx = parseInt(el.getAttribute('data-index'), 10);
        dropIndex = after ? idx + 1 : idx;
        el.classList.add('is-drag-target');
        renderCanvasDropLinesOnly();
      });
      el.addEventListener('dragleave', function () { el.classList.remove('is-drag-target'); });
      el.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropIndex = null;
        var newType = e.dataTransfer.getData('text/cms-block-type');
        var draggedId = e.dataTransfer.getData('text/cms-block-id');
        var rect = el.getBoundingClientRect();
        var after = e.clientY > rect.top + rect.height / 2;
        var idx = parseInt(el.getAttribute('data-index'), 10);
        if (newType) {
          addBlock(newType, after ? idx + 1 : idx);
        } else if (draggedId) {
          reorderBlock(draggedId, id, after);
        }
      });
      el.querySelectorAll('[data-act]').forEach(function (btn) {
        btn.addEventListener('click', function (ev) {
          ev.stopPropagation();
          var act = btn.getAttribute('data-act');
          if (act === 'up') moveBlock(id, -1);
          else if (act === 'down') moveBlock(id, 1);
          else if (act === 'del') removeBlock(id);
        });
      });
    });

    inner.querySelectorAll('[contenteditable="true"]').forEach(function (el) {
      el.addEventListener('blur', function () {
        var block = getBlock(selectedId);
        if (!block) return;
        var prop = el.getAttribute('data-prop');
        if (!prop) return;
        var val = el.innerHTML;
        if (block[prop] !== val) {
          pushUndo();
          block[prop] = val;
          markDirty();
        }
      });
    });
  }

  function renderCanvasDropLinesOnly() {
    var lines = document.querySelectorAll('.studio-drop-line');
    lines.forEach(function (l, i) {
      l.classList.toggle('is-visible', dropIndex === i || (dropIndex === (page.blocks || []).length && i === lines.length - 1));
    });
  }

  function renderInspector() {
    var body = $('#studio-inspector-body');
    if (!body) return;

    document.querySelectorAll('.studio-inspector-tabs button').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-tab') === inspectorTab);
    });

    if (paletteFocus && !selectedId) {
      var cat = CATALOG[paletteFocus];
      body.innerHTML = '<div class="studio-preview-stage">' +
        '<div class="studio-preview-stage-label">Aperçu du bloc</div>' +
        '<div class="studio-preview-large" id="studio-preview-large"><div class="cms-empty">Chargement…</div></div>' +
        '<p class="studio-preview-desc">' + esc(cat.desc) + '</p>' +
        '<button type="button" class="studio-add-block-btn" id="studio-add-focused">+ Ajouter à la page</button>' +
      '</div>';
      renderDemoBlock(paletteFocus).then(function (html) {
        var lg = $('#studio-preview-large');
        if (lg) lg.innerHTML = html;
      });
      var addBtn = $('#studio-add-focused');
      if (addBtn) addBtn.addEventListener('click', function () { addBlock(paletteFocus); });
      return;
    }

    var block = selectedId ? getBlock(selectedId) : null;
    if (!block) {
      body.innerHTML = '<div class="studio-inspector-empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' +
        '<p>Parcourez la bibliothèque à gauche.<br/>L\'aperçu du design s\'affiche ici avant insertion.</p></div>';
      return;
    }

    var previewHtml = '<div class="studio-preview-stage"><div class="studio-preview-stage-label">Aperçu sur la page</div>' +
      '<div class="studio-preview-large">' + renderBlockHtml(block, false) + '</div></div>';

    if (inspectorTab === 'preview') {
      body.innerHTML = previewHtml;
      return;
    }

    body.innerHTML = buildInspectorFields(block);
    bindInspectorFields(block);
  }

  function buildInspectorFields(block) {
    function f(label, html) { return '<label class="studio-field">' + label + html + '</label>'; }
    var fields = '';
    if (block.type === 'hero') {
      fields = f('Sous-titre', '<input type="text" data-prop="eyebrow" value="' + esc(block.eyebrow || '') + '"/>') +
        f('Titre', '<input type="text" data-prop="title" value="' + esc(block.title || '') + '"/>') +
        f('Description', '<textarea data-prop="subtitle" rows="3">' + esc(block.subtitle || '') + '</textarea>') +
        f('Image de fond', '<input type="text" data-prop="bg_image" value="' + esc(block.bg_image || '') + '"/><button type="button" class="cms-btn cms-btn-sm studio-pick-media" data-prop="bg_image" style="margin-top:6px">Choisir</button>') +
        f('Bouton', '<input type="text" data-prop="cta_label" value="' + esc(block.cta_label || '') + '"/>') +
        f('Lien', '<input type="text" data-prop="cta_link" value="' + esc(block.cta_link || '') + '"/>') +
        f('Alignement', alignSelect(block.align));
    } else if (block.type === 'text') {
      fields = f('Contenu', '<textarea data-prop="content" rows="8">' + esc(block.content || '') + '</textarea>') +
        f('Alignement', alignSelect(block.align));
    } else if (block.type === 'image') {
      fields = f('Image', '<input type="text" data-prop="src" value="' + esc(block.src || '') + '"/><button type="button" class="cms-btn cms-btn-sm studio-pick-media" data-prop="src" style="margin-top:6px">Choisir</button>') +
        f('Alt', '<input type="text" data-prop="alt" value="' + esc(block.alt || '') + '"/>') +
        f('Légende', '<input type="text" data-prop="caption" value="' + esc(block.caption || '') + '"/>');
    } else if (block.type === 'button') {
      fields = f('Libellé', '<input type="text" data-prop="label" value="' + esc(block.label || '') + '"/>') +
        f('Lien', '<input type="text" data-prop="link" value="' + esc(block.link || '') + '"/>') +
        f('Style', '<select data-prop="style"><option value="primary"' + (block.style === 'primary' ? ' selected' : '') + '>Primary</option><option value="outline"' + (block.style === 'outline' ? ' selected' : '') + '>Outline</option></select>') +
        f('Alignement', alignSelect(block.align));
    } else if (block.type === 'card') {
      fields = f('Titre', '<input type="text" data-prop="title" value="' + esc(block.title || '') + '"/>') +
        f('Texte', '<textarea data-prop="text" rows="4">' + esc(block.text || '') + '</textarea>') +
        f('Image', '<input type="text" data-prop="image" value="' + esc(block.image || '') + '"/><button type="button" class="cms-btn cms-btn-sm studio-pick-media" data-prop="image" style="margin-top:6px">Choisir</button>') +
        f('Bouton', '<input type="text" data-prop="btn_label" value="' + esc(block.btn_label || '') + '"/>') +
        f('Lien', '<input type="text" data-prop="btn_link" value="' + esc(block.btn_link || '') + '"/>');
    } else if (block.type === 'gallery') {
      fields = f('Colonnes', '<select data-prop="columns"><option value="2"' + (block.columns === '2' ? ' selected' : '') + '>2</option><option value="3"' + (block.columns === '3' ? ' selected' : '') + '>3</option><option value="4"' + (block.columns === '4' ? ' selected' : '') + '>4</option></select>');
      (block.images || []).forEach(function (img, i) {
        fields += f('Image ' + (i + 1), '<input type="text" data-gallery="' + i + '" value="' + esc(img.src || '') + '"/><button type="button" class="cms-btn cms-btn-sm studio-pick-media" data-gallery="' + i + '" style="margin-top:6px">Choisir</button>');
      });
    } else if (block.type === 'form') {
      fields = f('Titre', '<input type="text" data-prop="title" value="' + esc(block.title || '') + '"/>') +
        f('Sous-titre', '<input type="text" data-prop="subtitle" value="' + esc(block.subtitle || '') + '"/>') +
        f('Bouton envoi', '<input type="text" data-prop="submit_label" value="' + esc(block.submit_label || '') + '"/>');
    } else if (block.type === 'header') {
      fields = f('Marque', '<input type="text" data-prop="brand" value="' + esc(block.brand || '') + '"/>') +
        f('Style', '<select data-prop="style"><option value="light"' + (block.style === 'light' ? ' selected' : '') + '>Clair</option><option value="dark"' + (block.style === 'dark' ? ' selected' : '') + '>Sombre</option></select>');
    } else if (block.type === 'footer') {
      fields = f('Texte', '<textarea data-prop="text" rows="2">' + esc(block.text || '') + '</textarea>') +
        f('Copyright', '<input type="text" data-prop="copyright" value="' + esc(block.copyright || '') + '"/>');
    } else if (block.type === 'cta') {
      fields = f('Titre', '<input type="text" data-prop="title" value="' + esc(block.title || '') + '"/>') +
        f('Texte', '<textarea data-prop="text" rows="3">' + esc(block.text || '') + '</textarea>') +
        f('Bouton', '<input type="text" data-prop="btn_label" value="' + esc(block.btn_label || '') + '"/>') +
        f('Lien', '<input type="text" data-prop="btn_link" value="' + esc(block.btn_link || '') + '"/>');
    } else if (block.type === 'columns') {
      fields = f('Colonnes', '<select data-prop="layout"><option value="2"' + (block.layout === '2' ? ' selected' : '') + '>2</option><option value="3"' + (block.layout === '3' ? ' selected' : '') + '>3</option></select>');
      (block.columns || []).forEach(function (col, i) {
        fields += f('Colonne ' + (i + 1), '<textarea data-col-index="' + i + '" rows="4">' + esc(col.content || '') + '</textarea>');
      });
    } else if (block.type === 'spacer') {
      fields = f('Hauteur (px)', '<input type="number" data-prop="height" min="8" max="240" value="' + (block.height || 48) + '"/>');
    } else if (block.type === 'divider') {
      fields = f('Style', '<select data-prop="style"><option value="line"' + (block.style === 'line' ? ' selected' : '') + '>Ligne</option><option value="dots"' + (block.style === 'dots' ? ' selected' : '') + '>Points</option><option value="gradient"' + (block.style === 'gradient' ? ' selected' : '') + '>Dégradé</option></select>');
    } else if (block.type === 'video') {
      fields = f('URL vidéo', '<input type="text" data-prop="src" value="' + esc(block.src || '') + '"/>') +
        f('Poster', '<input type="text" data-prop="poster" value="' + esc(block.poster || '') + '"/>');
    }
    return '<div class="studio-props">' + (inspectorTab === 'props' ? '' : '') + fields + '</div>';
  }

  function alignSelect(val) {
    return '<select data-prop="align"><option value="left"' + (val === 'left' ? ' selected' : '') + '>Gauche</option><option value="center"' + (val === 'center' ? ' selected' : '') + '>Centre</option><option value="right"' + (val === 'right' ? ' selected' : '') + '>Droite</option></select>';
  }

  function bindInspectorFields(block) {
    var body = $('#studio-inspector-body');
    if (!body) return;
    body.querySelectorAll('[data-prop]').forEach(function (el) {
      function apply() {
        block[el.getAttribute('data-prop')] = el.type === 'number' ? parseInt(el.value, 10) : el.value;
        markDirty();
        renderCanvas();
      }
      el.addEventListener('input', apply);
      el.addEventListener('change', apply);
    });
    body.querySelectorAll('[data-col-index]').forEach(function (el) {
      el.addEventListener('input', function () {
        var i = parseInt(el.getAttribute('data-col-index'), 10);
        if (!block.columns) block.columns = [];
        if (!block.columns[i]) block.columns[i] = { content: '' };
        block.columns[i].content = el.value;
        markDirty();
        renderCanvas();
      });
    });
    body.querySelectorAll('.studio-pick-media').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var prop = btn.getAttribute('data-prop');
        var gIdx = btn.getAttribute('data-gallery');
        openMediaPicker(function (url) {
          if (gIdx != null) {
            if (!block.images) block.images = [];
            if (!block.images[gIdx]) block.images[gIdx] = { src: '', alt: '' };
            block.images[gIdx].src = url;
          } else {
            block[prop] = url;
          }
          markDirty();
          renderCanvas();
          renderInspector();
        });
      });
    });
  }

  function openMediaPicker(onPick) {
    if (deps.openMediaModal) { deps.openMediaModal(onPick); return; }
    toast('Bibliothèque médias indisponible', true);
  }

  function savePage() {
    return api('/admin/cms/pages/' + page.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: page.title,
        slug: page.slug,
        blocks: page.blocks,
        seo: page.seo,
        status: page.status === 'published' ? 'published' : 'draft'
      })
    }).then(function (r) { return r.json(); }).then(function (updated) {
      page = updated;
      markSaved();
      toast('Page enregistrée');
      refreshLivePreview(true);
    });
  }

  function publishPage() {
    savePage().then(function () {
      return api('/admin/cms/pages/' + page.id + '/publish', { method: 'POST' });
    }).then(function (r) { return r.json(); }).then(function (updated) {
      page = updated;
      toast('Page publiée');
      var btn = $('#studio-publish-btn');
      if (btn) btn.textContent = 'Republier';
      refreshLivePreview(true);
    });
  }

  function pagePreviewUrl() {
    if (!page) return '/';
    if (page.page_type === 'static' && page.linked_html) return '/' + page.linked_html;
    return '/p/' + encodeURIComponent(page.slug || '');
  }

  function refreshLivePreview(open) {
    var panel = $('#studio-live-preview');
    var frame = $('#studio-live-frame');
    if (!frame || !page) return;
    if (panel && panel.hidden && !open) return;
    frame.src = pagePreviewUrl() + '?_=' + Date.now();
    if (open && panel) {
      panel.hidden = false;
      $('.studio-builder').classList.add('has-live-preview');
    }
  }

  function openHistoryModal() {
    api('/admin/cms/pages/' + page.id + '/revisions')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var items = data.items || [];
        var modal = document.createElement('div');
        modal.className = 'cms-modal-bg';
        modal.innerHTML =
          '<div class="cms-modal" role="dialog">' +
            '<div class="cms-modal-head"><h2>Historique</h2><button type="button" class="cms-modal-close">&times;</button></div>' +
            '<ul class="cms-history-list">' +
              (items.length ? items.map(function (rev) {
                return '<li><div><strong>' + esc(rev.label || 'Version') + '</strong><small>' + esc(deps.fmtDate(rev.created_at)) + '</small></div>' +
                  '<button type="button" class="cms-btn cms-btn-sm" data-rev="' + esc(rev.id) + '">Restaurer</button></li>';
              }).join('') : '<li class="cms-empty">Aucune version.</li>') +
            '</ul></div>';
        document.body.appendChild(modal);
        function close() { modal.remove(); }
        modal.querySelector('.cms-modal-close').addEventListener('click', close);
        modal.addEventListener('click', function (ev) { if (ev.target === modal) close(); });
        modal.querySelectorAll('[data-rev]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            if (!confirm('Restaurer cette version ?')) return;
            api('/admin/cms/pages/' + page.id + '/revert/' + btn.getAttribute('data-rev'), { method: 'POST' })
              .then(function (r) { return r.json(); })
              .then(function (updated) {
                page = updated;
                markSaved();
                renderCanvas();
                renderInspector();
                close();
                toast('Version restaurée');
              });
          });
        });
      });
  }

  function openSeoModal() {
    var seo = page.seo || {};
    var modal = document.createElement('div');
    modal.className = 'cms-modal-bg';
    modal.innerHTML =
      '<div class="cms-modal" role="dialog">' +
        '<div class="cms-modal-head"><h2>SEO & partage</h2><button type="button" class="cms-modal-close">&times;</button></div>' +
        '<form id="studio-seo-form" class="cms-form">' +
          '<label>Meta title<input type="text" name="meta_title" value="' + esc(seo.meta_title || page.title || '') + '"/></label>' +
          '<label>Meta description<textarea name="meta_description" rows="3">' + esc(seo.meta_description || '') + '</textarea></label>' +
          '<label>Slug<input type="text" name="slug" value="' + esc(page.slug || '') + '"/></label>' +
          '<div class="cms-form-actions"><button type="button" class="cms-btn cms-modal-cancel">Annuler</button><button type="submit" class="cms-btn cms-btn-primary">Appliquer</button></div>' +
        '</form></div>';
    document.body.appendChild(modal);
    function close() { modal.remove(); }
    modal.querySelector('.cms-modal-close').addEventListener('click', close);
    modal.querySelector('.cms-modal-cancel').addEventListener('click', close);
    modal.querySelector('#studio-seo-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      page.seo = {
        meta_title: f.meta_title.value.trim(),
        meta_description: f.meta_description.value.trim(),
        og_image: seo.og_image || '',
        robots: seo.robots || 'index,follow'
      };
      page.slug = String(f.slug.value || page.slug).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
      markDirty();
      close();
      toast('SEO mis à jour — enregistrez');
    });
  }

  function renderShell(container) {
    container.innerHTML =
      '<div class="studio-builder">' +
        '<header class="studio-builder-bar">' +
          '<div class="studio-builder-bar-left">' +
            '<button type="button" class="cms-btn cms-btn-ghost" id="studio-back">← Pages</button>' +
            '<input type="text" class="studio-title-input" id="studio-title" value="' + esc(page.title) + '"/>' +
            '<span class="studio-save-badge" id="studio-save-badge">Enregistré</span>' +
          '</div>' +
          '<div class="studio-builder-bar-center">' +
            '<div class="studio-device-toggle" id="studio-devices">' +
              '<button type="button" data-vp="desktop" class="is-active">Desktop</button>' +
              '<button type="button" data-vp="tablet">Tablet</button>' +
              '<button type="button" data-vp="mobile">Mobile</button>' +
            '</div>' +
            '<select class="studio-zoom-select" id="studio-zoom" aria-label="Zoom">' +
              '<option value="75">75%</option><option value="100" selected>100%</option><option value="125">125%</option>' +
            '</select>' +
          '</div>' +
          '<div class="studio-builder-bar-right">' +
            '<button type="button" class="studio-icon-btn" id="studio-undo-btn" title="Annuler" disabled>↶</button>' +
            '<button type="button" class="studio-icon-btn" id="studio-redo-btn" title="Rétablir" disabled>↷</button>' +
            '<button type="button" class="cms-btn" id="studio-history-btn">Historique</button>' +
            '<button type="button" class="cms-btn" id="studio-preview-btn">Aperçu live</button>' +
            '<button type="button" class="cms-btn cms-btn-primary" id="studio-save-btn">Enregistrer</button>' +
            '<button type="button" class="cms-btn cms-btn-accent" id="studio-publish-btn">' + (page.status === 'published' ? 'Republier' : 'Publier') + '</button>' +
          '</div>' +
        '</header>' +
        '<div class="studio-builder-body">' +
          '<aside class="studio-library">' +
            '<div class="studio-panel-head"><h3>Bibliothèque</h3><p>Glissez ou cliquez pour prévisualiser</p></div>' +
            '<div class="studio-cat-tabs" id="studio-cat-tabs"></div>' +
            '<div class="studio-block-list" id="studio-block-list" data-cat="all"></div>' +
            '<div class="studio-library-foot">' +
              '<button type="button" class="cms-btn cms-btn-block" id="studio-media-btn">Bibliothèque médias</button>' +
              '<button type="button" class="cms-btn cms-btn-block" id="studio-seo-btn">SEO & partage</button>' +
            '</div>' +
          '</aside>' +
          '<main class="studio-canvas-zone" id="studio-canvas-zone">' +
            '<div class="studio-canvas-scaler" id="studio-canvas-scaler">' +
              '<div class="studio-canvas-frame vp-desktop" id="studio-canvas-frame">' +
                '<div class="studio-canvas-inner" id="studio-canvas-inner"></div>' +
              '</div>' +
            '</div>' +
          '</main>' +
          '<aside class="studio-inspector">' +
            '<div class="studio-panel-head"><h3>Design & réglages</h3><p>Aperçu avant insertion · propriétés du bloc</p></div>' +
            '<div class="studio-inspector-tabs">' +
              '<button type="button" data-tab="preview" class="is-active">Aperçu</button>' +
              '<button type="button" data-tab="props">Propriétés</button>' +
            '</div>' +
            '<div class="studio-inspector-body" id="studio-inspector-body"></div>' +
          '</aside>' +
        '</div>' +
        '<div class="studio-live-preview" id="studio-live-preview" hidden>' +
          '<div class="studio-live-preview-head"><span>Aperçu publié</span>' +
            '<button type="button" id="studio-live-refresh">Actualiser</button>' +
            '<button type="button" id="studio-live-close">Fermer</button></div>' +
          '<iframe id="studio-live-frame" title="Aperçu page"></iframe>' +
        '</div>' +
      '</div>';

    var tabs = $('#studio-cat-tabs');
    tabs.innerHTML = CATEGORIES.map(function (c, i) {
      return '<button type="button" class="studio-cat-tab' + (i === 0 ? ' is-active' : '') + '" data-cat="' + c.id + '">' + c.label + '</button>';
    }).join('');
    tabs.querySelectorAll('.studio-cat-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabs.querySelectorAll('.studio-cat-tab').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        $('#studio-block-list').setAttribute('data-cat', btn.getAttribute('data-cat'));
        renderLibrary();
      });
    });

    $('#studio-back').addEventListener('click', function () {
      if (dirty && !confirm('Quitter sans enregistrer ?')) return;
      if (deps.navigate) deps.navigate('cms-pages');
    });
    $('#studio-save-btn').addEventListener('click', savePage);
    $('#studio-publish-btn').addEventListener('click', publishPage);
    $('#studio-undo-btn').addEventListener('click', undo);
    $('#studio-redo-btn').addEventListener('click', redo);
    $('#studio-title').addEventListener('input', function (e) { page.title = e.target.value; markDirty(); });
    $('#studio-zoom').addEventListener('change', function (e) { zoom = parseInt(e.target.value, 10); renderCanvas(); });
    $('#studio-devices').querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        viewport = btn.getAttribute('data-vp');
        $('#studio-devices').querySelectorAll('button').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        renderCanvas();
      });
    });
    document.querySelectorAll('.studio-inspector-tabs button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        inspectorTab = btn.getAttribute('data-tab');
        renderInspector();
      });
    });
    $('#studio-preview-btn').addEventListener('click', function () {
      var p = $('#studio-live-preview');
      if (p.hidden) refreshLivePreview(true);
      else { p.hidden = true; $('.studio-builder').classList.remove('has-live-preview'); }
    });
    $('#studio-live-close').addEventListener('click', function () {
      $('#studio-live-preview').hidden = true;
      $('.studio-builder').classList.remove('has-live-preview');
    });
    $('#studio-live-refresh').addEventListener('click', function () { refreshLivePreview(true); });
    if (deps.openMediaModal) $('#studio-media-btn').addEventListener('click', function () { deps.openMediaModal(); });
    else $('#studio-media-btn').addEventListener('click', function () { openMediaPicker(null); });
    $('#studio-history-btn').addEventListener('click', openHistoryModal);
    $('#studio-seo-btn').addEventListener('click', openSeoModal);

    var zone = $('#studio-canvas-zone');
    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      $('#studio-canvas-frame').classList.add('is-drag-over');
    });
    zone.addEventListener('dragleave', function () {
      $('#studio-canvas-frame').classList.remove('is-drag-over');
      dropIndex = null;
    });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      $('#studio-canvas-frame').classList.remove('is-drag-over');
      dropIndex = null;
      var type = e.dataTransfer.getData('text/cms-block-type');
      if (type) addBlock(type);
    });

    renderLibrary();
    renderCanvas();
    renderInspector();
    updateUndoButtons();
    updateSaveBadge();
  }

  function open(pageId, options) {
    deps = options || {};
    selectedId = null;
    paletteFocus = null;
    dirty = false;
    undoStack = [];
    redoStack = [];
    templatesCache = null;
    inspectorTab = 'preview';

    if (deps.navigate) deps.navigate('cms-builder');

    var view = document.getElementById('view-cms-builder');
    if (!view) return;

    api('/admin/cms/pages/' + pageId).then(function (r) { return r.json(); }).then(function (p) {
      page = p;
      renderShell(view);
    }).catch(function (e) { toast(e.message, true); });
  }

  global.CircumBuilder = { open: open };
})(window);
