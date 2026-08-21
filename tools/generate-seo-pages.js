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
// Signal d'entité : « Droidex » est disputé par des sites tiers homonymes —
// le sameAs ancre l'auteur (et donc le site) sur nos profils publics.
const CREATOR = {
  '@type': 'Person',
  name: 'Nackz',
  url: 'https://github.com/n4ckz',
  sameAs: ['https://github.com/n4ckz/droidex', 'https://x.com/Nackz_X'],
};
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
    thDroid: 'Droid', thClass: 'Class', thPerk: 'Perk',
    tblIncome: 'Income per variant', tblCost: 'Cost per variant',
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
    thDroid: 'Droïde', thClass: 'Classe', thPerk: 'Perk',
    tblIncome: 'Revenus par variante', tblCost: 'Coût par variante',
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

/* Maillage interne éditorial : liens DANS le contenu avec des ancres qui
   décrivent leur cible (les liens de gabarit — logo, menu, CTA — sont
   dévalués par les moteurs). Formulé différemment sur chaque page pour
   rester du contenu, pas du chrome. Ajouté le 21/08/2026 : les deux pages
   FR encore indexées par Google sont nos seules portes vers les 7 élaguées. */
const SEE_ALSO = {
  'value-list': {
    en: (rel) => `To put these numbers to use, check the <a href="../rebirth-requirements/">rebirth requirements for all 35 levels and 5 cycles</a> — ` +
      `each level asks for three droids at a minimum variant — and track what you already own in <a href="${rel}">Droidex, the free tracker covering all 442 droid variants</a>. ` +
      `Flawless odds per variant are detailed in the <a href="../faq/">Droid Tycoon FAQ</a>.`,
    fr: (rel) => `Pour exploiter ces chiffres, consultez les <a href="../rebirth-requirements/">exigences des 35 niveaux de renaissance sur les 5 cycles</a> — ` +
      `chaque niveau demande trois droïdes à une variante minimale — et suivez ce que vous possédez déjà dans <a href="${rel}">Droidex, le tracker gratuit des 442 variantes de droïdes</a>. ` +
      `Les chances de Flawless par variante sont détaillées dans la <a href="../faq/">FAQ Droid Tycoon</a>.`,
  },
  'rebirth-requirements': {
    en: (rel) => `Before buying a required droid, look up its price in the <a href="../value-list/">value list — income and cost of every variant, Basic to Stellar</a>, ` +
      `and follow your own progress toward each level in <a href="${rel}">Droidex, the free Droid Tycoon collection tracker</a>. ` +
      `What a Super Rebirth keeps or resets is covered in the <a href="../faq/">FAQ</a>.`,
    fr: (rel) => `Avant d'acheter un droïde requis, vérifiez son prix dans la <a href="../value-list/">liste des valeurs — revenus et coût de chaque variante, de Basic à Stellaire</a>, ` +
      `et suivez votre propre progression vers chaque niveau dans <a href="${rel}">Droidex, le tracker de collection Droid Tycoon gratuit</a>. ` +
      `Ce qu'une Super-renaissance conserve ou réinitialise est détaillé dans la <a href="../faq/">FAQ</a>.`,
  },
  stats: {
    en: (rel) => `These numbers accompany <a href="${rel}">Droidex, the free Star Wars: Droid Tycoon collection tracker</a> — ` +
      `see also the <a href="../value-list/">value list with the income and cost of all seven droid variants</a> ` +
      `and the <a href="../rebirth-requirements/">rebirth requirements for all 35 levels</a>.`,
    fr: (rel) => `Ces statistiques accompagnent <a href="${rel}">Droidex, le tracker de collection Star Wars: Droid Tycoon gratuit</a> — ` +
      `voir aussi la <a href="../value-list/">liste des valeurs : revenus et coût des sept variantes de droïdes</a> ` +
      `et les <a href="../rebirth-requirements/">exigences des 35 niveaux de renaissance</a>.`,
  },
  faq: {
    en: (rel) => `Going further: the <a href="../rebirth-requirements/">full rebirth requirements for levels 1-35 across the 5 cycles</a>, ` +
      `the <a href="../value-list/">value list — income and cost of every droid variant</a>, ` +
      `and <a href="${rel}">the Droidex tracker itself — free, no account needed</a>.`,
    fr: (rel) => `Pour aller plus loin : les <a href="../rebirth-requirements/">exigences complètes des renaissances 1-35 sur les 5 cycles</a>, ` +
      `la <a href="../value-list/">liste des valeurs — revenus et coût de chaque variante</a>, ` +
      `et <a href="${rel}">le tracker Droidex lui-même — gratuit, sans compte obligatoire</a>.`,
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
<aside class="seo-see-also"><p>${SEE_ALSO[slug][lang](rel)}</p></aside>
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
    title: 'Droid Tycoon Value List — Income & Cost of Every Variant | Droidex',
    description: 'Income per second and cost of every Star Wars: Droid Tycoon droid at each variant: Basic, Gold, Diamond, Rainbow, Beskar, Galactic and Stellar.',
    h1: 'Droid Tycoon value list',
    intro: `<p class="seo-intro">This value list gives, for every ` +
      `droid in Star Wars: Droid Tycoon, both the income per second and the credit cost at each of the seven variants: ` +
      `Basic, Gold, Diamond, Rainbow, Beskar, Galactic and Stellar ` +
      `(the newest tier, added in the Stellar update of August 15, 2026). Every rarity has one table for income and one for cost, ` +
      `so you can see what a Diamond or Beskar copy of a droid actually costs before committing to it. Numbers ` +
      `are cross-checked against community sources (${DATE_ISO}) rather than a single guide, and ` +
      `Droidex's own cycle 1 rebirth requirements have been verified in-game through rebirth 23. Iconic droids have ` +
      `no variants: owning one simply adds a flat +15% income bonus alongside its unique perk. Remember that in ` +
      `Droidex's rebirth panel, a higher variant always satisfies a lower requirement — if a rebirth asks for a ` +
      `droid at Gold minimum, owning it at Diamond or better already counts, so this list also doubles as a quick ` +
      `reference for which variant is "enough".</p>`,
    jsonName: 'Droidex value list — Star Wars: Droid Tycoon',
    jsonDesc: 'Income per second and credit cost of every droid at each variant in Star Wars: Droid Tycoon.',
  },
  fr: {
    title: 'Droid Tycoon : liste des valeurs — revenus et coût de chaque variante | Droidex',
    description: 'Revenus/s et coût de chaque droïde de Droid Tycoon dans les sept variantes : Basic, Or, Diamant, Arc-en-ciel, Beskar, Galactique, Stellaire.',
    h1: 'Liste des valeurs de Droid Tycoon',
    intro: `<p class="seo-intro">Cette liste des valeurs donne, pour chaque droïde de Star Wars: Droid Tycoon, les ` +
      `revenus par seconde ET le coût en crédits dans chacune des sept variantes : Basic, Or, Diamant, Arc-en-ciel, ` +
      `Beskar, Galactique et Stellaire (le palier le plus récent, ajouté par la mise à jour Stellar du 15 août 2026). Chaque rareté ` +
      `a un tableau de revenus et un tableau de coûts, pour savoir ce que coûte vraiment un exemplaire Diamant ou ` +
      `Beskar avant de s'y engager. Les chiffres sont recoupés entre plusieurs sources communautaires (${DATE_ISO}) plutôt que tirés ` +
      `d'un guide unique, et les exigences de renaissance du cycle 1 de Droidex ont été vérifiées en jeu jusqu'à ` +
      `la renaissance 23. Les droïdes Iconiques n'ont pas de variantes : en posséder un ajoute simplement +15 % de ` +
      `revenus, en plus de son perk unique. Rappel : dans le panneau de renaissance de Droidex, une variante ` +
      `supérieure valide toujours une exigence inférieure — si une renaissance demande un droïde « Or minimum », ` +
      `le posséder en Diamant ou mieux suffit déjà ; cette liste sert donc aussi de référence rapide pour savoir ` +
      `quelle variante est « suffisante ».</p>`,
    jsonName: 'Liste des valeurs Droidex — Star Wars: Droid Tycoon',
    jsonDesc: 'Revenus par seconde et coût en crédits de chaque droïde dans chaque variante de Star Wars: Droid Tycoon.',
  },
};

function buildValueList(lang) {
  const L = STR[lang], T = VL_TEXT[lang];
  const TIERS_L = I18N[lang]._tiers;
  const RAR_L = I18N[lang]._rarities;

  const tierHeads = TIERS_L.map(t => `<th>${escapeHtml(t)}</th>`).join('');
  const wrap = (title, heads, rows) => `  <h2>◈ ${title}</h2>
  <div class="seo-table-wrap seo-table-rows">
    <table>
      <thead>
        <tr>${heads}</tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>`;

  const sections = RARITY_ORDER.map(rarity => {
    const droids = DROIDS.filter(d => d.r === rarity);
    const name = escapeHtml(RAR_L[rarity]);

    /* 1. revenus par variante (les Iconiques n'ont pas de variantes) */
    const incomeRows = droids.map(d => {
      const cells = d.iconic
        ? `<td colspan="${TIERS_L.length}">${L.iconicIncome}</td>`
        : d.inc.map(n => `<td>${n == null ? '—' : fmtInc(n) + '/s'}</td>`).join('');
      return `      <tr><td>${escapeHtml(d.n)}</td><td>${escapeHtml(d.t)}</td>${cells}` +
        `<td>${escapeHtml(d.perk || '—')}</td></tr>`;
    }).join('\n');
    const incomeTable = wrap(`${name} · ${L.tblIncome}`,
      `<th>${L.thDroid}</th><th>${L.thClass}</th>${tierHeads}<th>${L.thPerk}</th>`, incomeRows);

    /* 2. coût par variante — les Iconiques ne s'achètent pas au Sandcrawler,
          ils n'ont donc pas de tableau de coûts */
    const priced = droids.filter(d => !d.iconic && d.cost);
    if (!priced.length) return incomeTable;
    const costRows = priced.map(d =>
      `      <tr><td>${escapeHtml(d.n)}</td><td>${escapeHtml(d.t)}</td>` +
      d.cost.map(c => `<td>${c == null ? '—' : escapeHtml(c)}</td>`).join('') + '</tr>').join('\n');
    const costTable = wrap(`${name} · ${L.tblCost}`,
      `<th>${L.thDroid}</th><th>${L.thClass}</th>${tierHeads}`, costRows);

    return `${incomeTable}\n\n${costTable}`;
  }).join('\n\n');

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: T.jsonName,
    description: T.jsonDesc,
    url: `${SITE_URL}/${lang === 'fr' ? 'fr/' : ''}value-list/`,
    inLanguage: lang,
    license: 'https://github.com/n4ckz/droidex/blob/main/LICENSE',
    creator: CREATOR,
    dateModified: DATE_ISO,
    variableMeasured: ['income per second', 'cost per variant', 'perk'],
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
    title: 'Droid Tycoon Rebirth Requirements — All 35 Levels & Cycles 2-5 | Droidex',
    description: 'Required droids and credit cost for every Droid Tycoon rebirth level 1-35 — cycle 1 and the Super Rebirth cycles 2 to 5. The only list covering all five cycles.',
    h1: 'Droid Tycoon rebirth requirements',
    intro: `<p class="seo-intro">Star Wars: Droid Tycoon's progression runs through 35 rebirth levels, repeated ` +
      `across 5 cycles in an endless loop. Each level requires three specific droids placed in your base at a ` +
      `minimum variant, plus a credit cost that is identical across all 5 cycles for the same level, climbing from ` +
      `10K at rebirth 1 to 778T at rebirth 35. Rebirth 28, added with the Galactic update of mid-July 2026, is the ` +
      `first level to require a Galactic-tier droid in your base; the Stellar update of August 15, 2026 added ` +
      `rebirths 31-35, a fifth cycle, and the first Stellar-tier requirements from rebirth 31 onward. From rebirth 12 onward, meeting the requirements lets you trigger a ` +
      `Super Rebirth instead of a normal one: it keeps your Droidex, droidsmith level, cosmetics, unlocked Flawless ` +
      `droids, Nova crystals and Iconic unlocks, but resets your base, its droids, your currencies, rebirth rank, ` +
      `pickaxe level and blueprints, before advancing you straight into the next cycle. This page lists every ` +
      `cycle's requirements in full, cross-checked against community sources (${DATE_ISO}).</p>`,
    jsonName: 'Droidex rebirth requirements — Star Wars: Droid Tycoon',
    jsonDesc: 'Required droids, minimum variants and credit cost for all 35 rebirth levels across the 5 cycles in Star Wars: Droid Tycoon.',
  },
  fr: {
    title: 'Droid Tycoon : exigences de renaissance — les 35 niveaux et cycles 2-5 | Droidex',
    description: 'Droïdes requis et coût de chaque renaissance 1-35 de Droid Tycoon — cycle 1 et cycles 2 à 5 de Super-renaissance. La seule liste couvrant les cinq cycles.',
    h1: 'Exigences de renaissance de Droid Tycoon',
    intro: `<p class="seo-intro">La progression de Star Wars: Droid Tycoon passe par 35 niveaux de renaissance, ` +
      `répétés sur 5 cycles en boucle infinie. Chaque niveau exige trois droïdes précis placés dans votre base à ` +
      `une variante minimale, plus un coût en crédits identique d'un cycle à l'autre pour un même niveau, qui ` +
      `grimpe de 10K à la renaissance 1 jusqu'à 778T à la renaissance 35. La renaissance 28, ajoutée par la mise à ` +
      `jour Galactique de mi-juillet 2026, est le premier niveau à exiger un droïde de palier Galactique dans la ` +
      `base ; la mise à jour Stellar du 15 août 2026 a ajouté les renaissances 31 à 35, un cinquième cycle, et les ` +
      `premières exigences de palier Stellaire dès la renaissance 31. À partir de la renaissance 12, remplir les exigences permet de déclencher une Super-renaissance au ` +
      `lieu d'une renaissance normale : elle conserve le Droidex, le niveau de fabricant, les cosmétiques, les ` +
      `Flawless débloqués, les cristaux Nova et les déverrouillages d'Iconiques, mais réinitialise la base, ses ` +
      `droïdes, les devises, le rang de renaissance, le niveau de pioche et les blueprints, avant de passer ` +
      `directement au cycle suivant. Cette page liste l'intégralité des exigences de chaque cycle, recoupées ` +
      `entre sources communautaires (${DATE_ISO}).</p>`,
    jsonName: 'Exigences de renaissance Droidex — Star Wars: Droid Tycoon',
    jsonDesc: 'Droïdes requis, variantes minimales et coût en crédits des 35 niveaux de renaissance sur les 5 cycles de Star Wars: Droid Tycoon.',
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
    creator: CREATOR,
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
    description: 'Combien de joueurs sur Star Wars: Droid Tycoon en ce moment, pic CCU quotidien, parties, joueurs uniques et rétention — données Epic archivées chaque jour.',
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
    creator: CREATOR,
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
        'Droidex (the in-game collection log), and physically placed in your base. Most droids come in seven variants ' +
        '— Basic, Gold, Diamond, Rainbow, Beskar, Galactic and Stellar — so you tap through each variant independently as you obtain ' +
        'and place copies. A handful of Iconic droids have no variants; instead they get two separate toggles, one ' +
        'for ownership and one for being placed in your base.',
      fr: 'Chaque variante de droïde passe par trois états d\'un simple tap : jamais possédée, possédée dans le ' +
        'Droidex (le registre de collection du jeu), et physiquement placée dans la base. La plupart des droïdes ' +
        'existent en sept variantes — Basic, Or, Diamant, Arc-en-ciel, Beskar, Galactique et Stellaire — que l\'on coche ' +
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
      en: 'Each rebirth level, from 1 to 35, requires three specific droids placed in your base at a minimum variant, ' +
        'plus a credit cost that climbs from 10K at rebirth 1 up to 778T at rebirth 35. The 35 levels repeat across 5 ' +
        'cycles in a loop, and each cycle can ask for a different trio of droids at the same level even though the ' +
        'credit cost stays identical across cycles. Certain rebirth levels also unlock a new slot for your base, ' +
        'such as an extra Worker or Astromech slot.',
      fr: 'Chaque niveau de renaissance, de 1 à 35, exige trois droïdes précis placés dans la base à une variante ' +
        'minimale, plus un coût en crédits qui grimpe de 10K (renaissance 1) à 778T (renaissance 35). Les 35 niveaux ' +
        'se répètent sur 5 cycles en boucle, et chaque cycle peut demander un trio de droïdes différent au même ' +
        'niveau, le coût en crédits restant identique d\'un cycle à l\'autre. Certains niveaux débloquent aussi un ' +
        'nouvel emplacement de base, par exemple un slot Worker ou Astromech supplémentaire.',
    },
  },
  {
    q: { en: 'What is the Galactic variant and how does it work?', fr: 'Qu\'est-ce que la variante Galactique et comment fonctionne-t-elle ?' },
    a: {
      en: 'Galactic is the sixth variant tier, added above Beskar in the mid-July 2026 game update (the Stellar ' +
        'tier sits above it since the August 15, 2026 update). Since the Stellar update the in-game Droidex counts ' +
        'all seven variants in one unified total of 442, and Droidex mirrors that. ' +
        'Rebirth 28 — the first Galactic-gated level in each ' +
        'cycle — requires one specific Galactic droid placed in your base (for example a Galactic ' +
        'Proto-Roller in cycle 1) alongside a Rainbow droid, a Beskar droid and 45T credits. Like every higher ' +
        'variant, a Galactic copy also satisfies any lower requirement for the same droid. Galactic income values ' +
        'are now documented for all 62 standard droids, and community sources report Galactic droids appearing ' +
        'in-game on an hourly spawn timer; Droidex tracks each Galactic copy with the same tap-through states (owned, in base) and ' +
        'shows RB·GLC requirement badges so you know exactly which Galactic droids your next rebirth needs.',
      fr: 'Le Galactique est le sixième palier de variante, ajouté au-dessus du Beskar par la mise à jour de ' +
        'mi-juillet 2026 (le palier Stellaire le surplombe depuis la mise à jour du 15 août 2026). Depuis la mise à ' +
        'jour Stellar, l\'écran Droidex du jeu compte les sept variantes dans un total unifié de 442, et Droidex ' +
        'fait de même. La renaissance 28 — le premier niveau de chaque cycle à exiger du Galactique — exige un ' +
        'droïde Galactique précis placé dans la base (par exemple un Proto-Roller Galactique au cycle 1), aux ' +
        'côtés d\'un droïde Arc-en-ciel, d\'un Beskar et de 45T de crédits. Comme toute variante supérieure, une ' +
        'copie Galactique valide aussi les exigences inférieures du même droïde. Les revenus Galactiques sont ' +
        'désormais documentés pour les 62 droïdes standard, et la communauté rapporte des apparitions en jeu sur ' +
        'un cycle horaire ; Droidex suit chaque ' +
        'copie Galactique avec les mêmes états au tap (possédé, en base) et affiche des badges RB·GLC pour savoir ' +
        'exactement quels droïdes Galactiques votre prochaine renaissance demande.',
    },
  },
  {
    q: { en: 'What is the Stellar variant and how do I get Stellar droids?', fr: 'Qu\'est-ce que la variante Stellaire et comment obtenir des droïdes Stellaires ?' },
    a: {
      en: 'Stellar is the newest and seventh variant tier, added above Galactic in the Stellar update of August 15, ' +
        '2026 (game patch v1.26). Stellar droids spawn at the Sandcrawler on their own timer and are recorded in ' +
        'the in-game Droidex; dedicated Stellar Astromech missions costing 6T credits and the Stellar Surge from ' +
        'the Cantina Shop are further sources. The same update added rebirth levels 31 to 35 and a fifth rebirth ' +
        'cycle: rebirth 31 is the first level to require Stellar-tier droids in your base, with credit costs ' +
        'climbing from 150T at rebirth 31 to 778T at rebirth 35. The in-game Droidex counts Stellar copies in its ' +
        'unified 442-variant total, and Droidex does the same, with RB·STL ' +
        'requirement badges; a Stellar copy satisfies any lower variant requirement for the same droid. ' +
        'Stellar income values are documented for about half the standard droids so far and are completed at ' +
        'every data refresh.',
      fr: 'Le Stellaire est le septième et plus récent palier de variante, ajouté au-dessus du Galactique par la ' +
        'mise à jour Stellar du 15 août 2026 (patch v1.26). Les droïdes Stellaires apparaissent au Sandcrawler ' +
        'sur leur propre timer et s\'enregistrent dans le Droidex du jeu ; les missions Astromech Stellaires ' +
        'dédiées à 6T de crédits et le Stellar Surge du Cantina Shop sont d\'autres sources. La même mise à jour ' +
        'a ajouté les niveaux de renaissance 31 à 35 et un cinquième cycle : la renaissance 31 est le premier ' +
        'niveau à exiger des droïdes Stellaires dans la base, avec des coûts qui grimpent de 150T (renaissance 31) ' +
        'à 778T (renaissance 35). L\'écran Droidex du jeu compte les copies Stellaires dans son total unifié de ' +
        '442 variantes, et Droidex fait de même, avec des badges d\'exigence RB·STL ; une ' +
        'copie Stellaire valide toute exigence de variante inférieure du même droïde. Les revenus Stellaires sont ' +
        'documentés pour environ la moitié des droïdes standard et se complètent à chaque rafraîchissement des ' +
        'données.',
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
      en: 'Flawless is a shiny cosmetic paint rolled once, at the moment a droid finishes crafting, and kept forever ' +
        'in your Droidex. The odds depend only on the variant you crafted, never on the droid\'s rarity — a Mythic ' +
        'droid is no more likely to roll Flawless than a Common one at the same variant. Base odds are 1 in 1000 for ' +
        'Basic, 1 in 500 for Gold, 1 in 250 for Diamond, 1 in 125 for Rainbow, 1 in 100 for Beskar and 1 in 75 for ' +
        'Galactic. Two multipliers stack on top: the Flawless Charm from the Nova Shop (500 Nova crystals) doubles ' +
        'your chance, and events double it as well — running both during an event is the fastest way to fill the ' +
        'Flawless column. Each unique Flawless droid also grants a small permanent income multiplier, with a further ' +
        'reward once 51 unique Flawless droids are collected. Iconic droids cannot roll Flawless, since they are ' +
        'never crafted. Droidex lets you mark each droid\'s Flawless status with a ✦ toggle so you can track which ' +
        'ones you have already unlocked without relying on memory.',
      fr: 'Le Flawless est une peinture cosmétique brillante, tirée une seule fois au moment où le craft d\'un ' +
        'droïde se termine, et conservée à vie dans le Droidex. Les chances dépendent uniquement de la variante ' +
        'craftée, jamais de la rareté du droïde : à variante égale, un Mythique n\'a pas plus de chances qu\'un ' +
        'Commun. Les taux de base sont de 1 sur 1000 en Basic, 1 sur 500 en Or, 1 sur 250 en Diamant, 1 sur 125 en ' +
        'Arc-en-ciel, 1 sur 100 en Beskar et 1 sur 75 en Galactique. Deux multiplicateurs se cumulent par-dessus : ' +
        'le Flawless Charm de la boutique Nova (500 cristaux) double les chances, et les événements les doublent ' +
        'aussi — cumuler les deux pendant un événement est le moyen le plus rapide de remplir la colonne Flawless. ' +
        'Chaque droïde Flawless unique apporte en plus un petit multiplicateur de revenus permanent, avec une ' +
        'récompense supplémentaire une fois 51 Flawless uniques collectés. Les droïdes Iconiques ne peuvent pas ' +
        'être Flawless, puisqu\'ils ne se craftent pas. Droidex propose un interrupteur ✦ par droïde pour marquer ' +
        'ceux déjà débloqués sans compter sur sa mémoire.',
    },
  },
  {
    q: { en: 'How do I get Galactic droids?', fr: 'Comment obtenir des droïdes Galactiques ?' },
    a: {
      en: 'Galactic droids have several sources, all added over the July 2026 updates. A Galactic timer above the ' +
        'Sandcrawler spawns Galactic blueprints on its own cycle, the same way the Beskar timer does. Galactic ' +
        'blueprints can also be earned from Fishing, which is how the tier was first introduced. Since the Cantina ' +
        'Shop update, Astromech Missions include dedicated Galactic missions that reward credits, Beskar droids and ' +
        'Galactic droids, making them the most reliable source once you can afford them. Finally, a Rainbow or ' +
        'Beskar droid can be upgraded with Upgrade Chips, and the cost of higher-tier upgrades was significantly ' +
        'reduced in that same update. Droidex tracks every Galactic copy separately, ' +
        'so you can see at a glance which ones your next rebirth still needs.',
      fr: 'Les droïdes Galactiques ont plusieurs sources, toutes ajoutées au fil des mises à jour de juillet 2026. ' +
        'Un timer Galactique au-dessus du Sandcrawler fait apparaître des blueprints Galactiques sur son propre ' +
        'cycle, comme le fait le timer Beskar. Les blueprints Galactiques s\'obtiennent aussi à la pêche, qui a été ' +
        'le mode d\'obtention d\'origine du palier. Depuis la mise à jour du Cantina Shop, les missions Astromech ' +
        'comportent des missions Galactiques dédiées qui récompensent des crédits, des droïdes Beskar et des ' +
        'droïdes Galactiques — la source la plus fiable une fois qu\'on peut se les offrir. Enfin, un droïde ' +
        'Arc-en-ciel ou Beskar peut être amélioré avec des Upgrade Chips, dont le coût aux paliers supérieurs a été ' +
        'fortement réduit dans cette même mise à jour. Droidex suit chaque copie Galactique à part, ' +
        'pour voir d\'un coup d\'œil ceux qui manquent à la prochaine renaissance.',
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
    title: 'Droid Tycoon FAQ — Flawless Odds, Galactic Droids & Super Rebirth | Droidex',
    description: 'Droid Tycoon FAQ: Flawless odds by variant (1/1000 to 1/75), how to get Galactic and Stellar droids, what a Super Rebirth keeps, and the collection bonus.',
    h1: 'Droid Tycoon FAQ',
    intro: `<p class="seo-intro">Answers about how Droidex tracks your Star Wars: Droid Tycoon collection, how ` +
      `rebirth requirements and Super Rebirths work, and what Flawless and the collection bonus mean in the game.</p>`,
  },
  fr: {
    title: 'FAQ Droid Tycoon — chances de Flawless, droïdes Galactiques, Super-renaissance | Droidex',
    description: 'FAQ Droid Tycoon : chances de Flawless par variante (1/1000 à 1/75), obtenir les droïdes Galactiques et Stellaires, ce que garde la Super-renaissance.',
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
    author: CREATOR,
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
