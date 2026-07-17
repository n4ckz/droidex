# Super-renaissance + C-3PO — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter C-3PO comme 7ᵉ droïde iconique (317 variantes) et un bouton « Super-renaissance » qui applique la sémantique de reset du jeu en un tap.

**Architecture:** Site statique pur (pas de build). Les données de jeu viennent du générateur `tools/update-gamedata.py` (jamais éditer `site/data.js` à la main) ; C-3PO y est injecté statiquement tant que tycoon-tools ne le liste pas. Le bouton super-renaissance vit dans le panneau renaissance (`.rb-selects`), transforme l'état en place et persiste via `persistState()` (qui déclenche la synchro PocketBase si active).

**Tech Stack:** HTML/CSS/JS vanilla, i18n maison (`site/i18n.js`), Python 3 (générateur), tests jsdom (`tests/test-droidex.js`).

**Spec:** `docs/superpowers/specs/2026-07-17-super-rebirth-c3po-design.md`

## Global Constraints

- Toute nouvelle chaîne UI passe par le dictionnaire `I18N` de `site/i18n.js`, dans **les deux langues** (EN et FR). L'anglais est la langue par défaut — les tests attendent l'anglais.
- `site/data.js` est GÉNÉRÉ : ne jamais l'éditer à la main, modifier `tools/update-gamedata.py` puis relancer le script.
- `APP_VERSION` (`site/version.js`) doit être incrémentée pour toute modif du site : `1.2.4` → `1.2.5` (Task 3). Elle pilote le footer et l'invalidation du cache offline (sw.js l'importe, rien d'autre à toucher).
- État applicatif : `owned[id]` = tableau de 5 entiers `0|1|2` pour les non-iconiques (0 = jamais eu, 1 = possédé/Droidex, 2 = en base) ou `true` pour un iconique possédé ; `inBase[id]` = booléen, iconiques uniquement.
- Tests : `cd tests && node test-droidex.js` (jsdom, sans serveur ; `npm install` d'abord si `tests/node_modules` absent). `test-sync.js` n'est pas concerné (aucun changement de schéma sync).
- Commits fréquents, messages finissant par `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: C-3PO — générateur, data.js, compteurs

**Files:**
- Modify: `tools/update-gamedata.py` (NAME2ID ~l. 43-44, DISPLAY ~l. 58-60, `main()` après `parse_values()` ~l. 228)
- Modify: `site/data.js` (par régénération uniquement)
- Modify: `README.md:166`
- Test: `tests/test-droidex.js:50,53,151`

**Interfaces:**
- Produces: id de droïde `'c3po'` dans `DROIDS` (data.js), entrée `{id:'c3po',n:'C-3PO',t:'Worker',r:'Iconic',iconic:true}` — premier du bloc `/* Iconic */` (tri : Worker avant Astromech/Battle, « C-3PO » < « DJ R-3X »). Compteur total : 69 droïdes / 317 variantes (calculé dynamiquement par `renderProgress()`, aucun code UI à changer).

- [ ] **Step 1: Mettre à jour les assertions de comptage (test en premier)**

Dans `tests/test-droidex.js`, trois remplacements exacts :

Ligne 50 :
```js
    assert(cards.length === 69, '69 droïdes rendus (obtenu : ' + cards.length + ')');
```

Ligne 53 :
```js
    assert(label === '0 / 317 variants', 'progression "0 / 317 variants" (obtenu : "' + label + '")');
```

Ligne 151 :
```js
    assert(label === '1 / 317 variants', 'progression 1 / 317 (obtenu : "' + label + '")');
```

- [ ] **Step 2: Vérifier que les tests échouent**

Run: `cd tests && node test-droidex.js`
Expected: FAIL — `✗ ÉCHEC : 69 droïdes rendus (obtenu : 68)` et les deux assertions de progression (obtenu « 0 / 316 variants » / « 1 / 316 variants »). Les autres sections restent vertes.

- [ ] **Step 3: Ajouter C-3PO au générateur**

Dans `tools/update-gamedata.py` :

a) `NAME2ID` — la ligne
```python
 'CB-23':'cb23','R2-D2':'r2d2',
```
devient
```python
 'CB-23':'cb23','R2-D2':'r2d2','C-3PO':'c3po',
```

b) `DISPLAY` — la ligne
```python
 'ig11':'IG-11 Marshal','djr3x':'DJ R-3X','r2d2':'R2-D2',
```
devient
```python
 'ig11':'IG-11 Marshal','djr3x':'DJ R-3X','r2d2':'R2-D2','c3po':'C-3PO',
```

c) Dans `main()`, juste après `vals = parse_values()` :
```python
    # C-3PO existe en jeu (boutique de cristaux Nova, constaté le 17/07/2026)
    # mais pas encore dans la value list tycoon-tools : injection statique tant
    # que la source est en retard. setdefault → la source primera dès qu'elle
    # le référencera (classe supposée Worker, perk inconnu à ce jour).
    vals.setdefault('c3po', {'rarity': 'Iconic', 'type': 'Worker',
                             'perk': None, 'inc': [None] * 5, 'beskarCost': None})
```

- [ ] **Step 4: Régénérer data.js et relire le diff**

Run: `python3 tools/update-gamedata.py`
Expected: `✓ site/data.js régénéré (recoupé le 17/07/2026).`

Run: `git diff site/data.js`
Expected: exactement deux changements — la date « recoupées le 17/07/2026 » dans l'en-tête, et une ligne ajoutée en tête du bloc `/* Iconic */` :
```js
 {id:'c3po',n:'C-3PO',t:'Worker',r:'Iconic',iconic:true},
```
Tout autre changement = anomalie côté source distante : s'arrêter et relire.

- [ ] **Step 5: Vérifier que les tests passent**

Run: `cd tests && node test-droidex.js`
Expected: `✅ Tous les tests passent`

- [ ] **Step 6: Mettre à jour le README**

`README.md` ligne 166 — remplacer :
```
The data (68 tracked droids including 6 Iconics, rebirth requirements for the 4 cycles × 27 levels, credit costs, per-variant income, Beskar costs and perks) is maintained in [`site/data.js`](site/data.js) from community sources, cross-checked on 2026-07-11:
```
par :
```
The data (69 tracked droids including 7 Iconics, rebirth requirements for the 4 cycles × 27 levels, credit costs, per-variant income, Beskar costs and perks) is maintained in [`site/data.js`](site/data.js) from community sources, cross-checked on 2026-07-17:
```

- [ ] **Step 7: Commit**

```bash
git add tools/update-gamedata.py site/data.js tests/test-droidex.js README.md
git commit -m "Add C-3PO as 7th Iconic (69 droids / 317 variants)

Seen in the in-game Nova crystal shop (2026-07-17); not yet on
tycoon-tools, so injected statically in the generator (setdefault —
the remote source wins once it lists it). Class Worker assumed,
perk unknown.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Bouton « Super-renaissance »

**Files:**
- Modify: `site/i18n.js` (dict EN après `resetConfirm`, ~l. 58 ; dict FR après `resetConfirm`, ~l. 134)
- Modify: `site/index.html` (div `.rb-selects`, ~l. 72-75)
- Modify: `site/styles.css` (après la règle `.rb-selects select{...}`, ~l. 99)
- Modify: `site/app.js` (après le bloc listener `resetBtn`, ~l. 428-434)
- Test: `tests/test-droidex.js` (nouvelle section `[15]` avant le résumé final, ~l. 274)

**Interfaces:**
- Consumes: `DROIDS` (dont `c3po` de Task 1 — sans impact direct), `state`, `t(clé)`, `persistState()`, `renderAll()` (tous globaux existants de app.js/i18n.js).
- Produces: `applySuperRebirth()` — fonction globale sans argument qui mute `state` (2→1, iconiques hors base, `targetRB=1`, `targetCycle` +1 avec boucle 4→1) sans persister ni rendre ; bouton `#superRebirthBtn` qui confirme puis appelle `applySuperRebirth()` + `persistState()` + `renderAll()`.

- [ ] **Step 1: Écrire le test qui échoue (section [15])**

Dans `tests/test-droidex.js`, insérer avant les deux dernières lignes du IIFE (le `console.log('\n' + (failures ? …` final) :

```js
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
    assert(btn.textContent === 'Super Rebirth', 'libellé EN du bouton (obtenu : "' + btn.textContent + '")');
  }
```

Note : `boot()` stubbe déjà `window.confirm = () => true`, la confirmation est donc automatiquement acceptée dans les tests.

- [ ] **Step 2: Vérifier que le test échoue**

Run: `cd tests && node test-droidex.js`
Expected: FAIL dans `[15]` — `TypeError: Cannot read properties of null (reading 'click')` (le bouton n'existe pas encore ; l'exception fait échouer le run, c'est suffisant comme rouge).

- [ ] **Step 3: Ajouter les clés i18n (EN + FR)**

`site/i18n.js`, dict EN, juste après la ligne `resetConfirm: 'Erase the whole registry? This cannot be undone.',` :
```js
    superRebirthBtn: 'Super Rebirth',
    superRebirthAria: 'Apply a super rebirth',
    superRebirthConfirm: 'Apply a super rebirth? Droids in your base drop back to "owned (Droidex)", Iconic droids leave your base (their unlock is kept — buy-back at the Nova crystal shop), the targeted rebirth returns to 1 and the targeted cycle advances. Flawless and wishlist are kept.',
```

Dict FR, juste après la ligne `resetConfirm: 'Effacer tout le registre ? Cette action est définitive.',` :
```js
    superRebirthBtn: 'Super-renaissance',
    superRebirthAria: 'Appliquer une super-renaissance',
    superRebirthConfirm: 'Appliquer une super-renaissance ? Les droïdes de ta base repassent en « possédé (Droidex) », les iconiques quittent la base (déverrouillage conservé — rachat à la boutique de cristaux Nova), la renaissance visée revient à 1 et le cycle visé avance. Flawless et wishlist sont conservés.',
```

- [ ] **Step 4: Ajouter le bouton dans le HTML**

`site/index.html` — dans `<div class="rb-selects">`, après la ligne du `<select id="rbSelect" …>` :
```html
        <button id="superRebirthBtn" class="tool-btn super-rb-btn" data-i18n="superRebirthBtn" data-i18n-aria="superRebirthAria" aria-label="Apply a super rebirth">Super Rebirth</button>
```

- [ ] **Step 5: Ajouter le style**

`site/styles.css` — juste après la règle `.rb-selects select{…}` (fin de bloc ~l. 104) :
```css
.super-rb-btn{border-color:var(--jawa);color:var(--jawa)}
.super-rb-btn:hover{color:var(--sand);border-color:var(--sand)}
```
(le bouton hérite du gabarit `.tool-btn` ; cette règle, déclarée après `.tool-btn:hover` dans le fichier, prend le dessus à spécificité égale)

- [ ] **Step 6: Implémenter la logique**

`site/app.js` — juste après le bloc `document.getElementById('resetBtn').addEventListener(…)` (qui se termine par `renderAll(); });`) :
```js
function applySuperRebirth(){
  DROIDS.forEach(d=>{
    if(d.iconic){
      delete state.inBase[d.id];
    }else if(Array.isArray(state.owned[d.id])){
      state.owned[d.id]=state.owned[d.id].map(v=>v===2?1:v);
    }
  });
  state.targetRB=1;
  state.targetCycle=(state.targetCycle%4)+1;
}
document.getElementById('superRebirthBtn').addEventListener('click',()=>{
  if(!confirm(t('superRebirthConfirm'))) return;
  applySuperRebirth();
  try{ persistState(); }catch(e){}
  renderAll();
});
```

- [ ] **Step 7: Vérifier que les tests passent**

Run: `cd tests && node test-droidex.js`
Expected: `✅ Tous les tests passent` (les 53 asserts existants + les 11 de la section [15])

- [ ] **Step 8: Vérification visuelle rapide (optionnelle mais recommandée)**

Run: `docker compose -f docker-compose.local.yml up -d` puis ouvrir `http://localhost:8080` — le bouton apparaît à côté des sélecteurs cycle/RB, libellé « Super Rebirth » (EN) / « Super-renaissance » (FR via le sélecteur de langue), la confirmation s'affiche au clic.

- [ ] **Step 9: Commit**

```bash
git add site/i18n.js site/index.html site/styles.css site/app.js tests/test-droidex.js
git commit -m "Super Rebirth button: apply the in-game reset semantics in one tap

In-base variants drop back to owned (Droidex kept), Iconic droids
leave the base (unlock kept, buy-back at the Nova shop), targeted
rebirth returns to 1, targeted cycle advances (4 loops to 1).
Flawless and wishlist untouched. Semantics from the in-game Super
Rebirth screen (2026-07-17 screenshot).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Version 1.2.5 + CHANGELOG

**Files:**
- Modify: `site/version.js:5`
- Modify: `CHANGELOG.md` (en tête, après `# Changelog`)

**Interfaces:**
- Consumes: rien — clôture des Tasks 1 et 2.
- Produces: `APP_VERSION = '1.2.5'` (footer + invalidation du cache offline via sw.js, automatique).

- [ ] **Step 1: Bump de version**

`site/version.js` — remplacer :
```js
const APP_VERSION = '1.2.4';
```
par :
```js
const APP_VERSION = '1.2.5';
```

- [ ] **Step 2: Entrée CHANGELOG**

`CHANGELOG.md` — insérer après la ligne `# Changelog` (et sa ligne vide) :
```markdown
## 1.2.5 — 2026-07-17

- **C-3PO added as the 7th Iconic** (seen in the in-game Nova crystal shop; not yet on community sources, class/perk to confirm) — 69 droids / 317 variants tracked
- **Super Rebirth button** next to the cycle selector: applies the in-game reset semantics in one tap — in-base variants drop back to "owned (Droidex)", Iconic droids leave the base (unlock kept, buy-back at the Nova shop), targeted rebirth returns to 1 and the targeted cycle advances (4 loops back to 1); Flawless and wishlist untouched

```

- [ ] **Step 3: Suite complète**

Run: `cd tests && node test-droidex.js`
Expected: `✅ Tous les tests passent` (le test du footer `[14]` valide le format de version, pas la valeur — aucun test à changer)

- [ ] **Step 4: Commit**

```bash
git add site/version.js CHANGELOG.md
git commit -m "v1.2.5: C-3PO iconic + Super Rebirth button

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Après le plan (hors implémentation)

- Push + déploiement VPS : `cd /opt/sites/droidex && git pull && docker compose up -d --build` (procédure CLAUDE.md) — sur demande de Julien.
- Suivi ouvert : classe (Worker ?) et perk de C-3PO à confirmer en jeu ou via tycoon-tools ; le jour où la value list le référencera, `--check` signalera l'écart et le `setdefault` s'effacera devant la source.
