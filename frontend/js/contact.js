(function () {
  'use strict';

  var form = document.querySelector('[data-inquiry-form]');
  if (!form) return;
  var success = document.querySelector('[data-form-success]');
  var error = document.querySelector('[data-form-error]');
  var select = form.querySelector('[name="yacht_id"]');
  var params = new URLSearchParams(location.search);
  var preset = params.get('yacht') || '';

  fetch('/api/yachts')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!select) return;
      (data.yachts || []).forEach(function (y) {
        var opt = document.createElement('option');
        opt.value = y.id;
        opt.textContent = y.name + ' — ' + y.priceLabel;
        if (y.id === preset) opt.selected = true;
        select.appendChild(opt);
      });
    });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (error) error.textContent = '';
    var payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      yacht_id: form.yacht_id ? form.yacht_id.value : '',
      interest: form.interest ? form.interest.value : 'acquisition',
      message: form.message.value.trim()
    };
    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().then(function (body) { return { ok: r.ok, body: body }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.body.error || 'Erreur');
        form.style.display = 'none';
        if (success) {
          success.classList.add('show');
          var ref = success.querySelector('[data-ref]');
          if (ref) ref.textContent = res.body.reference;
        }
      })
      .catch(function (err) {
        if (error) error.textContent = err.message || 'Impossible d’envoyer la demande.';
      });
  });
})();
