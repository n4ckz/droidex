/* Tests d'acceptation DOM du tracker Droidex (jsdom) */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..', 'site');
const html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const bundle = ['i18n.js', 'data.js', 'app.js']
  .map(f => fs.readFileSync(path.join(SITE, f), 'utf8')).join('\n;\n');

let failures = 0;
function assert(cond, msg) {
  if (cond) console.log('  ✓ ' + msg);
  else { failures++; console.log('  ✗ ÉCHEC : ' + msg); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

function boot(localStorageSeed, lang) {
  const errors = [];
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' });
  const { window } = dom;
  window.confirm = () => true;
  if (localStorageSeed) window.localStorage.setItem('droidex-tracker-v1', localStorageSeed);
  if (lang) window.localStorage.setItem('droidex-lang', lang);
  try {
    // les <script> classiques partagent la portée lexicale globale ; on simule en concaténant
    window.eval(bundle +
      '\n;window.__test = { getState: () => state, applyParsedState, persistState, renderAll, setLang };');
  } catch (e) {
    errors.push(e.stack || e.message);
  }
  return { window, errors };
}
const findCard = (w, name) =>
  [...w.document.querySelectorAll('.droid')].find(c => c.querySelector('.droid-name').textContent === name);
const setTarget = (w, rb) => {
  const sel = w.document.getElementById('rbSelect');
  sel.value = String(rb);
  sel.dispatchEvent(new w.Event('change', { bubbles: true }));
};

(async () => {
  /* ---- 1. Démarrage vierge ---- */
  console.log('\n[1] Démarrage vierge');
  {
    const { window: w, errors } = boot();
    assert(errors.length === 0, 'aucune erreur JS au chargement' + (errors.length ? ' — ' + errors[0] : ''));
    const cards = w.document.querySelectorAll('.droid');
    assert(cards.length === 68, '68 droïdes rendus (obtenu : ' + cards.length + ')');
    assert(w.document.getElementById('rbSelect').value === '1', 'renaissance par défaut = 1');
    const label = w.document.getElementById('progressLabel').textContent;
    assert(label === '0 / 320 variants', 'progression "0 / 320 variants" (obtenu : "' + label + '")');
  }

  /* ---- 2. Persistance localStorage ---- */
  console.log('\n[2] Persistance localStorage (critère 2)');
  let savedJson;
  {
    const { window: w } = boot();
    findCard(w, 'Strike-Orb').querySelector('.tier[data-t="2"]').click();      // 0 → 1 possédé
    findCard(w, 'Strike-Orb').querySelector('.tier[data-t="2"]').click();      // 1 → 2 en base
    await sleep(600);  // debounce de sauvegarde (400 ms)
    savedJson = w.localStorage.getItem('droidex-tracker-v1');
    const parsed = JSON.parse(savedJson);
    assert(parsed && parsed.owned.strikeorb && parsed.owned.strikeorb[2] === 2,
      'localStorage : strikeorb Diamant = 2 (en base)');
    assert(w.document.getElementById('saveState').textContent === 'Registry saved',
      'message "Registry saved" affiché');
  }
  {
    // "rechargement" : nouveau DOM, même localStorage
    const { window: w } = boot(savedJson);
    const dia = findCard(w, 'Strike-Orb').querySelector('.tier[data-t="2"]');
    assert(dia.classList.contains('on') && dia.classList.contains('base'),
      'après rechargement : Strike-Orb Diamant restauré en base');
  }

  /* ---- 3. Export / import (critère 3) ---- */
  console.log('\n[3] Export / import JSON');
  {
    // l'export sérialise `state` ; on simule l'import du même contenu dans un navigateur vierge
    const { window: w } = boot();
    // importStateFile utilise FileReader ; on teste la voie applyParsedState + persist via eval
    const t = w.__test;
    const ok = t.applyParsedState(JSON.parse(savedJson));
    t.persistState(); t.renderAll();
    assert(ok, 'import du JSON exporté sans erreur');
    const dia = findCard(w, 'Strike-Orb').querySelector('.tier[data-t="2"]');
    assert(dia.classList.contains('base'), 'état restauré à l\'identique après import');
    assert(w.localStorage.getItem('droidex-tracker-v1') === JSON.stringify(JSON.parse(savedJson)),
      'localStorage réécrit après import');
  }

  /* ---- 4. Scénario badges (critère 4) : Strike-Orb reqs [[10,1]] ---- */
  console.log('\n[4] Badges de renaissance (critère 4)');
  {
    const { window: w } = boot(savedJson);   // Strike-Orb Diamant en base, cible 9
    setTarget(w, 10);
    let badge = findCard(w, 'Strike-Orb').querySelector('.req-badge');
    assert(badge.textContent === '✓ RB10 · Gold', 'cible 10 : badge "✓ RB10 · Gold" (obtenu : "' + badge.textContent + '")');
    assert(badge.classList.contains('ready') && !badge.classList.contains('done'),
      'cible 10 : badge vert (ready), non barré');
    // panneau : Strike-Orb doit apparaître ✓ en base
    const req = [...w.document.querySelectorAll('.rb-req')].find(r => r.textContent.includes('Strike-Orb'));
    assert(req && req.classList.contains('met') && req.querySelector('.status').textContent === '✓',
      'panneau RB10 : Strike-Orb "✓ … en base"');

    setTarget(w, 11);
    badge = findCard(w, 'Strike-Orb').querySelector('.req-badge');
    assert(badge.classList.contains('done'), 'cible 11 : badge barré (done)');
    assert(!findCard(w, 'Strike-Orb').querySelector('.keep-tag'), 'cible 11 : plus de tag "À garder"');
  }

  /* ---- 5. Variante supérieure valide l'exigence inférieure + états ⚠/✗ ---- */
  console.log('\n[5] Règle variante supérieure + états du panneau');
  {
    const seed = JSON.stringify({ owned: { r6: [0, 0, 1, 0, 0] }, inBase: {}, targetRB: 9 }); // R6 Diamant possédé (pas en base), req [[9,1]]
    const { window: w } = boot(seed);
    const badge = findCard(w, 'R6').querySelector('.req-badge');
    assert(badge.textContent === '⚠ RB9 · Gold' && badge.classList.contains('warn'),
      'R6 Diamant possédé : "⚠ RB9 · Gold" (Diamond valide Gold, pas en base)');
    const req = [...w.document.querySelectorAll('.rb-req')].find(r => r.textContent.includes('R6'));
    assert(req.querySelector('.status').textContent === '⚠', 'panneau : R6 en ⚠ (possédé, pas en base)');
    const reqTrak = [...w.document.querySelectorAll('.rb-req')].find(r => r.textContent.includes('TRAK-R'));
    assert(reqTrak.querySelector('.status').textContent === '✗', 'panneau : TRAK-R en ✗ (pas possédé)');
  }

  /* ---- 6. Migration ancien format (booléens + inBase global) ---- */
  console.log('\n[6] Migration ancien format');
  {
    const seed = JSON.stringify({ owned: { r6: [true, true, false, false, false], bb8: true }, inBase: { r6: true, bb8: true }, targetRB: 9 });
    const { window: w } = boot(seed);
    const s = JSON.parse(JSON.stringify(w.__test.getState()));
    assert(JSON.stringify(s.owned.r6) === '[1,2,0,0,0]', 'r6 [true,true,…] + inBase → [1,2,0,0,0] (obtenu : ' + JSON.stringify(s.owned.r6) + ')');
    assert(s.inBase.r6 === undefined, 'inBase.r6 supprimé après promotion');
    assert(s.owned.bb8 === true && s.inBase.bb8 === true, 'iconique bb8 inchangé (owned + inBase conservés)');
  }

  /* ---- 7. Iconiques ---- */
  console.log('\n[7] Iconiques');
  {
    const { window: w } = boot();
    findCard(w, 'BB-8').querySelector('.iconic-own').click();
    let card = findCard(w, 'BB-8');
    assert(card.querySelector('.iconic-own').classList.contains('on'), 'toggle possédé OK');
    card.querySelector('.base-toggle').click();
    card = findCard(w, 'BB-8');
    assert(card.querySelector('.base-toggle').classList.contains('on'), 'toggle en base OK');
    const label = w.document.getElementById('progressLabel').textContent;
    assert(label === '1 / 320 variants', 'progression 1 / 320 (obtenu : "' + label + '")');
  }

  /* ---- 8. Filtres et recherche ---- */
  console.log('\n[8] Filtres et recherche');
  {
    const { window: w } = boot(savedJson);
    const search = w.document.getElementById('search');
    search.value = 'strike';
    search.dispatchEvent(new w.Event('input', { bubbles: true }));
    assert(w.document.querySelectorAll('.droid').length === 1, 'recherche "strike" → 1 résultat');
    search.value = '';
    search.dispatchEvent(new w.Event('input', { bubbles: true }));
    [...w.document.querySelectorAll('.chip')].find(c => c.dataset.filter === 'base').click();
    const cards = [...w.document.querySelectorAll('.droid')];
    assert(cards.length === 1 && cards[0].querySelector('.droid-name').textContent === 'Strike-Orb',
      'filtre "En base" → uniquement Strike-Orb');
  }

  /* ---- 9. Réinitialisation ---- */
  console.log('\n[9] Réinitialisation');
  {
    const { window: w } = boot(savedJson);
    w.document.getElementById('resetBtn').click();
    const parsed = JSON.parse(w.localStorage.getItem('droidex-tracker-v1'));
    assert(Object.keys(parsed.owned).length === 0 && parsed.targetRB === 1, 'reset : état vide persisté immédiatement');
  }

  /* ---- 10. i18n : anglais par défaut, bascule en français ---- */
  console.log('\n[10] i18n');
  {
    const { window: w } = boot(savedJson);
    assert(w.document.documentElement.lang === 'en', 'langue par défaut : en');
    assert(w.document.querySelector('h1').textContent === "Droidex — Droidsmith's Registry", 'titre anglais par défaut');
    w.__test.setLang('fr');
    assert(w.document.documentElement.lang === 'fr', 'bascule : lang=fr');
    assert(w.document.querySelector('h1').textContent === 'Droidex — Registre du droïdesmith', 'titre français après bascule');
    w.__test.getState().targetRB = 10; w.__test.renderAll();
    const badge = findCard(w, 'Strike-Orb').querySelector('.req-badge');
    assert(badge.textContent === '✓ RB10 · Or', 'badge en français : "✓ RB10 · Or" (obtenu : "' + badge.textContent + '")');
    assert(w.localStorage.getItem('droidex-lang') === 'fr', 'choix de langue persisté');
    // nouveau chargement : le français est conservé
    const w2 = boot(savedJson).window;
    w2.localStorage.setItem('droidex-lang', 'fr');
    const { window: w3 } = boot(savedJson, 'fr');
    assert(w3.document.documentElement.lang === 'fr', 'langue restaurée au rechargement');
  }

  console.log('\n' + (failures ? '❌ ' + failures + ' échec(s)' : '✅ Tous les tests passent'));
  process.exit(failures ? 1 : 0);
})();
