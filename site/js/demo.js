/* ============================================================================
   SANDBAGR — "Watch the demo" video modal (home page). Opens from any
   [data-demo] link, or from /#demo. External file: CSP is script-src 'self'.
   ============================================================================ */
(function () {
  'use strict';
  var modal = document.getElementById('demoModal');
  var video = document.getElementById('demoVideo');
  if (!modal || !video) { return; }
  var lastFocus = null;
  function open() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('vmodal-open');
    var p = video.play(); if (p && p.catch) { p.catch(function () {}); }
    var x = modal.querySelector('.vmodal-x'); if (x) { x.focus(); }
  }
  function close() {
    video.pause();
    modal.hidden = true;
    document.body.classList.remove('vmodal-open');
    if (history.replaceState && location.hash === '#demo') { history.replaceState(null, '', location.pathname + location.search); }
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-demo]'), function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); open(); });
  });
  Array.prototype.forEach.call(modal.querySelectorAll('[data-close]'), function (b) {
    b.addEventListener('click', close);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) { close(); } });
  video.addEventListener('ended', function () { video.currentTime = 0; });
  if (location.hash === '#demo') { open(); }
  window.addEventListener('hashchange', function () { if (location.hash === '#demo') { open(); } });
})();
