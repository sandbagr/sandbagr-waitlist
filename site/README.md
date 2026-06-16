# SANDBAGR — Waitlist Landing

`sandbagrapp.com` waitlist page. Dark, cinematic, Money Green `#00FF87` on Jet Black `#0A0A0A`.
Built from the Landing Page Outline — seven scrolls, mobile-first (most traffic is Instagram).

## Run locally
```bash
cd site
python3 -m http.server 8000   # then open http://localhost:8000
```
It's a static site (HTML/CSS/vanilla JS + GSAP from CDN). Drop the `site/` folder on any
static host — Netlify, Vercel, Cloudflare Pages, S3 — and point `sandbagrapp.com` at it.

## Structure
- `index.html` — the seven sections: Hero · Problem · The Turn · How it works · Five formats · The Line · Footer
- `css/styles.css` — all styling and the in-phone app mockups
- `js/app.js` — scroll choreography, the live-ledger count animation, fading-chat, and the queue/referral flow
- `js/waitlist.js` — the waitlist + referral **data layer** (see below)
- `assets/` — mascot, QR, IG profile (favicon/OG)

## The Line — waitlist + referral (Section 6)
This is the Robinhood line-jump mechanic: sign up → see your position instantly (`#847`) →
invite friends by email or personal link → your position ticks **down** as friends join.

`js/waitlist.js` exposes one async API (`Waitlist.join / status / invite / count`). It ships
with a **working localStorage engine** so the page is fully functional the moment you open it
(positions, referral codes, dedupe, and queue-jump math all run client-side, scoped to one browser).

### Going to production — back it with a Google Sheet (free, no server)
The referral loop only grows the list for real with a shared backend. The easiest one
is a Google Sheet driven by the Apps Script in `backend/Code.gs`. Every signup becomes a
row, and positions + referral queue-jumps are computed server-side so they work across
every phone. You also get a spreadsheet of all signups you can sort and export.

**Setup (~5 min):**
1. Create a new Google Sheet. Rename the first tab to **`Waitlist`**.
2. **Extensions ▸ Apps Script**, delete the sample, paste all of `backend/Code.gs`.
3. **Deploy ▸ New deployment ▸ Web app**: *Execute as* **Me**, *Who has access* **Anyone**.
   Deploy, authorize, and copy the **Web app URL** (ends in `/exec`).
4. In `js/waitlist.js`, set:
   ```js
   var CONFIG = {
     backend: 'gsheet',               // was 'local'
     seedCount: 2847,                 // keep equal to SEED in backend/Code.gs
     gsheet: { url: 'https://script.google.com/macros/s/XXXX/exec' }
   };
   ```
That's it. New signups land in the **Waitlist** tab; invites land in an **Invites** tab.

Notes:
- `seedCount` (waitlist.js) and `SEED` (Code.gs) must match — it's the starting line size.
- If you ever re-deploy with code changes, use **Deploy ▸ Manage deployments ▸ Edit ▸
  New version** so the URL stays the same.
- Sending real invite emails is optional — the script logs intent to the Invites tab; you
  can add a `MailApp.sendEmail(...)` line in `invite_()` if you want auto-emails.

Prefer a different backend (Supabase, Firebase, your own API)? The data layer is one async
interface (`join / status / invite / count`) — swap the adapter, nothing else changes.

## Security

What's in place:
- **HTTPS everywhere** — Netlify auto-provisions TLS; `netlify.toml` forces `www → apex`,
  and `_headers` sends HSTS (`upgrade-insecure-requests` in the CSP too).
- **Security headers** (`_headers`): HSTS, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` (no clickjacking),
  `Permissions-Policy` locking off camera/mic/geo/payment.
- **Strict CSP** — `script-src 'self'` only. GSAP is **self-hosted** (`js/vendor/`), so no
  third-party JS executes. `connect-src` is limited to the Apps Script backend.
- **No XSS** — all backend/user values reach the DOM via `textContent` / input `.value`,
  never `innerHTML` (that's static markup only).
- **No secrets in the client** — the only "key" is the public Apps Script URL, which is
  designed to be called from browsers.
- **Backend input hardening** (`backend/Code.gs`): server-side email validation, referral
  codes constrained to `[A-Z0-9]{6}`, length caps, and **Google Sheets formula-injection
  neutralization** (`safeCell_` prefixes `= + - @` so a malicious `=IMPORTXML(...)` email
  can't execute and exfiltrate your sheet when you open it).
- **Bot honeypot** — a hidden `company` field on every form; filled = silently dropped,
  no backend write.

Known limits (inherent to a no-auth waitlist, acceptable for launch):
- **No email verification (single opt-in)** — someone could sign up someone else's email,
  or self-refer with throwaway emails to climb the queue. If gaming becomes a problem, add
  a confirmation-email step (double opt-in) and only count verified rows toward referrals.
- **No hard rate limit** — Apps Script can't see client IPs reliably. The honeypot + email
  validation stop casual spam; for heavier abuse, front the endpoint with a Cloudflare
  Turnstile/captcha check or move to a backend that can rate-limit by IP.

## Compliance
The footer compliance line is required and **verbatim** — do not edit it.
