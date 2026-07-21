#!/usr/bin/env node
/* =========================================================================
   Générateur des pages SEO statiques (EN uniquement) + sitemap.xml.
   Sans dépendance : lit site/version.js + site/i18n.js + site/data.js,
   les évalue dans un bac à sable vm pour récupérer les globales de jeu,
   puis produit 3 pages de contenu crawlable + un sitemap, tous dérivés
   des mêmes données que l'app (aucune donnée dupliquée à la main).

   Déterministe : deux exécutions successives produisent des fichiers
   strictement identiques (aucune horloge, aucun aléatoire — la seule date
   utilisée est extraite du commentaire "recoupées le JJ/MM/AAAA" de data.js).

   Usage : node tools/generate-seo-pages.js
   ========================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const SITE_URL = 'https://droidex.nackz.dev';

/* ---------- 1. Charger les données de jeu dans un bac à sable ---------- */

const dataSrc = fs.readFileSync(path.join(SITE, 'data.js'), 'utf8');
const bundleSrc = ['version.js', 'i18n.js', 'data.js']
  .map(f => fs.readFileSync(path.join(SITE, f), 'utf8'))
  .join('\n;\n');

const sandbox = {
  navigator: { language: 'en-US' },
  localStorage: { getItem() { return null; }, setItem() {} },
  document: {
    querySelectorAll: () => [],
    getElementById: () => ({ value: '', addEventListener() {} }),
    documentElement: {},
  },
  console,
};
vm.createContext(sandbox);
vm.runInContext(
  bundleSrc + '\n;this.__exported = {APP_VERSION, DROIDS, RB_CREDITS, REBIRTHS, RB_UNLOCKS, RARITY_ORDER, I18N};',
  sandbox,
  { filename: 'seo-data-bundle.js' }
);
const { APP_VERSION, DROIDS, RB_CREDITS, REBIRTHS, RB_UNLOCKS, RARITY_ORDER, I18N } = sandbox.__exported;
const TIERS = I18N.en._tiers;
const RARITIES = I18N.en._rarities;

/* ---------- 2. Date source unique (aucune horloge) ---------- */

const dateMatch = dataSrc.match(/recoupées le (\d{2})\/(\d{2})\/(\d{4})/);
if (!dateMatch) throw new Error('Date "recoupées le JJ/MM/AAAA" introuvable dans site/data.js');
const [, dd, mm, yyyy] = dateMatch;
const DATE_FR = `${dd}/${mm}/${yyyy}`;
const DATE_ISO = `${yyyy}-${mm}-${dd}`;

/* ---------- 3. Utilitaires ---------- */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Formatage compact des revenus (972 -> "972", 8200 -> "8.2K") — même règle que app.js:fmtInc */
function fmtInc(n) {
  if (n >= 1000) { const k = Math.round(n / 100) / 10; return (k === Math.round(k) ? Math.round(k) : k) + 'K'; }
  return String(n);
}

const NAV_ITEMS = [
  { slug: 'value-list', label: 'Value list' },
  { slug: 'rebirth-requirements', label: 'Rebirth requirements' },
  { slug: 'faq', label: 'FAQ' },
];

const LEGAL_HTML = 'Fan project not affiliated with Epic Games, Lucasfilm or Disney. Star Wars is a trademark of ' +
  'Lucasfilm Ltd. Droid Tycoon is a Fortnite mode created by FOAD/Blzn Studios. ' +
  '<a href="https://github.com/n4ckz/droidex" rel="noopener">Source code on GitHub</a>.';

/* Gabarit commun aux 3 pages de contenu. */
function page({ slug, title, description, jsonld, h1, bodyHtml }) {
  const navHtml = NAV_ITEMS.map(n => {
    const current = n.slug === slug;
    return `<a href="../${n.slug}/" class="seo-navlink${current ? ' active' : ''}"${current ? ' aria-current="page"' : ''}>${n.label}</a>`;
  }).join('\n      ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${SITE_URL}/${slug}/">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE_URL}/${slug}/">
<meta property="og:site_name" content="Droidex">
<meta name="theme-color" content="#101120">
<link rel="manifest" href="../manifest.json">
<link rel="icon" type="image/png" sizes="192x192" href="../icons/icon-192.png">
<link rel="apple-touch-icon" href="../icons/apple-touch-icon.png">
<link rel="stylesheet" href="../styles.css">
<link rel="stylesheet" href="../seo-pages.css">
<script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
</script>
</head>
<body class="seo-page">
<header class="seo-header">
  <div class="seo-hdr">
    <a class="brand" href="../">DROIDEX</a>
    <span class="brand-sub">▸ Droid Tycoon // Registry</span>
    <nav class="seo-nav" aria-label="Content pages">
      ${navHtml}
    </nav>
    <a class="tool-btn seo-cta" href="../">Open the tracker →</a>
  </div>
</header>
<main class="seo-main">
<h1>${h1}</h1>
${bodyHtml}
</main>
<footer class="seo-footer">
  <p class="seo-legal">${LEGAL_HTML}</p>
  <p class="seo-version">DROIDEX V${APP_VERSION}</p>
</footer>
</body>
</html>
`;
}

/* ---------- 4. Value list ---------- */

function buildValueList() {
  const intro = `<p class="seo-intro">This value list gives the income per second and Beskar upgrade cost for every ` +
    `droid in Star Wars: Droid Tycoon, across all six variants: Basic, Gold, Diamond, Rainbow, Beskar and Galactic ` +
    `(the new tier added in the mid-July 2026 update — Galactic incomes are still being documented by the ` +
    `community, undocumented values show as "—"). Numbers ` +
    `are cross-checked against community sources (${DATE_ISO}) rather than a single guide, and ` +
    `Droidex's own cycle 1 rebirth requirements have been verified in-game through rebirth 23. Iconic droids have ` +
    `no variants: owning one simply adds a flat +15% income bonus alongside its unique perk. Remember that in ` +
    `Droidex's rebirth panel, a higher variant always satisfies a lower requirement — if a rebirth asks for a ` +
    `droid at Gold minimum, owning it at Diamond or better already counts, so this list also doubles as a quick ` +
    `reference for which variant is "enough".</p>`;

  const sections = RARITY_ORDER.map(rarity => {
    const droids = DROIDS.filter(d => d.r === rarity);
    const rows = droids.map(d => {
      if (d.iconic) {
        return `      <tr><td>${escapeHtml(d.n)}</td><td>${escapeHtml(d.t)}</td>` +
          `<td colspan="6">+15%/s income</td><td>—</td><td>${escapeHtml(d.perk || '—')}</td></tr>`;
      }
      const tierCells = d.inc.map(n => `<td>${n == null ? '—' : fmtInc(n) + '/s'}</td>`).join('');
      return `      <tr><td>${escapeHtml(d.n)}</td><td>${escapeHtml(d.t)}</td>${tierCells}` +
        `<td>${escapeHtml(d.bskCost)}</td><td>${escapeHtml(d.perk || '—')}</td></tr>`;
    }).join('\n');

    return `  <h2>◈ ${escapeHtml(RARITIES[rarity])}</h2>
  <div class="seo-table-wrap">
    <table>
      <thead>
        <tr><th>Droid</th><th>Class</th><th>Basic</th><th>Gold</th><th>Diamond</th><th>Rainbow</th><th>Beskar</th><th>Galactic</th><th>Beskar cost</th><th>Perk</th></tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>`;
  }).join('\n\n');

  const bodyHtml = `${intro}\n\n${sections}`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Droidex value list — Star Wars: Droid Tycoon',
    description: 'Income per second and Beskar upgrade cost for every droid and variant in Star Wars: Droid Tycoon.',
    url: `${SITE_URL}/value-list/`,
    license: 'https://github.com/n4ckz/droidex/blob/main/LICENSE',
    creator: { '@type': 'Person', name: 'Nackz', url: 'https://github.com/n4ckz' },
    dateModified: DATE_ISO,
    variableMeasured: ['income per second', 'Beskar upgrade cost', 'perk'],
  };

  return page({
    slug: 'value-list',
    title: 'Droid Tycoon Value List — Income & Beskar Cost per Droid | Droidex',
    description: 'Income per second and Beskar upgrade cost for every Star Wars: Droid Tycoon droid, across Basic, Gold, Diamond, Rainbow, Beskar and Galactic variants.',
    h1: 'Droid Tycoon value list',
    jsonld,
    bodyHtml,
  });
}

/* ---------- 5. Rebirth requirements ---------- */

function buildRebirthRequirements() {
  const intro = `<p class="seo-intro">Star Wars: Droid Tycoon's progression runs through 28 rebirth levels, repeated ` +
    `across 4 cycles in an endless loop. Each level requires three specific droids placed in your base at a ` +
    `minimum variant, plus a credit cost that is identical across all 4 cycles for the same level, climbing from ` +
    `10K at rebirth 1 to 45T at rebirth 28. Rebirth 28, added with the Galactic update of mid-July 2026, is the ` +
    `first level to require a Galactic-tier droid in your base. From rebirth 12 onward, meeting the requirements lets you trigger a ` +
    `Super Rebirth instead of a normal one: it keeps your Droidex, droidsmith level, cosmetics, unlocked Flawless ` +
    `droids, Nova crystals and Iconic unlocks, but resets your base, its droids, your currencies, rebirth rank, ` +
    `pickaxe level and blueprints, before advancing you straight into the next cycle. This page lists every ` +
    `cycle's requirements in full, cross-checked against community sources (${DATE_ISO}).</p>`;

  const droidById = {};
  DROIDS.forEach(d => { droidById[d.id] = d; });
  const reqLabel = ([id, tier]) => `${escapeHtml(droidById[id] ? droidById[id].n : id)} (${TIERS[tier]} min)`;

  const cycles = Object.keys(REBIRTHS).sort((a, b) => a - b).map(cyc => {
    const levels = REBIRTHS[cyc];
    const rows = Object.keys(levels).sort((a, b) => a - b).map(rb => {
      const reqs = levels[rb].map(reqLabel).join(', ');
      const unlockCell = cyc === '1' ? `<td>${escapeHtml(RB_UNLOCKS[rb] || '—')}</td>` : '';
      return `      <tr><td>${rb}</td><td>${escapeHtml(RB_CREDITS[rb] || '—')}</td><td>${reqs}</td>${unlockCell}</tr>`;
    }).join('\n');
    const unlockHead = cyc === '1' ? '<th>Unlock</th>' : '';

    return `  <h2>◈ Cycle ${cyc}</h2>
  <div class="seo-table-wrap">
    <table>
      <thead>
        <tr><th>Rebirth</th><th>Credits</th><th>Required droids</th>${unlockHead}</tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>`;
  }).join('\n\n');

  const bodyHtml = `${intro}\n\n${cycles}`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Droidex rebirth requirements — Star Wars: Droid Tycoon',
    description: 'Required droids, minimum variants and credit cost for all 28 rebirth levels across the 4 cycles in Star Wars: Droid Tycoon.',
    url: `${SITE_URL}/rebirth-requirements/`,
    license: 'https://github.com/n4ckz/droidex/blob/main/LICENSE',
    creator: { '@type': 'Person', name: 'Nackz', url: 'https://github.com/n4ckz' },
    dateModified: DATE_ISO,
    variableMeasured: ['required droids', 'minimum variant', 'credit cost', 'unlock'],
  };

  return page({
    slug: 'rebirth-requirements',
    title: 'Droid Tycoon Rebirth Requirements — All 28 Levels, 4 Cycles | Droidex',
    description: 'The 3 required droids, minimum variants and credit cost for every Star Wars: Droid Tycoon rebirth level, from 1 to 28, across all 4 cycles.',
    h1: 'Droid Tycoon rebirth requirements',
    jsonld,
    bodyHtml,
  });
}

/* ---------- 6. FAQ ---------- */

const FAQ = [
  {
    q: 'What is Droidex?',
    a: 'Droidex is a free, open-source collection tracker for Star Wars: Droid Tycoon, the Fortnite creative mode ' +
      "released by FOAD/Blzn Studios on May 1st, 2026. The game gives no way to check what you already own while " +
      'standing at the in-game Sandcrawler shop, so Droidex fills that gap: it tracks all 69 droids across their ' +
      'variants, tells you which specific droids and variants you still need for your targeted rebirth, and which ' +
      'ones you can safely retire from your base. It works as an installable, offline-capable Progressive Web App.',
  },
  {
    q: 'How do I track variants (3 states)?',
    a: 'Each droid variant in Droidex cycles through three states with a single tap: never owned, owned in your ' +
      'Droidex (the in-game collection log), and physically placed in your base. Most droids come in six variants ' +
      '— Basic, Gold, Diamond, Rainbow, Beskar and Galactic — so you tap through each variant independently as you obtain ' +
      'and place copies. A handful of Iconic droids have no variants; instead they get two separate toggles, one ' +
      'for ownership and one for being placed in your base.',
  },
  {
    q: 'Does a higher variant satisfy a lower requirement?',
    a: "Yes. Rebirth requirements are expressed as a minimum variant — for example \"Strike-Orb (Gold minimum)\". " +
      'Owning or placing a higher variant of that droid always satisfies a lower requirement, so a Diamond ' +
      'Strike-Orb in your base counts for a Gold requirement just as well as an actual Gold copy would. You never ' +
      'need to hunt down a lesser copy of a droid you already own in a better variant: Droidex checks your best ' +
      'owned variant against each requirement automatically.',
  },
  {
    q: 'What are rebirth requirements?',
    a: 'Each rebirth level, from 1 to 28, requires three specific droids placed in your base at a minimum variant, ' +
      'plus a credit cost that climbs from 10K at rebirth 1 up to 45T at rebirth 28. The 28 levels repeat across 4 ' +
      'cycles in a loop, and each cycle can ask for a different trio of droids at the same level even though the ' +
      'credit cost stays identical across cycles. Certain rebirth levels also unlock a new slot for your base, ' +
      'such as an extra Worker or Astromech slot.',
  },
  {
    q: 'What is the Galactic variant and how does it work?',
    a: 'Galactic is the newest variant tier, added above Beskar in the mid-July 2026 game update, bringing the ' +
      'total to six variants per standard droid. Exactly like the in-game Droidex screen, the Galactic tier is ' +
      'not counted in the main 317-variant total: it has its own separate counter over the 62 standard droids, ' +
      'and Droidex mirrors that with a dedicated "Galactic x/62" counter. Rebirth 28 — the new top level of each ' +
      'of the 4 cycles — requires one specific Galactic droid placed in your base (for example a Galactic ' +
      'Proto-Roller in cycle 1) alongside a Rainbow droid, a Beskar droid and 45T credits. Like every higher ' +
      'variant, a Galactic copy also satisfies any lower requirement for the same droid. Community sources are ' +
      'still documenting Galactic income values, and report Galactic droids appearing in-game on an hourly ' +
      'spawn timer; Droidex tracks each Galactic copy with the same tap-through states (owned, in base) and ' +
      'shows RB·GLC requirement badges so you know exactly which Galactic droids your next rebirth needs.',
  },
  {
    q: 'What is a Super Rebirth and what do you keep or lose?',
    a: 'From rebirth level 12 onward, once your requirements are met you can trigger a Super Rebirth instead of a ' +
      'normal one, which advances you straight into the next cycle. You keep your Droidex, droidsmith level, ' +
      'cosmetics, unlocked Flawless droids, Nova crystals, and any Iconic droid unlocks. You lose your base ' +
      'layout, the droids currently placed in it, your currencies, your rebirth rank, your pickaxe level, and any ' +
      'blueprints — Iconic unlocks can be bought back at the Nova crystal shop afterward.',
  },
  {
    q: 'What is Flawless?',
    a: 'Flawless is a permanent, rare drop chance rolled independently for every droid you obtain, kept forever in ' +
      'your Droidex once unlocked. The odds depend on variant rarity: roughly 1 in 1000 for a Basic droid down to ' +
      '1 in 100 for a Beskar droid, so rarer, higher-value variants are noticeably more likely to roll Flawless. ' +
      "Droidex lets you mark each droid's Flawless status with a toggle so you can track which ones you've already " +
      'unlocked without relying on memory.',
  },
  {
    q: 'What is the collection bonus?',
    a: 'The collection bonus rewards broad collecting: for every distinct droid you own, regardless of which ' +
      'variant, your income increases by 1%. It stacks across your entire Droidex, so owning 40 different droids ' +
      '— even all at Basic variant — grants a flat +40% income bonus on top of your normal rebirth and variant ' +
      'progression. Droidex displays your current distinct-droid count and the resulting bonus percentage in the ' +
      'header, updating live as you tap through your registry.',
  },
  {
    q: 'Is Droidex free? Does it need an account?',
    a: 'Droidex is completely free, has no ads and no tracking. It works fully without an account: your registry ' +
      'is saved locally in your browser and never leaves your device. Creating an optional account via Google ' +
      'sign-in lets you sync that same registry across multiple devices; in that case only your email address and ' +
      "your registry data are stored on the server, and both can be deleted at any time from the app with the " +
      "\"Delete my account\" button.",
  },
  {
    q: 'Can I self-host it?',
    a: "Yes. Droidex's source code is open under the MIT license on GitHub, and the whole project is designed to " +
      'be self-hostable: the tracker itself is a static site with no build step, and the optional sync backend ' +
      'runs on PocketBase, deployable via the provided Docker and Traefik configuration. Anyone can fork the ' +
      'repository, point it at their own domain, and run their own independent copy with their own sync server ' +
      'if they prefer not to rely on the official droidex.nackz.dev instance.',
  },
];

function buildFaq() {
  const intro = `<p class="seo-intro">Answers about how Droidex tracks your Star Wars: Droid Tycoon collection, how ` +
    `rebirth requirements and Super Rebirths work, and what Flawless and the collection bonus mean in the game.</p>`;

  const items = FAQ.map(({ q, a }) => `  <div class="seo-faq-item">
    <h2>◈ ${escapeHtml(q)}</h2>
    <p>${escapeHtml(a)}</p>
  </div>`).join('\n\n');

  const bodyHtml = `${intro}\n\n${items}`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return page({
    slug: 'faq',
    title: 'Droid Tycoon FAQ — Variants, Rebirths, Flawless & Collection Bonus | Droidex',
    description: 'Frequently asked questions about tracking Star Wars: Droid Tycoon with Droidex: variants, rebirth requirements, Super Rebirth, Flawless odds and the collection bonus.',
    h1: 'Droid Tycoon FAQ',
    jsonld,
    bodyHtml,
  });
}

/* ---------- 7. sitemap.xml ---------- */

function buildSitemap() {
  const urls = ['', 'value-list/', 'rebirth-requirements/', 'faq/'];
  const body = urls.map(u => `  <url>
    <loc>${SITE_URL}/${u}</loc>
    <lastmod>${DATE_ISO}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

/* ---------- 8. Écriture ---------- */

function write(relPath, content) {
  const full = path.join(SITE, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  console.log('  wrote ' + relPath);
}

write('value-list/index.html', buildValueList());
write('rebirth-requirements/index.html', buildRebirthRequirements());
write('faq/index.html', buildFaq());
write('sitemap.xml', buildSitemap());
console.log('Done — 4 files generated from site/data.js (' + DATE_FR + ').');
