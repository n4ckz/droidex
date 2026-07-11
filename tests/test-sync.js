/* Test end-to-end de la synchronisation PocketBase (jsdom + instance Docker locale) */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..', 'site');
const html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const bundle = ['i18n.js', 'data.js', 'app.js', 'vendor/pocketbase.umd.js', 'config.js', 'sync.js']
  .map(f => fs.readFileSync(path.join(SITE, f), 'utf8')).join('\n;\n');
const PB = 'http://localhost:8090';
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@test.local';
const ADMIN_PASS = process.env.PB_ADMIN_PASS || 'testpass1234';
let ADMIN_TOKEN = '';

let failures = 0;
const assert = (c, m) => { if (c) console.log('  ✓ ' + m); else { failures++; console.log('  ✗ ÉCHEC : ' + m); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function boot(localStorageSeed) {
  const dom = new JSDOM(html, { url: 'http://localhost:8080/', runScripts: 'outside-only' });
  const { window: w } = dom;
  w.confirm = () => true;
  // jsdom n'implémente pas fetch : on injecte celui de Node
  w.fetch = (...a) => globalThis.fetch(...a);
  w.Headers = Headers; w.AbortController = AbortController; w.FormData = FormData;
  if (localStorageSeed) w.localStorage.setItem('droidex-tracker-v1', localStorageSeed);
  w.eval(bundle + '\n;window.__t = { getState: () => state, pb: () => pb, reconcile: syncReconcile, push: syncPush };');
  return w;
}
const findCard = (w, name) =>
  [...w.document.querySelectorAll('.droid')].find(c => c.querySelector('.droid-name').textContent === name);

async function adminGET(p) {
  // retry : PocketBase peut renvoyer un 400 transitoire pendant une écriture concurrente
  for (let i = 0; i < 3; i++) {
    const r = await fetch(PB + p, { headers: { Authorization: ADMIN_TOKEN } });
    if (r.status === 200) return { status: r.status, body: await r.json() };
    await sleep(500);
    if (i === 2) return { status: r.status, body: await r.json().catch(() => null) };
  }
}

async function setup() {
  const r = await fetch(PB + '/api/collections/_superusers/auth-with-password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASS })
  });
  if (r.status !== 200) {
    throw new Error('Superuser PocketBase introuvable. Démarrer le compose local puis :\n' +
      '  docker compose -f docker-compose.local.yml exec pocketbase /pb/pocketbase superuser upsert ' +
      ADMIN_EMAIL + ' ' + ADMIN_PASS + ' --dir=/pb/pb_data');
  }
  ADMIN_TOKEN = (await r.json()).token;
  // utilisateurs de test (idempotent : échoue silencieusement s'ils existent)
  for (const u of ['alice', 'bob']) {
    await fetch(PB + '/api/collections/users/records', {
      method: 'POST', headers: { Authorization: ADMIN_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: u + '@test.local', password: 'motdepasse123', passwordConfirm: 'motdepasse123' })
    });
  }
  // repartir d'un serveur sans sauvegardes
  const list = await adminGET('/api/collections/saves/records?fields=id&skipTotal=1&perPage=200');
  for (const it of (list.body.items || [])) {
    await fetch(PB + '/api/collections/saves/records/' + it.id, {
      method: 'DELETE', headers: { Authorization: ADMIN_TOKEN }
    });
  }
}

(async () => {
  await setup();
  console.log('\n[A] Connexion avec données locales, serveur vide → push');
  const seed = JSON.stringify({ owned: { strikeorb: [0, 0, 2, 0, 0] }, inBase: {}, targetRB: 10 });
  {
    const w = boot(seed);
    assert(!w.document.getElementById('syncBar').hidden, 'barre de synchro visible (PB_URL configurée)');
    assert(!w.document.getElementById('loginBtn').hidden, 'bouton connexion visible hors session');
    await w.__t.pb().collection('users').authWithPassword('alice@test.local', 'motdepasse123');
    await w.__t.reconcile(true);
    const saves = await adminGET('/api/collections/saves/records');
    assert(saves.body.totalItems === 1, '1 enregistrement saves créé (obtenu : ' + saves.body.totalItems + ')');
    assert(saves.body.items[0].data.owned.strikeorb[2] === 2, 'données locales poussées sur le serveur');
  }

  console.log('\n[B] Nouvel appareil vierge → pull du compte');
  let wB;
  {
    wB = boot(null);
    await wB.__t.pb().collection('users').authWithPassword('alice@test.local', 'motdepasse123');
    await wB.__t.reconcile(true);
    const dia = findCard(wB, 'Strike-Orb').querySelector('.tier[data-t="2"]');
    assert(dia.classList.contains('base'), 'Strike-Orb Diamant en base restauré depuis le compte');
    assert(wB.document.getElementById('rbSelect').value === '10', 'cible RB10 restaurée');
    const local = JSON.parse(wB.localStorage.getItem('droidex-tracker-v1'));
    assert(local.owned.strikeorb[2] === 2, 'localStorage mis à jour comme cache');
  }

  console.log('\n[C] Modification locale → push automatique débounce');
  {
    findCard(wB, 'R6').querySelector('.tier[data-t="1"]').click();   // R6 Or possédé
    await sleep(2200);  // 400 ms (save locale) + 1000 ms (push) + réseau
    const saves = await adminGET('/api/collections/saves/records');
    assert(saves.body.totalItems === 1, 'toujours un seul enregistrement (update, pas doublon)');
    assert(saves.body.items[0].data.owned.r6 && saves.body.items[0].data.owned.r6[1] === 1,
      'R6 Or synchronisé sur le serveur');
    assert(wB.document.getElementById('syncStatus').textContent.includes('alice@test.local'),
      'statut affiche l\'email du compte');
  }

  console.log('\n[D] Isolation : bob ne voit pas la sauvegarde d\'alice');
  {
    const r = await fetch(PB + '/api/collections/users/auth-with-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: 'bob@test.local', password: 'motdepasse123' })
    });
    const bobToken = (await r.json()).token;
    const list = await fetch(PB + '/api/collections/saves/records', { headers: { Authorization: bobToken } });
    const listBody = await list.json();
    assert(listBody.totalItems === 0, 'liste des saves vide pour bob');
    const saves = await adminGET('/api/collections/saves/records');
    const aliceRecId = saves.body.items[0].id;
    const one = await fetch(PB + '/api/collections/saves/records/' + aliceRecId, { headers: { Authorization: bobToken } });
    assert(one.status === 404, 'accès direct à l\'enregistrement d\'alice refusé (' + one.status + ')');
    const upd = await fetch(PB + '/api/collections/saves/records/' + aliceRecId, {
      method: 'PATCH', headers: { Authorization: bobToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { owned: {}, inBase: {}, targetRB: 1 } })
    });
    assert(upd.status === 404, 'modification par bob refusée (' + upd.status + ')');
  }

  console.log('\n[E] Session persistée + authRefresh au rechargement');
  {
    // le SDK garde l'auth dans localStorage("pocketbase_auth") : on la copie dans un nouveau DOM
    const auth = wB.localStorage.getItem('pocketbase_auth');
    const w = new JSDOM(html, { url: 'http://localhost:8080/', runScripts: 'outside-only' }).window;
    w.confirm = () => true;
    w.fetch = (...a) => globalThis.fetch(...a);
    w.Headers = Headers; w.AbortController = AbortController; w.FormData = FormData;
    w.localStorage.setItem('pocketbase_auth', auth);
    w.eval(bundle + '\n;window.__t = { pb: () => pb };');
    await sleep(1500);  // authRefresh + reconcile asynchrones du init
    const dia = findCard(w, 'Strike-Orb').querySelector('.tier[data-t="2"]');
    assert(dia.classList.contains('base'), 'état du compte chargé automatiquement au démarrage');
    assert(w.document.getElementById('logoutBtn').hidden === false, 'bouton déconnexion visible');
  }

  console.log('\n[F] Reset connecté → serveur vidé aussi');
  {
    wB.document.getElementById('resetBtn').click();
    await sleep(2200);
    const saves = await adminGET('/api/collections/saves/records');
    assert(Object.keys(saves.body.items[0].data.owned).length === 0, 'sauvegarde serveur vidée après reset');
  }

  console.log('\n[G] Suppression de compte (RGPD)');
  {
    await wB.__t.pb().collection('users').authWithPassword('alice@test.local', 'motdepasse123');
    await wB.__t.pb().collection('users').delete(wB.__t.pb().authStore.record.id);
    const saves = await adminGET('/api/collections/saves/records');
    assert(saves.body.totalItems === 0, 'sauvegarde supprimée en cascade avec le compte');
    const users = await adminGET('/api/collections/users/records');
    assert(!users.body.items.some(u => u.email === 'alice@test.local'), 'compte alice supprimé');
  }

  console.log('\n' + (failures ? '❌ ' + failures + ' échec(s)' : '✅ Synchronisation : tous les tests passent'));
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error('ERREUR FATALE :', e); process.exit(1); });
