#!/usr/bin/env node
/* Vérification du site dans un VRAI navigateur (Playwright) — complète les
   tests jsdom en pilotant l'app comme un utilisateur : compteurs, cartes
   fusion, D-O, interaction tap, captures d'écran.

   Usage :  node tests/verify-site.js [url] [dossier-captures]
   Défauts : https://droidex.nackz.dev et tests/verify-out/
   Local   : node tests/verify-site.js http://localhost:8080

   Les assertions sont STRUCTURELLES (dérivées du DOM), pas des totaux en
   dur : le script survit aux patchs du jeu qui ajoutent des droïdes.

   Prérequis (non listés dans package.json pour garder `npm install` léger,
   même convention que screenshots.js) :
     cd tests && npm install --no-save playwright \
       && npx playwright install chromium-headless-shell
*/
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const URL_BASE = (process.argv[2] || 'https://droidex.nackz.dev').replace(/\/$/, '');
const OUT = process.argv[3] || path.join(__dirname, 'verify-out');

let failures = 0;
function check(cond, label, detail) {
  console.log((cond ? '  ✓ ' : '  ✗ ÉCHEC : ') + label + (detail ? ' — ' + detail : ''));
  if (!cond) failures++;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: 'en-US',
  });

  console.log('Vérification de ' + URL_BASE);
  await page.goto(URL_BASE + '/', { waitUntil: 'networkidle' });

  /* version servie */
  const versionJs = await (await page.request.get(URL_BASE + '/version.js')).text();
  const version = (versionJs.match(/APP_VERSION = '([^']+)'/) || [])[1];
  console.log('  version servie : ' + (version || 'INTROUVABLE'));
  check(!!version, 'version.js expose APP_VERSION');

  /* cohérence structurelle des compteurs : total = 7×standard + iconiques */
  const cards = page.locator('.droid');
  const nCards = await cards.count();
  const nIconic = await page.locator('.droid .iconic-own').count();
  const nStandard = nCards - nIconic;
  const progress = (await page.locator('#progressLabel').textContent()).trim();
  const total = parseInt(progress.split('/')[1], 10);
  console.log(`  cartes : ${nCards} (${nStandard} standard + ${nIconic} iconiques) · compteur ${progress}`);
  check(nCards > 0, 'des cartes de droïdes sont rendues');
  check(total === 7 * nStandard + nIconic, 'compteur principal = 7×standard + iconiques',
    `${total} vs ${7 * nStandard + nIconic}`);

  /* compteur flawless = nb de droïdes standard */
  const flawless = (await page.locator('#flawlessCount').textContent()).trim();
  check(flawless.includes('/' + nStandard), 'compteur Flawless sur les ' + nStandard + ' standard', flawless);

  /* cartes fusion : recette « ⚗ A + B + C » sur chacune */
  const fusionLines = await page.locator('.fusion-line').allTextContents();
  const recetteOk = fusionLines.every(t => /^⚗ .+ \+ .+ \+ .+$/.test(t.trim()));
  console.log('  droïdes fusion : ' + fusionLines.length);
  check(fusionLines.length > 0 && recetteOk, 'chaque carte fusion porte une recette à 3 droïdes',
    fusionLines[0]);

  /* interaction réelle : un tap sur la 1ʳᵉ variante du 1ᵉʳ droïde fusion */
  const firstFusion = page.locator('.droid', { has: page.locator('.fusion-line') }).first();
  await firstFusion.scrollIntoViewIfNeeded();
  const before = parseInt(progress, 10);
  await firstFusion.locator('.tier[data-t="0"]').click();
  const after = parseInt((await page.locator('#progressLabel').textContent()).trim(), 10);
  check(after === before + 1, 'un tap incrémente le compteur unifié', before + ' → ' + after);
  await firstFusion.screenshot({ path: path.join(OUT, 'fusion-card.png') });

  /* D-O : carte iconique (toggle possédé, pas de pastilles) */
  const doCard = page.locator('.droid', { has: page.locator('.droid-name', { hasText: /^D-O$/ }) });
  const doThere = await doCard.count();
  check(doThere === 1 && await doCard.locator('.iconic-own').count() === 1
    && await doCard.locator('.tier').count() === 0, 'D-O rendu en carte Iconique');
  if (doThere) {
    await doCard.scrollIntoViewIfNeeded();
    await doCard.screenshot({ path: path.join(OUT, 'do-card.png') });
  }

  /* vue d'ensemble */
  await page.locator('header').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(OUT, 'overview.png') });

  await browser.close();
  console.log(failures
    ? '\n❌ ' + failures + ' échec(s) — captures dans ' + OUT
    : '\n✅ Site vérifié en réel — captures dans ' + OUT);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error('✗ ERREUR : ' + e.message); process.exit(1); });
