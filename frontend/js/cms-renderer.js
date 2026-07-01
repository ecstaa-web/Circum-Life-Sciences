/**
 * Rendu public des pages CMS (blocs).
 */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getSlug() {
    var m = window.location.pathname.match(/\/p\/([a-z0-9-]+)\/?$/);
    if (m) return m[1];
    var params = new URLSearchParams(window.location.search);
    return params.get('slug') || '';
  }

  function renderBlock(block) {
    if (!block || !block.type) return '';
    if (block.type === 'hero') {
      var style = block.bg_image ? ' style="background-image:url(' + esc(block.bg_image) + ')"' : '';
      return (
        '<section class="cms-block-hero align-' + esc(block.align || 'left') + '"' + style + '>' +
          '<div class="cms-block-hero-inner">' +
            (block.eyebrow ? '<span class="cms-block-hero-eyebrow">' + esc(block.eyebrow) + '</span>' : '') +
            '<h1>' + esc(block.title || '') + '</h1>' +
            (block.subtitle ? '<div class="cms-block-hero-desc">' + block.subtitle + '</div>' : '') +
            (block.cta_label ? '<a class="cms-block-hero-btn" href="' + esc(block.cta_link || '#') + '">' + esc(block.cta_label) + '</a>' : '') +
          '</div>' +
        '</section>'
      );
    }
    if (block.type === 'text') {
      return '<section class="cms-block-text align-' + esc(block.align || 'left') + '">' + (block.content || '') + '</section>';
    }
    if (block.type === 'image' && block.src) {
      return (
        '<figure class="cms-block-image width-' + esc(block.width || 'full') + '">' +
          '<img src="' + esc(block.src) + '" alt="' + esc(block.alt || '') + '" loading="lazy"/>' +
          (block.caption ? '<figcaption>' + esc(block.caption) + '</figcaption>' : '') +
        '</figure>'
      );
    }
    if (block.type === 'columns') {
      var cols = (block.columns || []).map(function (c) {
        return '<div class="cms-block-col">' + (c.content || '') + '</div>';
      }).join('');
      return '<section class="cms-block-columns cols-' + esc(block.layout || '2') + '">' + cols + '</section>';
    }
    if (block.type === 'cta') {
      return (
        '<section class="cms-block-cta">' +
          '<h2>' + esc(block.title || '') + '</h2>' +
          (block.text ? '<p>' + block.text + '</p>' : '') +
          (block.btn_label ? '<a class="cms-block-cta-btn" href="' + esc(block.btn_link || '#') + '">' + esc(block.btn_label) + '</a>' : '') +
        '</section>'
      );
    }
    if (block.type === 'spacer') {
      return '<div class="cms-block-spacer" style="height:' + (block.height || 48) + 'px" aria-hidden="true"></div>';
    }
    if (block.type === 'divider') {
      return '<hr class="cms-block-divider ' + esc(block.style || 'line') + '" aria-hidden="true"/>';
    }
    if (block.type === 'video' && block.src) {
      return (
        '<section class="cms-block-video">' +
          '<video src="' + esc(block.src) + '" controls playsinline' +
          (block.poster ? ' poster="' + esc(block.poster) + '"' : '') +
          (block.autoplay ? ' autoplay muted' : '') + '></video>' +
        '</section>'
      );
    }
    if (block.type === 'header') {
      var hcls = block.style === 'dark' ? ' cms-block-header dark' : ' cms-block-header';
      var hlinks = (block.links || []).map(function (l) {
        return '<a href="' + esc(l.href || '#') + '">' + esc(l.label || '') + '</a>';
      }).join('');
      return '<header class="' + hcls.trim() + '"><strong class="cms-block-header-brand">' + esc(block.brand || '') + '</strong><nav>' + hlinks + '</nav></header>';
    }
    if (block.type === 'gallery') {
      var gcols = block.columns || '3';
      var gcells = (block.images || []).filter(function (img) { return img && img.src; }).map(function (img) {
        return '<figure><img src="' + esc(img.src) + '" alt="' + esc(img.alt || '') + '" loading="lazy"/></figure>';
      }).join('');
      return gcells ? '<section class="cms-block-gallery cols-' + esc(gcols) + '">' + gcells + '</section>' : '';
    }
    if (block.type === 'button') {
      var bstyle = block.style === 'outline' ? 'outline' : 'primary';
      return '<section class="cms-block-button align-' + esc(block.align || 'center') + '">' +
        '<a class="cms-block-btn ' + bstyle + '" href="' + esc(block.link || '#') + '">' + esc(block.label || '') + '</a></section>';
    }
    if (block.type === 'card') {
      return '<article class="cms-block-card">' +
        (block.image ? '<div class="cms-block-card-img" style="background-image:url(' + esc(block.image) + ')"></div>' : '') +
        '<div class="cms-block-card-body"><h2>' + esc(block.title || '') + '</h2><div>' + (block.text || '') + '</div>' +
        (block.btn_label ? '<a href="' + esc(block.btn_link || '#') + '">' + esc(block.btn_label) + '</a>' : '') +
        '</div></article>';
    }
    if (block.type === 'form') {
      var ffields = (block.fields || ['name', 'email', 'message']).map(function (f) {
        var label = f === 'name' ? 'Nom' : f === 'email' ? 'Email' : f === 'phone' ? 'Téléphone' : f === 'company' ? 'Société' : 'Message';
        var tag = f === 'message' ? 'textarea rows="4"' : 'input type="' + (f === 'email' ? 'email' : 'text') + '"';
        return '<label>' + label + '<' + tag + ' name="' + f + '"></' + (f === 'message' ? 'textarea' : 'input') + '></label>';
      }).join('');
      return '<section class="cms-block-form"><h2>' + esc(block.title || '') + '</h2>' +
        (block.subtitle ? '<p>' + esc(block.subtitle) + '</p>' : '') +
        '<form action="/contact.html" method="get">' + ffields +
        '<button type="submit">' + esc(block.submit_label || 'Envoyer') + '</button></form></section>';
    }
    if (block.type === 'footer') {
      var flinks = (block.links || []).map(function (l) {
        return '<a href="' + esc(l.href || '#') + '">' + esc(l.label || '') + '</a>';
      }).join('');
      return '<footer class="cms-block-footer"><p>' + esc(block.text || '') + '</p><nav>' + flinks + '</nav>' +
        (block.copyright ? '<small>' + esc(block.copyright) + '</small>' : '') + '</footer>';
    }
    return '';
  }

  function applySeo(page) {
    var seo = page.seo || {};
    document.title = (seo.meta_title || page.title || 'Circum') + ' · Circum Life Sciences';
    var desc = document.querySelector('meta[name="description"]');
    if (desc && seo.meta_description) desc.setAttribute('content', seo.meta_description);
    if (seo.og_image) {
      var og = document.querySelector('meta[property="og:image"]');
      if (!og) {
        og = document.createElement('meta');
        og.setAttribute('property', 'og:image');
        document.head.appendChild(og);
      }
      og.setAttribute('content', seo.og_image);
    }
  }

  function loadPage() {
    var slug = getSlug();
    var root = document.getElementById('cms-page-root');
    if (!slug) {
      root.innerHTML = '<div class="cms-error">Page introuvable.</div>';
      return;
    }
    fetch('/api/cms/pages/' + encodeURIComponent(slug))
      .then(function (r) {
        if (!r.ok) throw new Error('Page introuvable');
        return r.json();
      })
      .then(function (page) {
        applySeo(page);
        var html = '<main class="cms-page">';
        (page.blocks || []).forEach(function (block) {
          html += renderBlock(block);
        });
        html += '</main>';
        root.innerHTML = html;
      })
      .catch(function () {
        root.innerHTML = '<div class="cms-error">Cette page n\'existe pas ou n\'est pas publiée.</div>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPage);
  } else {
    loadPage();
  }
})();
