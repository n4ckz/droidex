#!/usr/bin/env node
/* =========================================================================
   Générateur des pages SEO statiques (EN + FR) + sitemap.xml.
   Sans dépendance : lit site/version.js + site/i18n.js + site/data.js
   + data/metrics/daily.json, les évalue dans un bac à sable vm, puis
   produit 4 pages de contenu crawlable × 2 langues + un sitemap, tous
   dérivés des mêmes données que l'app (aucune donnée dupliquée à la main).

   Langues : anglais sous /<slug>/, français sous /fr/<slug>/, reliés par
   des balises hreflang (x-default = EN). La redirection automatique selon
   la langue du navigateur vit dans site/lang-redirect.js et ne s'applique
   QUE dans le sens EN → FR (comme l'app) : rediriger depuis les pages FR
   éjecterait Googlebot (qui navigue en anglais) et tuerait leur indexation.

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
const LANGS = ['en', 'fr'];

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

/* Archive quotidienne (tools/archive-metrics.py) : valeurs statiques de la
   page stats (SEO + sans JS), ré-hydratées côté client par site/stats.js. */
const DAILY_METRICS = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data', 'metrics', 'daily.json'), 'utf8'));

function fmtBig(n) {
  if (n == null) return '—';
  if (n >= 1e6) { const m = Math.round(n / 1e5) / 10; return (m === Math.round(m) ? Math.round(m) : m) + 'M'; }
  return fmtInc(n);
}
const pctTxt = v => v == null ? '—' : Math.round(v * 100) + '%';

/* ---------- 4. Chaînes d'interface par langue ---------- */

const STR = {
  en: {
    navItems: [
      { slug: 'value-list', label: 'Value list' },
      { slug: 'rebirth-requirements', label: 'Rebirth requirements' },
      { slug: 'stats', label: 'Live stats' },
      { slug: 'faq', label: 'FAQ' },
    ],
    navAria: 'Content pages',
    cta: 'Open the tracker →',
    legal: 'Fan project not affiliated with Epic Games, Lucasfilm or Disney. Star Wars is a trademark of ' +
      'Lucasfilm Ltd. Droid Tycoon is a Fortnite mode created by FOAD/Blzn Studios. ' +
      '<a href="https://github.com/n4ckz/droidex" rel="noopener">Source code on GitHub</a>.',
    minSuffix: 'min',
    thDroid: 'Droid', thClass: 'Class', thBeskarCost: 'Beskar cost', thPerk: 'Perk',
    iconicIncome: '+15%/s income',
    thRebirth: 'Rebirth', thCredits: 'Credits', thRequired: 'Required droids', thUnlock: 'Unlock',
    cycle: 'Cycle',
    statsTiles: {
      live: ['In game right now', 'live, refreshed every 5 min'],
      peak: 'Peak players', unique: ['Unique players', 'per day'], plays: ['Plays', 'per day'],
      avg: ['Avg. session', 'per player per day'], d1: 'D1 retention',
      on: 'on', min: 'min',
    },
    chartCcu: '◈ Peak concurrent players per day',
    chartPlays: '◈ Plays per day',
    dayByDay: '◈ Day by day',
    statsTable: ['Date (UTC)', 'Peak CCU', 'Unique players', 'Plays', 'Avg. min/player', 'D1', 'D7'],
    statsNote: `Numbers on this page are the official values aggregated by Epic (no estimates, no scraping).
  The Galactic update of July 16, 2026 more than doubled the island's daily peak. Data archive:
  <a href="https://github.com/n4ckz/droidex/tree/main/data/metrics" rel="noopener">github.com/n4ckz/droidex</a>.`,
  },
  fr: {
    navItems: [
      { slug: 'value-list', label: 'Liste des valeurs' },
      { slug: 'rebirth-requirements', label: 'Exigences de renaissance' },
      { slug: 'stats', label: 'Stats en direct' },
      { slug: 'faq', label: 'FAQ' },
    ],
    navAria: 'Pages de contenu',
    cta: 'Ouvrir le tracker →',
    legal: 'Projet de fan non affilié à Epic Games, Lucasfilm ou Disney. Star Wars est une marque de ' +
      'Lucasfilm Ltd. Droid Tycoon est un mode Fortnite créé par FOAD/Blzn Studios. ' +
      '<a href="https://github.com/n4ckz/droidex" rel="noopener">Code source sur GitHub</a>.',
    minSuffix: 'min.',
    thDroid: 'Droïde', thClass: 'Classe', thBeskarCost: 'Coût Beskar', thPerk: 'Perk',
    iconicIncome: '+15 %/s de revenus',
    thRebirth: 'Renaissance', thCredits: 'Crédits', thRequired: 'Droïdes requis', thUnlock: 'Débloque',
    cycle: 'Cycle',
    statsTiles: {
      live: ['En jeu en ce moment', 'en direct, rafraîchi toutes les 5 min'],
      peak: 'Pic de joueurs', unique: ['Joueurs uniques', 'par jour'], plays: ['Parties', 'par jour'],
      avg: ['Session moyenne', 'par joueur et par jour'], d1: 'Rétention J1',
      on: 'le', min: 'min',
    },
    chartCcu: '◈ Pic de joueurs simultanés par jour',
    chartPlays: '◈ Parties par jour',
    dayByDay: '◈ Jour par jour',
    statsTable: ['Date (UTC)', 'Pic CCU', 'Joueurs uniques', 'Parties', 'Min. moy./joueur', 'J1', 'J7'],
    statsNote: `Les chiffres de cette page sont les valeurs officielles agrégées par Epic (aucune estimation,
  aucun scraping). La mise à jour Galactique du 16 juillet 2026 a plus que doublé le pic quotidien de l'île.
  Archive des données : <a href="https://github.com/n4ckz/droidex/tree/main/data/metrics" rel="noopener">github.com/n4ckz/droidex</a>.`,
  },
};

/* Gabarit commun aux pages de contenu (les deux langues). */
function page({ lang, slug, title, description, jsonld, h1, bodyHtml, extraHead = '', ogImage = 'og/og-1200x630.png' }) {
  const L = STR[lang];
  const rel = lang === 'fr' ? '../../' : '../';          /* vers la racine du site */
  const urlOf = (lg, sl) => `${SITE_URL}/${lg === 'fr' ? 'fr/' : ''}${sl}/`;
  const navHtml = L.navItems.map(n => {
    const current = n.slug === slug;
    return `<a href="../${n.slug}/" class="seo-navlink${current ? ' active' : ''}"${current ? ' aria-current="page"' : ''}>${n.label}</a>`;
  }).join('\n      ');
  const langSwitch = LANGS.map(lg =>
    lg === lang
      ? `<span class="seo-lang current" aria-current="true">${lg.toUpperCase()}</span>`
      /* chemin relatif à l'hôte (pas SITE_URL) : le sélecteur doit rester sur
         l'instance courante (local, auto-hébergement) */
      : `<a class="seo-lang" href="/${lg === 'fr' ? 'fr/' : ''}${slug}/" data-setlang="${lg}" hreflang="${lg}">${lg.toUpperCase()}</a>`
  ).join('<span class="seo-lang-sep">·</span>');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${urlOf(lang, slug)}">
<link rel="alternate" hreflang="en" href="${urlOf('en', slug)}">
<link rel="alternate" hreflang="fr" href="${urlOf('fr', slug)}">
<link rel="alternate" hreflang="x-default" href="${urlOf('en', slug)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${urlOf(lang, slug)}">
<meta property="og:site_name" content="Droidex">
<meta property="og:image" content="${SITE_URL}/${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${SITE_URL}/${ogImage}">
<meta name="theme-color" content="#101120">
<link rel="manifest" href="${rel}manifest.json">
<link rel="icon" type="image/png" sizes="192x192" href="${rel}icons/icon-192.png">
<link rel="apple-touch-icon" href="${rel}icons/apple-touch-icon.png">
<link rel="stylesheet" href="${rel}styles.css">
<link rel="stylesheet" href="${rel}seo-pages.css">
<script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
</script>
<script src="${rel}lang-redirect.js" defer></script>
${extraHead}</head>
<body class="seo-page">
<header class="seo-header">
  <div class="seo-hdr">
    <a class="brand" href="${rel}">DROIDEX</a>
    <span class="brand-sub">▸ Droid Tycoon // Registry</span>
    <nav class="seo-nav" aria-label="${L.navAria}">
      ${navHtml}
    </nav>
    <span class="seo-langs">${langSwitch}</span>
    <a class="tool-btn seo-cta" href="${rel}">${L.cta}</a>
  </div>
</header>
<main class="seo-main">
<h1>${h1}</h1>
${bodyHtml}
</main>
<footer class="seo-footer">
  <p class="seo-legal">${L.legal}</p>
  <p class="seo-version">DROIDEX V${APP_VERSION}</p>
</footer>
</body>
</html>
`;
}

/* ---------- 5. Value list ---------- */

const VL_TEXT = {
  en: {
    title: 'Droid Tycoon Value List — Income & Beskar Cost per Droid | Droidex',
    description: 'Income per second and Beskar upgrade cost for every Star Wars: Droid Tycoon droid, across Basic, Gold, Diamond, Rainbow, Beskar and Galactic variants.',
    h1: 'Droid Tycoon value list',
    intro: `<p class="seo-intro">This value list gives the income per second and Beskar upgrade cost for every ` +
      `droid in Star Wars: Droid Tycoon, across all six variants: Basic, Gold, Diamond, Rainbow, Beskar and Galactic ` +
      `(the new tier added in the mid-July 2026 update — Galactic incomes are still being documented by the ` +
      `community, undocumented values show as "—"). Numbers ` +
      `are cross-checked against community sources (${DATE_ISO}) rather than a single guide, and ` +
      `Droidex's own cycle 1 rebirth requirements have been verified in-game through rebirth 23. Iconic droids have ` +
      `no variants: owning one simply adds a flat +15% income bonus alongside its unique perk. Remember that in ` +
      `Droidex's rebirth panel, a higher variant always satisfies a lower requirement — if a rebirth asks for a ` +
      `droid at Gold minimum, owning it at Diamond or better already counts, so this list also doubles as a quick ` +
      `reference for which variant is "enough".</p>`,
    jsonName: 'Droidex value list — Star Wars: Droid Tycoon',
    jsonDesc: 'Income per second and Beskar upgrade cost for every droid and variant in Star Wars: Droid Tycoon.',
  },
  fr: {
    title: 'Droid Tycoon : liste des valeurs — revenus et coût Beskar par droïde | Droidex',
    description: 'Revenus par seconde et coût d\'amélioration Beskar pour chaque droïde de Star Wars: Droid Tycoon, sur les variantes Basic, Or, Diamant, Arc-en-ciel, Beskar et Galactique.',
    h1: 'Liste des valeurs de Droid Tycoon',
    intro: `<p class="seo-intro">Cette liste des valeurs donne les revenus par seconde et le coût d'amélioration ` +
      `Beskar de chaque droïde de Star Wars: Droid Tycoon, sur les six variantes : Basic, Or, Diamant, Arc-en-ciel, ` +
      `Beskar et Galactique (le nouveau palier ajouté par la mise à jour de mi-juillet 2026 — les revenus ` +
      `Galactiques sont encore en cours de documentation par la communauté, les valeurs inconnues s'affichent ` +
      `« — »). Les chiffres sont recoupés entre plusieurs sources communautaires (${DATE_ISO}) plutôt que tirés ` +
      `d'un guide unique, et les exigences de renaissance du cycle 1 de Droidex ont été vérifiées en jeu jusqu'à ` +
      `la renaissance 23. Les droïdes Iconiques n'ont pas de variantes : en posséder un ajoute simplement +15 % de ` +
      `revenus, en plus de son perk unique. Rappel : dans le panneau de renaissance de Droidex, une variante ` +
      `supérieure valide toujours une exigence inférieure — si une renaissance demande un droïde « Or minimum », ` +
      `le posséder en Diamant ou mieux suffit déjà ; cette liste sert donc aussi de référence rapide pour savoir ` +
      `quelle variante est « suffisante ».</p>`,
    jsonName: 'Liste des valeurs Droidex — Star Wars: Droid Tycoon',
    jsonDesc: 'Revenus par seconde et coût d\'amélioration Beskar pour chaque droïde et variante de Star Wars: Droid Tycoon.',
  },
};

function buildValueList(lang) {
  const L = STR[lang], T = VL_TEXT[lang];
  const TIERS_L = I18N[lang]._tiers;
  const RAR_L = I18N[lang]._rarities;

  const sections = RARITY_ORDER.map(rarity => {
    const droids = DROIDS.filter(d => d.r === rarity);
    const rows = droids.map(d => {
      if (d.iconic) {
        return `      <tr><td>${escapeHtml(d.n)}</td><td>${escapeHtml(d.t)}</td>` +
          `<td colspan="6">${L.iconicIncome}</td><td>—</td><td>${escapeHtml(d.perk || '—')}</td></tr>`;
      }
      const tierCells = d.inc.map(n => `<td>${n == null ? '—' : fmtInc(n) + '/s'}</td>`).join('');
      return `      <tr><td>${escapeHtml(d.n)}</td><td>${escapeHtml(d.t)}</td>${tierCells}` +
        `<td>${escapeHtml(d.bskCost)}</td><td>${escapeHtml(d.perk || '—')}</td></tr>`;
    }).join('\n');

    const tierHeads = TIERS_L.map(t => `<th>${escapeHtml(t)}</th>`).join('');
    return `  <h2>◈ ${escapeHtml(RAR_L[rarity])}</h2>
  <div class="seo-table-wrap">
    <table>
      <thead>
        <tr><th>${L.thDroid}</th><th>${L.thClass}</th>${tierHeads}<th>${L.thBeskarCost}</th><th>${L.thPerk}</th></tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>`;
  }).join('\n\n');

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: T.jsonName,
    description: T.jsonDesc,
    url: `${SITE_URL}/${lang === 'fr' ? 'fr/' : ''}value-list/`,
    inLanguage: lang,
    license: 'https://github.com/n4ckz/droidex/blob/main/LICENSE',
    creator: { '@type': 'Person', name: 'Nackz', url: 'https://github.com/n4ckz' },
    dateModified: DATE_ISO,
    variableMeasured: ['income per second', 'Beskar upgrade cost', 'perk'],
  };

  return page({
    lang, slug: 'value-list',
    title: T.title, description: T.description, h1: T.h1,
    jsonld, bodyHtml: `${T.intro}\n\n${sections}`,
  });
}

/* ---------- 6. Rebirth requirements ---------- */

const RB_TEXT = {
  en: {
    title: 'Droid Tycoon Rebirth Requirements — All 28 Levels, 4 Cycles | Droidex',
    description: 'The 3 required droids, minimum variants and credit cost for every Star Wars: Droid Tycoon rebirth level, from 1 to 28, across all 4 cycles.',
    h1: 'Droid Tycoon rebirth requirements',
    intro: `<p class="seo-intro">Star Wars: Droid Tycoon's progression runs through 28 rebirth levels, repeated ` +
      `across 4 cycles in an endless loop. Each level requires three specific droids placed in your base at a ` +
      `minimum variant, plus a credit cost that is identical across all 4 cycles for the same level, climbing from ` +
      `10K at rebirth 1 to 45T at rebirth 28. Rebirth 28, added with the Galactic update of mid-July 2026, is the ` +
      `first level to require a Galactic-tier droid in your base. From rebirth 12 onward, meeting the requirements lets you trigger a ` +
      `Super Rebirth instead of a normal one: it keeps your Droidex, droidsmith level, cosmetics, unlocked Flawless ` +
      `droids, Nova crystals and Iconic unlocks, but resets your base, its droids, your currencies, rebirth rank, ` +
      `pickaxe level and blueprints, before advancing you straight into the next cycle. This page lists every ` +
      `cycle's requirements in full, cross-checked against community sources (${DATE_ISO}).</p>`,
    jsonName: 'Droidex rebirth requirements — Star Wars: Droid Tycoon',
    jsonDesc: 'Required droids, minimum variants and credit cost for all 28 rebirth levels across the 4 cycles in Star Wars: Droid Tycoon.',
  },
  fr: {
    title: 'Droid Tycoon : exigences de renaissance — les 28 niveaux, 4 cycles | Droidex',
    description: 'Les 3 droïdes requis, les variantes minimales et le coût en crédits de chaque niveau de renaissance de Star Wars: Droid Tycoon, de 1 à 28, sur les 4 cycles.',
    h1: 'Exigences de renaissance de Droid Tycoon',
    intro: `<p class="seo-intro">La progression de Star Wars: Droid Tycoon passe par 28 niveaux de renaissance, ` +
      `répétés sur 4 cycles en boucle infinie. Chaque niveau exige trois droïdes précis placés dans votre base à ` +
      `une variante minimale, plus un coût en crédits identique d'un cycle à l'autre pour un même niveau, qui ` +
      `grimpe de 10K à la renaissance 1 jusqu'à 45T à la renaissance 28. La renaissance 28, ajoutée par la mise à ` +
      `jour Galactique de mi-juillet 2026, est le premier niveau à exiger un droïde de palier Galactique dans la ` +
      `base. À partir de la renaissance 12, remplir les exigences permet de déclencher une Super-renaissance au ` +
      `lieu d'une renaissance normale : elle conserve le Droidex, le niveau de fabricant, les cosmétiques, les ` +
      `Flawless débloqués, les cristaux Nova et les déverrouillages d'Iconiques, mais réinitialise la base, ses ` +
      `droïdes, les devises, le rang de renaissance, le niveau de pioche et les blueprints, avant de passer ` +
      `directement au cycle suivant. Cette page liste l'intégralité des exigences de chaque cycle, recoupées ` +
      `entre sources communautaires (${DATE_ISO}).</p>`,
    jsonName: 'Exigences de renaissance Droidex — Star Wars: Droid Tycoon',
    jsonDesc: 'Droïdes requis, variantes minimales et coût en crédits des 28 niveaux de renaissance sur les 4 cycles de Star Wars: Droid Tycoon.',
  },
};

function buildRebirthRequirements(lang) {
  const L = STR[lang], T = RB_TEXT[lang];
  const TIERS_L = I18N[lang]._tiers;
  const droidById = {};
  DROIDS.forEach(d => { droidById[d.id] = d; });
  const reqLabel = ([id, tier]) => `${escapeHtml(droidById[id] ? droidById[id].n : id)} (${TIERS_L[tier]} ${L.minSuffix})`;

  const cycles = Object.keys(REBIRTHS).sort((a, b) => a - b).map(cyc => {
    const levels = REBIRTHS[cyc];
    const rows = Object.keys(levels).sort((a, b) => a - b).map(rb => {
      const reqs = levels[rb].map(reqLabel).join(', ');
      const unlockCell = cyc === '1' ? `<td>${escapeHtml(RB_UNLOCKS[rb] || '—')}</td>` : '';
      return `      <tr><td>${rb}</td><td>${escapeHtml(RB_CREDITS[rb] || '—')}</td><td>${reqs}</td>${unlockCell}</tr>`;
    }).join('\n');
    const unlockHead = cyc === '1' ? `<th>${L.thUnlock}</th>` : '';

    return `  <h2>◈ ${L.cycle} ${cyc}</h2>
  <div class="seo-table-wrap">
    <table>
      <thead>
        <tr><th>${L.thRebirth}</th><th>${L.thCredits}</th><th>${L.thRequired}</th>${unlockHead}</tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>`;
  }).join('\n\n');

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: T.jsonName,
    description: T.jsonDesc,
    url: `${SITE_URL}/${lang === 'fr' ? 'fr/' : ''}rebirth-requirements/`,
    inLanguage: lang,
    license: 'https://github.com/n4ckz/droidex/blob/main/LICENSE',
    creator: { '@type': 'Person', name: 'Nackz', url: 'https://github.com/n4ckz' },
    dateModified: DATE_ISO,
    variableMeasured: ['required droids', 'minimum variant', 'credit cost', 'unlock'],
  };

  return page({
    lang, slug: 'rebirth-requirements',
    title: T.title, description: T.description, h1: T.h1,
    jsonld, bodyHtml: `${T.intro}\n\n${cycles}`,
  });
}

/* ---------- 7. Live stats ---------- */

const ST_TEXT = {
  en: {
    title: 'Droid Tycoon Live Player Count & Daily Stats | Droidex',
    description: 'How many people play Star Wars: Droid Tycoon right now, plus daily peak CCU, plays, unique players and retention — official Epic data, archived daily.',
    h1: 'Droid Tycoon player stats',
    intro: `<p class="seo-intro">Live player count and daily statistics for Star Wars: Droid Tycoon, the ` +
      `Fortnite creative mode by FOAD/Blzn Studios — peak concurrent players (CCU), plays, unique players, ` +
      `average session length and D1/D7 retention. Every number comes from Epic's official, public Ecosystem ` +
      `API for the island (code 7865-8305-9184). Epic only exposes a rolling 7-day window, so Droidex archives ` +
      `the official daily values every morning: this history, kept since 2026-07-14, exists nowhere else. ` +
      `Tiles and charts refresh in your browser with the latest data.</p>`,
    jsonName: 'Star Wars: Droid Tycoon — daily player statistics',
    jsonDesc: 'Daily peak concurrent players (CCU), plays, unique players, average session length and retention for the Fortnite island Star Wars: Droid Tycoon, archived from Epic\'s official Ecosystem API.',
  },
  fr: {
    title: 'Droid Tycoon : joueurs en direct et statistiques quotidiennes | Droidex',
    description: 'Combien de personnes jouent à Star Wars: Droid Tycoon en ce moment, plus le pic CCU quotidien, les parties, les joueurs uniques et la rétention — données officielles Epic, archivées chaque jour.',
    h1: 'Statistiques des joueurs de Droid Tycoon',
    intro: `<p class="seo-intro">Nombre de joueurs en direct et statistiques quotidiennes de Star Wars: Droid ` +
      `Tycoon, le mode créatif Fortnite de FOAD/Blzn Studios — pic de joueurs simultanés (CCU), parties, joueurs ` +
      `uniques, durée moyenne de session et rétention J1/J7. Chaque chiffre provient de l'API Ecosystem ` +
      `officielle et publique d'Epic pour l'île (code 7865-8305-9184). Epic n'expose qu'une fenêtre glissante de ` +
      `7 jours : Droidex archive donc chaque matin les valeurs quotidiennes officielles — cet historique, ` +
      `conservé depuis le 14/07/2026, n'existe nulle part ailleurs. Les tuiles et les courbes se rafraîchissent ` +
      `dans votre navigateur avec les dernières données.</p>`,
    jsonName: 'Star Wars: Droid Tycoon — statistiques quotidiennes des joueurs',
    jsonDesc: 'Pic quotidien de joueurs simultanés (CCU), parties, joueurs uniques, durée moyenne de session et rétention de l\'île Fortnite Star Wars: Droid Tycoon, archivés depuis l\'API Ecosystem officielle d\'Epic.',
  },
};

function buildStats(lang) {
  const L = STR[lang], T = ST_TEXT[lang], TL = L.statsTiles;
  const days = Object.keys(DAILY_METRICS).sort();
  const last = days[days.length - 1];
  const d = DAILY_METRICS[last];

  const tiles = [
    ['stat-live', TL.live[0], '—', TL.live[1]],
    ['stat-peak', TL.peak, fmtBig(d.peakCCU), `${TL.on} <span id="stat-peak-day">${last}</span> <span id="stat-peak-delta"></span>`],
    ['stat-unique', TL.unique[0], fmtBig(d.uniquePlayers), TL.unique[1]],
    ['stat-plays', TL.plays[0], fmtBig(d.plays), TL.plays[1]],
    ['stat-avgmin', TL.avg[0], d.averageMinutesPerPlayer == null ? '—' : Math.round(d.averageMinutesPerPlayer) + ' ' + TL.min, TL.avg[1]],
    ['stat-d1', TL.d1, pctTxt(d.retentionD1), `${lang === 'fr' ? 'J7' : 'D7'}: <span id="stat-d7">${pctTxt(d.retentionD7)}</span>`],
  ];
  const tilesHtml = `  <div class="stat-grid">\n` + tiles.map(([id, label, value, sub]) =>
    `    <div class="stat-tile"><span class="stat-label">${label}</span>` +
    `<span class="stat-value" id="${id}">${value}</span>` +
    `<span class="stat-sub">${sub}</span></div>`).join('\n') + `\n  </div>`;

  const chartsHtml = `
  <figure class="stat-chart" id="chart-ccu">
    <figcaption>${L.chartCcu}</figcaption>
    <div class="chart-box"></div>
  </figure>
  <figure class="stat-chart" id="chart-plays">
    <figcaption>${L.chartPlays}</figcaption>
    <div class="chart-box"></div>
  </figure>`;

  const rows = days.slice().reverse().map(day => {
    const v = DAILY_METRICS[day];
    return `      <tr><td>${day}</td><td>${fmtBig(v.peakCCU)}</td><td>${fmtBig(v.uniquePlayers)}</td>` +
      `<td>${fmtBig(v.plays)}</td><td>${v.averageMinutesPerPlayer == null ? '—' : Math.round(v.averageMinutesPerPlayer)}</td>` +
      `<td>${pctTxt(v.retentionD1)}</td><td>${pctTxt(v.retentionD7)}</td></tr>`;
  }).join('\n');

  const tableHtml = `  <h2>${L.dayByDay}</h2>
  <div class="seo-table-wrap">
    <table>
      <thead>
        <tr>${L.statsTable.map(h => `<th>${h}</th>`).join('')}</tr>
      </thead>
      <tbody id="stats-tbody">
${rows}
      </tbody>
    </table>
  </div>
  <p class="seo-note">${L.statsNote}</p>`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: T.jsonName,
    description: T.jsonDesc,
    url: `${SITE_URL}/${lang === 'fr' ? 'fr/' : ''}stats/`,
    inLanguage: lang,
    license: 'https://github.com/n4ckz/droidex/blob/main/LICENSE',
    creator: { '@type': 'Person', name: 'Nackz' },
    temporalCoverage: `2026-07-14/${last}`,
    distribution: [{
      '@type': 'DataDownload',
      encodingFormat: 'application/json',
      contentUrl: 'https://raw.githubusercontent.com/n4ckz/droidex/main/data/metrics/daily.json',
    }],
  };

  const rel = lang === 'fr' ? '../../' : '../';
  return page({
    lang, slug: 'stats',
    title: T.title, description: T.description, h1: T.h1,
    jsonld, bodyHtml: `${T.intro}\n\n${tilesHtml}\n${chartsHtml}\n\n${tableHtml}`,
    extraHead: `<script src="${rel}stats.js" defer></script>\n`,
    ogImage: 'og/og-stats-1200x630.png',
  });
}

/* ---------- 8. FAQ ---------- */

const FAQ = [
  {
    q: { en: 'What is Droidex?', fr: 'Qu\'est-ce que Droidex ?' },
    a: {
      en: 'Droidex is a free, open-source collection tracker for Star Wars: Droid Tycoon, the Fortnite creative mode ' +
        "released by FOAD/Blzn Studios on May 1st, 2026. The game gives no way to check what you already own while " +
        'standing at the in-game Sandcrawler shop, so Droidex fills that gap: it tracks all 69 droids across their ' +
        'variants, tells you which specific droids and variants you still need for your targeted rebirth, and which ' +
        'ones you can safely retire from your base. It works as an installable, offline-capable Progressive Web App.',
      fr: 'Droidex est un tracker de collection gratuit et open source pour Star Wars: Droid Tycoon, le mode créatif ' +
        'Fortnite sorti par FOAD/Blzn Studios le 1ᵉʳ mai 2026. Le jeu n\'offre aucun moyen de vérifier ce que vous ' +
        'possédez déjà quand vous êtes devant la boutique du Sandcrawler : Droidex comble ce manque en suivant les ' +
        '69 droïdes et leurs variantes, en vous disant quels droïdes et quelles variantes manquent encore pour votre ' +
        'renaissance visée, et lesquels peuvent être retirés de la base sans risque. Il s\'installe comme une ' +
        'application (PWA) et fonctionne hors ligne.',
    },
  },
  {
    q: { en: 'How do I track variants (3 states)?', fr: 'Comment suivre les variantes (3 états) ?' },
    a: {
      en: 'Each droid variant in Droidex cycles through three states with a single tap: never owned, owned in your ' +
        'Droidex (the in-game collection log), and physically placed in your base. Most droids come in six variants ' +
        '— Basic, Gold, Diamond, Rainbow, Beskar and Galactic — so you tap through each variant independently as you obtain ' +
        'and place copies. A handful of Iconic droids have no variants; instead they get two separate toggles, one ' +
        'for ownership and one for being placed in your base.',
      fr: 'Chaque variante de droïde passe par trois états d\'un simple tap : jamais possédée, possédée dans le ' +
        'Droidex (le registre de collection du jeu), et physiquement placée dans la base. La plupart des droïdes ' +
        'existent en six variantes — Basic, Or, Diamant, Arc-en-ciel, Beskar et Galactique — que l\'on coche ' +
        'indépendamment au fil des obtentions. Les quelques droïdes Iconiques n\'ont pas de variantes : ils ont ' +
        'deux interrupteurs distincts, un pour la possession et un pour la présence en base.',
    },
  },
  {
    q: { en: 'Does a higher variant satisfy a lower requirement?', fr: 'Une variante supérieure valide-t-elle une exigence inférieure ?' },
    a: {
      en: "Yes. Rebirth requirements are expressed as a minimum variant — for example \"Strike-Orb (Gold minimum)\". " +
        'Owning or placing a higher variant of that droid always satisfies a lower requirement, so a Diamond ' +
        'Strike-Orb in your base counts for a Gold requirement just as well as an actual Gold copy would. You never ' +
        'need to hunt down a lesser copy of a droid you already own in a better variant: Droidex checks your best ' +
        'owned variant against each requirement automatically.',
      fr: 'Oui. Les exigences de renaissance s\'expriment en variante minimale — par exemple « Strike-Orb (Or ' +
        'minimum) ». Posséder ou placer une variante supérieure de ce droïde valide toujours l\'exigence : un ' +
        'Strike-Orb Diamant en base compte pour une exigence Or exactement comme une copie Or. Inutile de ' +
        'rechasser une copie inférieure d\'un droïde déjà possédé en mieux : Droidex compare automatiquement votre ' +
        'meilleure variante à chaque exigence.',
    },
  },
  {
    q: { en: 'What are rebirth requirements?', fr: 'Que sont les exigences de renaissance ?' },
    a: {
      en: 'Each rebirth level, from 1 to 28, requires three specific droids placed in your base at a minimum variant, ' +
        'plus a credit cost that climbs from 10K at rebirth 1 up to 45T at rebirth 28. The 28 levels repeat across 4 ' +
        'cycles in a loop, and each cycle can ask for a different trio of droids at the same level even though the ' +
        'credit cost stays identical across cycles. Certain rebirth levels also unlock a new slot for your base, ' +
        'such as an extra Worker or Astromech slot.',
      fr: 'Chaque niveau de renaissance, de 1 à 28, exige trois droïdes précis placés dans la base à une variante ' +
        'minimale, plus un coût en crédits qui grimpe de 10K (renaissance 1) à 45T (renaissance 28). Les 28 niveaux ' +
        'se répètent sur 4 cycles en boucle, et chaque cycle peut demander un trio de droïdes différent au même ' +
        'niveau, le coût en crédits restant identique d\'un cycle à l\'autre. Certains niveaux débloquent aussi un ' +
        'nouvel emplacement de base, par exemple un slot Worker ou Astromech supplémentaire.',
    },
  },
  {
    q: { en: 'What is the Galactic variant and how does it work?', fr: 'Qu\'est-ce que la variante Galactique et comment fonctionne-t-elle ?' },
    a: {
      en: 'Galactic is the newest variant tier, added above Beskar in the mid-July 2026 game update, bringing the ' +
        'total to six variants per standard droid. Exactly like the in-game Droidex screen, the Galactic tier is ' +
        'not counted in the main 317-variant total: it has its own separate counter over the 62 standard droids, ' +
        'and Droidex mirrors that with a dedicated "Galactic x/62" counter. Rebirth 28 — the new top level of each ' +
        'of the 4 cycles — requires one specific Galactic droid placed in your base (for example a Galactic ' +
        'Proto-Roller in cycle 1) alongside a Rainbow droid, a Beskar droid and 45T credits. Like every higher ' +
        'variant, a Galactic copy also satisfies any lower requirement for the same droid. Community sources are ' +
        'still documenting Galactic income values, and report Galactic droids appearing in-game on an hourly ' +
        'spawn timer; Droidex tracks each Galactic copy with the same tap-through states (owned, in base) and ' +
        'shows RB·GLC requirement badges so you know exactly which Galactic droids your next rebirth needs.',
      fr: 'Le Galactique est le palier de variante le plus récent, ajouté au-dessus du Beskar par la mise à jour de ' +
        'mi-juillet 2026, portant le total à six variantes par droïde standard. Exactement comme l\'écran Droidex ' +
        'du jeu, le palier Galactique n\'entre pas dans le total principal de 317 variantes : il a son propre ' +
        'compteur sur les 62 droïdes standard, et Droidex l\'affiche à l\'identique avec un compteur dédié ' +
        '« Galactique x/62 ». La renaissance 28 — le nouveau niveau maximal de chacun des 4 cycles — exige un ' +
        'droïde Galactique précis placé dans la base (par exemple un Proto-Roller Galactique au cycle 1), aux ' +
        'côtés d\'un droïde Arc-en-ciel, d\'un Beskar et de 45T de crédits. Comme toute variante supérieure, une ' +
        'copie Galactique valide aussi les exigences inférieures du même droïde. La communauté documente encore ' +
        'les revenus Galactiques et rapporte des apparitions en jeu sur un cycle horaire ; Droidex suit chaque ' +
        'copie Galactique avec les mêmes états au tap (possédé, en base) et affiche des badges RB·GLC pour savoir ' +
        'exactement quels droïdes Galactiques votre prochaine renaissance demande.',
    },
  },
  {
    q: { en: 'What is a Super Rebirth and what do you keep or lose?', fr: 'Qu\'est-ce qu\'une Super-renaissance, et que garde-t-on ou perd-on ?' },
    a: {
      en: 'From rebirth level 12 onward, once your requirements are met you can trigger a Super Rebirth instead of a ' +
        'normal one, which advances you straight into the next cycle. You keep your Droidex, droidsmith level, ' +
        'cosmetics, unlocked Flawless droids, Nova crystals, and any Iconic droid unlocks. You lose your base ' +
        'layout, the droids currently placed in it, your currencies, your rebirth rank, your pickaxe level, and any ' +
        'blueprints — Iconic unlocks can be bought back at the Nova crystal shop afterward.',
      fr: 'À partir du niveau de renaissance 12, une fois les exigences remplies, vous pouvez déclencher une ' +
        'Super-renaissance au lieu d\'une renaissance normale : elle vous fait passer directement au cycle suivant. ' +
        'Vous conservez le Droidex, le niveau de fabricant, les cosmétiques, les droïdes Flawless débloqués, les ' +
        'cristaux Nova et les déverrouillages d\'Iconiques. Vous perdez l\'agencement de la base, les droïdes qui y ' +
        'sont placés, les devises, le rang de renaissance, le niveau de pioche et les blueprints — les Iconiques ' +
        'se rachètent ensuite à la boutique de cristaux Nova.',
    },
  },
  {
    q: { en: 'What is Flawless?', fr: 'Qu\'est-ce que le Flawless ?' },
    a: {
      en: 'Flawless is a permanent, rare drop chance rolled independently for every droid you obtain, kept forever in ' +
        'your Droidex once unlocked. The odds depend on variant rarity: roughly 1 in 1000 for a Basic droid down to ' +
        '1 in 100 for a Beskar droid, so rarer, higher-value variants are noticeably more likely to roll Flawless. ' +
        "Droidex lets you mark each droid's Flawless status with a toggle so you can track which ones you've already " +
        'unlocked without relying on memory.',
      fr: 'Le Flawless est une chance de drop rare et permanente, tirée indépendamment à chaque droïde obtenu, et ' +
        'conservée à vie dans le Droidex une fois débloquée. Les chances dépendent de la variante : environ 1 sur ' +
        '1000 pour un droïde Basic, jusqu\'à 1 sur 100 pour un Beskar — les variantes rares et chères ont donc ' +
        'nettement plus de chances de sortir Flawless. Droidex propose un interrupteur ✦ par droïde pour marquer ' +
        'ceux déjà débloqués sans compter sur sa mémoire.',
    },
  },
  {
    q: { en: 'What is the collection bonus?', fr: 'Qu\'est-ce que le bonus de collection ?' },
    a: {
      en: 'The collection bonus rewards broad collecting: for every distinct droid you own, regardless of which ' +
        'variant, your income increases by 1%. It stacks across your entire Droidex, so owning 40 different droids ' +
        '— even all at Basic variant — grants a flat +40% income bonus on top of your normal rebirth and variant ' +
        'progression. Droidex displays your current distinct-droid count and the resulting bonus percentage in the ' +
        'header, updating live as you tap through your registry.',
      fr: 'Le bonus de collection récompense la largeur de collection : chaque droïde distinct possédé, quelle que ' +
        'soit la variante, augmente les revenus de 1 %. Il se cumule sur tout le Droidex : posséder 40 droïdes ' +
        'différents — même tous en Basic — donne +40 % de revenus en plus de la progression normale par ' +
        'renaissances et variantes. Droidex affiche en permanence le nombre de droïdes distincts et le bonus ' +
        'correspondant dans l\'en-tête, mis à jour en direct.',
    },
  },
  {
    q: { en: 'Is Droidex free? Does it need an account?', fr: 'Droidex est-il gratuit ? Faut-il un compte ?' },
    a: {
      en: 'Droidex is completely free, has no ads and no tracking. It works fully without an account: your registry ' +
        'is saved locally in your browser and never leaves your device. Creating an optional account via Google ' +
        'sign-in lets you sync that same registry across multiple devices; in that case only your email address and ' +
        "your registry data are stored on the server, and both can be deleted at any time from the app with the " +
        "\"Delete my account\" button.",
      fr: 'Droidex est entièrement gratuit, sans publicité ni tracking. Il fonctionne sans compte : le registre est ' +
        'sauvegardé localement dans le navigateur et ne quitte jamais l\'appareil. Un compte optionnel via ' +
        '« Se connecter avec Google » permet de synchroniser le registre entre appareils ; dans ce cas, seuls ' +
        'l\'adresse email et le registre sont stockés sur le serveur, et les deux sont supprimables à tout moment ' +
        'depuis l\'app via « Supprimer mon compte ».',
    },
  },
  {
    q: { en: 'Can I self-host it?', fr: 'Peut-on l\'auto-héberger ?' },
    a: {
      en: "Yes. Droidex's source code is open under the MIT license on GitHub, and the whole project is designed to " +
        'be self-hostable: the tracker itself is a static site with no build step, and the optional sync backend ' +
        'runs on PocketBase, deployable via the provided Docker and Traefik configuration. Anyone can fork the ' +
        'repository, point it at their own domain, and run their own independent copy with their own sync server ' +
        'if they prefer not to rely on the official droidex.nackz.dev instance.',
      fr: 'Oui. Le code source de Droidex est ouvert sous licence MIT sur GitHub, et tout le projet est conçu pour ' +
        'l\'auto-hébergement : le tracker est un site statique sans étape de build, et la synchronisation ' +
        'optionnelle repose sur PocketBase, déployable via la configuration Docker/Traefik fournie. Chacun peut ' +
        'forker le dépôt, le pointer vers son propre domaine et faire tourner sa copie indépendante avec son ' +
        'propre serveur de synchro, sans dépendre de l\'instance officielle droidex.nackz.dev.',
    },
  },
];

const FAQ_TEXT = {
  en: {
    title: 'Droid Tycoon FAQ — Variants, Rebirths, Flawless & Collection Bonus | Droidex',
    description: 'Frequently asked questions about tracking Star Wars: Droid Tycoon with Droidex: variants, rebirth requirements, Super Rebirth, Flawless odds and the collection bonus.',
    h1: 'Droid Tycoon FAQ',
    intro: `<p class="seo-intro">Answers about how Droidex tracks your Star Wars: Droid Tycoon collection, how ` +
      `rebirth requirements and Super Rebirths work, and what Flawless and the collection bonus mean in the game.</p>`,
  },
  fr: {
    title: 'FAQ Droid Tycoon — variantes, renaissances, Flawless et bonus de collection | Droidex',
    description: 'Questions fréquentes sur le suivi de collection Star Wars: Droid Tycoon avec Droidex : variantes, exigences de renaissance, Super-renaissance, chances de Flawless et bonus de collection.',
    h1: 'FAQ Droid Tycoon',
    intro: `<p class="seo-intro">Les réponses sur la façon dont Droidex suit votre collection Star Wars: Droid ` +
      `Tycoon, le fonctionnement des exigences de renaissance et des Super-renaissances, et ce que signifient le ` +
      `Flawless et le bonus de collection dans le jeu.</p>`,
  },
};

function buildFaq(lang) {
  const T = FAQ_TEXT[lang];
  const items = FAQ.map(({ q, a }) => `  <div class="seo-faq-item">
    <h2>◈ ${escapeHtml(q[lang])}</h2>
    <p>${escapeHtml(a[lang])}</p>
  </div>`).join('\n\n');

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: FAQ.map(({ q, a }) => ({
      '@type': 'Question',
      name: q[lang],
      acceptedAnswer: { '@type': 'Answer', text: a[lang] },
    })),
  };

  return page({
    lang, slug: 'faq',
    title: T.title, description: T.description, h1: T.h1,
    jsonld, bodyHtml: `${T.intro}\n\n${items}`,
  });
}

/* ---------- 9. sitemap.xml ---------- */

function buildSitemap() {
  const slugs = ['value-list/', 'rebirth-requirements/', 'stats/', 'faq/'];
  const urls = ['', ...slugs, ...slugs.map(s => 'fr/' + s)];
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

/* ---------- 10. Écriture ---------- */

function write(relPath, content) {
  const full = path.join(SITE, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  console.log('  wrote ' + relPath);
}

for (const lang of LANGS) {
  const prefix = lang === 'fr' ? 'fr/' : '';
  write(`${prefix}value-list/index.html`, buildValueList(lang));
  write(`${prefix}rebirth-requirements/index.html`, buildRebirthRequirements(lang));
  write(`${prefix}stats/index.html`, buildStats(lang));
  write(`${prefix}faq/index.html`, buildFaq(lang));
}
write('sitemap.xml', buildSitemap());
console.log('Done — 9 files generated from site/data.js + data/metrics (' + DATE_FR + ').');
