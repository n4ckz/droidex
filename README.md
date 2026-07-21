# Droidex — Droidsmith's Registry

Community collection tracker for **Star Wars: Droid Tycoon**, the Fortnite mode created by FOAD/Blzn Studios (released May 1st, 2026).

The game features a Droidex of 200+ collectible droids across 6 variants (Basic, Gold, Diamond, Rainbow, Beskar, Galactic) and 28 Rebirth levels across the 4 cycles, each requiring 3 specific droids **physically present in your base**, plus credits. Standing at the Sandcrawler shop, the game gives you no way to know what you already own — this tracker fills that gap.

> 📱 Designed to be used on your phone, next to the console. Installable as an app (PWA). English by default, French available from the in-app language selector.

<p align="center">
  <img src="docs/screenshot-rebirth.png" width="45%" alt="Rebirth panel: target rebirth 10 with the three required droids in mixed states and the credits needed">
  &nbsp;
  <img src="docs/screenshot-main.png" width="45%" alt="Main view: droid cards with per-variant states, requirement badges and Keep tags">
</p>

## Features

- **Per-variant tracking** with 3 tap-cyclable states: never owned → owned (Droidex entry) → ⌂ in base (physical presence) → clear. A help panel explains the tap cycle on first visits (until 30 distinct droids are owned) and stays reachable behind the "i" pastille.
- **Higher-variant rule**: a Diamond droid always satisfies a "Gold" requirement.
- **"Next targeted rebirth" panel** (1–28, across the 4 super-rebirth cycles): the 3 required droids with their status (✗ not owned, ⚠ owned but not in base, ✓ ready), the credits needed and the slot unlocked.
- **Requirement badges** on each droid (e.g. "RB9·GLD"): struck through only once the rebirth is behind you — never a future requirement, even when satisfied.
- **Super Rebirth button**: applies the in-game reset semantics in one tap — droids in your base drop back to "owned (Droidex)", Iconic droids leave the base (unlock kept), the targeted rebirth returns to 1 and the cycle advances.
- **"Keep" tag** as long as a future rebirth depends on the droid; orange outline when action is needed.
- **Value data on every droid**: income per second (Basic → Beskar), Beskar upgrade cost and passive perk — plus a "sort by income" mode to decide what to buy at the Sandcrawler.
- **Flawless ✦ and wishlist ★ toggles** on every droid, with a Wishlist filter.
- **Collection bonus counter**: each distinct droid owned grants +1% income; the header shows where you stand.
- **Filters**: All / Keep / Missing required / In base / Wishlist / Worker / Astromech / Battle, plus search.
- **Iconic droids** (BB-8, Mister Bones, IG-11 Marshal, DJ R-3X, CB-23, R2-D2, C-3PO): simple owned + in-base toggles, no variants.
- **Cross-device sync (optional)**: sign in with a Google account and your registry follows you. Without an account, everything stays in your browser (`localStorage`) — no tracking, no mandatory signup.
- **JSON export/import** as a fallback, or to stay 100 % offline.
- **Two languages**: English (default) and French, switchable from the header dropdown.

## Usage

### Online

Just open the site and tick your droids. On mobile, use "Add to Home Screen" to install it as an app (works offline afterwards).

### Syncing between devices

Two options:

- **Google account** (recommended): "Sign in with Google" button in the top bar. Your registry is saved server-side and automatically restored on any device signed in with the same account. Last write wins; "Delete my account" wipes everything server-side.
- **Manual**: **Export backup** → downloads `droidex-backup.json` → transfer the file (AirDrop, email…) → **Import** on the other device.

## Self-hosting (Docker)

Two containers:

- **droidex**: the static site (nginx).
- **pocketbase**: the sync API ([PocketBase](https://pocketbase.io) 0.39, single binary + SQLite). Optional — without it, the site works in pure local mode.

### Local test

```bash
docker compose -f docker-compose.local.yml up -d
# Site: http://localhost:8080 — API: http://localhost:8090
```

### VPS behind Traefik (v2 or v3)

Prerequisites: an existing Traefik with a `websecure` entrypoint, an ACME certificate resolver and an external Docker network. Two DNS records pointing to the VPS: `droidex.yourdomain.com` and `api.droidex.yourdomain.com`.

```bash
git clone https://github.com/n4ckz/droidex.git && cd droidex
cp .env.example .env
# then edit .env:
#   DROIDEX_DOMAIN=droidex.yourdomain.com
#   TRAEFIK_NETWORK=proxy            # your Traefik docker network name
#   TRAEFIK_CERTRESOLVER=letsencrypt # your ACME resolver name
docker compose up -d

# create the PocketBase admin account (once)
docker compose exec pocketbase /pb/pocketbase superuser upsert YOUR@EMAIL.com YOUR_PASSWORD --dir=/pb/pb_data
```

Both containers expose an HTTP healthcheck, visible via `docker ps`. PocketBase data lives in `./pb_data` (include it in your VPS backups).

**Admin console security**: the PocketBase dashboard (`/_/`) and the superuser auth endpoint are **not exposed to the internet** — Traefik returns 403 for them (on Traefik v2, replace `ipallowlist` with `ipwhitelist` in `docker-compose.yml`). To administer PocketBase, use an SSH tunnel:

```bash
ssh -L 8091:127.0.0.1:8091 your-vps
# then open http://localhost:8091/_/
```

Alternatively, allowlist your own public IP(s) via `DROIDEX_ADMIN_IPS` in `.env` (comma-separated CIDRs) to reach `https://api.<domain>/_/` directly. Keep `127.0.0.1/32` in the list so the SSH tunnel keeps working if your IP changes.

### Enabling Google sign-in (once the site is up)

1. [Google Cloud Console](https://console.cloud.google.com/) → create a project → **APIs & Services › OAuth consent screen**: type "External", fill in name and email. Only basic scopes (email, profile) are used: **no Google verification is required**; publish the app ("In production").
2. **Credentials › Create credentials › OAuth client ID** → type "Web application". Under **Authorized redirect URIs**, add:
   - `https://api.droidex.yourdomain.com/api/oauth2-redirect`
   - `http://localhost:8090/api/oauth2-redirect` (for local testing)
3. Open the PocketBase console `https://api.droidex.yourdomain.com/_/`, sign in with the admin account, then **Collections › users › ⚙ Options › OAuth2**: enable **Google** and paste the Client ID and Client Secret.

That's it: the site's "Sign in with Google" button now works. The `saves` collection (one backup per user, readable/writable only by its owner) is created automatically by migration on first startup.

### Self-hosting and SEO files

`site/index.html` (canonical URL, Open Graph, JSON-LD), `site/robots.txt`, `site/sitemap.xml` and `site/llms.txt` reference the official instance `https://droidex.nackz.dev`. If you host your own public instance, replace those URLs with your domain.

### Without Traefik / without sync

Serve the `site/` folder with any static file server. To disable sync entirely (and hide the account UI), set `PB_URL` to `''` in [`site/config.js`](site/config.js). By convention, the frontend looks for the API at `api.<site domain>` (editable in that same file).

## Project structure

```
site/               The complete static site
  index.html
  styles.css        "Nocturne" dark HUD theme (self-hosted Chakra Petch + IBM Plex Sans)
  seo-pages.css     Styles for the generated content pages below (scoped, does
                    not touch styles.css)
  i18n.js           EN/FR translations, language selector logic
  data.js           ⚠ Game data (droids, requirements, credits) — the ONLY file
                    to edit when the game adds content
  app.js            Logic (states, rendering, persistence, export/import)
  config.js         Sync API URL ('' to disable)
  sync.js           Account sync (PocketBase, optional)
  vendor/           Self-hosted PocketBase JS SDK (0.27.0)
  manifest.json     PWA
  version.js        App version — bump on EVERY site update (drives both the
                    footer display and the offline cache invalidation)
  sw.js             Service worker (offline shell cache, versioned by version.js)
  fonts/            Self-hosted fonts (no Google Fonts requests)
  icons/            PWA icons (+ icons/game/: in-game class/credits/rebirth icons)
  og/               Open Graph share images (1200×630 + square)
  value-list/               Generated content page (see "Content pages" below)
  rebirth-requirements/     Generated content page
  faq/                      Generated content page
  sitemap.xml               Generated, lists all 4 pages
deploy/
  nginx.conf              nginx config (caching, gzip, sw.js never cached)
  pocketbase.Dockerfile   PocketBase image (pinned version)
  pb_migrations/          Migration creating the "saves" collection
tests/                    Test suites (see below)
tools/
  update-gamedata.py      Regenerates site/data.js from tycoon-tools
  generate-seo-pages.js   Regenerates the content pages + sitemap.xml from
                          site/data.js (see "Content pages" below)
.github/workflows/
  gamedata-check.yml      Scheduled watch: opens a PR when the game data changes
                          (and regenerates the content pages with it)
Dockerfile                Static site image
docker-compose.yml        Production (Traefik): site + API
docker-compose.local.yml  Local testing
```

## Tests

```bash
docker compose -f docker-compose.local.yml up -d
docker compose -f docker-compose.local.yml exec pocketbase /pb/pocketbase superuser upsert admin@test.local testpass1234 --dir=/pb/pb_data

cd tests && npm install
npm run test:app    # tracker logic (jsdom, no server): persistence, badges, migration, filters, i18n
npm run test:sync   # end-to-end against the local PocketBase: push/pull, account isolation, GDPR deletion
```

The sync test creates its own test users (`alice@test.local`, `bob@test.local`) and wipes the `saves` collection on every run — never point it at a production instance.

### Sync model

`localStorage` remains the local cache and the offline mode. When signed in, every change is pushed (1 s debounce) to the `saves` collection; on load, the account backup is pulled. If the device and the account diverge at sign-in, the user picks which one to keep. Last write wins across devices.

### Security

- The `users` collection is **Google-only**: a migration disables password login and restricts account creation to the OAuth2 flow, so no one can spam the database with direct sign-ups (PocketBase leaves this open by default). To allow password sign-up on your own instance, revert `deploy/pb_migrations/1752000000_harden_users.js`.
- The static site is served with a strict **Content-Security-Policy** (no inline scripts) plus `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`.
- The admin console is not reachable from the internet (see above).

### Personal data (GDPR)

Accounts are optional. When one is created, PocketBase stores the Google email, the profile name and the collection registry — nothing else, no tracking. The "Delete my account" button removes the account **and** its backup (cascade deletion), with no admin intervention. If you host a public instance, remember to adapt the contact info in the footer.

## Game data and known limitations

The data (69 tracked droids including 7 Iconics, rebirth requirements for the 4 cycles × 28 levels, credit costs, per-variant income, Beskar costs and perks) is maintained in [`site/data.js`](site/data.js) from community sources, cross-checked on 2026-07-21:

- [Rebirth requirements and value list (tycoon-tools)](https://tycoon-tools.com/droid-tycoon/) — its cycle-1 table matched 23/23 of our previously play-validated requirements
- [Complete Droidex (Insider Gaming)](https://insider-gaming.com/fortnite-star-wars-droid-tycoon-droidex-all-droids/)
- [Community wiki](https://star-wars-droid-tycoon.fandom.com/wiki/) and [Fortnite wiki](https://fortnite.fandom.com/wiki/Droid_Tycoon)
- [Events and Iconics](https://droidtycoonguide.com/events/)

**Known uncertainties:**

- Rebirth cycles **2–4** (super-rebirth) come from tycoon-tools and have not yet been verified in game by us.
- Some classifications changed vs. earlier community sources and now follow the tycoon-tools value list: CB-23 is Iconic, Proto-Roller is Legendary, DRFT-R is an Astromech, DJ R-3X is a Worker.
- The game is updated frequently. If you spot a discrepancy, open an issue or a PR against `site/data.js`.

**About Flawless**: a Flawless is a rare permanent drop chance on any droid (1/1000 on Basic up to 1/100 on Beskar) kept forever in your Droidex — hence the ✦ toggle per droid.

### Updating game data after a game patch

`site/data.js` is generated from tycoon-tools by [`tools/update-gamedata.py`](tools/update-gamedata.py) — don't edit it by hand:

```bash
python3 tools/update-gamedata.py --check   # is our data still current?
python3 tools/update-gamedata.py           # regenerate site/data.js
git diff site/data.js                      # review what the game changed
```

Then bump `APP_VERSION` in `site/version.js`, add a CHANGELOG entry and run the tests. If the game adds a brand-new droid, the script stops and tells you to add its id to `NAME2ID`/`DISPLAY` first.

This check also runs automatically **twice a week** (GitHub Actions): when a game patch changes the data, the workflow regenerates `site/data.js`, runs the test suite against it and opens a reviewable pull request.

### Content pages

Three static, crawlable pages are generated straight from `site/data.js` — no build step, no duplicated data: a [value list](https://droidex.nackz.dev/value-list/), the [rebirth requirements](https://droidex.nackz.dev/rebirth-requirements/) for all 4 cycles, and a [FAQ](https://droidex.nackz.dev/faq/). They're linked from the app footer and from `site/sitemap.xml`.

```bash
node tools/generate-seo-pages.js   # regenerates site/value-list, site/rebirth-requirements, site/faq, site/sitemap.xml
```

The scheduled game-data watch above regenerates these pages automatically whenever it regenerates `site/data.js`, so they stay in sync with the game without manual upkeep.

## License and disclaimers

Code under the [MIT license](LICENSE).

Fan project not affiliated with Epic Games, Lucasfilm or Disney. Star Wars is a trademark of Lucasfilm Ltd. Droid Tycoon is a Fortnite mode created by FOAD/Blzn Studios. A handful of small in-game icons (droid classes, credits, rebirth) are used for identification purposes only; all rights on those assets belong to their respective owners and they will be removed on request.
