/* ============================================================================
   SANDBAGR — Contact form
   ----------------------------------------------------------------------------
   AJAX submit to Web3Forms (keeps the user on-page). Lives in an external file
   so it satisfies the strict CSP (script-src 'self' — no inline scripts).
   ============================================================================ */
(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  var btn = document.getElementById('submit-btn');
  var status = document.getElementById('status');
  if (!form || !btn || !status) { return; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'status';
    status.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Sending…';

    var data = Object.fromEntries(new FormData(form).entries());

    fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json }; }); })
      .then(function (r) {
        if (r.ok && r.json.success) {
          form.reset();
          status.className = 'status ok';
          status.textContent = 'Thanks — your message is on its way. We’ll be in touch.';
          btn.textContent = 'Sent';
        } else {
          throw new Error(r.json.message || 'Submission failed');
        }
      })
      .catch(function () {
        status.className = 'status err';
        status.innerHTML = 'Something went wrong. Please email us directly at <a href="mailto:team@sandbagrapp.com">team@sandbagrapp.com</a>.';
        btn.disabled = false;
        btn.textContent = 'Send message';
      });
  });
})();
