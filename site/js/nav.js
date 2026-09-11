/* ============================================================================
   SANDBAGR — header menu on phones (the pills show on wider screens).
   External file because the CSP is script-src 'self' (no inline scripts).
   ============================================================================ */
(function () {
  'use strict';
  var btn = document.getElementById('bhMenu');
  var drop = document.getElementById('bhDrop');
  if (!btn || !drop) { return; }
  function setOpen(open) {
    drop.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    setOpen(drop.hidden);
  });
  document.addEventListener('click', function (e) {
    if (!drop.hidden && !drop.contains(e.target)) { setOpen(false); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setOpen(false); }
  });
})();
