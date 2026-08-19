(function () {
  'use strict';
  var strip = document.querySelector('[data-featured-strip]');
  if (!strip) return;
  fetch('/api/yachts')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var featured = (data.yachts || []).filter(function (y) { return y.featured; }).slice(0, 6);
      strip.innerHTML = featured.map(function (y) {
        return (
          '<a class="h-card" href="yacht.html?id=' + encodeURIComponent(y.id) + '">' +
            '<img alt="' + y.name + '" src="' + y.image + '"/>' +
            '<h3>' + y.name + '</h3>' +
            '<p>' + y.lengthLabel + ' · ' + y.priceLabel + '</p>' +
          '</a>'
        );
      }).join('');
    });
})();
