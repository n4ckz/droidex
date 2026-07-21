/* Génère les captures d'écran du README (docs/) avec un registre réaliste.
   Prérequis : npm i -D playwright && npx playwright install chromium
   (ou NODE_PATH pointant vers un node_modules qui contient playwright)
   Usage : node screenshots.js [url]   — défaut : http://localhost:8080 */
const { chromium } = require('playwright');
const path = require('path');

const URL = process.argv[2] || 'http://localhost:8080';
const OUT = path.join(__dirname, '..', 'docs');

/* Registre "milieu de partie" : cible RB10, badges dans tous les états.
   Panneau RB10 : Strike-Orb ✓ (Diamant en base), Haul-R ⚠ (Arc-en-ciel possédé
   pas en base), LO ✗ (Arc-en-ciel manquant). */
const STATE = {
  targetRB: 10,
  inBase: { bb8: true },
  owned: {
    mouse:[2,1,0,0,0], pit:[1,2,0,0,0], gonk:[1,1,0,0,0], cb:[1,0,0,0,0],
    cb23:[1,0,0,0,0], r3:[1,1,2,0,0], r5:[0,1,0,0,0], r8:[1,0,0,0,0],
    improbe:[1,1,0,0,0], b1battle:[2,0,0,0,0], drk1:[1,1,0,0,0],
    bdx:[1,1,0,0,0], arg:[1,2,0,0,0], senate:[1,0,0,0,0], bu4d:[1,1,2,0,0],
    balcore:[1,0,0,0,0], '2bb':[1,1,0,0,0], alt:[1,0,2,0,0], r4:[1,0,0,0,0],
    r9:[1,1,2,0,0], b1sec:[1,1,0,0,0], vectarm:[1,0,0,0,0], hovr:[1,1,2,0,0],
    groundmech:[1,1,0,0,0], lo:[1,1,0,0,0], amp:[1,0,0,1,0], sentri:[1,0,0,0,0],
    gunrunner:[1,1,0,0,0], bb:[1,1,0,0,0,2], r2:[1,1,1,0,0], r6:[1,2,0,0,0,1],
    trakr:[1,1,0,0,0], orbwalker:[1,0,0,0,0], utiltec:[1,1,0,0,0],
    b2super:[1,0,0,0,0], b2heavy:[0,1,0,0,0], strikeorb:[0,0,2,0,0],
    haulr:[0,0,0,1,0], lngshot:[1,0,0,0,0], protoroller:[1,1,0,0,0,1],
    mechadroid:[1,0,0,0,0], bb9:[1,1,0,0,0], r7:[1,0,0,0,0], cyclograv:[1,0,0,0,0],
    snowmouse:[1,0,0,0,0], ric:[1,1,0,0,0], lep:[1,0,0,0,0], motrak:[1,0,0,0,0],
    cyclens:[1,1,0,0,0], kx:[1,0,0,0,0], ig:[1,1,1,0,0],
    bb8: true, r2d2: true, misterbones: true
  }
};

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  await context.addInitScript(state => {
    localStorage.setItem('droidex-tracker-v1', JSON.stringify(state));
    localStorage.setItem('droidex-lang', 'en');
  }, STATE);

  const page = await context.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('.droid');
  await page.waitForTimeout(600); // polices + transitions

  // 1. Panneau de renaissance (haut de page)
  await page.screenshot({ path: path.join(OUT, 'screenshot-rebirth.png') });
  console.log('docs/screenshot-rebirth.png');

  // 2. Vue principale : autour de Strike-Orb (badge ✓ vert, ⚠, Keep, pips variés)
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.droid')];
    const target = cards.find(c => c.querySelector('.droid-name').textContent === 'B2 Super');
    target.scrollIntoView();
    window.scrollBy(0, -70); // dégage la barre de recherche sticky
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'screenshot-main.png') });
  console.log('docs/screenshot-main.png');

  await browser.close();
})();
