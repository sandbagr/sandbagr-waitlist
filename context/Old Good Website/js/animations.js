/* ============================================================
   SANDBAGR — Site-wide animation polish.
   Loaded after GSAP. Wires magnetic buttons, cursor accent,
   number counters, and a scroll-pinned engine pipeline.
   ============================================================ */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);

  // ============================================================
  // 1) CUSTOM CURSOR ACCENT — small green dot that follows cursor.
  //    Desktop only. Lerps to position for buttery motion.
  // ============================================================
  function initCursor() {
    if (isTouch || prefersReducedMotion) return;
    var dot = document.createElement('div');
    dot.className = 'sb-cursor';
    document.body.appendChild(dot);

    var ring = document.createElement('div');
    ring.className = 'sb-cursor-ring';
    document.body.appendChild(ring);

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var dx = mx, dy = my;
    var rx = mx, ry = my;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
    });

    document.addEventListener('mouseleave', function () {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
      dot.style.opacity = '';
      ring.style.opacity = '';
    });

    // Hover state on interactive elements
    var hoverables = 'a, button, .btn, .hot, [data-go], iframe, .proto-phone-hero, .proto-sat-frame, .league-phone-frame, .golden-hero-phone, input, .jt-row, .proof-row, .bg-row';
    document.body.addEventListener('mouseover', function (e) {
      if (e.target.closest(hoverables)) {
        document.body.classList.add('sb-cursor-hover');
      }
    });
    document.body.addEventListener('mouseout', function (e) {
      if (e.target.closest(hoverables)) {
        document.body.classList.remove('sb-cursor-hover');
      }
    });

    function tick() {
      // Inner dot — fast lerp
      dx += (mx - dx) * 0.55;
      dy += (my - dy) * 0.55;
      dot.style.transform = 'translate3d(' + dx + 'px,' + dy + 'px,0) translate(-50%,-50%)';

      // Ring — slow lerp for trail effect
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) translate(-50%,-50%)';

      requestAnimationFrame(tick);
    }
    tick();
  }

  // ============================================================
  // 2) MAGNETIC BUTTONS — buttons gently track cursor on hover.
  // ============================================================
  function initMagnetic() {
    if (isTouch || prefersReducedMotion) return;
    var nodes = document.querySelectorAll('.btn, .wl-submit');
    nodes.forEach(function (el) {
      var rect, cx, cy;
      var STRENGTH = 0.25; // 0 = no pull, 0.5 = strong pull
      el.addEventListener('mouseenter', function () {
        rect = el.getBoundingClientRect();
        cx = rect.left + rect.width / 2;
        cy = rect.top + rect.height / 2;
      });
      el.addEventListener('mousemove', function (e) {
        if (!rect) return;
        var x = (e.clientX - cx) * STRENGTH;
        var y = (e.clientY - cy) * STRENGTH;
        el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
      });
    });
  }

  // ============================================================
  // 3) NUMBER COUNTERS — counts up to value when in viewport.
  //    Use [data-count="100"] data-suffix="+" data-prefix="$" data-decimals="1"
  // ============================================================
  function initCounters() {
    if (prefersReducedMotion) return;
    var nodes = document.querySelectorAll('[data-count]');
    if (!nodes.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.dataset.counted === '1') return;
        el.dataset.counted = '1';

        var target = parseFloat(el.dataset.count) || 0;
        var prefix = el.dataset.prefix || '';
        var suffix = el.dataset.suffix || '';
        var decimals = parseInt(el.dataset.decimals || '0', 10);
        var dur = parseInt(el.dataset.dur || '1400', 10);
        var start = performance.now();

        function step(t) {
          var p = Math.min((t - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
          var v = target * eased;
          el.textContent = prefix + v.toFixed(decimals) + suffix;
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = prefix + target.toFixed(decimals) + suffix;
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.45 });

    nodes.forEach(function (el) { observer.observe(el); });
  }

  // ============================================================
  // 4) SCRAMBLE / TYPE-IN HEADLINES — for elements with .scramble
  //    Reveals letter-by-letter as the headline enters viewport.
  // ============================================================
  function initScramble() {
    if (prefersReducedMotion) return;
    var nodes = document.querySelectorAll('.scramble');
    if (!nodes.length) return;
    var GLYPHS = '0123456789!@#$%&*?ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.dataset.scrambled === '1') return;
        el.dataset.scrambled = '1';

        var original = el.textContent;
        var len = original.length;
        var iterations = 0;
        var maxIter = len * 2.5;

        var interval = setInterval(function () {
          el.textContent = original.split('').map(function (ch, i) {
            if (iterations >= i) return ch;
            if (ch === ' ') return ' ';
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }).join('');
          iterations += 0.5;
          if (iterations >= len) {
            clearInterval(interval);
            el.textContent = original;
          }
        }, 32);
      });
    }, { threshold: 0.55 });

    nodes.forEach(function (el) { observer.observe(el); });
  }

  // ============================================================
  // 5) SCROLL-PINNED ENGINE PIPELINE — features.html only.
  //    Pins the pipeline section. As user scrolls, each step
  //    activates sequentially with a glowing pulse moving along
  //    the track.
  // ============================================================
  function initEnginePipeline() {
    if (prefersReducedMotion) return;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    var pipeline = document.getElementById('pipeline');
    if (!pipeline) return;
    var steps = pipeline.querySelectorAll('.pipeline-step');
    if (!steps.length) return;

    // Reset all step active states for the scroll-driven sequencing
    steps.forEach(function (s) { s.classList.remove('pipeline-step-highlight'); });

    var fill = pipeline.querySelector('.pipeline-fill');
    var pulse = pipeline.querySelector('.pipeline-pulse');

    // Pin the pipeline + drive progress with scroll
    ScrollTrigger.create({
      trigger: pipeline,
      start: 'top 18%',
      end: '+=' + (steps.length * 220),
      pin: true,
      pinSpacing: true,
      scrub: 0.6,
      onUpdate: function (self) {
        var p = self.progress;
        var idx = Math.min(steps.length - 1, Math.floor(p * steps.length));
        if (fill) fill.style.height = (p * 100) + '%';
        if (pulse) pulse.style.top = (p * 100) + '%';
        steps.forEach(function (step, i) {
          step.classList.toggle('pipeline-step-active', i <= idx);
          step.classList.toggle('pipeline-step-current', i === idx);
        });
      }
    });
  }

  // ============================================================
  // 6) HEADLINE LINE-REVEAL — wraps each line of a headline in a
  //    span and animates them in with a soft mask reveal.
  //    Mark with .reveal-lines.
  // ============================================================
  function initLineReveal() {
    if (prefersReducedMotion || typeof gsap === 'undefined') return;
    var nodes = document.querySelectorAll('.reveal-lines');
    nodes.forEach(function (el) {
      // Wrap each <br>-delimited line in a span
      var html = el.innerHTML;
      var lines = html.split(/<br\s*\/?>/i);
      el.innerHTML = lines.map(function (l) {
        return '<span class="rl-line"><span class="rl-inner">' + l + '</span></span>';
      }).join('');
      var inners = el.querySelectorAll('.rl-inner');
      gsap.fromTo(inners,
        { yPercent: 110 },
        { yPercent: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%' }
        }
      );
    });
  }

  // ============================================================
  // 8a) ENGINE STAGE V3 — phone-morph cinematic.
  //     Cycles 3 phone screens (bet card → live feed → settle),
  //     side copy panel updates, bottom progress bar tracks.
  // ============================================================
  function initEngineStage() {
    var stage = document.getElementById('engineStage');
    if (!stage) return;

    var screens = stage.querySelectorAll('.es-screen');
    var copyPanels = stage.querySelectorAll('.es-copy-step');
    var markers = stage.querySelectorAll('.es-marker');
    var progressFill = document.getElementById('esProgressFill');

    var STEP_MS = 3600; // dwell time per step (slightly longer for readability)
    var PAUSE_MS = 8000; // how long to pause auto-cycle after a manual click
    var TOTAL = 3;
    var idx = 0;
    var autoTimer = null;
    var pauseTimer = null;

    function setStep(i) {
      idx = i;
      screens.forEach(function (s, k) { s.classList.toggle('es-screen-active', k === i); });
      copyPanels.forEach(function (c, k) { c.classList.toggle('es-copy-active', k === i); });
      markers.forEach(function (m, k) { m.classList.toggle('es-marker-active', k === i); });
      var pct = ((i + 1) / TOTAL) * 100;
      if (progressFill) progressFill.style.width = pct + '%';
    }

    function nextStep() {
      var next = (idx + 1) % TOTAL;
      setStep(next);
    }

    function startAuto() {
      if (autoTimer) return;
      autoTimer = setInterval(nextStep, STEP_MS);
    }

    function stopAuto() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }

    // Manual click on a marker — jump there and pause auto-cycle
    markers.forEach(function (m) {
      m.style.cursor = 'pointer';
      m.addEventListener('click', function () {
        var s = parseInt(m.dataset.step, 10) || 0;
        setStep(s);
        stopAuto();
        if (pauseTimer) clearTimeout(pauseTimer);
        // Resume auto-cycle after PAUSE_MS of inactivity
        pauseTimer = setTimeout(startAuto, PAUSE_MS);
      });
    });

    // Start auto-cycle when in viewport
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !stage.dataset.started) {
          stage.dataset.started = '1';
          setStep(0);
          // Small delay before first auto-advance so users see the first state
          setTimeout(startAuto, STEP_MS);
        }
      });
    }, { threshold: 0.25 });
    observer.observe(stage);
  }

  // ============================================================
  // 8b) Legacy engine flow (SVG nodes) — kept for backwards compat
  //     in case some pages still use it. No-ops if element missing.
  // ============================================================
  function initEngineFlow() {
    var stage = document.getElementById('engineCinema');
    if (!stage) return;

    var nodes = stage.querySelectorAll('[data-node]');
    var paths = stage.querySelectorAll('[data-path]');
    var labels = stage.querySelectorAll('[data-cinema-label]');

    // Initialize SVG paths with stroke-dashoffset trick
    paths.forEach(function (p) {
      try {
        var len = p.getTotalLength ? p.getTotalLength() : 800;
        p.style.strokeDasharray = len + ' ' + len;
        p.style.strokeDashoffset = len;
        p.dataset.pathLen = len;
      } catch (e) { /* ignore */ }
    });

    var STEP_MS = 1900;   // each step illuminates for this long — slow enough to track clearly
    var TOTAL = nodes.length;
    var idx = 0;

    function activateStep(i) {
      // Reset all
      nodes.forEach(function (n, k) { n.classList.toggle('cn-on', k <= i); n.classList.toggle('cn-now', k === i); });
      labels.forEach(function (l, k) { l.classList.toggle('cl-on', k === i); });

      // Draw paths up to current step
      paths.forEach(function (p, k) {
        var len = parseFloat(p.dataset.pathLen) || 800;
        if (k < i) {
          p.style.transition = 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)';
          p.style.strokeDashoffset = '0';
        } else if (k === i - 1) {
          p.style.transition = 'stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)';
          p.style.strokeDashoffset = '0';
        } else {
          p.style.transition = 'none';
          p.style.strokeDashoffset = len;
        }
      });
    }

    function tick() {
      activateStep(idx);
      idx++;
      if (idx > TOTAL) {
        // Reset for next loop
        setTimeout(function () {
          idx = 0;
          nodes.forEach(function (n) { n.classList.remove('cn-on'); n.classList.remove('cn-now'); });
          labels.forEach(function (l) { l.classList.remove('cl-on'); });
          paths.forEach(function (p) {
            var len = parseFloat(p.dataset.pathLen) || 800;
            p.style.transition = 'none';
            p.style.strokeDashoffset = len;
          });
          tick();
        }, STEP_MS * 1.5);
        return;
      }
      setTimeout(tick, STEP_MS);
    }

    // Start when in viewport
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !stage.dataset.started) {
          stage.dataset.started = '1';
          tick();
        }
      });
    }, { threshold: 0.25 });
    observer.observe(stage);
  }

  // ============================================================
  // 7) MARKETS TERMINAL — auto-running live trading floor.
  //    Renders rows that tick prices every 2-3s, sparklines that
  //    update, volume that climbs, and a scrolling take-tape.
  // ============================================================
  function initMarketsTerminal() {
    var list = document.getElementById('mtList');
    var tapeInner = document.getElementById('mtTapeInner');
    var clockEl = document.getElementById('mtClock');
    var volEl = document.getElementById('mtVolume');
    var takesEl = document.getElementById('mtTakes');
    if (!list) return;

    // Seed markets with realistic golf-bet questions
    var MARKETS = [
      { q: 'Lowest round today',          meta: 'YES · spans whole league', price: 62, hist: [55,58,57,60,59,62,62,61,62] },
      { q: 'First birdie · front 9',       meta: 'YES · between 7:00–9:00 AM', price: 71, hist: [64,66,68,70,69,71,73,71,71] },
      { q: 'Mike vs Jake H2H',             meta: 'YES · stroke play',         price: 55, hist: [50,51,53,55,54,56,55,53,55] },
      { q: 'Most birdies today',           meta: 'YES · across all members',  price: 48, hist: [44,46,45,47,48,47,48,49,48] },
      { q: 'Anyone breaks 75',             meta: 'YES · open question',       price: 36, hist: [30,32,34,35,33,36,38,36,36] },
      { q: 'Hole-in-one · today',          meta: 'YES · longshot',            price: 4,  hist: [3,3,4,4,5,4,4,5,4] }
    ];

    var TAKERS = ['Colin','Jake','Mike','Sarah','Brad','Ryan','Tyler','Sam','Pat','Drew'];
    var QUOTES = ['Lowest round','First birdie · front','Mike vs Jake','Most birdies','Anyone breaks 75','Hole-in-one'];

    // Sparkline renderer (SVG path)
    function renderSpark(hist, isUp) {
      var w = 76, h = 26;
      var min = Math.min.apply(null, hist), max = Math.max.apply(null, hist);
      var span = max - min || 1;
      var step = w / (hist.length - 1);
      var pts = hist.map(function (v, i) {
        var x = i * step;
        var y = h - ((v - min) / span) * (h - 4) - 2;
        return x.toFixed(1) + ',' + y.toFixed(1);
      }).join(' ');
      var color = isUp ? '#00FF87' : '#ff5555';
      return '<svg class="mt-spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' +
        '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px ' + color + '88);" />' +
      '</svg>';
    }

    function renderRow(m, idx) {
      var prevPrice = m.hist[m.hist.length - 2] || m.price;
      var isUp = m.price >= prevPrice;
      var arrow = isUp ? '▲' : '▼';
      var diff = (m.price - prevPrice).toFixed(1);
      var diffStr = (diff >= 0 ? '+' : '') + diff;
      return '<div class="mt-row" data-row="' + idx + '">' +
          '<div><div class="mt-q">' + m.q + '<span class="mt-q-meta">' + m.meta + '</span></div></div>' +
          renderSpark(m.hist, isUp) +
          '<div class="mt-price' + (isUp ? '' : ' is-down') + '">' + m.price + '¢</div>' +
          '<div class="mt-arrow ' + (isUp ? 'up' : 'down') + '">' + arrow + ' ' + Math.abs(diffStr) + '</div>' +
        '</div>';
    }

    function renderAll() {
      list.innerHTML = MARKETS.map(renderRow).join('');
    }
    renderAll();

    // Tick a random market every 2.2s
    function tickMarket() {
      var i = Math.floor(Math.random() * MARKETS.length);
      var m = MARKETS[i];
      var delta = (Math.random() * 6 - 3); // -3 to +3
      var nextPrice = Math.max(1, Math.min(99, Math.round((m.price + delta) * 10) / 10));
      var direction = nextPrice >= m.price ? 'tick-up' : 'tick-down';
      m.hist.shift();
      m.hist.push(nextPrice);
      m.price = nextPrice;
      var node = list.querySelector('[data-row="' + i + '"]');
      if (node) {
        node.outerHTML = renderRow(m, i);
        var newNode = list.querySelector('[data-row="' + i + '"]');
        if (newNode) {
          newNode.classList.add(direction);
          setTimeout(function () { newNode.classList.remove(direction); }, 600);
        }
      }
    }

    setInterval(tickMarket, 2200);

    // Volume + takes counters
    var volume = 4210;
    var takes = 487;
    setInterval(function () {
      volume += Math.floor(Math.random() * 80) + 12;
      takes += Math.random() > 0.5 ? 1 : 0;
      if (volEl) volEl.textContent = '$' + volume.toLocaleString();
      if (takesEl) takesEl.textContent = takes.toLocaleString();
    }, 1800);
    if (volEl) volEl.textContent = '$' + volume.toLocaleString();
    if (takesEl) takesEl.textContent = takes.toLocaleString();

    // Clock
    function tickClock() {
      var d = new Date();
      var hh = d.getHours().toString().padStart(2, '0');
      var mm = d.getMinutes().toString().padStart(2, '0');
      var ss = d.getSeconds().toString().padStart(2, '0');
      if (clockEl) clockEl.textContent = hh + ':' + mm + ':' + ss + ' EDT';
    }
    tickClock();
    setInterval(tickClock, 1000);

    // Scrolling take-tape
    function makeTake() {
      var name = TAKERS[Math.floor(Math.random() * TAKERS.length)];
      var qt = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      var side = Math.random() > 0.45 ? 'YES' : 'NO';
      var stake = (Math.floor(Math.random() * 80) + 10);
      var px = Math.floor(Math.random() * 80) + 10;
      return '<span class="mt-take"><strong>' + name + '</strong> bought <span class="mt-take-side ' + side.toLowerCase() + '">' + side + '</span> on ' + qt + ' · $' + stake + ' @ ' + px + '¢</span>';
    }
    var takeStr = '';
    for (var i = 0; i < 8; i++) takeStr += makeTake();
    tapeInner.innerHTML = takeStr + takeStr; // double for seamless loop

    // CSS-driven marquee
    var tapeCSS = document.createElement('style');
    tapeCSS.textContent =
      '@keyframes mt-tape-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }' +
      '#mtTapeInner { animation: mt-tape-scroll 60s linear infinite; }';
    document.head.appendChild(tapeCSS);
  }

  // ============================================================
  // 9) LEAGUE ACTIVITY FEED — auto-running stream of activity.
  //    Items appear from below, scroll up, fade out. Mix of
  //    Goldens, fades, joins, recaps, taunts.
  // ============================================================
  function initLeagueFeed() {
    var list = document.getElementById('lfList');
    if (!list) return;
    var clockEl = document.getElementById('lfClock');
    var membersEl = document.getElementById('lfMembers');
    var roundsEl = document.getElementById('lfRounds');
    var takesEl = document.getElementById('lfTakes');

    var TEMPLATES = [
      { av: 'gold', avTxt: '⚡', html: '<strong>Sarah</strong> called Golden on Hole 7 · <strong>"22-foot putt drops."</strong> <span class="lf-tag lf-tag-golden">3 TAKERS</span>' },
      { av: 'mike', avTxt: 'M', html: '<strong>Mike</strong> took Golden · sunk it · <span class="lf-amount">+$36.50</span>' },
      { av: 'jake', avTxt: 'JK', html: '<strong>Jake</strong> faded Colin · Fairway Finder · <span class="lf-amount">$25 vs $35</span> <span class="lf-tag lf-tag-locked">P2P LOCKED</span>' },
      { av: 'system', avTxt: '◉', html: 'Pebble Beach round just <strong>went live</strong> · 12 markets open <span class="lf-tag lf-tag-live">LIVE</span>' },
      { av: 'sarah', avTxt: 'S', html: '<strong>Sarah</strong> bought YES on Lowest round · <strong>$50 @ 62¢</strong>' },
      { av: 'colin', avTxt: 'CC', html: '<strong>Colin</strong> hit The Snake · 3-putt from 12ft · <span class="lf-amount-loss">−$40</span>' },
      { av: 'brad', avTxt: 'B', html: '<strong>Brad</strong> joined the league · <span class="lf-tag lf-tag-locked">+1 MEMBER</span>' },
      { av: 'tyler', avTxt: 'T', html: '<strong>Tyler</strong> on a <strong>5-bet heater</strong> at Bethpage · <span class="lf-amount">+$120 today</span>' },
      { av: 'jake', avTxt: 'JK', html: '<strong>Jake</strong> won Closest to Pin at 6\'4" · <span class="lf-amount">+$75</span>' },
      { av: 'mike', avTxt: 'M', html: '<strong>Mike</strong> sold his "Hole-in-one" YES position at <strong>5¢</strong>' },
      { av: 'system', avTxt: '◉', html: '"Most birdies" market just hit <strong>$1.2K volume</strong> · YES climbing to 48¢' },
      { av: 'colin', avTxt: 'CC', html: '<strong>Colin</strong> drained Draino from 22ft · <span class="lf-amount">+$110</span> <span class="lf-tag lf-tag-locked">SETTLED</span>' },
      { av: 'sarah', avTxt: 'S', html: '<strong>Sarah</strong> heckled Colin: <em>"Bold strategy missing fairways all day."</em>' },
      { av: 'gold', avTxt: '⚡', html: '<strong>Mike</strong> called Golden on Hole 14 · 30-yard chip · <span class="lf-tag lf-tag-golden">2 TAKERS</span>' },
      { av: 'system', avTxt: '◉', html: 'Settle Day in <strong>3 days</strong> · debt-minimized Venmo set incoming' },
      { av: 'tyler', avTxt: 'T', html: '<strong>Tyler</strong> claimed Brad\'s Pin Seek · <span class="lf-tag lf-tag-locked">P2P LOCKED</span>' },
    ];

    var MAX_ITEMS = 7;     // how many visible at a time
    var ADD_INTERVAL = 2400; // new item every X ms
    var pool = TEMPLATES.slice();
    var idx = 0;
    var minutesAgo = 0;

    function timeStr(m) {
      if (m === 0) return 'NOW';
      if (m === 1) return '1m';
      return m + 'm';
    }

    function makeItem(tpl, ago) {
      var d = document.createElement('div');
      d.className = 'lf-item';
      d.innerHTML =
        '<div class="lf-av lf-av-' + tpl.av + '">' + tpl.avTxt + '</div>' +
        '<div class="lf-text">' + tpl.html + '</div>' +
        '<div class="lf-time">' + timeStr(ago) + '</div>';
      return d;
    }

    function shuffle(arr) {
      // Fisher-Yates
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      }
      return arr;
    }

    // Seed initial items
    shuffle(pool);
    for (var s = 0; s < MAX_ITEMS - 2; s++) {
      var tpl = pool[s % pool.length];
      var item = makeItem(tpl, MAX_ITEMS - 2 - s);
      list.appendChild(item);
      // Stagger reveal
      (function (el, delay) {
        setTimeout(function () { el.classList.add('lf-in'); }, delay);
      })(item, s * 90);
    }

    function pushNew() {
      idx = (idx + 1) % pool.length;
      var tpl = pool[idx];
      var item = makeItem(tpl, 0);
      list.appendChild(item);
      // Reveal after a tick
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { item.classList.add('lf-in'); });
      });

      // Bump existing items' times
      var existing = list.querySelectorAll('.lf-item');
      existing.forEach(function (el, i) {
        if (el === item) return;
        var t = el.querySelector('.lf-time');
        if (t) {
          var idx2 = Array.prototype.indexOf.call(existing, el);
          var ageInList = existing.length - 1 - idx2;
          t.textContent = timeStr(ageInList);
        }
      });

      // Remove the oldest if over MAX_ITEMS
      if (list.children.length > MAX_ITEMS) {
        var first = list.firstElementChild;
        first.classList.remove('lf-in');
        first.classList.add('lf-out');
        setTimeout(function () { if (first.parentNode) first.parentNode.removeChild(first); }, 600);
      }

      // Re-shuffle pool when exhausted to keep it varied
      if (idx === pool.length - 1) {
        shuffle(pool);
        idx = -1;
      }
    }

    // Drive the feed at intervals
    setInterval(pushNew, ADD_INTERVAL);

    // Live counters
    var members = 24, rounds = 3, takes = 487;
    setInterval(function () {
      // Occasional member bump
      if (Math.random() > 0.92) members += 1;
      // Occasional round flicker
      if (Math.random() > 0.95) rounds = Math.max(1, Math.min(5, rounds + (Math.random() > 0.5 ? 1 : -1)));
      // Takes climb steadily
      takes += Math.random() > 0.4 ? 1 : 0;
      if (membersEl) membersEl.textContent = members;
      if (roundsEl) roundsEl.textContent = rounds;
      if (takesEl) takesEl.textContent = takes;
    }, 1900);

    // Clock
    function tickClock() {
      if (!clockEl) return;
      var d = new Date();
      var hh = d.getHours().toString().padStart(2, '0');
      var mm = d.getMinutes().toString().padStart(2, '0');
      clockEl.textContent = hh + ':' + mm + ' EDT';
    }
    tickClock();
    setInterval(tickClock, 30000);
  }

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    initCursor();
    initMagnetic();
    initCounters();
    initScramble();
    initEnginePipeline();
    initLineReveal();
    initMarketsTerminal();
    initEngineFlow();
    initLeagueFeed();
    initEngineStage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
