(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var id = params.get('id');
  var root = document.querySelector('[data-yacht-detail]');

  function spec(label, value) {
    return '<div><span>' + label + '</span><strong>' + value + '</strong></div>';
  }

  function card(y) {
    return (
      '<a class="yacht-card" href="yacht.html?id=' + encodeURIComponent(y.id) + '">' +
        '<div class="yacht-card-media"><img alt="' + y.name + '" src="' + y.image + '"/></div>' +
        '<div class="yacht-card-body"><h3>' + y.name + '</h3><div class="price">' + y.priceLabel + '</div>' +
        '<div class="meta">' + y.type + ' · ' + y.lengthLabel + '</div></div></a>'
    );
  }

  function render(y, all) {
    document.title = y.name + ' · Nereïs';
    var gallery = (y.gallery || []).map(function (src, i) {
      return '<img alt="' + y.name + ' — vue ' + (i + 1) + '" data-full="' + src + '" src="' + src + '"/>';
    }).join('');
    var highlights = (y.highlights || []).map(function (h) { return '<li>' + h + '</li>'; }).join('');
    var related = (all || []).filter(function (item) {
      return item.id !== y.id && item.category === y.category;
    }).slice(0, 3);
    if (related.length < 3) {
      (all || []).forEach(function (item) {
        if (related.length >= 3 || item.id === y.id) return;
        var exists = related.some(function (r) { return r.id === item.id; });
        if (!exists) related.push(item);
      });
    }
    var relatedHtml = related.length
      ? '<section class="section"><p class="kicker">Dans la même eau</p><h2 class="section-title" style="margin-bottom:28px">Unités voisines</h2><div class="yacht-grid">' + related.map(card).join('') + '</div></section>'
      : '';

    root.innerHTML =
      '<section class="yacht-hero">' +
        '<img alt="' + y.name + '" src="' + (y.hero || y.image) + '"/>' +
        '<div class="yacht-hero-copy">' +
          '<p class="kicker">' + y.type + ' · ' + y.year + '</p>' +
          '<h1>' + y.name + '</h1>' +
          '<p>' + y.tagline + '</p>' +
        '</div>' +
      '</section>' +
      '<section class="detail-layout">' +
        '<div class="detail-copy">' +
          '<p>' + y.description + '</p>' +
          '<ul class="highlights">' + highlights + '</ul>' +
        '</div>' +
        '<aside class="side-card">' +
          '<div class="status">' + y.status + '</div>' +
          '<div class="price">' + y.priceLabel + '</div>' +
          '<div class="spec-list">' +
            spec('Longueur', y.lengthLabel) +
            spec('Maître-bau', y.beam) +
            spec('Tirant d’eau', y.draft) +
            spec('Invités', y.guests) +
            spec('Cabines', y.cabins) +
            spec('Équipage', y.crew) +
            spec('Vitesse', y.speed) +
            spec('Autonomie', y.range) +
            spec('Chantier', y.shipyard) +
            spec('Quai', y.location) +
          '</div>' +
          '<a class="btn btn-gold" href="contact.html?yacht=' + encodeURIComponent(y.id) + '">Audience privée</a>' +
          '<a class="btn btn-ghost" href="collection.html">Retour à la collection</a>' +
        '</aside>' +
      '</section>' +
      '<div class="gallery">' + gallery + '</div>' +
      relatedHtml;

    var lb = document.querySelector('.lightbox');
    var lbImg = lb && lb.querySelector('img');
    root.querySelectorAll('.gallery img').forEach(function (img) {
      img.addEventListener('click', function () {
        if (!lb || !lbImg) return;
        lbImg.src = img.getAttribute('data-full') || img.src;
        lb.classList.add('open');
      });
    });
  }

  if (!id || !root) {
    if (root) root.innerHTML = '<section class="page-hero"><h1 class="display">Yacht introuvable</h1><p class="lede">Cette unité n’est plus au catalogue. <a class="btn-line" href="collection.html">Voir la collection</a></p></section>';
    return;
  }

  Promise.all([
    fetch('/api/yachts/' + encodeURIComponent(id)).then(function (r) {
      if (!r.ok) throw new Error('missing');
      return r.json();
    }),
    fetch('/api/yachts').then(function (r) { return r.json(); })
  ])
    .then(function (pair) {
      render(pair[0], (pair[1] && pair[1].yachts) || []);
    })
    .catch(function () {
      root.innerHTML = '<section class="page-hero"><h1 class="display">Yacht introuvable</h1><p class="lede">Cette unité n’est plus au catalogue. <a class="btn-line" href="collection.html">Voir la collection</a></p></section>';
    });

  var close = document.querySelector('[data-close-lightbox]');
  var lightbox = document.querySelector('.lightbox');
  if (close && lightbox) {
    close.addEventListener('click', function () { lightbox.classList.remove('open'); });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) lightbox.classList.remove('open');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') lightbox.classList.remove('open');
    });
  }
})();
