# Changelog

## 1.8.1 — 2026-07-21

- **Sync fix**: the account-conflict dialog no longer reappears on every page load after a data-format migration. The local/server comparison now normalizes both sides through the same migrations (boolean legacy states, CB-23 reclassification, the v1.5.0 six-variant padding) before comparing — a pre-Galactic server backup is recognized as identical to its migrated local counterpart. Real conflicts are still detected.

## 1.8.0 — 2026-07-21

- **French versions of all four content pages** under `/fr/` (value list, rebirth requirements, live stats, FAQ) — fully translated, generated from the same data, cross-linked with `hreflang` tags (x-default: English). Sitemap now lists 9 URLs.
- **Language detection like the app**: first visit with a French browser on an English content page redirects to the French version; the EN/FR selector in the page header persists the explicit choice in the same key as the tracker, so the app and the content pages always agree. No redirect ever happens from the French pages (crawler-safe).
- Stats page dynamic texts (months, day-over-day delta) follow the page language.

## 1.7.1 — 2026-07-21

- SEO content pages now ship Open Graph + Twitter card tags (`summary_large_image`): generic Droidex card for value list / rebirths / FAQ, and a dedicated `/stats/` image (KPI tiles + the Galactic-update CCU spike) so shared links render a proper preview on X/Discord.

## 1.7.0 — 2026-07-21

- **New public page `/stats/`** — Droid Tycoon live player count and daily statistics: KPI tiles (in game right now, peak CCU with day-over-day delta, unique players, plays, average session, D1/D7 retention), two interactive SVG charts (peak CCU and plays per day, crosshair + tooltip) and a day-by-day table. Official Epic Ecosystem API data, hydrated in the browser, with a static SEO-crawlable snapshot baked in at build time.
- Daily metrics archive (`data/metrics/`, cron job): Epic only keeps a rolling 7-day window, Droidex now archives the official daily values forever — the week of the Galactic patch (peak CCU 21.5K → 49.4K) was captured just in time.
- Watch: CCU anomaly signal (yesterday's peak vs archive average, ±40%) feeding the gamedata-signal issue.

## 1.6.0 — 2026-07-21

- **Live player counter** in the header ("● 12.5K in game"): concurrent players on the Star Wars Droid Tycoon island, straight from Epic's official, public Ecosystem API (10-minute buckets, refreshed every 5 minutes). Hidden gracefully when offline or if the API is unreachable — no error, no tracking, no key required.

## 1.5.1 — 2026-07-21

SEO follow-up for the Galactic update (new searches expected):

- Dedicated FAQ entry "What is the Galactic variant and how does it work?" (separate x/62 counter, RB28 requirement, hourly spawn per community sources, partial income data)
- Value list and rebirth pages: intros explicitly mention the mid-July 2026 Galactic update and the RB28 Galactic requirement
- llms.txt: dedicated Galactic bullet (tier above Beskar, x/62 counter, RB·GLC badges, "—" for undocumented incomes)
- README screenshots regenerated with Galactic (GLC) cells visible

## 1.5.0 — 2026-07-21

Game update (Galactic variant):

- New **Galactic** variant (6th tier, above Beskar) on every standard droid: tappable GLC cell (owned / in base), `RB·GLC` requirement badges
- Rebirth level **28** in all 4 cycles (45T; cycle 1: Galactic Proto-Roller + Rainbow MO-TRAK + Beskar DRFT-R)
- Main counter unchanged (**/317**, matching the in-game Droidex screen); new **Galactic x/62** counter next to the collection bonus
- Value list with 6 income columns (Galactic incomes still partial in community sources: "—" when undocumented); SEO pages regenerated
- Automatic save migration (variant arrays padded to 6); Super Rebirth covers the Galactic tier (in base → owned)
- Data generator: BB-8/C-3P0 aliases (new tycoon-tools spellings), C-3PO perk observed in-game preserved

## 1.4.5 — 2026-07-18

- The "in base" house icon no longer resizes the variant cell: it now sits as a small badge in the cell's top-right corner instead of stacking as a third row between the lamp and the label

## 1.4.4 — 2026-07-18

- The crawlable noscript fallback and llms.txt now describe the tracker's differentiating features: per-droid wishlist and Flawless tracking, name search, filters with live counts, rarity/income sorting, live collection counter, English+French interface, JSON export/import and optional Google sync — AI-generated tool comparisons were crediting competitors with features Droidex already has, simply because our indexed text never mentioned them

## 1.4.3 — 2026-07-18

- The tap-cycle help now stays open through the learning phase and closes itself once you own 30 distinct droids (or when dismissed via the "i" pastille) — closing it at the first tap was defeating its purpose

## 1.4.2 — 2026-07-18

- The tap-cycle help now opens automatically on first visit (empty registry) and stays away once dismissed — a corner "i" pastille alone was never going to be discovered

## 1.4.1 — 2026-07-18

- The "i" hint pastille is now tappable: on touch devices the tap-cycle help (1 tap = owned · 2 taps = in base · 3 taps = clear) opens as a small panel under the search bar — it was hover-only since the redesign

## 1.4.0 — 2026-07-18

- **SEO/discoverability**: keyword page title, real Open Graph images (1200×630 + square), ~300-word crawlable noscript fallback
- **Three static content pages generated from the game data** (auto-refreshed by the scheduled data watch): [value list](https://droidex.nackz.dev/value-list/), [rebirth requirements](https://droidex.nackz.dev/rebirth-requirements/), [FAQ](https://droidex.nackz.dev/faq/) — English, no JS, Nocturne-styled, linked from the app footer
- Sitemap now lists the 4 pages with data-driven lastmod; llms.txt links the new pages

## 1.3.2 — 2026-07-18

- C-3PO perk filled in from in-game observation: **+25% workers** (still absent from community sources)

## 1.3.1 — 2026-07-18

- "Delete my account" button now uses the HUD button style with a red danger hover (it rendered in the body font inside the sync bar)

## 1.3.0 — 2026-07-18

- **Nocturne redesign** — full visual overhaul from the Claude Design handoff (dark futuristic HUD): Chakra Petch + IBM Plex Sans (self-hosted), purple accent palette, bracket-framed target panel, scanline textures, desktop sidebar layout (≥980px)
- Segmented progress bar with `012/317`-style counter; per-filter counts; animated "✓ Rebirth ready" badge; class icons and credit icons on cards; colored tier lamps (`BAS/GLD/DIA/RBW/BSK`)
- Requirement badge format is now `RB10·GLD` (semantics unchanged); flawless toggle glyph is now ✦
- Fixed stale copy: rebirth count corrected to 27 levels × 4 cycles in page metadata and llms.txt

## 1.2.5 — 2026-07-17

- **C-3PO added as the 7th Iconic** (seen in the in-game Nova crystal shop; not yet on community sources, class/perk to confirm) — 69 droids / 317 variants tracked
- **Super Rebirth button** next to the cycle selector: applies the in-game reset semantics in one tap — in-base variants drop back to "owned (Droidex)", Iconic droids leave the base (unlock kept, buy-back at the Nova shop), targeted rebirth returns to 1 and the targeted cycle advances (4 loops back to 1); Flawless and wishlist untouched

## 1.2.4 — 2026-07-11

- Replaced the 🏠 emoji for the "in base" state with a monochrome house icon that takes the variant's colour (fits the dark theme instead of clashing)
- Filter chips now wrap onto multiple lines on desktop (pointer devices) instead of only being scrollable, so no filter is hidden on a computer

## 1.2.3 — 2026-07-11

### Security

- **PocketBase users collection hardened** (migration `deploy/pb_migrations/1752000000_harden_users.js`): direct email/password sign-up is closed (`createRule` restricted to the OAuth2 context) and password login is disabled — the tracker is Google-only. Fixes the default PocketBase behaviour that left public account creation open. OAuth2 sign-in still creates new accounts normally.
- **HTTP security headers** on every response (Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- **Game-data generator** (`tools/update-gamedata.py`) now allow-lists the characters of any string coming from the remote source before writing it into `data.js`, so a compromised/altered source page cannot inject JavaScript.

## 1.2.2 — 2026-07-11

- Legend line explaining the ★ (wishlist) and ✨ (Flawless) toggles, plus hover tooltips

## 1.2.1 — 2026-07-11

- Header now references Fortnite: "Fortnite · Star Wars: Droid Tycoon"

## 1.2.0 — 2026-07-11

- **Game data overhaul** (cross-checked against tycoon-tools; cycle-1 requirements matched 23/23 of our play-validated data):
  - Rebirths extended to **27 levels across the 4 super-rebirth cycles**, with per-cycle requirements and credits up to 32T; cycle selector added
  - Slot unlocks shown in the rebirth panel (cycle 1)
  - Reclassifications: CB-23 → Iconic (existing progress migrates automatically), Proto-Roller → Legendary, DRFT-R → Astromech, DJ R-3X → Worker
- **Value data**: income per second at all 5 tiers, Beskar upgrade cost and passive perk on every card; "sort by income" mode
- **Flawless ✨** and **wishlist ★** toggles per droid, with a Wishlist filter
- **Collection bonus counter** (+1% income per distinct droid owned)
- App version displayed in the footer; single-source version drives the offline cache

## 1.1.0 — 2026-07-11

- English by default with in-app EN/FR language switcher (French preselected for French-speaking browsers on first visit)
- Optional cross-device sync via Google sign-in (PocketBase), with account deletion
- SEO and AI discoverability: JSON-LD, sitemap, robots.txt, llms.txt
- README screenshots generated headless (Playwright)

## 1.0.0 — 2026-07-11

- Initial public release: per-variant tracking (3 states), rebirth panel, requirement badges, Keep tag, filters and search, JSON export/import, installable offline PWA, Tatooine dark theme
