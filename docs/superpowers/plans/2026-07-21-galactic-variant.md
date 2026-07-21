# Variante Galactique (6ᵉ palier) + RB28 — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Intégrer la variante Galactique (index 5, au-dessus de Beskar) et le palier RB28 dans le tracker, avec compteur principal inchangé (/317) et compteur galactique séparé (x/62).

**Architecture:** Approche A de la spec `docs/superpowers/specs/2026-07-21-galactic-variant-design.md` — le Galactique est la 6ᵉ entrée du tableau `owned[id]`, cyclable 0/1/2 comme les autres ; toute la logique badges/exigences existante s'applique sans exception. data.js est régénéré (jamais édité à la main).

**Tech Stack:** Statique pur (pas de build), Python 3 stdlib (générateur), jsdom (tests), Node sans dépendance (pages SEO).

## Global Constraints

- data.js est GÉNÉRÉ : ne jamais l'éditer à la main, toujours via `python3 tools/update-gamedata.py` puis relire le diff.
- Toute nouvelle chaîne UI passe par le dictionnaire `I18N` (EN **et** FR), textes de tests attendus en ANGLAIS.
- Libellés courts identiques EN/FR : le Galactique est `GLC` ; libellés longs `Galactic` (EN) / `Galactique` (FR).
- Compteur principal `progressLabel` : index 0-4 uniquement → reste `xxx/317`.
- Règles métier intangibles du CLAUDE.md inchangées (badges barrés uniquement si rb < cible ; non-régression Strike-Orb `✓ RB10·GLD`).
- Tests : `cd tests && node test-droidex.js` — 0 échec exigé à la fin de CHAQUE tâche.
- Travailler sur la branche `feat/galactic-variant` (créée en tâche 1).

---

### Task 1: Générateur — 6ᵉ colonne de revenus, GALACTIC=5, RB28, régénération de data.js

**Files:**
- Modify: `tools/update-gamedata.py`
- Regenerate: `site/data.js`

**Interfaces:**
- Produces: `data.js` avec `inc:[…×6]` (dernier élément possiblement `null`), `REBIRTHS[cycle]` avec clés 1..28 (28 → `[[id,5],…]`), `RB_CREDITS[28]='45T'`. Les tâches 2-3 en dépendent.

- [ ] **Step 1: Vérifier l'état de départ**

Run : `git checkout -b feat/galactic-variant && git status --short`
Attendu : seuls `tools/update-gamedata.py` (alias BB-8/C-3P0 déjà en place) apparaît en modifié.

- [ ] **Step 2: Étendre TIER_WORDS et le parsing de la value list**

Dans `tools/update-gamedata.py` :

```python
TIER_WORDS = {'BASE': 0, 'GOLD': 1, 'DIAMOND': 2, 'RAINBOW': 3, 'BESKAR': 4, 'GALACTIC': 5}
```

Dans `parse_values()` (colonnes distantes : Droid, Rarity, Type, Perk, Base, Gold, Diamond, Rainbow, Beskar, **Galactic**, Beskar Cost) :

```python
        vals[NAME2ID[c[0]]] = {
            'rarity': c[1].capitalize(), 'type': c[2].capitalize(),
            'perk': None if c[3] in ('—', '') else c[3],
            'inc': [parse_income(x) for x in c[4:10]],
            'beskarCost': None if c[10] in ('—', '') else c[10],
        }
```

- [ ] **Step 3: `js_num` accepte les trous (revenus Galactiques non documentés)**

```python
def js_num(v):
    if v is None:
        return 'null'
    return str(int(v)) if float(v).is_integer() else str(v)
```

- [ ] **Step 4: C-3PO — inc ×6 dans l'injection statique + préservation du perk relevé en jeu**

La value list distante référence désormais C-3P0 mais avec perk « — » ; le relevé
en jeu de Julien (18/07/2026) prime tant que la source est muette. Remplacer le bloc
`vals.setdefault('c3po', …)` de `main()` par :

```python
    vals.setdefault('c3po', {'rarity': 'Iconic', 'type': 'Worker',
                             'perk': '+25% workers', 'inc': [None] * 6, 'beskarCost': None})
    # tycoon-tools liste désormais C-3P0 mais sans perk : le relevé en jeu
    # (+25% workers, 18/07/2026) prime tant que la source ne le documente pas.
    if not vals['c3po'].get('perk'):
        vals['c3po']['perk'] = '+25% workers'
```

- [ ] **Step 5: Mettre à jour les commentaires d'en-tête générés**

Dans `generate()`, remplacer :
- `Exigences de renaissance (4 cycles × 27) et value list :` → `Exigences de renaissance (4 cycles × 28) et value list :`
- `   inc: revenus crédits/s par variante [Basic, Or, Diamant, Arc-en-ciel, Beskar]` → `   inc: revenus crédits/s par variante [Basic, Or, Diamant, Arc-en-ciel, Beskar, Galactique] (null = non documenté)`
- `   Index des variantes : 0=Basic, 1=Or/Gold, 2=Diamant/Diamond, 3=Arc-en-ciel/Rainbow, 4=Beskar. */` → `   Index des variantes : 0=Basic, 1=Or/Gold, 2=Diamant/Diamond, 3=Arc-en-ciel/Rainbow, 4=Beskar, 5=Galactique/Galactic. */`
- `   Une variante supérieure valide toujours l'exigence. Après la renaissance 27` → `   Une variante supérieure valide toujours l'exigence. Après la renaissance 28`

- [ ] **Step 6: Régénérer et relire le diff**

Run : `python3 tools/update-gamedata.py && git diff --stat site/data.js`
Attendu : `✓ site/data.js régénéré`, et le diff montre : `inc` à 6 entrées (Galactique `null` pour la plupart, `90000` pour MONO-WLKR/R7/OPTI-STRK…), `RB_CREDITS` avec `28:'45T'`, chaque cycle avec `28:[['…',5],['…',3],['…',4]]` (cycle 1 : `protoroller`,5). Vérifier qu'AUCUN droïde n'a disparu (69 lignes de droïdes).

Run : `node -e "eval(require('fs').readFileSync('site/data.js','utf8')); console.log(DROIDS.length, Object.keys(REBIRTHS[1]).length, RB_CREDITS[28], JSON.stringify(REBIRTHS[1][28]))"`
Attendu : `69 28 45T [["protoroller",5],["motrak",3],["drftr",4]]`

- [ ] **Step 7: Vérifier que la suite existante reste verte**

Run : `cd tests && node test-droidex.js`
Attendu : ✅ 0 échec (l'app ignore encore l'index 5 : rien ne casse).

- [ ] **Step 8: Commit**

```bash
git add tools/update-gamedata.py site/data.js
git commit -m "data: variante Galactique (tier 5) + RB28, value list à 6 colonnes"
```

---

### Task 2: App — 6ᵉ pastille, migration, compteur galactique, RB28

**Files:**
- Modify: `site/i18n.js`, `site/app.js`, `site/index.html`, `site/styles.css`
- Test: `tests/test-droidex.js`

**Interfaces:**
- Consumes: `data.js` de la tâche 1 (`inc ×6`, `REBIRTHS[*][28]`, tier 5).
- Produces: globales `TIERS`/`TIER_SHORT` à 6 entrées ; clé i18n `galacticCount` (`'✧ Galactic {0}/{1}'` / `'✧ Galactique {0}/{1}'`) ; élément `#galacticCount` ; variable CSS `--tier-5`.

- [ ] **Step 1: Écrire les tests qui échouent**

Dans `tests/test-droidex.js` :

a) Section 6 (migration), remplacer l'assert r6 :
```js
    assert(JSON.stringify(s.owned.r6) === '[1,2,0,0,0,0]', 'r6 [true,true,…] + inBase → [1,2,0,0,0,0] + padding Galactique (obtenu : ' + JSON.stringify(s.owned.r6) + ')');
```

b) Section 11, remplacer l'assert du sélecteur :
```js
    assert(w.document.getElementById('rbSelect').options.length === 28, 'sélecteur RB : 28 niveaux');
```

c) Section 15 (super-renaissance), seed et asserts : remplacer
`owned: { strikeorb: [1, 2, 2, 0, 0], mouse: [2, 0, 0, 0, 0], bb8: true },` par
`owned: { strikeorb: [1, 2, 2, 0, 0, 2], mouse: [2, 0, 0, 0, 0], bb8: true },` puis
```js
    assert(JSON.stringify(st.owned.strikeorb) === '[1,1,1,0,0,1]', 'variantes en base → possédé, Galactique compris (Strike-Orb)');
    assert(JSON.stringify(st.owned.mouse) === '[1,0,0,0,0,0]', 'variantes en base → possédé (Mouse, paddée à 6)');
```
et l'assert localStorage correspondant : `JSON.stringify(saved.owned.strikeorb) === '[1,1,1,0,0,1]'`.

d) Nouvelle section 21 avant le `console.log` final :
```js
  /* ---- 21. Variante Galactique (6ᵉ palier) + RB28 ---- */
  console.log('\n[21] Variante Galactique et RB28');
  {
    const { window: w } = boot();
    // 6 pastilles par carte, la 6ᵉ = GLC
    const tiers = findCard(w, 'R6').querySelectorAll('.tier');
    assert(tiers.length === 6, '6 pastilles de variante par carte (obtenu : ' + tiers.length + ')');
    assert(tiers[5].dataset.t === '5' && tiers[5].textContent.includes('GLC'), '6ᵉ pastille libellée GLC');
    // compteur galactique à vide
    const gc = w.document.getElementById('galacticCount');
    assert(gc && gc.textContent.includes('0/62'), 'compteur galactique "0/62" (obtenu : "' + (gc && gc.textContent) + '")');
    // Proto-Roller Galactique en base → badge RB28 vert, compteur principal inchangé
    findCard(w, 'Proto-Roller').querySelector('.tier[data-t="5"]').click();  // 0 → 1
    findCard(w, 'Proto-Roller').querySelector('.tier[data-t="5"]').click();  // 1 → 2 en base
    setTarget(w, 28);
    const badge = findCard(w, 'Proto-Roller').querySelector('.req-badge');
    assert(badge.textContent === '✓ RB28·GLC', 'badge "✓ RB28·GLC" (obtenu : "' + badge.textContent + '")');
    assert(badge.classList.contains('ready') && !badge.classList.contains('done'), 'badge RB28 vert non barré');
    assert(w.document.getElementById('rbCreditsBig').textContent.includes('45T'), 'crédits RB28 : 45T');
    assert(w.document.getElementById('progressLabel').textContent === '000/317',
      'Galactique possédé : compteur principal toujours 000/317');
    assert(w.document.getElementById('galacticCount').textContent.includes('1/62'), 'compteur galactique passé à 1/62');
    assert(w.document.getElementById('collectionBonus').textContent.includes('+1%'),
      'droïde possédé en Galactique seul → compte comme distinct (+1%)');
  }
  {
    // le Galactique satisfait une exigence inférieure (règle variante supérieure)
    const seed = JSON.stringify({ owned: { r6: [0, 0, 0, 0, 0, 2] }, inBase: {}, targetRB: 9 });  // req R6 [[9,1]]
    const { window: w } = boot(seed);
    const badge = findCard(w, 'R6').querySelector('.req-badge');
    assert(badge.textContent === '✓ RB9·GLD' && badge.classList.contains('ready'),
      'R6 Galactique en base satisfait l\'exigence Or (obtenu : "' + badge.textContent + '")');
  }
```

- [ ] **Step 2: Vérifier que les nouveaux tests échouent**

Run : `cd tests && node test-droidex.js`
Attendu : ÉCHECS sur [6] (padding absent), [11] (27 ≠ 28), [15], [21] (pastilles = 5, `#galacticCount` absent). Les autres sections restent vertes.

- [ ] **Step 3: i18n — 6ᵉ tier + clé du compteur**

Dans `site/i18n.js`, bloc `en:` :
```js
    _tiers: ['Basic','Gold','Diamond','Rainbow','Beskar','Galactic'],
    _tierShort: ['BAS','GLD','DIA','RBW','BSK','GLC'],
```
et ajouter après `collectionBonus:` :
```js
    galacticCount: '✧ Galactic {0}/{1}',
```
Bloc `fr:` :
```js
    _tiers: ['Basic','Or','Diamant','Arc-en-ciel','Beskar','Galactique'],
    _tierShort: ['BAS','GLD','DIA','RBW','BSK','GLC'],
```
et après `collectionBonus:` :
```js
    galacticCount: '✧ Galactique {0}/{1}',
```

- [ ] **Step 4: app.js — bornes, migration, compteurs, sélecteur RB**

a) `ownedTiers` :
```js
function ownedTiers(id){
  const v = state.owned[id];
  return Array.isArray(v) ? v : [0,0,0,0,0,0];
}
```

b) `meetsReq` / `inBaseReq` : borne `i<5` → `i<6` (les deux boucles).

c) `applyParsedState`, dans le bloc `if(Array.isArray(v) && !iconicIds.has(id)){` :
```js
      state.owned[id] = v.map(x=>x===true?1:(typeof x==='number'?x:0));
      /* v1.5.0 : padding à 6 entrées (variante Galactique) */
      while(state.owned[id].length<6) state.owned[id].push(0);
      /* ancien toggle global "en base" -> promotion de la meilleure variante possédée */
      if(state.inBase[id]===true){
        const arr = state.owned[id];
        for(let i=arr.length-1;i>=0;i--){ if(arr[i]>=1){ arr[i]=2; break; } }
        delete state.inBase[id];
      }
```

d) `renderProgress` — compteur principal sur 0-4 + compteur galactique :
```js
function renderProgress(){
  let total=0,done=0,gal=0,galTotal=0;
  DROIDS.forEach(d=>{
    if(d.iconic){total+=1;if(state.owned[d.id]===true)done+=1;}
    else{
      const o=ownedTiers(d.id);
      /* le jeu n'inclut pas le Galactique dans le total Droidex (317) */
      total+=5;done+=o.slice(0,5).filter(v=>v>=1).length;
      galTotal+=1;if(o[5]>=1)gal+=1;
    }
  });
  const segs=document.getElementById('progressSegs');
  const lit=total?Math.round(done/total*10):0;
  [...segs.children].forEach((s,i)=>s.classList.toggle('on',i<lit));
  document.getElementById('progressLabel').textContent=String(done).padStart(3,'0')+'/'+total;
  document.getElementById('galacticCount').textContent=t('galacticCount', gal, galTotal);
  const n=distinctOwned();
  document.getElementById('collectionBonus').textContent=t('collectionBonus', n, n);
}
```

e) `renderRBPanel` — borne du sélecteur dérivée des données :
```js
  const sel = document.getElementById('rbSelect');
  if(!sel.options.length){
    const maxRB = Math.max(...Object.keys(REBIRTHS[1]).map(Number));
    for(let i=1;i<=maxRB;i++){
```

- [ ] **Step 5: index.html — élément du compteur galactique**

Après la ligne `<span class="collection-bonus" id="collectionBonus"></span>` :
```html
    <span class="collection-bonus galactic-count" id="galacticCount"></span>
```

- [ ] **Step 6: styles.css — couleur du 6ᵉ palier**

Ligne des variables (`--tier-0:… --tier-4:#C8CDD4;`) : ajouter ` --tier-5:#9D6BFF;`
Ligne des couleurs de pastilles : ajouter ` .tier[data-t="5"]{color:var(--tier-5)}`
Après la règle `.collection-bonus{…}` : ajouter
```css
.galactic-count{color:var(--tier-5)}
```

- [ ] **Step 7: Vérifier que tout passe**

Run : `cd tests && node test-droidex.js`
Attendu : ✅ 0 échec (y compris la non-régression Strike-Orb [4] et la section [21]).

- [ ] **Step 8: Commit**

```bash
git add site/i18n.js site/app.js site/index.html site/styles.css tests/test-droidex.js
git commit -m "feat: variante Galactique — 6e pastille, compteur /62, badges RB28, migration"
```

---

### Task 3: Pages SEO — 6 variantes, 28 paliers

**Files:**
- Modify: `tools/generate-seo-pages.js`
- Regenerate: `site/value-list/index.html`, `site/rebirth-requirements/index.html`, `site/faq/index.html`, `site/sitemap.xml`
- Test: `tests/test-droidex.js` (section 19)

**Interfaces:**
- Consumes: `data.js` (tâche 1) et `I18N.en._tiers` (tâche 2 — fournit « Galactic » automatiquement au générateur).

- [ ] **Step 1: Tests — étendre la section 19**

Après l'assert `'value list : ≥ 60 lignes de tableau'` :
```js
    assert(vl.includes('<th>Galactic</th>'), 'value list : colonne Galactic');
    assert(rb.includes('45T'), 'rebirths : RB28 (45T) présent');
```
(`rb` est déjà lu deux lignes plus bas — déplacer sa lecture `const rb = read(…)` AVANT ces asserts si nécessaire.)

- [ ] **Step 2: Vérifier l'échec**

Run : `cd tests && node test-droidex.js`
Attendu : ÉCHEC des 2 nouveaux asserts de [19] uniquement.

- [ ] **Step 3: Générateur SEO — cellules, en-tête, textes**

Dans `tools/generate-seo-pages.js` :

a) Cellules de revenus (trous Galactiques) :
```js
      const tierCells = d.inc.map(n => `<td>${n == null ? '—' : fmtInc(n) + '/s'}</td>`).join('');
```
(remplace `d.inc.map(n => `<td>${fmtInc(n)}/s</td>`)`)

b) En-tête du tableau : dans la ligne `<tr><th>Droid</th>…`, insérer `<th>Galactic</th>` entre `<th>Beskar</th>` et `<th>Beskar cost</th>`.

c) Textes (remplacements exacts, mêmes chaînes dans les intros, descriptions JSON-LD, meta et FAQ) :
- `across all five variants: Basic, Gold, Diamond, Rainbow and Beskar` → `across all six variants: Basic, Gold, Diamond, Rainbow, Beskar and Galactic`
- `across Basic, Gold, Diamond, Rainbow and Beskar variants` → `across Basic, Gold, Diamond, Rainbow, Beskar and Galactic variants`
- `— Basic, Gold, Diamond, Rainbow and Beskar —` → `— Basic, Gold, Diamond, Rainbow, Beskar and Galactic —`
- `27 rebirth levels` → `28 rebirth levels` (toutes occurrences)
- `all 27 levels` / `All 27 Levels` → `all 28 levels` / `All 28 Levels`
- `from 1 to 27` → `from 1 to 28`
- `32T at rebirth 27` → `45T at rebirth 28` (toutes occurrences)
- `Each rebirth level, from 1 to 27,` → `Each rebirth level, from 1 to 28,`

Vérifier avec `grep -n "27\|five variants" tools/generate-seo-pages.js` qu'il ne reste
aucune occurrence obsolète (les « 27 » restants légitimes, s'il y en a, doivent être justifiés).

- [ ] **Step 4: Régénérer les pages**

Run : `node tools/generate-seo-pages.js && git diff --stat site/value-list site/rebirth-requirements site/faq site/sitemap.xml`
Attendu : pages régénérées ; le diff montre la colonne Galactic, les lignes RB28 (45T), les textes « six variants »/« 28 ».

- [ ] **Step 5: Vérifier que tout passe**

Run : `cd tests && node test-droidex.js`
Attendu : ✅ 0 échec.

- [ ] **Step 6: Commit**

```bash
git add tools/generate-seo-pages.js site/value-list site/rebirth-requirements site/faq site/sitemap.xml tests/test-droidex.js
git commit -m "seo: pages régénérées — 6 variantes (Galactic), 28 paliers, RB28 45T"
```

---

### Task 4: Version 1.5.0 + CHANGELOG + régénération finale

**Files:**
- Modify: `site/version.js`, `CHANGELOG.md`
- Regenerate: pages SEO (le footer des pages embarque la version)

- [ ] **Step 1: Bump version**

Dans `site/version.js` : `APP_VERSION = '1.5.0'` (remplacer la valeur actuelle 1.4.5).

- [ ] **Step 2: Entrée CHANGELOG**

En tête de `CHANGELOG.md` (suivre le format des entrées existantes) :
```markdown
## v1.5.0 — 2026-07-21

Mise à jour du jeu (variante Galactique) :
- Variante **Galactique** (6ᵉ palier, au-dessus de Beskar) sur chaque droïde standard : pastille GLC cyclable (possédé / en base), badges d'exigence `RB·GLC`.
- Palier de renaissance **28** dans les 4 cycles (45T ; cycle 1 : Proto-Roller Galactique + MO-TRAK Arc-en-ciel + DRFT-R Beskar).
- Compteur principal inchangé (**/317**, fidèle au jeu) ; nouveau compteur **Galactique x/62** à côté du bonus de collection.
- Value list à 6 colonnes (revenus Galactiques partiels chez tycoon-tools : « — » quand non documenté) ; pages SEO régénérées.
- Migration automatique des sauvegardes (padding à 6 variantes) ; la super-renaissance couvre le Galactique (en base → possédé).
- Générateur : alias BB-8/C-3P0 (nouvelles graphies tycoon-tools), perk C-3PO relevé en jeu préservé.
```

- [ ] **Step 3: Régénérer les pages SEO (footer versionné) et tester**

Run : `node tools/generate-seo-pages.js && cd tests && node test-droidex.js`
Attendu : ✅ 0 échec.

- [ ] **Step 4: Commit**

```bash
git add site/version.js CHANGELOG.md site/value-list site/rebirth-requirements site/faq site/sitemap.xml
git commit -m "v1.5.0: variante Galactique (6e palier) + RB28"
```

---

### Task 5: Revue, PR, release, déploiement

- [ ] **Step 1: Revue de code** — REQUIRED SUB-SKILL : `superpowers:requesting-code-review` sur le diff `main...feat/galactic-variant` ; corriger ce qui doit l'être.

- [ ] **Step 2: PR**

```bash
git push -u origin feat/galactic-variant
gh pr create --title "v1.5.0 — Variante Galactique (6e palier) + RB28" --body "$(cat <<'EOF'
Mise à jour du jeu : 6e variante « Galactic » au-dessus de Beskar + palier RB28 (4 cycles).
Spec : docs/superpowers/specs/2026-07-21-galactic-variant-design.md
- data.js régénéré (value list 6 colonnes, RB28 45T, tier 5)
- 6e pastille GLC, compteur galactique x/62, compteur principal inchangé /317
- migration sauvegardes (padding à 6), super-renaissance inchangée par construction
- pages SEO régénérées (six variants, 28 levels)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Merge après validation de Julien**, puis rituel de release (CLAUDE.md) :

```bash
git checkout main && git pull
git tag v1.5.0 && git push origin --tags
gh release create v1.5.0 --title "v1.5.0 — 2026-07-21" --notes-file <notes CHANGELOG>
```

- [ ] **Step 4: Déploiement VPS**

```bash
ssh crm-vps "cd /opt/sites/droidex && git pull && docker compose up -d --build"
```
Attendre ~15 s (fenêtre 404 Traefik), puis vérifier en ligne : `version.js` (1.5.0), une carte avec pastille GLC, `data.js` contient `28:` et `,5]`, pages SEO avec colonne Galactic.
