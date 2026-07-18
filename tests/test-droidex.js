/* Tests d'acceptation DOM du tracker Droidex (jsdom) */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..', 'site');
const html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const bundle = ['version.js', 'i18n.js', 'data.js', 'app.js']
  .map(f => fs.readFileSync(path.join(SITE, f), 'utf8')).join('\n;\n');

let failures = 0;
function assert(cond, msg) {
  if (cond) console.log('  ✓ ' + msg);
  else { failures++; console.log('  ✗ ÉCHEC : ' + msg); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

function boot(localStorageSeed, lang, navLang) {
  const errors = [];
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' });
  const { window } = dom;
  window.confirm = () => true;
  if (navLang) Object.defineProperty(window.navigator, 'language', { get: () => navLang });
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
    assert(cards.length === 69, '69 droïdes rendus (obtenu : ' + cards.length + ')');
    assert(w.document.getElementById('rbSelect').value === '1', 'renaissance par défaut = 1');
    const label = w.document.getElementById('progressLabel').textContent;
    assert(label === '000/317', 'progression "000/317" (obtenu : "' + label + '")');
    const segs = w.document.getElementById('progressSegs');
    assert(segs && segs.children.length === 10, '10 segments de progression rendus');
    assert([...segs.children].every(s => !s.classList.contains('on')), 'aucun segment allumé à vide');
    // badge "prêt" : état vierge, cible RB1 → 0 / 3
    const badge = w.document.getElementById('readyBadge');
    assert(badge && badge.textContent === '0 / 3 ready', 'badge prêt "0 / 3 ready" (obtenu : "' + (badge && badge.textContent) + '")');
    assert(!badge.classList.contains('all'), 'badge prêt non-pulsant à vide');
    assert(!w.document.getElementById('exportBtn').closest('[hidden]'), 'export accessible même sans sync (barre non cachée)');
    assert(w.document.getElementById('loginBtn').hidden === true, 'bouton login caché par défaut (géré par sync.js)');
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
    assert(w.document.getElementById('saveState').textContent === 'Saved ● local',
      'message "Saved ● local" affiché');
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
    assert(badge.textContent === '✓ RB10·GLD', 'cible 10 : badge "✓ RB10·GLD" (obtenu : "' + badge.textContent + '")');
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
    assert(badge.textContent === '⚠ RB9·GLD' && badge.classList.contains('warn'),
      'R6 Diamant possédé : "⚠ RB9·GLD" (Diamond valide Gold, pas en base)');
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
    assert(label === '001/317', 'progression 001/317 (obtenu : "' + label + '")');
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
    assert(badge.textContent === '✓ RB10·GLD', 'badge en français : "✓ RB10·GLD" (obtenu : "' + badge.textContent + '")');
    assert(w.localStorage.getItem('droidex-lang') === 'fr', 'choix de langue persisté');
    // nouveau chargement : le français est conservé
    const w2 = boot(savedJson).window;
    w2.localStorage.setItem('droidex-lang', 'fr');
    const { window: w3 } = boot(savedJson, 'fr');
    assert(w3.document.documentElement.lang === 'fr', 'langue restaurée au rechargement');
    // détection navigateur à la première visite (aucun choix enregistré)
    const { window: w4 } = boot(null, null, 'fr-FR');
    assert(w4.document.documentElement.lang === 'fr', 'navigateur fr-FR sans choix → français présélectionné');
    const { window: w5 } = boot(null, null, 'de-DE');
    assert(w5.document.documentElement.lang === 'en', 'navigateur de-DE sans choix → anglais');
    // le choix explicite prime sur la détection
    const { window: w6 } = boot(null, 'en', 'fr-FR');
    assert(w6.document.documentElement.lang === 'en', 'choix enregistré "en" prime sur navigateur fr-FR');
  }

  /* ---- 11. Cycles de renaissance et données étendues ---- */
  console.log('\n[11] Cycles et RB 24-27');
  {
    const { window: w } = boot(savedJson);
    assert(w.document.getElementById('rbSelect').options.length === 27, 'sélecteur RB : 27 niveaux');
    assert(w.document.getElementById('cycleSelect').options.length === 4, 'sélecteur cycle : 4 cycles');
    // RB24 cycle 1 : BESKAR BB9, BESKAR CYCLO-GRAV, BASE MO-TRAK · 9T
    const sel = w.document.getElementById('rbSelect');
    sel.value = '24'; sel.dispatchEvent(new w.Event('change', { bubbles: true }));
    const reqNames = [...w.document.querySelectorAll('.rb-req')].map(r => r.textContent);
    assert(reqNames.some(x => x.includes('MO-TRAK')), 'panneau RB24 : MO-TRAK requis');
    assert(w.document.getElementById('rbCreditsBig').textContent.includes('9T'), 'crédits RB24 : 9T');
    // bascule cycle 2 : RB1 = ID10, Mouse, Gonk
    sel.value = '1'; sel.dispatchEvent(new w.Event('change', { bubbles: true }));
    const cyc = w.document.getElementById('cycleSelect');
    cyc.value = '2'; cyc.dispatchEvent(new w.Event('change', { bubbles: true }));
    const names2 = [...w.document.querySelectorAll('.rb-req')].map(r => r.textContent).join(' ');
    assert(names2.includes('ID10') && names2.includes('Gonk'), 'cycle 2 RB1 : exigences différentes (ID10, Gonk)');
    await sleep(600);
    assert(JSON.parse(w.localStorage.getItem('droidex-tracker-v1')).targetCycle === 2, 'targetCycle persisté');
  }

  /* ---- 12. Migration CB-23 -> Iconique ---- */
  console.log('\n[12] Migration CB-23');
  {
    const seed = JSON.stringify({ owned: { cb23: [1, 0, 2, 0, 0] }, inBase: {}, targetRB: 1 });
    const { window: w } = boot(seed);
    const st = w.__test.getState();
    assert(st.owned.cb23 === true, 'cb23 variantes -> possédé (true)');
    assert(st.inBase.cb23 === true, 'cb23 variante en base -> inBase true');
    const card = findCard(w, 'CB-23');
    assert(card.querySelector('.iconic-own').classList.contains('on'), 'carte CB-23 : iconique possédé');
  }

  /* ---- 13. Flawless ✨ et wishlist ★ ---- */
  console.log('\n[13] Flawless et wishlist');
  {
    const { window: w } = boot();
    findCard(w, 'R6').querySelector('.icon-btn:not(.flaw)').click();     // wishlist
    let card = findCard(w, 'R6');
    assert(card.querySelector('.icon-btn').classList.contains('on-wish'), 'toggle wishlist actif');
    card.querySelector('.icon-btn.flaw').click();                        // flawless
    card = findCard(w, 'R6');
    assert(card.querySelector('.icon-btn.flaw').classList.contains('on-flaw'), 'toggle flawless actif');
    await sleep(600);
    const st = JSON.parse(w.localStorage.getItem('droidex-tracker-v1'));
    assert(st.wish.r6 === true && st.flawless.r6 === true, 'wish + flawless persistés');
    [...w.document.querySelectorAll('.chip')].find(c => c.dataset.filter === 'wish').click();
    assert(w.document.querySelectorAll('.droid').length === 1, 'filtre Wishlist → 1 résultat');
  }

  /* ---- 14. Valeurs et bonus de collection ---- */
  console.log('\n[14] Valeurs, tri et bonus de collection');
  {
    const { window: w } = boot(savedJson);   // strikeorb dia en base
    const vline = findCard(w, 'Strike-Orb').querySelector('.value-line');
    assert(vline && vline.textContent.includes('540/s') && vline.textContent.includes('18.4K/s'),
      'ligne de valeur Strike-Orb : 540/s → 18.4K/s (obtenu : "' + (vline ? vline.textContent : 'absente') + '")');
    assert(w.document.getElementById('collectionBonus').textContent.includes('+1%'),
      'bonus de collection : 1 droïde distinct → +1%');
    const sort = w.document.getElementById('sortSelect');
    sort.value = 'income'; sort.dispatchEvent(new w.Event('change', { bubbles: true }));
    const first = w.document.querySelector('.droid .droid-name').textContent;
    assert(['Loadlifter', 'MO-TRAK', 'KX'].includes(first), 'tri par revenu : un 7.2K/s en tête (obtenu : ' + first + ')');
    const ver = w.document.getElementById('appVersion').textContent;
    assert(/^DROIDEX V\d+\.\d+\.\d+$/.test(ver), 'version affichée dans le footer (obtenu : "' + ver + '")');
  }

  /* ---- 15. Super-renaissance ---- */
  console.log('\n[15] Super-renaissance');
  {
    const seed = JSON.stringify({
      owned: { strikeorb: [1, 2, 2, 0, 0], mouse: [2, 0, 0, 0, 0], bb8: true },
      inBase: { bb8: true },
      flawless: { mouse: true },
      wish: { r2: true },
      targetRB: 12,
      targetCycle: 1
    });
    const { window: w } = boot(seed);
    w.document.getElementById('superRebirthBtn').click();
    const st = w.__test.getState();
    assert(JSON.stringify(st.owned.strikeorb) === '[1,1,1,0,0]', 'variantes en base → possédé (Strike-Orb)');
    assert(JSON.stringify(st.owned.mouse) === '[1,0,0,0,0]', 'variantes en base → possédé (Mouse)');
    assert(st.owned.bb8 === true, 'iconique : possédé (Droidex) conservé');
    assert(!st.inBase.bb8, 'iconique : plus en base');
    assert(st.flawless.mouse === true, 'flawless conservé');
    assert(st.wish.r2 === true, 'wishlist conservée');
    assert(st.targetRB === 1 && w.document.getElementById('rbSelect').value === '1', 'renaissance visée revenue à 1');
    assert(st.targetCycle === 2 && w.document.getElementById('cycleSelect').value === '2', 'cycle visé passé à 2');
    const saved = JSON.parse(w.localStorage.getItem('droidex-tracker-v1'));
    assert(saved && saved.targetCycle === 2 && JSON.stringify(saved.owned.strikeorb) === '[1,1,1,0,0]', 'transition persistée dans localStorage');
    const cyc = w.document.getElementById('cycleSelect');
    cyc.value = '4';
    cyc.dispatchEvent(new w.Event('change', { bubbles: true }));
    w.document.getElementById('superRebirthBtn').click();
    assert(w.__test.getState().targetCycle === 1, 'cycle 4 boucle vers 1');
    const btn = w.document.getElementById('superRebirthBtn');
    assert(btn.textContent === 'SUPER RB', 'libellé EN du bouton (obtenu : "' + btn.textContent + '")');
  }

  /* ---- 16. Badge « prêt » du panneau RB : 3/3 en base ---- */
  console.log('\n[16] Badge « prêt » du panneau RB');
  {
    const seed = JSON.stringify({ owned: { cb: [2, 0, 0, 0, 0], pit: [2, 0, 0, 0, 0], drk1: [2, 0, 0, 0, 0] }, targetRB: 1, targetCycle: 1 });
    const { window: w } = boot(seed);
    const badge2 = w.document.getElementById('readyBadge');
    assert(badge2.textContent === '✓ Rebirth ready', 'badge "✓ Rebirth ready" quand 3/3');
    assert(badge2.classList.contains('all'), 'badge pulsant quand 3/3');
  }

  /* ---- 17. Filtres à compteurs ---- */
  console.log('\n[17] Filtres à compteurs');
  {
    const { window: w } = boot();
    const side = w.document.getElementById('filtersSide');
    const chips = w.document.getElementById('filtersChips');
    assert(side && side.querySelectorAll('.chip').length === 8, '8 filtres dans la sidebar');
    assert(chips && chips.querySelectorAll('.chip').length === 8, '8 chips mobiles');
    const all = side.querySelector('[data-filter="all"] .chip-count');
    assert(all && all.textContent === '69', 'compteur TOUS = 69 (obtenu : ' + (all && all.textContent) + ')');
    const worker = side.querySelector('[data-filter="Worker"] .chip-count');
    const astro = side.querySelector('[data-filter="Astromech"] .chip-count');
    const battle = side.querySelector('[data-filter="Battle"] .chip-count');
    assert(parseInt(worker.textContent,10)+parseInt(astro.textContent,10)+parseInt(battle.textContent,10) === 69,
      'compteurs par classe sommant à 69');
    // clic sur un filtre côté sidebar → filtre actif des deux côtés
    side.querySelector('[data-filter="Worker"]').click();
    assert(side.querySelector('[data-filter="Worker"]').classList.contains('active'), 'filtre actif sidebar');
    assert(chips.querySelector('[data-filter="Worker"]').classList.contains('active'), 'filtre actif chips');
  }

  /* ---- 18. Icônes de carte (type + crédits) ---- */
  console.log('\n[18] Icônes de carte');
  {
    const { window: w } = boot();
    // icône de classe sur la carte
    const gonk = findCard(w, 'Gonk');
    assert(gonk && gonk.querySelector('.type-ico.t-worker'), 'icône de classe Worker sur Gonk');
    // ligne valeur avec icône crédits
    assert(gonk.querySelector('.value-line .ico-cred'), 'icône crédits dans la ligne de valeur');
  }

  /* ---- 19. Pages SEO générées ---- */
  console.log('\n[19] Pages SEO générées');
  {
    const read = f => fs.readFileSync(path.join(SITE, f), 'utf8');
    const vl = read('value-list/index.html');
    assert(vl.includes('Strike-Orb') && vl.includes('Beskar'), 'value list : droïdes + libellés longs');
    assert((vl.match(/<tr>/g) || []).length >= 60, 'value list : ≥ 60 lignes de tableau');
    const rb = read('rebirth-requirements/index.html');
    assert(rb.includes('32T') && rb.includes('Cycle 4'), 'rebirths : crédits max + 4 cycles');
    const faq = read('faq/index.html');
    assert(faq.includes('"@type": "FAQPage"') || faq.includes('"@type":"FAQPage"'), 'FAQ : JSON-LD FAQPage');
    const sm = read('sitemap.xml');
    assert((sm.match(/<loc>/g) || []).length === 4, 'sitemap : 4 URLs');
    ['value-list','rebirth-requirements','faq'].forEach(p =>
      assert(sm.includes('https://droidex.nackz.dev/' + p + '/'), 'sitemap contient ' + p));
  }

  console.log('\n' + (failures ? '❌ ' + failures + ' échec(s)' : '✅ Tous les tests passent'));
  process.exit(failures ? 1 : 0);
})();
