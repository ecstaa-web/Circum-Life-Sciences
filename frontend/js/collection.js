(function () {
  'use strict';

  var grid = document.querySelector('[data-yacht-grid]');
  var countEl = document.querySelector('[data-yacht-count]');
  var chips = document.querySelectorAll('.filter-chip');
  var sortSelect = document.querySelector('[data-sort]');
  var yachts = [];
  var category = 'all';

  function card(y) {
    return (
      '<a class="yacht-card reveal" href="yacht.html?id=' + encodeURIComponent(y.id) + '">' +
        '<div class="yacht-card-media">' +
          '<img alt="' + y.name + '" loading="lazy" src="' + y.image + '"/>' +
          '<div class="yacht-card-overlay"><span class="badge">' + y.status + '</span></div>' +
        '</div>' +
        '<div class="yacht-card-body">' +
          '<h3>' + y.name + '</h3>' +
          '<div class="price">' + y.priceLabel + '</div>' +
          '<div class="meta">' + y.type + ' · ' + y.lengthLabel + ' · ' + y.location + '</div>' +
        '</div>' +
      '</a>'
    );
  }

  function sorted(list) {
    var copy = list.slice();
    var mode = sortSelect ? sortSelect.value : 'featured';
    if (mode === 'price-asc') copy.sort(function (a, b) { return a.price - b.price; });
    if (mode === 'price-desc') copy.sort(function (a, b) { return b.price - a.price; });
    if (mode === 'length') copy.sort(function (a, b) { return b.length - a.length; });
    if (mode === 'featured') copy.sort(function (a, b) { return Number(b.featured) - Number(a.featured); });
    return copy;
  }

  function render() {
    var list = yachts.filter(function (y) { return category === 'all' || y.category === category; });
    list = sorted(list);
    if (!grid) return;
    grid.innerHTML = list.length ? list.map(card).join('') : '<p class="empty-state">Aucun yacht ne correspond à ce filtre.</p>';
    if (countEl) countEl.textContent = list.length + ' yacht' + (list.length > 1 ? 's' : '') + ' d’exception';
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });
      grid.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
      category = chip.getAttribute('data-filter') || 'all';
      render();
      if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    chip.setAttribute('aria-pressed', chip.classList.contains('active') ? 'true' : 'false');
  });
  if (sortSelect) sortSelect.addEventListener('change', render);

  fetch('/api/yachts')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      yachts = data.yachts || [];
      render();
    })
    .catch(function () {
      if (grid) grid.innerHTML = '<p class="empty-state">La collection sera disponible dans un instant.</p>';
    });
})();
