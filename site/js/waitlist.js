/* ============================================================================
   SANDBAGR — Waitlist + Referral engine
   ----------------------------------------------------------------------------
   This is the data layer behind "The Line" (Section 6). It exposes one async
   API, `Waitlist`, that the UI in app.js talks to. It ships with a working
   localStorage-backed implementation so the page is fully functional the moment
   you open it — sign up, get a real position, share a referral link, and watch
   your spot tick down as friends join (within the same browser).

   GOING TO PRODUCTION — back it with a Google Sheet (free, no server)
   -------------------------------------------------------------------
   The referral mechanic only grows the list for real with a shared backend
   (cross-device). Easiest path: a Google Sheet + the Apps Script in
   backend/Code.gs. Deploy that script as a Web App, then below set
   CONFIG.backend = 'gsheet' and paste the Web App URL into CONFIG.gsheet.url.
   That's it — every signup becomes a row and positions/referrals are computed
   server-side so they work across every phone.
   ============================================================================ */
(function (global) {
  'use strict';

  var CONFIG = {
    // 'local'  → localStorage demo (works instantly, single browser only)
    // 'gsheet' → real shared backend via Google Sheet (live)
    backend: 'gsheet',
    // No seed — show the real number of signups. MUST match SEED in backend/Code.gs.
    seedCount: 0,
    gsheet: {
      // Apps Script Web App URL (ends in /exec). See backend/Code.gs.
      url: 'https://script.google.com/macros/s/AKfycbwS4_PVkzQdx0qXxCh3VIvXdx6KKMIS_o7391ISMW1d2nipSzTpSLCNtbTMYPvJ2Q0/exec'
    }
  };

  // -------------------------------------------------------------- utilities
  function makeCode() {
    var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
    var n = c.length;
    if (global.crypto && global.crypto.getRandomValues) {
      var buf = new Uint8Array(6);
      global.crypto.getRandomValues(buf);
      for (var i = 0; i < 6; i++) { s += c[buf[i] % n]; }
    } else {
      var seed = Date.now();
      for (var j = 0; j < 6; j++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; s += c[(seed >> 16) % n]; }
    }
    return s;
  }
  // Phone: accept common formats, validate by digit count, store normalized digits.
  function normalizePhone(p) {
    var d = String(p || '').replace(/\D/g, '');
    if (d.length === 11 && d.charAt(0) === '1') { d = d.slice(1); } // drop US country code
    return d;
  }
  function validPhone(p) { var d = normalizePhone(p); return d.length >= 10 && d.length <= 15; }
  function maskPhone(p) { var d = normalizePhone(p); return d.length >= 4 ? ('•••-' + d.slice(-4)) : 'A friend'; }
  function refLinkFor(code) {
    return location.origin + location.pathname.replace(/index\.html?$/, '') + '?ref=' + code;
  }
  function getRefFromUrl() {
    var m = location.search.match(/[?&]ref=([A-Z0-9]+)/i);
    return m ? m[1].toUpperCase() : null;
  }

  /* ==========================================================================
     LOCAL implementation — a tiny waitlist DB in localStorage
     ======================================================================== */
  var Local = (function () {
    var KEY = 'sandbagr_waitlist_v1';

    function db() {
      try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
      catch (e) { return {}; }
    }
    function save(d) { localStorage.setItem(KEY, JSON.stringify(d)); }
    function init(d) {
      if (!d.people) { d.people = {}; }      // code -> { phone, code, ref, joinedAt, order }
      if (!d.byPhone) { d.byPhone = {}; }     // phone -> code
      if (d.next == null) { d.next = 1; }     // join order counter
      return d;
    }

    // position = (people who joined before you, after weighting referrals) + base.
    // Each friend who joins on your link pulls you ahead of `JUMP` people.
    var JUMP = 35;
    function positionOf(d, code) {
      var me = d.people[code];
      if (!me) { return null; }
      var refCount = 0, ahead = 0;
      for (var c in d.people) {
        var p = d.people[c];
        if (p.code === code) { continue; }
        if (p.ref === code) { refCount++; }
        if (p.order < me.order) { ahead++; }
      }
      var base = CONFIG.seedCount;
      var pos = base + ahead - (refCount * JUMP) - (me.refSelf || 0) * JUMP;
      // your own referrals already counted via refCount; clamp sane
      pos = base + 1 + ahead - refCount * JUMP;
      return { position: Math.max(1, pos), refCount: refCount };
    }

    // first names of everyone who joined on `code`, in join order
    function crewOf(d, code) {
      var list = [];
      for (var c in d.people) {
        var p = d.people[c];
        if (p.ref === code) { list.push(p); }
      }
      return list.sort(function (a, b) { return a.order - b.order; })
                 .map(function (p) { return p.name || maskPhone(p.phone); });
    }

    return {
      join: function (phone, ref, name) {
        var d = init(db());
        phone = normalizePhone(phone);
        var existing = d.byPhone[phone];
        if (existing && d.people[existing]) {
          var st = positionOf(d, existing);
          return Promise.resolve({ phone: phone, code: existing, position: st.position, refCount: st.refCount, crew: crewOf(d, existing), returning: true });
        }
        var code = makeCode();
        while (d.people[code]) { code = makeCode(); }
        d.people[code] = { phone: phone, name: (name || '').trim(), code: code, ref: (ref && d.people[ref]) ? ref : null, order: d.next++ };
        d.byPhone[phone] = code;
        save(d);
        var s = positionOf(d, code);
        return Promise.resolve({ phone: phone, code: code, position: s.position, refCount: s.refCount, crew: crewOf(d, code), returning: false });
      },
      status: function (code) {
        var d = init(db());
        if (!d.people[code]) { return Promise.resolve(null); }
        var s = positionOf(d, code);
        return Promise.resolve({ code: code, position: s.position, refCount: s.refCount, crew: crewOf(d, code) });
      },
      invite: function (code, friendPhone) {
        // Records intent locally (unused — the site shares via link, not direct invite).
        var d = init(db());
        d.invites = d.invites || [];
        d.invites.push({ from: code, to: normalizePhone(friendPhone) });
        save(d);
        return Promise.resolve({ ok: true });
      },
      count: function () {
        var d = init(db());
        return Promise.resolve(CONFIG.seedCount + Object.keys(d.people).length);
      }
    };
  })();

  /* ==========================================================================
     GOOGLE SHEET adapter — production. Activated when CONFIG.backend='gsheet'.
     Talks to the Apps Script Web App in backend/Code.gs. All calls are GET with
     query params: that avoids a CORS preflight (which Apps Script can't answer),
     and Apps Script returns permissive CORS on GET so the browser is happy.
     ======================================================================== */
  var Sheet = {
    _call: function (params) {
      var qs = Object.keys(params)
        .filter(function (k) { return params[k] != null && params[k] !== ''; })
        .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
        .join('&');
      return fetch(CONFIG.gsheet.url + '?' + qs, { method: 'GET', redirect: 'follow' })
        .then(function (r) { if (!r.ok) { throw new Error('backend ' + r.status); } return r.json(); })
        .then(function (d) { if (d && d.error) { throw new Error(d.error); } return d; });
    },
    join: function (phone, ref, name) {
      phone = normalizePhone(phone);
      return Sheet._call({ action: 'join', phone: phone, ref: ref || '', name: name || '' })
        .then(function (d) {
          return { phone: phone, code: d.code, position: d.position, refCount: d.refCount || 0, crew: d.crew || [], returning: !!d.returning };
        });
    },
    status: function (code) {
      return Sheet._call({ action: 'status', code: code })
        .then(function (d) { return { code: code, position: d.position, refCount: d.refCount || 0, crew: d.crew || [] }; })
        .catch(function () { return null; });
    },
    invite: function (code, friendPhone) {
      return Sheet._call({ action: 'invite', code: code, phone: normalizePhone(friendPhone) })
        .then(function () { return { ok: true }; });
    },
    count: function () {
      return Sheet._call({ action: 'count' })
        .then(function (d) { return d.count || CONFIG.seedCount; })
        .catch(function () { return CONFIG.seedCount; });
    }
  };

  var impl = (CONFIG.backend === 'gsheet' && CONFIG.gsheet.url) ? Sheet : Local;

  // -------------------------------------------------------- session memory
  var SESSION_KEY = 'sandbagr_me_v1';
  function remember(me) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(me)); } catch (e) {} }
  function recall() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; } }

  global.Waitlist = {
    validPhone: validPhone,
    normalizePhone: normalizePhone,
    refLinkFor: refLinkFor,
    getRefFromUrl: getRefFromUrl,
    me: recall,
    join: function (phone, name) {
      return impl.join(phone, getRefFromUrl(), name).then(function (res) {
        var me = { phone: res.phone, name: (name || '').trim(), code: res.code, refLink: refLinkFor(res.code) };
        remember(me);
        return res;
      });
    },
    status: function (code) { return impl.status(code); },
    count: function () { return impl.count(); }
  };
})(window);
