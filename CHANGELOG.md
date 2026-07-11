# Changelog

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
