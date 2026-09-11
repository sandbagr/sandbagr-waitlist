/* ============================================================================
   SANDBAGR — FAQ accordion. One open at a time; height animates via max-height.
   External file because the CSP is script-src 'self' (no inline scripts).
   ============================================================================ */
(function () {
  'use strict';
  var items = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));
  if (!items.length) { return; }

  function close(item) {
    item.classList.remove('open');
    item.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    item.querySelector('.faq-a').style.maxHeight = null;
  }
  function open(item) {
    item.classList.add('open');
    item.querySelector('.faq-q').setAttribute('aria-expanded', 'true');
    var a = item.querySelector('.faq-a');
    a.style.maxHeight = a.scrollHeight + 'px';
  }
  items.forEach(function (item) {
    item.querySelector('.faq-q').addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      items.forEach(function (o) { if (o !== item && o.classList.contains('open')) { close(o); } });
      if (isOpen) { close(item); } else { open(item); }
    });
  });

  // deep link: /faq.html#money opens that question
  if (location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target && target.classList.contains('faq-item')) {
      open(target);
      setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60);
    }
  }
  // keep open answers sized correctly if the window changes
  window.addEventListener('resize', function () {
    items.forEach(function (item) {
      if (item.classList.contains('open')) { var a = item.querySelector('.faq-a'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });
})();
