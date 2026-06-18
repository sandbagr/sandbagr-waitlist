/* ============================================================================
   SANDBAGR Waitlist — Google Sheets backend (Google Apps Script)
   ----------------------------------------------------------------------------
   This turns a plain Google Sheet into the real, shared backend behind
   "The Line". Every signup is a row; positions and referral queue-jumps are
   computed server-side so they work across every phone.

   SETUP (5 minutes)
   1. Create a new Google Sheet. Rename the first tab to:  Waitlist
   2. Extensions ▸ Apps Script. Delete the sample code, paste THIS whole file.
   3. Click Deploy ▸ New deployment ▸ type "Web app".
        - Execute as:        Me
        - Who has access:    Anyone
      Deploy, authorize, and COPY the Web app URL (ends in /exec).
   4. Paste that URL into site/js/waitlist.js → CONFIG.gsheet.url
      and set CONFIG.backend = 'gsheet'.
   Done. New rows appear in the sheet as people join.
   ============================================================================ */

var SHEET_NAME = 'Waitlist';
var SEED = 0;      // no seed — count + positions reflect the real number of signups (must match waitlist.js seedCount)
var JUMP = 35;     // spots you cut per friend who joins on your link

function doGet(e) { return handle(e); }
function doPost(e) { return handle(e); }

function handle(e) {
  var p = (e && e.parameter) || {};
  var action = p.action || '';
  var out;
  try {
    if (action === 'join')        out = join_(p.phone, p.ref, p.name);
    else if (action === 'status') out = status_(p.code);
    else if (action === 'invite') out = invite_(p.code, p.phone);
    else if (action === 'count')  out = { count: count_() };
    else                          out = { error: 'unknown action' };
  } catch (err) {
    out = { error: String(err) };
  }
  return ContentService
    .createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- storage helpers --------------------------------------------------------
function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); }
  if (sh.getLastRow() === 0) {
    sh.appendRow(['order', 'phone', 'code', 'ref', 'joinedAt', 'name']);
  }
  return sh;
}
function rows_() {
  var sh = sheet_();
  var n = sh.getLastRow();
  if (n < 2) { return []; }
  var vals = sh.getRange(2, 1, n - 1, 6).getValues();
  return vals.map(function (r) {
    return { order: Number(r[0]), phone: normalizePhone_(String(r[1])), code: String(r[2]),
             ref: String(r[3] || ''), name: String(r[5] || '') };
  });
}
function makeCode_() {
  var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
  for (var i = 0; i < 6; i++) { s += c.charAt(Math.floor(Math.random() * c.length)); }
  return s;
}

// ---- input hardening --------------------------------------------------------
// Phone: keep digits only (drop a leading US "1"); valid = 10–15 digits.
function normalizePhone_(p) {
  var d = String(p == null ? '' : p).replace(/\D/g, '');
  if (d.length === 11 && d.charAt(0) === '1') { d = d.slice(1); }
  return d;
}
function isPhone_(p) { var d = normalizePhone_(p); return d.length >= 10 && d.length <= 15; }
// Neutralize Google Sheets formula injection: a cell whose text starts with
// = + - @ (or tab/CR) can execute as a formula when the owner opens the sheet
// (e.g. =IMPORTXML(...) exfiltrates other rows). Prefix those with an apostrophe.
function safeCell_(v) {
  var s = String(v == null ? '' : v).slice(0, 254);
  return /^[=+\-@\t\r]/.test(s) ? ("'" + s) : s;
}
// Display names: strip control/formula chars, cap length, letters/spaces/.- only.
function cleanName_(v) {
  var s = String(v == null ? '' : v).replace(/[<>=+@\t\r\n]/g, '').trim();
  return s.slice(0, 40);
}
// A display label for someone in your crew: their first name, else masked phone.
function crewLabel_(p) {
  if (p.name) { return p.name; }
  var d = String(p.phone || '');
  return d.length >= 4 ? ('•••-' + d.slice(-4)) : 'A friend';   // •••-1234
}
// Everyone who joined on `code`, in join order.
function referredOf_(all, code) {
  return all.filter(function (p) { return p.ref === code; })
            .sort(function (a, b) { return a.order - b.order; })
            .map(crewLabel_);
}
// Referral codes we issue are exactly 6 chars from a fixed alphabet.
function cleanCode_(v) {
  var s = String(v == null ? '' : v).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.slice(0, 6);
}
function positionOf_(all, code) {
  var me = null, ahead = 0, refCount = 0;
  for (var i = 0; i < all.length; i++) { if (all[i].code === code) { me = all[i]; break; } }
  if (!me) { return null; }
  for (var j = 0; j < all.length; j++) {
    var r = all[j];
    if (r.code === code) { continue; }
    if (r.ref === code) { refCount++; }
    if (r.order < me.order) { ahead++; }
  }
  var pos = SEED + 1 + ahead - refCount * JUMP;
  return { position: Math.max(1, pos), refCount: refCount };
}

// ---- actions ----------------------------------------------------------------
function join_(phone, ref, name) {
  phone = normalizePhone_(phone);
  if (!isPhone_(phone)) { return { error: 'invalid phone' }; }
  ref = cleanCode_(ref);
  name = cleanName_(name);
  var lock = LockService.getScriptLock();
  lock.waitLock(8000);
  try {
    var all = rows_();
    for (var i = 0; i < all.length; i++) {
      if (all[i].phone === phone) {
        var st0 = positionOf_(all, all[i].code);
        return { code: all[i].code, position: st0.position, refCount: st0.refCount,
                 crew: referredOf_(all, all[i].code), returning: true };
      }
    }
    var code = makeCode_();
    var taken = {}; all.forEach(function (r) { taken[r.code] = 1; });
    while (taken[code]) { code = makeCode_(); }
    var refValid = '';
    if (ref) { for (var k = 0; k < all.length; k++) { if (all[k].code === ref) { refValid = ref; break; } } }
    var order = all.length + 1;
    // phone is digits-only after normalize so it can't be a formula; safeCell_ is belt-and-suspenders.
    sheet_().appendRow([order, safeCell_(phone), code, refValid, new Date(), safeCell_(name)]);
    var all2 = rows_();
    var st = positionOf_(all2, code);
    return { code: code, position: st.position, refCount: st.refCount,
             crew: referredOf_(all2, code), returning: false };
  } finally {
    lock.releaseLock();
  }
}
function status_(code) {
  code = cleanCode_(code);
  if (!code) { return { error: 'code required' }; }
  var all = rows_();
  var st = positionOf_(all, code);
  return st ? { position: st.position, refCount: st.refCount, crew: referredOf_(all, code) }
            : { error: 'not found' };
}
function invite_(code, phone) {
  // Logs intent on an "Invites" tab. (Currently unused — the site shares via link, not direct invite.)
  code = cleanCode_(code);
  phone = normalizePhone_(phone);
  if (!isPhone_(phone)) { return { error: 'invalid phone' }; }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var inv = ss.getSheetByName('Invites');
  if (!inv) { inv = ss.insertSheet('Invites'); inv.appendRow(['from', 'to', 'at']); }
  inv.appendRow([code, safeCell_(phone), new Date()]);
  return { ok: true };
}
function count_() {
  return SEED + rows_().length;
}
