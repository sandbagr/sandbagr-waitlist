/* ============================================================================
   SANDBAGR — page controller
   Scroll choreography and the in-phone app mockups.
   ============================================================================ */
(function () {
  'use strict';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* The app screens are the real prototype, embedded via <iframe> in index.html
     (demo/sandbagr-app.html?app=…). They animate themselves — no mockups here. */

  /* ----------------------------------------------------- scroll progress bar */
  var bar = $('#scrollProgress');
  function onScroll() {
    var h = document.documentElement;
    var pct = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    bar.style.width = (pct * 100) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --------------------------------------------------- hero logo intro reveal
     On load you see only the SANDBAGR logo; the first scroll (or any nudge)
     "populates" the tagline, headline, capture, and phone. */
  var heroSection = $('#hero');
  (function heroIntro() {
    if (!heroSection) { return; }
    if (prefersReduced) { heroSection.classList.add('lit'); return; }
    var lit = false;
    function reveal() {
      if (lit) { return; }
      lit = true;
      heroSection.classList.add('lit');
      ['scroll', 'wheel', 'touchmove', 'keydown', 'pointerdown'].forEach(function (ev) {
        window.removeEventListener(ev, reveal);
      });
    }
    ['scroll', 'wheel', 'touchmove', 'keydown', 'pointerdown'].forEach(function (ev) {
      window.addEventListener(ev, reveal, { passive: true });
    });
    // safety net: never leave the page stuck on the logo
    setTimeout(reveal, 4200);
  })();

  /* ------------------------------------------------------ brand header reveal */
  var header = $('#brandHeader');
  var heroEl = $('#hero');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (ents) {
      header.classList.toggle('is-active', !ents[0].isIntersecting);
    }, { rootMargin: '-72% 0px 0px 0px' }).observe(heroEl);
  }

  /* ------------------------------------------------- generic scroll reveals */
  if (!prefersReduced && 'IntersectionObserver' in window) {
    var rvObs = new IntersectionObserver(function (ents, o) {
      ents.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        if (window.gsap) {
          window.gsap.to(e.target, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
        } else { e.target.style.opacity = 1; e.target.style.transform = 'none'; }
        o.unobserve(e.target);
      });
    }, { threshold: 0.18 });
    $$('.rv').forEach(function (el) { rvObs.observe(el); });
  } else {
    $$('.rv').forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
  }

  /* --------------------------------------- Problem section — scroll-built chat
     Headline shows first. As you scroll: the subline flies in, the chat thread
     reconstructs bubble-by-bubble, then the bold bridge line lands. */
  (function problemSequence() {
    var section = $('#problem');
    if (!section) { return; }
    var fill = $('#problemFill');
    var words = fill ? $$('.w', fill) : [];
    var until = $('#problemUntil');
    var bubbles = $$('.chat-bubble', section);
    var bridge  = $('.problem-bridge', section);
    var animated = [until].concat(bubbles).concat([bridge]).filter(Boolean);

    if (prefersReduced || !window.gsap || !window.ScrollTrigger) {
      words.forEach(function (w) { w.style.color = '#fff'; });
      animated.forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
      return;
    }
    window.gsap.registerPlugin(window.ScrollTrigger);

    // headline fills in word by word, tied to the scroll position (scrubbed, so it runs both ways)
    if (words.length) {
      window.gsap.to(words, {
        color: '#ffffff', ease: 'none', stagger: 0.12,
        scrollTrigger: { trigger: fill, start: 'top 80%', end: 'bottom 38%', scrub: 0.4 }
      });
    }
    // then the green answer lands
    if (until) {
      window.gsap.from(until, {
        opacity: 0, y: 24, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: until, start: 'top 58%' }
      });
    }
    // chat reconstructs, one bubble at a time, alternating slide direction
    window.gsap.from(bubbles, {
      opacity: 0, y: 26, scale: 0.96, duration: 0.5, ease: 'power3.out',
      stagger: 0.32,
      scrollTrigger: { trigger: '#chatMock', start: 'top 75%' }
    });
    // bold bridge — the climax that hands off to the product. It now lives in the
    // magic section; if present here animate it, otherwise it reveals via .rv.
    if (bridge) {
      window.gsap.from(bridge, {
        opacity: 0, y: 56, scale: 0.9, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: bridge, start: 'top 85%' }
      });
    }
  })();

})();

/* ============================================================================
   SANDBAGR — self-running phone animations (voice-to-ledger + groups cascade).
   Vanilla setTimeout loops, independent of the GSAP scroll choreography above.
   ============================================================================ */
(function voiceToLedger() {
  'use strict';
  var q = document.getElementById('g-q'), cur = document.getElementById('g-cur'), course = document.getElementById('g-course');
  var av = [document.getElementById('gav1'), document.getElementById('gav2'), document.getElementById('gav3')];
  var start = document.getElementById('g-start'), betnow = document.getElementById('g-betnow'), custom = document.getElementById('g-custom');
  var ring = document.getElementById('g-ring'), mic = document.getElementById('g-mic'), wave = document.getElementById('g-wave'), cap = document.getElementById('g-cap'), sentence = document.getElementById('g-sentence');
  var neu = document.getElementById('g-new');
  var sc = [document.getElementById('gs1'), document.getElementById('gs2'), document.getElementById('gs3'), document.getElementById('gs4'), document.getElementById('gs5')];
  if (!sc[0]) { return; }
  var tiles = document.querySelectorAll('#gs3 .gtile');
  var T = []; function at(ms, fn) { T.push(setTimeout(fn, ms)); }
  function show(el) { el.classList.add('show'); } function hide(el) { el.classList.remove('show'); }
  var query = 'Pebble Beach', words = ['Mike Bennett', 'shanks', 'it', 'off', 'the', 'tee'];
  function run() {
    T.forEach(clearTimeout); T = []; sc.forEach(hide);
    q.textContent = ''; hide(course); cur.style.display = 'inline';
    av.forEach(function (a) { a.classList.remove('sel'); }); start.classList.remove('show', 'press');
    betnow.classList.remove('press'); tiles.forEach(function (t) { t.classList.remove('show', 'tap'); });
    ring.classList.remove('on'); mic.classList.remove('on'); wave.classList.remove('on'); cap.textContent = '';
    sentence.classList.remove('show', 'dock'); neu.classList.remove('show', 'settle');
    at(200, function () { show(sc[0]); });
    for (var i = 1; i <= query.length; i++) { (function (n) { at(450 + n * 55, function () { q.textContent = query.slice(0, n); }); })(i); }
    at(450 + query.length * 55 + 250, function () { cur.style.display = 'none'; show(course); });
    at(2600, function () { hide(sc[0]); });
    at(2900, function () { show(sc[1]); });
    at(3350, function () { av[0].classList.add('sel'); }); at(3680, function () { av[1].classList.add('sel'); }); at(4010, function () { av[2].classList.add('sel'); });
    at(4500, function () { show(start); }); at(5100, function () { start.classList.add('press'); }); at(5700, function () { hide(sc[1]); });
    at(6000, function () { show(sc[2]); }); at(6550, function () { betnow.classList.add('press'); });
    tiles.forEach(function (tl, i) { at(6950 + i * 150, function () { tl.classList.add('show'); }); });
    at(8050, function () { custom.classList.add('tap'); }); at(8500, function () { custom.classList.remove('tap'); }); at(8800, function () { hide(sc[2]); });
    at(9100, function () { show(sc[3]); }); at(9450, function () { mic.classList.add('on'); ring.classList.add('on'); wave.classList.add('on'); });
    var t = 9900; words.forEach(function (w, i) { at(t, function () { cap.textContent += (i ? ' ' : '') + w; }); t += 300; });
    at(t + 120, function () { mic.classList.remove('on'); ring.classList.remove('on'); wave.classList.remove('on'); });
    at(t + 400, function () { show(sentence); }); at(t + 1500, function () { sentence.classList.add('dock'); }); at(t + 1800, function () { hide(sc[3]); });
    at(t + 1950, function () { show(sc[4]); }); at(t + 2250, function () { neu.classList.add('show'); }); at(t + 3300, function () { neu.classList.add('settle'); });
    at(t + 6000, run);
  }
  // Start (and restart) the loop only when the phone scrolls into view, so it
  // always begins from the top instead of being caught mid-animation on arrival.
  var stageEl = document.querySelector('#magic .stage') || sc[0];
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting) { run(); }
        else { T.forEach(clearTimeout); T = []; }
      });
    }, { threshold: 0.45 }).observe(stageEl);
  } else { run(); }
})();

(function groupsCascade() {
  'use strict';
  var cards = [document.getElementById('lg1'), document.getElementById('lg2'), document.getElementById('lg3'), document.getElementById('lg4')];
  if (!cards[0]) { return; }
  var T = []; function at(ms, fn) { T.push(setTimeout(fn, ms)); }
  function run() {
    T.forEach(clearTimeout); T = [];
    cards.forEach(function (c) { c.classList.remove('show'); });
    cards.forEach(function (c, i) { at(500 + i * 180, function () { c.classList.add('show'); }); });
    at(7000, run);
  }
  // Same treatment as the voice demo: kick off the cascade on scroll-in.
  var el = document.querySelector('.groups-phone') || cards[0];
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting) { run(); }
        else { T.forEach(clearTimeout); T = []; }
      });
    }, { threshold: 0.35 }).observe(el);
  } else { run(); }
})();


(function preRoundDemo() {
  'use strict';
  // Coming-soon phone: course -> tees -> crew -> lines -> board -> post -> action, on a loop.
  // Built as 8 scenes; the dots under the phone jump to a scene (playFrom).
  var g = function (id) { return document.getElementById(id); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var scenes = [g('pr0'), g('pr1'), g('pr2'), g('pr3'), g('pr4'), g('pr5'), g('pr6'), g('pr7')];
  if (!scenes[0]) { return; }
  var dots = $$('#pr-dots i');
  var T = []; function at(ms, fn) { T.push(setTimeout(fn, ms)); }
  function show(el) { el.classList.add('show'); } function hide(el) { el.classList.remove('show'); }
  function type(el, text, t0, step) {
    for (var c = 1; c <= text.length; c++) { (function (k) { at(t0 + k * step, function () { el.textContent = text.slice(0, k); }); })(c); }
    return t0 + text.length * step;
  }
  var q0 = g('pr-q0'), courses = $$('#pr-courses .pr-card'), nearby = g('pr-nearby'), pebble = g('pr-pebble'), pebbleS = g('pr-pebble-s');
  var tees = $$('#pr-tees .pr-card'), blue = g('pr-blue');
  var q2 = g('pr-q2'), hit = g('pr-hit'), hitAv = g('pr-hit-av'), hitN = g('pr-hit-n'), hitS = g('pr-hit-s');
  var newRows = [g('pr-r1'), g('pr-r2'), g('pr-r3')], cnt = g('pr-cnt'), gen = g('pr-gen');
  var fill = g('pr-fill'), status = g('pr-status');
  var tiles = $$('.pr-tile'), tileDexy = g('pr-tile-dexy');
  var tabs = $$('#pr-tabs span'), lines = g('pr-lines'), cats = $$('#pr-lines .pr-cat'), over = g('pr-over');
  var a20 = g('pr-a20'), post = g('pr-post');
  var posts = [g('pr-p0'), g('pr-p1'), g('pr-p2')], pill0 = g('pr-pill0'), take1 = g('pr-take1'), toast = g('pr-toast'), sum = g('pr-sum'), openN = g('pr-open');
  var crew = [['Dex', 'DP', '#7F77DD', '#fff', 'Dexy Payne', '@dexy · 14.6'], ['Col', 'CC', '#378ADD', '#fff', 'Colin Critchley', '@colin · 5.2'], ['Jak', 'JR', '#EF9F27', '#0A0A0A', 'Jake Reilly', '@jake · 19.3']];

  function resetAll() {
    scenes.forEach(hide);
    q0.textContent = ''; courses.forEach(function (c) { c.classList.remove('show', 'tap', 'sel'); }); hide(nearby);
    pebbleS.textContent = 'Pebble Beach, CA · 1700 17 Mile Drive'; pebbleS.classList.remove('g');
    tees.forEach(function (c) { c.classList.remove('show', 'tap', 'sel'); });
    q2.textContent = ''; hit.classList.remove('show', 'tap'); newRows.forEach(function (r) { r.classList.remove('in', 'show'); }); cnt.textContent = '1';
    hide(gen); gen.classList.remove('press');
    fill.classList.remove('go'); status.textContent = '';
    tiles.forEach(function (t) { t.classList.remove('show', 'tap', 'sel'); });
    tabs.forEach(function (t, i) { t.classList.toggle('on', i === 0); }); lines.scrollTop = 0; over.classList.remove('tap', 'picked');
    a20.classList.remove('on'); post.classList.remove('press');
    posts.forEach(hide); pill0.textContent = 'Open'; pill0.classList.remove('matched');
    take1.textContent = 'Take $10'; take1.classList.remove('tap', 'done'); hide(toast); hide(sum); openN.textContent = '3 open';
  }

  // Each scene schedules its beats from t and returns how long it runs.
  var S = [
    function (t) { // 0 · find a course
      at(t, function () { show(scenes[0]); });
      var e = type(q0, 'Pebble beach', t + 500, 70);
      at(e + 350, function () { show(nearby); });
      courses.forEach(function (c, i) { at(e + 450 + i * 130, function () { show(c); }); });
      at(e + 1500, function () { pebble.classList.add('tap'); });
      at(e + 1700, function () { pebble.classList.remove('tap'); pebble.classList.add('sel'); pebbleS.textContent = 'Preparing course data…'; pebbleS.classList.add('g'); });
      at(e + 2700, function () { hide(scenes[0]); });
      return (e - t) + 3000;
    },
    function (t) { // 1 · pick the tees
      at(t, function () { show(scenes[1]); });
      tees.forEach(function (c, i) { at(t + 300 + i * 120, function () { show(c); }); });
      at(t + 1700, function () { blue.classList.add('tap'); });
      at(t + 1900, function () { blue.classList.remove('tap'); blue.classList.add('sel'); });
      at(t + 2900, function () { hide(scenes[1]); });
      return 3200;
    },
    function (t) { // 2 · add the crew by name
      at(t, function () { show(scenes[2]); });
      var cur = t + 400;
      crew.forEach(function (p, i) {
        (function (p, i, t0) {
          at(t0, function () { q2.textContent = ''; hit.classList.remove('show'); });
          var e = type(q2, p[0], t0, 90);
          at(e + 250, function () { hitAv.textContent = p[1]; hitAv.style.background = p[2]; hitAv.style.color = p[3]; hitN.textContent = p[4]; hitS.textContent = p[5]; show(hit); });
          at(e + 900, function () { hit.classList.add('tap'); });
          at(e + 1100, function () { hit.classList.remove('tap', 'show'); q2.textContent = ''; newRows[i].classList.add('in'); cnt.textContent = String(i + 2); });
          at(e + 1150, function () { show(newRows[i]); });
        })(p, i, cur);
        cur += p[0].length * 90 + 1700;
      });
      at(cur + 100, function () { show(gen); });
      at(cur + 900, function () { gen.classList.add('press'); });
      at(cur + 1300, function () { hide(scenes[2]); });
      return (cur - t) + 1600;
    },
    function (t) { // 3 · low-key loading
      at(t, function () { show(scenes[3]); });
      at(t + 150, function () { fill.classList.add('go'); });
      ['reading the card…', 'running 12,000 rounds…', 'ranking the lines…'].forEach(function (s, i) { at(t + 300 + i * 850, function () { status.textContent = s; }); });
      at(t + 3000, function () { hide(scenes[3]); });
      return 3300;
    },
    function (t) { // 4 · the other three, one tile each
      at(t, function () { show(scenes[4]); });
      tiles.forEach(function (c, i) { at(t + 300 + i * 140, function () { show(c); }); });
      at(t + 2000, function () { tileDexy.classList.add('tap'); });
      at(t + 2200, function () { tileDexy.classList.remove('tap'); tileDexy.classList.add('sel'); });
      at(t + 3000, function () { hide(scenes[4]); });
      return 3300;
    },
    function (t) { // 5 · Dexy's 25 lines: tab through the categories, pick a side
      at(t, function () { show(scenes[5]); lines.scrollTop = 0; });
      function tab(i) {
        tabs.forEach(function (x, k) { x.classList.toggle('on', k === i); });
        var top = cats[i].offsetTop - cats[0].offsetTop;
        if (lines.scrollTo) { lines.scrollTo({ top: top, behavior: 'smooth' }); } else { lines.scrollTop = top; }
      }
      at(t + 1700, function () { tab(1); }); at(t + 3100, function () { tab(2); }); at(t + 4500, function () { tab(0); });
      at(t + 5600, function () { over.classList.add('tap'); });
      at(t + 5800, function () { over.classList.remove('tap'); over.classList.add('picked'); });
      at(t + 6600, function () { hide(scenes[5]); });
      return 6900;
    },
    function (t) { // 6 · post a side
      at(t, function () { show(scenes[6]); });
      at(t + 900, function () { a20.classList.add('on'); });
      at(t + 2300, function () { post.classList.add('press'); });
      at(t + 2900, function () { hide(scenes[6]); });
      return 3200;
    },
    function (t) { // 7 · the group's action: take one, get taken
      at(t, function () { show(scenes[7]); });
      posts.forEach(function (p, i) { at(t + 300 + i * 220, function () { show(p); }); });
      at(t + 2300, function () { take1.classList.add('tap'); });
      at(t + 2500, function () { take1.classList.remove('tap'); take1.textContent = 'MATCHED'; take1.classList.add('done'); openN.textContent = '2 open'; });
      at(t + 3900, function () { show(toast); pill0.textContent = 'Matched'; pill0.classList.add('matched'); openN.textContent = '1 open'; });
      at(t + 4900, function () { show(sum); });
      at(t + 6600, function () { hide(toast); });
      at(t + 7000, function () { hide(scenes[7]); });
      return 7300;
    }
  ];
  function playFrom(k) {
    T.forEach(clearTimeout); T = []; resetAll();
    var t = 150;
    for (var i = k; i < S.length; i++) {
      (function (i, t0) { at(t0, function () { dots.forEach(function (d, j) { d.classList.toggle('on', j === i); }); }); })(i, t);
      t += S[i](t);
    }
    at(t + 200, function () { playFrom(0); });
  }
  dots.forEach(function (d, i) { d.addEventListener('click', function () { playFrom(i); }); });
  var el = document.querySelector('.pr-phone') || scenes[0];
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting) { playFrom(0); }
        else { T.forEach(clearTimeout); T = []; }
      });
    }, { threshold: 0.35 }).observe(el);
  } else { playFrom(0); }
})();

/* ============================================================================
   HOW IT WORKS — scroll choreography (phones glide in, copy staggers, idle float)
   ============================================================================ */
(function flowSequence() {
  var layers = Array.prototype.slice.call(document.querySelectorAll('.flow .layer'));
  if (!layers.length) { return; }
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !window.gsap || !window.ScrollTrigger) {
    layers.forEach(function (el) { el.style.opacity = 1; });
    return;
  }
  window.gsap.registerPlugin(window.ScrollTrigger);

  layers.forEach(function (layer, i) {
    var fromRight = layer.classList.contains('reverse');
    var shot = layer.querySelector('.shot');
    var img = shot && shot.querySelector('img');
    var glow = layer.querySelector('.device-glow');
    var num = layer.querySelector('.layer-num');
    var head = layer.querySelector('h3');
    var bullets = layer.querySelectorAll('.bullets li');

    var tl = window.gsap.timeline({
      scrollTrigger: { trigger: layer, start: 'top 74%' }
    });
    if (shot) {
      tl.from(shot, {
        x: fromRight ? 90 : -90, rotate: fromRight ? 4 : -4,
        scale: 0.92, opacity: 0, duration: 1.05, ease: 'power3.out'
      }, 0);
    }
    if (glow) { tl.from(glow, { opacity: 0, scale: 0.6, duration: 1.5, ease: 'power2.out' }, 0.1); }
    if (num) { tl.from(num, { opacity: 0, y: 12, letterSpacing: '0.4em', duration: 0.7, ease: 'power2.out' }, 0.15); }
    if (head) { tl.from(head, { opacity: 0, y: 34, duration: 0.9, ease: 'power3.out' }, 0.25); }
    if (bullets.length) {
      tl.from(bullets, { opacity: 0, x: -18, duration: 0.6, ease: 'power2.out', stagger: 0.16 }, 0.45);
    }

    // idle levitation - phones breathe once they have arrived
    if (img) {
      window.gsap.to(img, {
        y: -9, duration: 3.1 + i * 0.4, repeat: -1, yoyo: true,
        ease: 'sine.inOut', delay: 1.2 + i * 0.3
      });
    }
  });
})();
