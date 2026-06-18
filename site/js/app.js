/* ============================================================================
   SANDBAGR — page controller
   Scroll choreography, the in-phone app mockups, and "The Line" queue flow.
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
    var subline = $('.problem-subline', section);
    var bubbles = $$('.chat-bubble', section);
    var bridge  = $('.problem-bridge', section);
    var animated = [subline].concat(bubbles).concat([bridge]).filter(Boolean);

    if (prefersReduced || !window.gsap || !window.ScrollTrigger) {
      animated.forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
      return;
    }
    window.gsap.registerPlugin(window.ScrollTrigger);

    // subline flies up
    window.gsap.from(subline, {
      opacity: 0, y: 40, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: subline, start: 'top 80%' }
    });
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

  /* ----------------------------------------- number count-up helper (queue/trust) */
  function animateNum(el, from, to, ms, prefix, sign) {
    if (prefersReduced) { el.textContent = (sign && to >= 0 ? '+' : '') + (prefix || '') + Math.round(to); return; }
    var start = null;
    function frame(t) {
      if (start === null) { start = t; }
      var k = Math.min(1, (t - start) / ms);
      var v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      el.textContent = (sign && v >= 0 ? '+' : '') + (prefix || '') + (v < 0 ? '-' + Math.abs(v) : v);
      if (k < 1) { requestAnimationFrame(frame); }
    }
    requestAnimationFrame(frame);
  }
  /* ============================================================================
     THE LINE: queue + referral flow
     ============================================================================ */
  var captureForms = $$('form[data-capture]');
  var qcCapture = $('#qcCapture');
  var qcPosition = $('#qcPosition');
  var posNumEl = $('#posNum');
  var refLinkEl = $('#refLink');
  var refCountEl = $('#refCount');
  var trustCountEl = $('#trustCount');

  // live "already in line" social proof — hide the line until the real count
  // loads from the backend so it never flashes "0 already in line".
  var trustLine = trustCountEl ? trustCountEl.closest('.qc-trust') : null;
  var heroCountEl = $('#heroCount');
  if (trustLine) { trustLine.style.visibility = 'hidden'; }
  Waitlist.count().then(function (n) {
    if (trustLine) { trustLine.style.visibility = 'visible'; }
    tickTo(trustCountEl, n);
    if (heroCountEl) { tickTo(heroCountEl, n); }
  });

  function tickTo(el, target) {
    var cur = parseInt((el.textContent || '0').replace(/\D/g, ''), 10) || 0;
    animateNum(el, cur, target, 900, '', false);
  }

  function showError(id, msg) {
    var el = $('#' + id); if (el) { el.textContent = msg || ''; }
  }

  var crewListEl = $('#crewList');
  var crewEmptyEl = $('#crewEmpty');
  var shownCrew = [];   // names currently rendered, to detect new joiners

  function initials(name) {
    var parts = (name || '?').trim().split(/\s+/);
    var a = parts[0] ? parts[0].charAt(0) : '?';
    var b = parts[1] ? parts[1].charAt(0) : '';
    return (a + b).toUpperCase();
  }
  function renderCrew(crew) {
    crew = crew || [];
    refCountEl.textContent = crew.length;
    if (crewEmptyEl) { crewEmptyEl.style.display = crew.length ? 'none' : ''; }
    // append only the new ones so existing rows don't re-animate
    for (var i = shownCrew.length; i < crew.length; i++) {
      var row = document.createElement('div');
      row.className = 'crew-row';
      var av = document.createElement('span'); av.className = 'crew-av'; av.textContent = initials(crew[i]);
      var nm = document.createElement('span'); nm.className = 'crew-name'; nm.textContent = crew[i];
      var tag = document.createElement('span'); tag.className = 'crew-tag'; tag.textContent = 'joined';
      row.appendChild(av); row.appendChild(nm); row.appendChild(tag);
      crewListEl.appendChild(row);
      if (window.gsap && !prefersReduced) {
        window.gsap.fromTo(row, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.45, ease: 'power2.out' });
      }
    }
    shownCrew = crew.slice();
  }

  function revealPosition(res) {
    // count DOWN from a higher number into the real position for drama
    qcCapture.hidden = true;
    qcPosition.hidden = false;
    refLinkEl.value = Waitlist.refLinkFor(res.code);
    shownCrew = [];
    if (crewListEl) { $$('.crew-row', crewListEl).forEach(function (n) { n.remove(); }); }
    renderCrew(res.crew);
    var fakeStart = res.position + 535;
    animateNum(posNumEl, fakeStart, res.position, 1400, '', false);
    if (window.gsap && !prefersReduced) {
      window.gsap.fromTo(qcPosition, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
    }
    qcPosition.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
    pollStatus(res.code, res.position);
  }

  // Each capture (hero + final) drops into the same flow
  captureForms.forEach(function (form) {
    var errId = form.getAttribute('data-capture') === 'hero' ? 'heroErr' : 'lineErr';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // honeypot: real users never fill this. Silently accept (don't tip off bots).
      var hp = form.querySelector('.hp');
      if (hp && hp.value) { revealPosition({ code: 'XXXXXX', position: 847, refCount: 0, crew: [] }); return; }
      var nameInput = form.querySelector('input[name="firstName"]');
      var input = form.querySelector('input[name="phone"]');
      var name = (nameInput && nameInput.value || '').trim();
      var phone = input.value.trim();
      showError(errId, '');
      if (!name) { showError(errId, 'Add your first name.'); if (nameInput) { nameInput.focus(); } return; }
      if (!Waitlist.validPhone(phone)) { showError(errId, 'Enter a valid phone number.'); input.focus(); return; }
      var btn = form.querySelector('button'); var label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Locking in…';
      Waitlist.join(phone, name).then(function (res) {
        btn.disabled = false; btn.textContent = label;
        // both captures route to the queue card in section 6
        revealPosition(res);
        if (form.getAttribute('data-capture') === 'hero') {
          $('#cta').scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
        }
      }).catch(function () {
        btn.disabled = false; btn.textContent = label;
        showError(errId, 'Something went wrong. Try again.');
      });
    });
  });

  // If returning visitor already signed up, restore their position view
  var existing = Waitlist.me();
  if (existing && existing.code) {
    Waitlist.status(existing.code).then(function (st) {
      if (st) { revealPosition({ code: existing.code, position: st.position, refCount: st.refCount, crew: st.crew }); }
    });
  }

  // Poll status so the position visibly ticks down when friends join
  var lastPos = null;
  function pollStatus(code, knownPos) {
    lastPos = knownPos;
    clearInterval(pollStatus._t);
    pollStatus._t = setInterval(function () {
      Waitlist.status(code).then(function (st) {
        if (!st) { return; }
        renderCrew(st.crew);   // new joiners slide in
        if (lastPos != null && st.position < lastPos) {
          animateNum(posNumEl, lastPos, st.position, 800, '', false);
          flashMove(lastPos - st.position);
        }
        lastPos = st.position;
      });
    }, 4000);
  }
  function flashMove(by) {
    var el = $('#posMove'); if (!el) { return; }
    el.hidden = false; el.textContent = '▲ Jumped ' + by + ' spots';
    if (window.gsap && !prefersReduced) {
      window.gsap.fromTo(el, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, yoyo: true, repeat: 1 });
    }
  }

  /* ---- copy referral link ---- */
  var copyBtn = $('#refCopy');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var txt = refLinkEl.value;
      var done = function () {
        copyBtn.textContent = 'Copied'; copyBtn.classList.add('copied');
        setTimeout(function () { copyBtn.textContent = 'Copy'; copyBtn.classList.remove('copied'); }, 1600);
      };
      if (navigator.clipboard) { navigator.clipboard.writeText(txt).then(done, function () { refLinkEl.select(); document.execCommand('copy'); done(); }); }
      else { refLinkEl.select(); document.execCommand('copy'); done(); }
    });
  }

  /* ---- one-tap share ---- */
  function shareMsg() {
    var me = Waitlist.me();
    var link = me ? me.refLink : location.origin;
    return "I'm in line for SANDBAGR — turn every round into a live market. Cut the line with me: " + link;
  }
  var shareText = $('#shareText'), shareIG = $('#shareIG'), shareNative = $('#shareNative');
  if (shareText) {
    shareText.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.href = 'sms:?&body=' + encodeURIComponent(shareMsg());
    });
  }
  if (shareIG) {
    shareIG.addEventListener('click', function (e) {
      e.preventDefault();
      // No web intent for IG stories — copy the message so it's ready to paste
      var msg = shareMsg();
      if (navigator.clipboard) { navigator.clipboard.writeText(msg); }
      shareIG.textContent = '📸 Copied — paste it';
      setTimeout(function () { shareIG.textContent = '📸 Story'; }, 1800);
      window.open('https://instagram.com', '_blank');
    });
  }
  if (shareNative) {
    if (navigator.share) {
      shareNative.addEventListener('click', function () {
        navigator.share({ title: 'SANDBAGR', text: "Cut the line with me — SANDBAGR", url: (Waitlist.me() || {}).refLink || location.href });
      });
    } else {
      shareNative.style.display = 'none';
    }
  }
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
