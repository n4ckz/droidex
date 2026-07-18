# Changelog

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
