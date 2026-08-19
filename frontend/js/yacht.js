(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var id = params.get('id');
  var root = document.querySelector('[data-yacht-detail]');

  function spec(label, value) {
    return '<div><span>' + label + '</span><strong>' + value + '</strong></div>';
  }

  function render(y) {
    document.title = y.name + ' · Nereïs';
    var gallery = (y.gallery || []).map(function (src, i) {
      return '<img alt="' + y.name + ' — vue ' + (i + 1) + '" data-full="' + src + '" src="' + src + '"/>';
    }).join('');
    var highlights = (y.highlights || []).map(function (h) { return '<li>' + h + '</li>'; }).join('');
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
      '<div class="gallery">' + gallery + '</div>';

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

  fetch('/api/yachts/' + encodeURIComponent(id))
    .then(function (r) {
      if (!r.ok) throw new Error('missing');
      return r.json();
    })
    .then(render)
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
  }
})();
