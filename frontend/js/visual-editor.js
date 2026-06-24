/**
 * Éditeur visuel Circum — iframe admin (textes éditables, commandes depuis la barre admin).
 */
(function () {
  'use strict';

  if (window.parent === window) return;
  if (new URLSearchParams(location.search).get('circum_edit') !== '1') return;

  var baseline = {};
  var lang = 'fr';
  var active = false;
  var activeEl = null;
  var savedRange = null;
  var EDITABLE = '[data-i18n], [data-i18n-html]';

  function injectStyles() {
    if (document.getElementById('circum-visual-editor-css')) return;
    var s = document.createElement('style');
    s.id = 'circum-visual-editor-css';
    s.textContent =
      '.circum-editable{outline:2px dashed transparent;outline-offset:3px;transition:outline-color .15s,background .15s;cursor:text;border-radius:2px}' +
      '.circum-editable:hover{outline-color:rgba(32,90,153,.5);background:rgba(32,90,153,.07)}' +
      '.circum-editable:focus,.circum-editable.circum-editing{outline:2px solid rgba(225,90,130,.9);background:rgba(225,90,130,.08)}' +
      '.circum-editable.circum-modified{outline-color:rgba(225,90,130,.65);outline-style:solid}' +
      'html.circum-edit-preview,html.circum-edit-preview body{min-width:1280px}';
    document.head.appendChild(s);
  }

  function getKey(el) {
    return el.getAttribute('data-i18n-html') || el.getAttribute('data-i18n');
  }

  function readValue(el) {
    return el.innerHTML.trim();
  }

  function saveSelection() {
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    savedRange = sel.getRangeAt(0).cloneRange();
  }

  function restoreSelection() {
    if (!savedRange) return;
    var sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(savedRange);
  }

  function postFmtState() {
    var state = { bold: false, italic: false, underline: false, strikeThrough: false };
    if (activeEl) {
      try {
        state.bold = document.queryCommandState('bold');
        state.italic = document.queryCommandState('italic');
        state.underline = document.queryCommandState('underline');
        state.strikeThrough = document.queryCommandState('strikeThrough');
      } catch (e) { /* ignore */ }
    }
    window.parent.postMessage({
      type: 'circum-fmt-state',
      active: !!activeEl,
      state: state
    }, window.location.origin);
  }

  function execFmt(cmd, val) {
    if (!activeEl) return;
    activeEl.focus();
    restoreSelection();
    try {
      document.execCommand('styleWithCSS', false, true);
      document.execCommand(cmd, false, val || null);
    } catch (e) { /* ignore */ }
    saveSelection();
    activeEl.classList.toggle('circum-modified', readValue(activeEl) !== baseline[getKey(activeEl)]);
    notifyChange(activeEl);
    postFmtState();
  }

  function applyInlineStyle(prop, val) {
    if (!activeEl) return;
    activeEl.focus();
    restoreSelection();
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (sel.isCollapsed) {
      execFmt('styleWithCSS', true);
      document.execCommand('insertHTML', false, '<span style="' + prop + ':' + val + '">\u200b</span>');
    } else {
      var range = sel.getRangeAt(0);
      var span = document.createElement('span');
      span.setAttribute('style', prop + ':' + val);
      try {
        range.surroundContents(span);
      } catch (e) {
        document.execCommand('styleWithCSS', true);
        document.execCommand('fontSize', false, '3');
        var font = activeEl.querySelector('font[size="3"]');
        if (font) {
          var wrap = document.createElement('span');
          wrap.setAttribute('style', prop + ':' + val);
          wrap.innerHTML = font.innerHTML;
          font.replaceWith(wrap);
        }
      }
    }
    saveSelection();
    notifyChange(activeEl);
    postFmtState();
  }

  function setActiveEl(el) {
    activeEl = el;
    document.querySelectorAll('.circum-editable').forEach(function (node) {
      node.classList.toggle('circum-editing', node === el);
    });
    postFmtState();
  }

  function disableNav() {
    document.addEventListener('click', function (e) {
      if (!active) return;
      var a = e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) === '#') return;
      e.preventDefault();
      e.stopPropagation();
      window.parent.postMessage({ type: 'circum-navigate', href: href }, window.location.origin);
    }, true);
  }

  function bindEditable(el) {
    if (el.dataset.circumBound) return;
    if (el.querySelector('input, select, textarea, button')) return;
    var key = getKey(el);
    if (!key) return;

    el.dataset.circumBound = '1';
    el.classList.add('circum-editable');
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'true');
    el.setAttribute('data-circum-key', key);

    el.addEventListener('focus', function () {
      setActiveEl(el);
    });

    el.addEventListener('blur', function () {
      setTimeout(function () {
        if (document.activeElement === el) return;
        notifyChange(el);
        if (!document.querySelector('.circum-editable:focus')) {
          activeEl = null;
          document.querySelectorAll('.circum-editing').forEach(function (node) {
            node.classList.remove('circum-editing');
          });
          postFmtState();
        }
      }, 120);
    });

    el.addEventListener('keyup', function () {
      saveSelection();
      postFmtState();
      el.classList.toggle('circum-modified', readValue(el) !== baseline[key]);
    });

    el.addEventListener('mouseup', function () {
      saveSelection();
      postFmtState();
    });

    el.addEventListener('input', function () {
      el.classList.toggle('circum-modified', readValue(el) !== baseline[key]);
    });
  }

  function setupEditables() {
    document.querySelectorAll(EDITABLE).forEach(bindEditable);
    markModified();
  }

  function notifyChange(el) {
    var key = getKey(el);
    if (!key) return;
    var val = readValue(el);
    el.classList.toggle('circum-modified', baseline[key] !== undefined && val !== baseline[key]);
    window.parent.postMessage({
      type: 'circum-content-change',
      key: key,
      value: val,
      lang: lang
    }, window.location.origin);
  }

  function markModified() {
    document.querySelectorAll('[data-circum-key]').forEach(function (el) {
      var key = getKey(el);
      el.classList.toggle('circum-modified', baseline[key] !== undefined && readValue(el) !== baseline[key]);
    });
  }

  function applyPendingValues(pending) {
    if (!pending) return;
    Object.keys(pending).forEach(function (key) {
      var el = document.querySelector('[data-i18n="' + key + '"], [data-i18n-html="' + key + '"]');
      if (el) el.innerHTML = pending[key];
    });
  }

  function handleFmtMessage(d) {
    if (d.action === 'inlineStyle') {
      applyInlineStyle(d.prop, d.value);
      return;
    }
    if (d.cmd) execFmt(d.cmd, d.value);
  }

  function activate(data) {
    baseline = data.baseline || {};
    lang = data.lang || 'fr';
    if (window.CIRCUM_I18N_API && lang !== window.CIRCUM_I18N_API.getLang()) {
      window.CIRCUM_I18N_API.setLang(lang);
    }
    if (!active) {
      active = true;
      injectStyles();
      document.documentElement.classList.add('circum-edit-preview');
      disableNav();
    }
    setTimeout(function () {
      setupEditables();
      applyPendingValues(data.pending);
      markModified();
    }, 100);
  }

  window.addEventListener('message', function (e) {
    if (e.origin !== window.location.origin) return;
    var d = e.data;
    if (!d || !d.type) return;

    if (d.type === 'circum-editor-init') {
      activate(d);
    } else if (d.type === 'circum-set-lang') {
      lang = d.lang || lang;
      if (d.baseline) baseline = d.baseline;
      if (window.CIRCUM_I18N_API) window.CIRCUM_I18N_API.setLang(lang);
      setTimeout(setupEditables, 120);
    } else if (d.type === 'circum-editor-sync') {
      if (d.baseline) baseline = d.baseline;
      applyPendingValues(d.pending);
      markModified();
    } else if (d.type === 'circum-fmt-exec') {
      handleFmtMessage(d);
    } else if (d.type === 'circum-fmt-save-selection') {
      saveSelection();
    }
  });

  function waitForI18n(cb) {
    if (window.CIRCUM_I18N_API) { cb(); return; }
    var n = 0;
    var t = setInterval(function () {
      if (window.CIRCUM_I18N_API || ++n > 60) {
        clearInterval(t);
        cb();
      }
    }, 100);
  }

  waitForI18n(function () {
    window.parent.postMessage({
      type: 'circum-editor-ready',
      page: (document.body && document.body.dataset.page) || ''
    }, window.location.origin);
  });
})();
