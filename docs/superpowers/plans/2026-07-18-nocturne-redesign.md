# Refonte Nocturne (v1.3.0) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le thème Tatooine par le design « Nocturne » (sombre futuriste HUD) conçu dans Claude Design, avec ses nouveautés (progression segmentée, badge renaissance prête, compteurs de filtres, sidebar desktop), à iso-logique métier.

**Architecture:** Re-skin en place : `app.js`/`i18n.js`/`sync.js`/`data.js` gardent leurs rôles ; `styles.css` est réécrit ; `index.html` restructuré (layout sidebar desktop / pile mobile, breakpoint 980px) ; `app.js` reçoit des deltas ciblés (segments, compteurs, badge ready, icônes). Le prototype `~/Downloads/redesign-app-futuriste/project/Droidex Prototype.dc.html` est la **référence visuelle pixel-perfect** — chaque implémenteur DOIT le lire (au moins la zone qu'il traite) ; son code n'est jamais copié (runtime de maquette), ses valeurs (couleurs, tailles, espacements, libellés) sont reprises exactement.

**Tech Stack:** HTML/CSS/JS vanilla (pas de build), i18n maison, tests jsdom.

**Spec:** `docs/superpowers/specs/2026-07-18-nocturne-redesign-design.md`

## Global Constraints

- Toute chaîne UI nouvelle ou modifiée passe par `I18N` (`site/i18n.js`), EN + FR. Anglais = langue par défaut, les tests attendent l'anglais.
- La casse « uppercase » du design se fait par `text-transform:uppercase` en CSS, PAS en réécrivant les valeurs i18n (les tests assertent le `textContent`, insensible au CSS). Exceptions (chaînes réellement réécrites) : listées explicitement dans les tasks.
- **Aucune ressource externe** : jamais d'`@import` Google Fonts (le styles.css du design system Nocturne en contient un — NE PAS le copier tel quel), polices/icônes auto-hébergées uniquement. CSP réelle : `script-src 'self'` (aucun JS inline), `style-src 'self' 'unsafe-inline'` (styles inline tolérés ; on privilégie les classes, `element.style` en JS permis).
- État/stockage inchangés : clé `droidex-tracker-v1`, schéma `{owned,inBase,targetRB,targetCycle,flawless,wish}`, aucune migration, sync intacte.
- Sémantique métier intangible (CLAUDE.md) : états 0/1/2, badges barrés uniquement si rb < cible, « à garder », variante supérieure valide l'inférieure. Seul le FORMAT des libellés change (acté par Julien) : scénario canonique « ✓ RB10 · Gold » → « ✓ RB10·GLD ».
- Tokens (source : prototype + design system Nocturne, valeurs actées) : fond page `#101120`, texte `#e9e9ed`, accent `#9184d9`, accent-300 `#d2cefd`, accent-700 `#5d5294`, accent-800 `#423a6a`, neutres 300/400/500/600/700 `#cfd3e5/#b2b6ca/#9397ab/#75798c/#595d6c`, vert `#8fbf8f`, rouge `#d98a8a`, or flawless `#E3B341`, tiers `#8d90a0/#E3B341/#7FD4E8/#D98CE0/#C8CDD4`, base rgba accent `145,132,217`.
- Typo : Chakra Petch 500/600/700 (UI/titres) + IBM Plex Sans variable (corps), woff2 du bundle. Breakpoint desktop : **980px**.
- Tests : `cd tests && node test-droidex.js` doit finir `✅ Tous les tests passent`. jsdom ignore le CSS : les tasks à dominante CSS se vérifient visuellement (`docker compose -f docker-compose.local.yml up -d` → http://localhost:8080) contre `~/Downloads/redesign-app-futuriste/SCREENSHOT/{desktop,mobile,mobile-cards}.png`.
- Commits fréquents, message terminé par `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- `APP_VERSION` reste `1.2.5` jusqu'à la Task 7 (bump unique en fin de refonte).

---

### Task 1: Fondations — polices, icônes, tokens, base

**Files:**
- Create: `site/icons/game/worker.webp`, `astromech.webp`, `battle.webp`, `credits.webp`, `rebirth.png`, `super-rebirth.png` (copies renommées de `~/Downloads/redesign-app-futuriste/ICONES/`)
- Create: `site/fonts/chakra-petch-500.woff2`, `chakra-petch-600.woff2`, `chakra-petch-700.woff2`, `ibm-plex-sans-var.woff2` (copies du bundle `project/site/fonts/`)
- Modify: `site/styles.css` (tête de fichier : tokens + @font-face + base ; les anciennes règles de composants restent en place pour l'instant)
- Modify: `site/sw.js` (liste `SHELL`)

**Interfaces:**
- Produces: variables CSS `--bg --text --accent --accent-300 --accent-700 --accent-800 --n-300 --n-400 --n-500 --n-600 --n-700 --ok --danger --flaw --tier-0…--tier-4 --acc-rgb`, familles `'Chakra Petch'` et `'IBM Plex Sans'`, chemins `icons/game/*.{webp,png}`. Toutes les tasks suivantes en dépendent.

- [ ] **Step 1: Copier les assets**

```bash
cd "/Users/julien/DEV/PROJET COMMUNAUTAIRE/DROIDEX"
mkdir -p site/icons/game
cp ~/Downloads/redesign-app-futuriste/ICONES/Worker_Droid_-_Droid_-_Droid_Tycoon.webp site/icons/game/worker.webp
cp ~/Downloads/redesign-app-futuriste/ICONES/Astromech_Droid_-_Droid_-_Droid_Tycoon.webp site/icons/game/astromech.webp
cp ~/Downloads/redesign-app-futuriste/ICONES/Battle_Droid_-_Droid_-_Droid_Tycoon.webp site/icons/game/battle.webp
cp ~/Downloads/redesign-app-futuriste/ICONES/Credits_-_Icon_-_Droid_Tycoon.webp site/icons/game/credits.webp
cp ~/Downloads/redesign-app-futuriste/ICONES/rebirth.png site/icons/game/rebirth.png
cp "~/Downloads/redesign-app-futuriste/ICONES/super rebirth.png" site/icons/game/super-rebirth.png 2>/dev/null || cp ~/Downloads/redesign-app-futuriste/ICONES/super\ rebirth.png site/icons/game/super-rebirth.png
cp ~/Downloads/redesign-app-futuriste/project/site/fonts/*.woff2 site/fonts/
ls site/icons/game site/fonts
```

Inventorier les polices actuelles de `site/fonts/` (celles du thème Tatooine) : les fichiers qui ne sont plus référencés après le Step 2 seront supprimés au Step 3.

- [ ] **Step 2: Tokens + @font-face + base dans styles.css**

Remplacer en tête de `site/styles.css` l'actuel bloc `:root{…}` et les `@font-face` existants par (les autres règles du fichier restent inchangées pour l'instant — le site est temporairement hybride sur la branche, c'est prévu) :

```css
/* ---------- Nocturne : tokens ---------- */
:root{
  --bg:#101120; --text:#e9e9ed;
  --accent:#9184d9; --accent-300:#d2cefd; --accent-700:#5d5294; --accent-800:#423a6a;
  --n-300:#cfd3e5; --n-400:#b2b6ca; --n-500:#9397ab; --n-600:#75798c; --n-700:#595d6c;
  --ok:#8fbf8f; --danger:#d98a8a; --flaw:#E3B341;
  --tier-0:#8d90a0; --tier-1:#E3B341; --tier-2:#7FD4E8; --tier-3:#D98CE0; --tier-4:#C8CDD4;
  --acc-rgb:145,132,217;
  --font-hud:'Chakra Petch',sans-serif;
  --font-body:'IBM Plex Sans',system-ui,sans-serif;
  /* alias de compatibilité pour les anciennes règles encore présentes : */
  --sand:var(--text); --sand-dim:var(--n-400); --line:rgba(var(--acc-rgb),.25); --jawa:var(--accent);
}
@font-face{font-family:'Chakra Petch';font-style:normal;font-weight:500;font-display:swap;src:url('fonts/chakra-petch-500.woff2') format('woff2')}
@font-face{font-family:'Chakra Petch';font-style:normal;font-weight:600;font-display:swap;src:url('fonts/chakra-petch-600.woff2') format('woff2')}
@font-face{font-family:'Chakra Petch';font-style:normal;font-weight:700;font-display:swap;src:url('fonts/chakra-petch-700.woff2') format('woff2')}
@font-face{font-family:'IBM Plex Sans';font-style:normal;font-weight:100 700;font-display:swap;src:url('fonts/ibm-plex-sans-var.woff2') format('woff2-variations')}
html,body{margin:0;background:var(--bg)}
body{
  font-family:var(--font-body);color:var(--text);
  background:radial-gradient(ellipse at 50% -10%, rgba(var(--acc-rgb),.09), var(--bg) 55%) var(--bg);
  background-attachment:fixed;
}
@keyframes pulseGlow{0%,100%{box-shadow:0 0 5px rgba(143,191,143,.25)}50%{box-shadow:0 0 16px rgba(143,191,143,.75)}}
a{color:var(--accent-300)}a:hover{color:var(--accent)}
input::placeholder{color:#6b6e80}
button{-webkit-tap-highlight-color:transparent}
```

Les alias `--sand/--sand-dim/--line/--jawa` pointent vers les tokens Nocturne pour que les anciennes règles restantes rendent déjà dans la nouvelle palette. Adapter les anciens `@font-face`/`font-family` du fichier : toute référence aux anciennes familles Tatooine passe à `var(--font-body)`.

- [ ] **Step 3: sw.js + ménage polices**

Dans `site/sw.js`, mettre à jour le tableau `SHELL` : retirer les entrées des anciennes polices, ajouter :
`'fonts/chakra-petch-500.woff2','fonts/chakra-petch-600.woff2','fonts/chakra-petch-700.woff2','fonts/ibm-plex-sans-var.woff2','icons/game/worker.webp','icons/game/astromech.webp','icons/game/battle.webp','icons/game/credits.webp','icons/game/rebirth.png','icons/game/super-rebirth.png'`.
Supprimer de `site/fonts/` les anciens fichiers devenus non référencés (vérifier avec `grep -rn "fonts/" site/*.css site/sw.js`).

- [ ] **Step 4: Tests + vérification visuelle**

Run: `cd tests && node test-droidex.js` — Expected: `✅ Tous les tests passent` (aucun changement DOM).
Puis `docker compose -f docker-compose.local.yml up -d` → http://localhost:8080 : fond violet nuit + halo, typographies chargées (onglet Réseau : woff2 en 200), pas de requête externe.

- [ ] **Step 5: Commit**

```bash
git add site/styles.css site/sw.js site/fonts site/icons/game
git commit -m "Nocturne foundations: tokens, self-hosted fonts, game icons, SW cache list

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Header, barre sync, squelette de layout

**Files:**
- Modify: `site/index.html` (header, sync-bar remontée sous le header, conteneurs `.layout`/`.side`/`.main`, meta theme-color)
- Modify: `site/app.js` (`renderProgress`)
- Modify: `site/i18n.js` (clés header)
- Modify: `site/styles.css` (header, sync-bar, layout)
- Test: `tests/test-droidex.js`

**Interfaces:**
- Consumes: tokens/fonts Task 1.
- Produces: `#progressSegs` (10 `<span class="seg">`, classe `on` = allumé), `#progressLabel` au format `String(done).padStart(3,'0')+'/'+total` (ex. `000/317`), conteneurs `<aside class="side" id="sidePanel">` (reçoit rb-panel Task 3 et filtres Task 4) et `<main class="main">` (recherche/liste/footer). La sync-bar (`#syncBar`) est visible en haut de page (l'attribut `hidden` initial est conservé — sync.js le retire quand PB_URL est configurée, comportement inchangé).

- [ ] **Step 1: Adapter les tests (rouge attendu)**

Dans `tests/test-droidex.js` :
- Ligne 53 : `assert(label === '000/317', 'progression "000/317" (obtenu : "' + label + '")');`
- Ligne 151 : `assert(label === '001/317', 'progression 001/317 (obtenu : "' + label + '")');`
- Dans la section `[1] Démarrage vierge`, ajouter après l'assertion de progression :

```js
    const segs = w.document.getElementById('progressSegs');
    assert(segs && segs.children.length === 10, '10 segments de progression rendus');
    assert([...segs.children].every(s => !s.classList.contains('on')), 'aucun segment allumé à vide');
```

Run: `cd tests && node test-droidex.js` — Expected: FAIL (« 000/317 » ≠ « 0 / 317 variants », segments absents).

- [ ] **Step 2: index.html — header + sync-bar + layout**

Remplacer le bloc `<header>…</header>` (lignes ~52-66) par :

```html
  <header>
    <div class="hdr">
      <span class="brand" data-i18n="h1short">DROIDEX</span>
      <span class="brand-sub" data-i18n="eyebrow">▸ Droid Tycoon // Registry</span>
      <div class="progress-line">
        <div class="progress-segs" id="progressSegs"><span class="seg"></span><span class="seg"></span><span class="seg"></span><span class="seg"></span><span class="seg"></span><span class="seg"></span><span class="seg"></span><span class="seg"></span><span class="seg"></span><span class="seg"></span></div>
        <span class="progress-label" id="progressLabel">—</span>
      </div>
      <span class="collection-bonus" id="collectionBonus"></span>
      <select id="langSelect" class="lang-select" aria-label="Language">
        <option value="en">EN</option>
        <option value="fr">FR</option>
      </select>
    </div>
  </header>
```

Puis déplacer le bloc `.sync-bar` existant (actuellement en bas, lignes ~124-131) juste APRÈS `</header>`, sans en changer le contenu ni les ids. Envelopper ensuite le reste (rb-panel, controls, loading, noscript, list, footer, legal, version) dans :

```html
  <div class="layout">
    <aside class="side" id="sidePanel">
      <!-- rb-panel existant déplacé ici tel quel (Task 3 le restylera) -->
    </aside>
    <main class="main">
      <!-- controls, loading, noscript, list, footer, legal, version -->
    </main>
  </div>
```

Le `<h1>` disparaît au profit de `.brand` : conserver un `<h1>` accessible/SEO en `visually-hidden` juste après `<body>` : `<h1 class="vh" data-i18n="h1">Droidex — Droidsmith's Registry</h1>`. Mettre à jour `<meta name="theme-color" content="#101120">`.

- [ ] **Step 3: i18n — clés header**

`site/i18n.js` — dans les deux dictionnaires, ajouter/modifier (EN puis FR) :

```js
    h1short: 'DROIDEX',
    eyebrow: '▸ Droid Tycoon // Registry',
```
FR : `h1short: 'DROIDEX', eyebrow: '▸ Droid Tycoon // Registry',` (identiques — marque non traduite).
La clé `collectionBonus` existante change de format : EN `'{0} distinct · bonus +{1}%'`, FR `'{0} distincts · bonus +{1}%'`.

- [ ] **Step 4: app.js — renderProgress segmenté**

Remplacer le corps de `renderProgress()` (site/app.js ~l. 224-235) par :

```js
function renderProgress(){
  let total=0,done=0;
  DROIDS.forEach(d=>{
    if(d.iconic){total+=1;if(state.owned[d.id]===true)done+=1;}
    else{total+=5;done+=ownedTiers(d.id).filter(v=>v>=1).length;}
  });
  const segs=document.getElementById('progressSegs');
  const lit=total?Math.round(done/total*10):0;
  [...segs.children].forEach((s,i)=>s.classList.toggle('on',i<lit));
  document.getElementById('progressLabel').textContent=String(done).padStart(3,'0')+'/'+total;
  const n=distinctOwned();
  document.getElementById('collectionBonus').textContent=t('collectionBonus', n, n);
}
```

Supprimer les références restantes à `progressFill` (recherche `grep -n progressFill site/app.js`).

- [ ] **Step 5: CSS — header/sync/layout**

Dans `site/styles.css`, remplacer les règles `header/.header-top/.eyebrow/h1/.progress-*/.collection-bonus/.lang-select` et `.sync-bar` par :

```css
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
header{border-bottom:1px solid rgba(var(--acc-rgb),.25)}
.hdr{display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:13px 18px}
.brand{font-family:var(--font-hud);font-size:19px;font-weight:700;letter-spacing:.08em;text-shadow:0 0 14px rgba(var(--acc-rgb),.45)}
.brand-sub{font-family:var(--font-hud);font-size:9px;letter-spacing:.24em;text-transform:uppercase;color:var(--accent)}
.progress-line{flex:1;display:flex;align-items:center;gap:10px;min-width:180px;max-width:380px;margin:0 auto}
.progress-segs{flex:1;display:flex;gap:2px;height:5px}
.seg{flex:1;background:rgba(var(--acc-rgb),.15)}
.seg.on{background:var(--accent);box-shadow:0 0 8px rgba(var(--acc-rgb),.6)}
.progress-label{font-family:var(--font-hud);font-size:11px;color:var(--accent-300);white-space:nowrap}
.collection-bonus{font-family:var(--font-hud);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--n-400)}
.lang-select{font-family:var(--font-hud);font-size:10px;letter-spacing:.1em;color:var(--n-300);border:1px solid var(--accent-800);background:rgba(var(--acc-rgb),.06);padding:3px 6px}
.sync-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:space-between;padding:8px 14px;border-bottom:1px solid rgba(var(--acc-rgb),.15);background:rgba(var(--acc-rgb),.03)}
.sync-bar[hidden]{display:none}
.layout{display:block;padding:14px 14px 0;max-width:560px;margin:0 auto}
@media(min-width:980px){
  .layout{display:grid;grid-template-columns:310px minmax(0,1fr);gap:22px;padding:18px 22px;max-width:1280px}
  .side{display:flex;flex-direction:column;gap:16px;position:sticky;top:12px;align-self:start;max-height:calc(100vh - 24px);overflow:auto}
}
.main{display:flex;flex-direction:column;gap:14px;min-width:0}
@media(max-width:979px){.hdr{padding:10px 14px 9px}.brand{font-size:16px}}
```

Supprimer l'ancienne règle `.wrap` (le div `.wrap` d'index.html est remplacé par la structure header/sync/layout ; retirer aussi la div `.wrap` du HTML si encore présente).

- [ ] **Step 6: Tests verts + visuel**

Run: `cd tests && node test-droidex.js` — Expected: `✅ Tous les tests passent`.
Visuel : header conforme à `SCREENSHOT/desktop.png` (bandeau haut) et `mobile.png` ; à ≥980px la grille sidebar apparaît (vide côté aside pour l'instant, c'est attendu).

- [ ] **Step 7: Commit**

```bash
git add site/index.html site/app.js site/i18n.js site/styles.css tests/test-droidex.js
git commit -m "Nocturne header, sync bar and responsive layout shell (segmented progress)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Panneau cible (rb-panel)

**Files:**
- Modify: `site/index.html` (bloc `.rb-panel` dans `#sidePanel`)
- Modify: `site/app.js` (`renderRBPanel`)
- Modify: `site/i18n.js`
- Modify: `site/styles.css`
- Test: `tests/test-droidex.js`

**Interfaces:**
- Consumes: `#sidePanel` (Task 2), tokens/icônes (Task 1).
- Produces: `#readyBadge` (texte `t('readyCount', n, total)` ou `t('rebirthReady')`, classe `all` quand tout est prêt) ; lignes `.rb-req` avec classes d'état `met`/`part`/`unmet` ; `#rbCreditsBig` (montant) ; `#rbCredits` (note). Les ids `cycleSelect`/`rbSelect`/`superRebirthBtn`/`rbReqs` sont conservés.

- [ ] **Step 1: Tests (rouge attendu)**

Ajouter dans la section `[11] Cycles et RB 24-27` (ou en nouvelle sous-section de `[3]` si plus simple — au choix de l'implémenteur, mais les asserts suivants doivent exister) :

```js
    // badge "prêt" : état vierge, cible RB1 → 0 / 3
    const badge = w.document.getElementById('readyBadge');
    assert(badge && badge.textContent === '0 / 3 ready', 'badge prêt "0 / 3 ready" (obtenu : "' + (badge && badge.textContent) + '")');
    assert(!badge.classList.contains('all'), 'badge prêt non-pulsant à vide');
```

Et dans une section avec les 3 exigences de RB1 cycle 1 en base (seed : `{"owned":{"cb":[2,0,0,0,0],"pit":[2,0,0,0,0],"drk1":[2,0,0,0,0]},"targetRB":1,"targetCycle":1}`) :

```js
    assert(badge2.textContent === '✓ Rebirth ready', 'badge "✓ Rebirth ready" quand 3/3');
    assert(badge2.classList.contains('all'), 'badge pulsant quand 3/3');
```

(Les exigences RB1 cycle 1 sont `cb`, `pit`, `drk1` en Basic — vérifiable dans `site/data.js`, `REBIRTHS[1][1]`. Si le seed choisi ne correspond pas, l'implémenteur ajuste les ids depuis data.js, pas les asserts.)

Run — Expected: FAIL (`readyBadge` absent).

- [ ] **Step 2: index.html — markup du panneau**

Remplacer le bloc `.rb-panel` par :

```html
      <div class="rb-panel">
        <div class="rb-head">
          <span class="rb-title"><img src="icons/game/rebirth.png" alt="" class="ico-rb"><span data-i18n="rbTitle">Target · Rebirth</span></span>
          <span class="ready-badge" id="readyBadge"></span>
        </div>
        <div class="rb-selects">
          <select id="cycleSelect" data-i18n-aria="cycleAria" aria-label="Rebirth cycle"></select>
          <select id="rbSelect" data-i18n-aria="rbAria" aria-label="Targeted rebirth"></select>
          <button id="superRebirthBtn" class="super-rb-btn" data-i18n="superRebirthBtn" data-i18n-aria="superRebirthAria" aria-label="Apply a super rebirth"><img src="icons/game/super-rebirth.png" alt="" class="ico-srb">SUPER RB</button>
        </div>
        <div class="rb-reqs" id="rbReqs"></div>
        <div class="rb-credits-row">
          <span class="rb-credits-big"><img src="icons/game/credits.webp" alt="" class="ico-cred">​<span id="rbCreditsBig">—</span></span>
          <span class="rb-credits-note" id="rbCredits"></span>
        </div>
      </div>
```

Attention : le libellé du bouton devient l'image + le texte de la clé `superRebirthBtn` — le `data-i18n` remplace le textContent du bouton, ce qui écraserait l'`<img>`. Solution : mettre le `data-i18n` sur un `<span>` interne : `<button id="superRebirthBtn" class="super-rb-btn" data-i18n-aria="superRebirthAria" aria-label="Apply a super rebirth"><img src="icons/game/super-rebirth.png" alt="" class="ico-srb"><span data-i18n="superRebirthBtn">SUPER RB</span></button>`.

- [ ] **Step 3: i18n**

Deux dictionnaires (EN / FR) :

```js
    rbTitle: 'Target · Rebirth',                    // FR : 'Cible · Renaissance'
    superRebirthBtn: 'SUPER RB',                    // FR : 'SUPER RB' (abréviation identique)
    readyCount: '{0} / {1} ready',                  // FR : '{0} / {1} prêts'
    rebirthReady: '✓ Rebirth ready',                // FR : '✓ Renaissance prête'
    cycleShort: 'CYC',                              // FR : 'CYC'
    rbShort: 'RB',                                  // FR : 'RB'
    minInBase: '· in base',                         // FR : '· en base'
    minNotInBase: '· not in base',                  // FR : '· hors base'
    minimum: 'min',                                 // FR : 'min'
    credits: 'Credits required',                    // FR : 'Crédits requis'
    unlocks: 'Unlock: {0}',                         // FR : 'Débloque : {0}'
```

`credits` perd son `<b>{0}</b>` (le montant part dans `#rbCreditsBig`) ; vérifier l'appel `t('credits', …)` dans app.js et retirer l'argument devenu inutile. `superRebirthConfirm`/`superRebirthAria` existants inchangés.

- [ ] **Step 4: app.js — renderRBPanel**

Adapter `renderRBPanel()` (~l. 180-222) :

```js
  [...cyc.options].forEach((o,idx)=>{ o.textContent=t('cycleShort')+' '+(idx+1); });
  // options rbSelect : t('rbShort')+' '+i  (même principe, dans la boucle de peuplement existante)
```

Rendu des exigences + badge :

```js
  let ready=0;
  needed.forEach(({d,tier})=>{
    const owned=meetsReq(d.id,tier);
    const isReady=inBaseReq(d.id,tier);
    if(isReady) ready++;
    const row=document.createElement('div');
    row.className='rb-req '+(isReady?'met':(owned?'part':'unmet'));
    let icon,note;
    if(isReady){icon='✓';note=TIERS[tier]+' '+t('minInBase');}
    else if(owned){icon='⚠';note=TIERS[tier]+' '+t('minNotInBase');}
    else{icon='✗';note=TIERS[tier]+' '+t('minimum');}
    row.innerHTML='<span class="status">'+icon+'</span><span class="rq-name">'+d.n+'</span>'+
      '<span class="rq-note">'+note+'</span>';
    reqsEl.appendChild(row);
  });
  const badge=document.getElementById('readyBadge');
  const allReady=needed.length>0 && ready===needed.length;
  badge.textContent=allReady?t('rebirthReady'):t('readyCount', ready, needed.length);
  badge.classList.toggle('all',allReady);
  document.getElementById('rbCreditsBig').textContent=RB_CREDITS[state.targetRB]||'—';
  let note=t('credits');
  if(state.targetCycle===1 && RB_UNLOCKS[state.targetRB]) note+=' · '+t('unlocks', RB_UNLOCKS[state.targetRB]);
  document.getElementById('rbCredits').textContent=note;
```

- [ ] **Step 5: CSS — panneau brackets**

Remplacer les règles `.rb-panel/.rb-head/.rb-title/.rb-selects/.rb-req*/.rb-credits*` par :

```css
.rb-panel{position:relative;background:rgba(var(--acc-rgb),.05);padding:14px;background-image:repeating-linear-gradient(0deg,rgba(var(--acc-rgb),.045) 0 1px,transparent 1px 3px)}
.rb-panel::before{content:'';position:absolute;inset:0;pointer-events:none;border:1px solid rgba(var(--acc-rgb),.3);clip-path:polygon(0 0,14px 0,14px 1px,1px 1px,1px 14px,0 14px,0 100%,14px 100%,14px calc(100% - 1px),1px calc(100% - 1px),1px calc(100% - 14px),0 calc(100% - 14px))}
.rb-panel::after{content:'';position:absolute;inset:0;pointer-events:none;border:1px solid rgba(var(--acc-rgb),.3);clip-path:polygon(100% 0,calc(100% - 14px) 0,calc(100% - 14px) 1px,calc(100% - 1px) 1px,calc(100% - 1px) 14px,100% 14px,100% 100%,calc(100% - 14px) 100%,calc(100% - 14px) calc(100% - 1px),calc(100% - 1px) calc(100% - 1px),calc(100% - 1px) calc(100% - 14px),100% calc(100% - 14px))}
.rb-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.rb-title{font-family:var(--font-hud);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.ico-rb{width:13px;height:13px;flex:none;filter:drop-shadow(0 0 4px rgba(143,191,143,.5))}
.ready-badge{font-family:var(--font-hud);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);border:1px dashed rgba(var(--acc-rgb),.5);padding:3px 7px;white-space:nowrap}
.ready-badge.all{color:var(--ok);border:1px solid rgba(143,191,143,.7);animation:pulseGlow 1.6s ease-in-out infinite}
.rb-selects{display:flex;gap:6px;margin-top:10px}
.rb-selects select{font-family:var(--font-hud);font-size:10.5px;color:var(--n-300);border:1px solid var(--accent-800);background:rgba(var(--acc-rgb),.06);padding:4px 6px}
.rb-selects #rbSelect{color:var(--accent-300);border-color:var(--accent);box-shadow:0 0 8px rgba(var(--acc-rgb),.25)}
.super-rb-btn{font-family:var(--font-hud);font-size:9.5px;letter-spacing:.08em;color:var(--accent-300);border:1px dashed rgba(var(--acc-rgb),.55);background:transparent;padding:4px 8px;cursor:pointer;display:inline-flex;align-items:center;gap:5px}
.super-rb-btn:hover{background:rgba(var(--acc-rgb),.12)}
.ico-srb{width:12px;height:12px;filter:drop-shadow(0 0 4px rgba(var(--acc-rgb),.5))}
.rb-reqs{display:flex;flex-direction:column;gap:5px;margin-top:10px}
.rb-req{display:flex;align-items:center;gap:9px;padding:7px 10px;border-left:2px solid var(--n-600);background:linear-gradient(90deg,rgba(255,255,255,.03),transparent 70%)}
.rb-req.met{border-left-color:var(--ok);background:linear-gradient(90deg,rgba(143,191,143,.1),transparent 70%)}
.rb-req.part{border-left-color:var(--accent);background:linear-gradient(90deg,rgba(var(--acc-rgb),.12),transparent 70%)}
.rb-req .status{font-family:var(--font-hud);font-size:12px;width:14px;text-align:center;color:var(--n-400)}
.rb-req.met .status{color:var(--ok)}
.rb-req.part .status{color:var(--accent)}
.rq-name{font-size:12.5px}
.rq-note{margin-left:auto;font-family:var(--font-hud);font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--n-300)}
.rb-credits-row{display:flex;align-items:baseline;gap:8px;margin-top:11px;font-family:var(--font-hud);flex-wrap:wrap}
.rb-credits-big{display:inline-flex;align-items:center;gap:7px;font-size:19px;font-weight:700;color:var(--accent-300);text-shadow:0 0 12px rgba(var(--acc-rgb),.5)}
.ico-cred{width:17px;height:17px;filter:drop-shadow(0 0 5px rgba(227,179,65,.5))}
.rb-credits-note{font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--n-400);line-height:1.5}
```

Supprimer l'ancienne règle `.tool-btn.super-rb-btn` (le bouton n'a plus la classe `tool-btn`).

- [ ] **Step 6: Tests verts + visuel**

Run: `cd tests && node test-droidex.js` — Expected: `✅ Tous les tests passent` (y compris section [15] super-renaissance : le bouton garde son id et son confirm).
Visuel vs `SCREENSHOT/desktop.png` (panneau gauche) et `mobile.png` (panneau haut) : brackets, lignes colorées, badge pulsant si 3/3.

- [ ] **Step 7: Commit**

```bash
git add site/index.html site/app.js site/i18n.js site/styles.css tests/test-droidex.js
git commit -m "Nocturne target panel: bracket frame, ready badge, credits row

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Recherche, tri, filtres à compteurs

**Files:**
- Modify: `site/index.html` (bloc `.controls` → barre sticky + conteneurs filtres)
- Modify: `site/app.js` (`renderFilters()` nouveau, branchement)
- Modify: `site/i18n.js`
- Modify: `site/styles.css`
- Test: `tests/test-droidex.js`

**Interfaces:**
- Consumes: `.side`/`.main` (Task 2).
- Produces: `renderFilters()` — reconstruit les boutons de filtre avec compteurs dans `#filtersSide` (sidebar desktop) ET `#filtersChips` (chips mobile) ; appelée par `renderAll()`. Chaque bouton : `class="chip"` + `data-filter`, contenu `<span class="chip-label">…</span><span class="chip-count">N</span>`. Le compteur = nombre de droïdes passant `droidMatches` avec ce filtre (la recherche courante s'applique).

- [ ] **Step 1: Tests (rouge attendu)**

Nouvelle section avant le résumé final :

```js
  /* ---- 16. Filtres à compteurs ---- */
  console.log('\n[16] Filtres à compteurs');
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
```

Run — Expected: FAIL (`filtersSide` absent).

- [ ] **Step 2: index.html — barre sticky + conteneurs**

Remplacer le bloc `.controls` par (dans `.main`, en tête) :

```html
      <div class="searchbar">
        <div class="search-row">
          <div class="search-box"><span class="search-glyph">⌕</span>
            <input type="search" id="search" data-i18n-placeholder="searchPlaceholder" data-i18n-aria="searchAria" placeholder="Scan registry… (e.g. R6)" aria-label="Search">
          </div>
          <select id="sortSelect" data-i18n-aria="sortAria" aria-label="Sort">
            <option value="rarity" data-i18n="sortRarity">Rarity</option>
            <option value="income" data-i18n="sortIncome">Income</option>
          </select>
          <span class="hint-i" id="hintI" data-i18n-title="hintFull" title="">i</span>
        </div>
        <div class="chips" id="filtersChips" role="tablist"></div>
      </div>
```

Et dans `#sidePanel`, après le rb-panel :

```html
      <div class="filters-side">
        <div class="filters-head" data-i18n="filtersHead">◈ Filters</div>
        <div id="filtersSide"></div>
      </div>
```

Les 8 boutons statiques `.chip` disparaissent du HTML (générés par `renderFilters()`). Le mécanisme `data-i18n-title` n'existe pas encore dans i18n.js : l'ajouter (même principe que `data-i18n-aria`, il pose `title`) — voir Step 3.

- [ ] **Step 3: i18n**

Ajouter le support `data-i18n-title` dans la fonction d'application des attributs de `site/i18n.js` (à côté du traitement `data-i18n-aria`, en copiant son pattern avec `setAttribute('title', …)`).
Clés (EN / FR) :

```js
    filtersHead: '◈ Filters',                        // FR : '◈ Filtres'
    searchPlaceholder: 'Scan registry… (e.g. R6)',   // FR : 'Scanner le registre… (ex. R6)'
    sortRarity: 'Rarity',                            // FR : 'Rareté'
    sortIncome: 'Income',                            // FR : 'Revenu'
    filterAll: 'All',            // FR : 'Tous'
    filterKeep: 'Keep',          // FR : 'Garder'
    filterMissing: 'Missing',    // FR : 'Manquants'
    filterBase: 'In base',       // FR : 'En base'
    filterWish: 'Wish ★',        // FR : 'Wish ★'
    filterWorker: 'Worker', filterAstromech: 'Astromech', filterBattle: 'Battle',  // identiques FR
    hintFull: '1 tap = owned (Droidex) · 2 taps = in base · 3 taps = clear · ★ = wishlist · ✦ = Flawless unlocked (rare permanent drop)',
    // FR : '1 tap = possédé (Droidex) · 2 taps = en base · 3 taps = vide · ★ = wishlist · ✦ = Flawless débloqué (drop permanent rare)',
```

Les anciennes clés `hint`/`legendIcons` sont supprimées des deux dictionnaires (fusionnées dans `hintFull`) ; retirer leurs `div` d'index.html.

- [ ] **Step 4: app.js — renderFilters**

Ajouter (près de `droidMatches`) :

```js
const FILTER_DEFS=[['all','filterAll'],['keep','filterKeep'],['missing','filterMissing'],['base','filterBase'],['wish','filterWish'],['Worker','filterWorker'],['Astromech','filterAstromech'],['Battle','filterBattle']];
function countFor(f){
  const prev=filter; filter=f;
  const n=DROIDS.filter(droidMatches).length;
  filter=prev; return n;
}
function renderFilters(){
  ['filtersSide','filtersChips'].forEach(cid=>{
    const box=document.getElementById(cid);
    if(!box) return;
    box.innerHTML='';
    FILTER_DEFS.forEach(([f,key])=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='chip'+(filter===f?' active':'');
      b.dataset.filter=f;
      b.innerHTML='<span class="chip-label">'+t(key)+'</span><span class="chip-count">'+countFor(f)+'</span>';
      b.addEventListener('click',()=>{ filter=f; renderFilters(); renderList(); });
      box.appendChild(b);
    });
  });
}
```

Supprimer l'ancien branchement `document.querySelectorAll('.chip').forEach(…)` (~l. 412-419). Ajouter `renderFilters()` dans `renderAll()` (avant `renderList()`), et l'appeler aussi dans le handler de recherche (`input`) pour rafraîchir les compteurs pendant la frappe.

- [ ] **Step 5: CSS**

Remplacer `.controls/.search/.chips/.chip/.chip-select` par :

```css
.searchbar{position:sticky;top:0;z-index:10;display:flex;flex-direction:column;gap:10px;padding:14px 10px 11px;margin:-14px -10px 0;background:radial-gradient(ellipse at 50% -10%, rgba(var(--acc-rgb),.09), var(--bg) 55%) var(--bg);background-attachment:fixed}
@media(min-width:980px){.searchbar{padding:18px 12px 13px;margin:-18px -12px 0}}
.search-row{display:flex;gap:6px}
.search-box{flex:1;display:flex;align-items:center;gap:8px;border:1px solid var(--accent-800);padding:0 12px;background:rgba(var(--acc-rgb),.04)}
.search-glyph{color:var(--accent);font-size:13px}
.search-box input{flex:1;background:transparent;border:none;outline:none;color:var(--text);font-size:13px;padding:9px 0;font-family:inherit;min-width:0}
.search-row select{font-family:var(--font-hud);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--n-300);border:1px solid var(--accent-800);background:rgba(var(--acc-rgb),.04);padding:0 9px}
.hint-i{font-family:var(--font-hud);font-size:10px;font-weight:600;color:var(--n-400);border:1px solid var(--n-700);border-radius:50%;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;align-self:center;cursor:help;flex:none}
.hint-i:hover{color:var(--accent-300);border-color:var(--accent)}
.chips{display:flex;gap:6px;flex-wrap:wrap;font-family:var(--font-hud)}
#filtersChips .chip{font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:5px 11px;border:1px solid var(--n-700);color:var(--n-300);background:transparent;cursor:pointer;display:inline-flex;gap:6px}
#filtersChips .chip.active{border-color:var(--accent);color:var(--accent-300);background:rgba(var(--acc-rgb),.12)}
#filtersChips .chip-count{opacity:.55}
.filters-side{display:none}
@media(min-width:980px){
  .filters-side{display:flex;flex-direction:column;gap:2px;font-family:var(--font-hud)}
  .filters-head{font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--n-400);padding:0 4px 7px}
  #filtersSide .chip{display:flex;width:100%;text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:7px 10px;background:transparent;color:var(--n-300);border:none;border-left:2px solid transparent;cursor:pointer}
  #filtersSide .chip.active{background:rgba(var(--acc-rgb),.12);color:var(--accent-300);border-left-color:var(--accent)}
  #filtersSide .chip-count{margin-left:auto;color:var(--n-500)}
  #filtersChips{display:none}
}
```

- [ ] **Step 6: Tests verts + visuel** — `cd tests && node test-droidex.js` → `✅` ; visuel : compteurs conformes à `SCREENSHOT/desktop.png` (TOUS 69, sidebar) et `mobile.png` (chips).

- [ ] **Step 7: Commit**

```bash
git add site/index.html site/app.js site/i18n.js site/styles.css tests/test-droidex.js
git commit -m "Nocturne search bar and counted filters (sidebar + mobile chips)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Cartes droïde

**Files:**
- Modify: `site/app.js` (`renderDroid`, sections dans `renderList`)
- Modify: `site/i18n.js` (`_tierShort`, clés cartes)
- Modify: `site/styles.css`
- Test: `tests/test-droidex.js`

**Interfaces:**
- Consumes: tokens/icônes (Task 1), `TIER_SHORT` global (réassigné par `setLang`).
- Produces: cartes `.droid` au nouveau format. **Le scénario canonique change ici** : badge « ✓ RB10·GLD » (séparateur `·` sans espaces, `TIER_SHORT` au lieu de `TIERS`).

- [ ] **Step 1: Tests (rouge attendu)**

Adapter les asserts existants du scénario canonique Strike-Orb (chercher `RB10` dans tests/test-droidex.js) : la chaîne attendue devient `'✓ RB10·GLD'` (EN, cible 10) et la classe `done` (barré) à cible 11 est inchangée. Adapter tout assert qui vérifie les libellés de boutons de variante (attendus : `BAS/GLD/DIA/RBW/BSK`). Ajouter :

```js
    // icône de classe sur la carte
    const gonk = findCard(w, 'Gonk');
    assert(gonk && gonk.querySelector('.type-ico.t-worker'), 'icône de classe Worker sur Gonk');
    // ligne valeur avec icône crédits
    assert(gonk.querySelector('.value-line .ico-cred'), 'icône crédits dans la ligne de valeur');
```

Run — Expected: FAIL (`✓ RB10 · Gold` ≠ `✓ RB10·GLD`, `.type-ico` absent).

- [ ] **Step 2: i18n — TIER_SHORT abrégés**

Dans les deux dictionnaires, `_tierShort` devient **`['BAS','GLD','DIA','RBW','BSK']`** (identique EN/FR — acté). `_tiers` (libellés longs, utilisés par le panneau cible et les aria-labels) inchangés. Clés cartes (EN / FR) :

```js
    keepTag: 'Keep',        // FR : 'Garder'   (uppercase via CSS)
    owned: 'Owned',         // FR : 'Possédé'
    notOwned: 'Not owned',  // FR : 'Non possédé'
    inBase: '⌂ In base',    // FR : '⌂ En base'
    notInBase: 'Not in base', // FR : 'Hors base'
```

- [ ] **Step 3: app.js — renderDroid**

Modifier `renderDroid()` (~l. 290-403) — uniquement les portions listées, les toggles ★/✦ et les listeners de variantes sont inchangés :

a) En-tête de carte (remplace le bloc `top`) :

```js
  let top='<div class="droid-top"><span class="droid-name">'+d.n+'</span>'+
    '<span class="type-ico t-'+d.t.toLowerCase()+'" role="img" aria-label="'+d.t+'" title="'+d.t+'"></span>'+
    '<span class="card-actions"></span>';
  if(ki) top+='<span class="keep-tag">'+t('keepTag')+'</span>';
  top+='</div>';
```

b) Badges d'exigence — la ligne du texte devient :

```js
      return '<span class="req-badge'+cls+'">'+prefix+'RB'+rb+'·'+TIER_SHORT[tier]+'</span>';
```

c) Ligne de valeur — remplacer `💰 ` par une icône dans les deux branches :

```js
    value='<div class="value-line"><span class="ico-cred" aria-hidden="true"></span>'+fmtInc(d.inc[0])+'/s → '+fmtInc(d.inc[4])+'/s'+ …
```

(même changement pour la branche iconique `+15%/s`). `.ico-cred` en `<span>` à background-image (défini au Step 4) pour rester sur `innerHTML` sans balise img à attributs dynamiques.

d) Boutons de variante — le flawless passe de `✨` à `✦` (prototype) : dans la création de `flawBtn`, `flawBtn.textContent='✦';`. La légende i18n `hintFull` (Task 4) utilise déjà ✦.

- [ ] **Step 4: CSS — cartes**

Remplacer les règles `.droid/.droid-top/.droid-name/.droid-type/.keep-tag/.req-badge*/.value-line/.tiers/.tier/.lamp/.iconic-own/.base-toggle/.icon-btn/.rarity-section/.rarity-title/.empty` par le bloc suivant (valeurs du prototype) :

```css
.rarity-section{display:flex;flex-direction:column;gap:11px;margin-top:14px}
.rarity-title{display:flex;align-items:center;gap:10px;font-family:var(--font-hud);font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:var(--accent-300)}
.rarity-title::before{content:'◈';color:var(--accent);letter-spacing:0}
.rarity-title .count{letter-spacing:0;color:var(--n-400)}
.rarity-title::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(var(--acc-rgb),.5),transparent)}
#list{display:block}
.cards{display:grid;grid-template-columns:1fr;gap:12px}
@media(min-width:980px){.cards{grid-template-columns:1fr 1fr}}
.droid{position:relative;display:flex;flex-direction:column;gap:8px;padding:12px 14px;background:rgba(var(--acc-rgb),.04);border:1px solid rgba(var(--acc-rgb),.15);background-image:repeating-linear-gradient(0deg,rgba(var(--acc-rgb),.03) 0 1px,transparent 1px 3px)}
.droid.keep{background:rgba(var(--acc-rgb),.06);border-color:rgba(var(--acc-rgb),.3);border-left:2px solid var(--accent);box-shadow:inset 6px 0 14px -8px rgba(var(--acc-rgb),.5)}
.droid-top{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.droid-name{font-family:var(--font-hud);font-size:14.5px;font-weight:600;letter-spacing:.03em;text-transform:uppercase}
.type-ico{width:15px;height:15px;align-self:center;flex:none;background-size:contain;background-repeat:no-repeat;background-position:center;filter:drop-shadow(0 0 4px rgba(var(--acc-rgb),.35))}
.type-ico.t-worker{background-image:url('icons/game/worker.webp')}
.type-ico.t-astromech{background-image:url('icons/game/astromech.webp')}
.type-ico.t-battle{background-image:url('icons/game/battle.webp')}
.card-actions{margin-left:auto;display:inline-flex;gap:2px}
.icon-btn{background:none;border:none;cursor:pointer;font-size:13px;line-height:1;padding:2px 4px;color:var(--n-500)}
.icon-btn.on-wish{color:var(--accent)}
.icon-btn.flaw{color:var(--n-600)}
.icon-btn.on-flaw{color:var(--flaw);text-shadow:0 0 8px rgba(227,179,65,.8)}
.icon-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}
.keep-tag{font-family:var(--font-hud);font-size:8.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#161826;background:var(--accent);padding:2px 7px}
.req-badges{display:flex;gap:4px;flex-wrap:wrap;font-family:var(--font-hud)}
.req-badge{font-size:9px;letter-spacing:.05em;color:var(--accent-300);border:1px solid var(--accent-700);background:rgba(var(--acc-rgb),.1);padding:1px 5px}
.req-badge.ready{color:var(--ok);border-color:rgba(143,191,143,.4);background:transparent}
.req-badge.warn{background:transparent}
.req-badge.done{color:var(--n-300);border-color:var(--n-700);background:transparent;text-decoration:line-through;opacity:.5}
.value-line{display:flex;align-items:center;gap:6px;font-family:var(--font-hud);font-size:10.5px;color:var(--n-300);letter-spacing:.04em;text-transform:uppercase}
.value-line .ico-cred{width:13px;height:13px;flex:none;background:url('icons/game/credits.webp') center/contain no-repeat}
.value-line .dim{color:var(--n-400)}
.tiers{display:flex;border:1px solid rgba(var(--acc-rgb),.25);margin-top:auto}
.tier{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:7px 2px;cursor:pointer;border:none;border-right:1px solid rgba(var(--acc-rgb),.18);background:transparent;font-family:var(--font-hud);font-size:9px;letter-spacing:.08em;transition:background .3s ease,box-shadow .3s ease}
.tier:last-child{border-right:none}
.tier[data-t="0"]{color:var(--tier-0)} .tier[data-t="1"]{color:var(--tier-1)} .tier[data-t="2"]{color:var(--tier-2)} .tier[data-t="3"]{color:var(--tier-3)} .tier[data-t="4"]{color:var(--tier-4)}
.tier .lamp{width:16px;height:4px;border:1px solid currentColor;background:transparent;transition:background .3s ease,box-shadow .3s ease}
.tier.on{background:color-mix(in oklab,currentColor 8%,transparent)}
.tier.on .lamp{border:none;background:currentColor;box-shadow:0 0 8px currentColor}
.tier.base{background:color-mix(in oklab,currentColor 16%,transparent);box-shadow:inset 0 0 10px color-mix(in oklab,currentColor 30%,transparent)}
.iconic-own,.base-toggle{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;font-family:var(--font-hud);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;padding:7px 4px;cursor:pointer;background:transparent;color:var(--n-400);border:1px solid var(--n-700)}
.iconic-own.on,.base-toggle.on{background:rgba(var(--acc-rgb),.12);color:var(--accent-300);border-color:var(--accent)}
.iconic-row{display:flex;gap:6px;margin-top:auto}
.iconic-own .lamp,.base-toggle .lamp{width:10px;height:10px;border-radius:50%;border:1.5px solid var(--accent);background:transparent}
.iconic-own.on .lamp,.base-toggle.on .lamp{background:var(--accent);box-shadow:0 0 7px var(--accent)}
.empty{text-align:center;padding:40px 10px;color:var(--n-400);font-family:var(--font-hud);font-size:11px;letter-spacing:.14em;text-transform:uppercase}
```

Ajustements DOM associés dans app.js : envelopper les cartes de chaque section dans un conteneur `<div class="cards">` (dans `renderList`, remplacer `ds.forEach(d=>sec.appendChild(renderDroid(d)))` par la création d'un div `.cards` qui reçoit les cartes puis est appendu à la section — dans LES DEUX branches, revenu et rareté) ; pour les iconiques, envelopper les deux boutons dans `<div class="iconic-row">` (créer le div, y appendre `btn` et `baseBtn`, appendre le div à la carte — cela remplace les deux `card.appendChild` directs). Le BASE_ICON (maison SVG) est conservé tel quel dans les boutons de variante.

- [ ] **Step 5: Tests verts + visuel** — `cd tests && node test-droidex.js` → `✅`. Visuel vs `SCREENSHOT/desktop.png` et `mobile-cards.png` : rangée de variantes à lampes colorées, badge GARDER plein, icônes de classe.

- [ ] **Step 6: Commit**

```bash
git add site/app.js site/i18n.js site/styles.css tests/test-droidex.js
git commit -m "Nocturne droid cards: tier lamps, class icons, badge format RBn·TIER

BREAKING LABEL: canonical badge becomes '✓ RB10·GLD' (semantics unchanged)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Footer, légal, états

**Files:**
- Modify: `site/index.html` (footer fusionné, loading, légal, version)
- Modify: `site/i18n.js`
- Modify: `site/styles.css`
- Test: `tests/test-droidex.js` (asserts footer/empty adaptés si libellés changés)

**Interfaces:**
- Consumes: layout (Task 2).
- Produces: footer une ligne `#saveState · EXPORT · IMPORT · RESET`, légal inchangé sur le fond, `#appVersion` au format `DROIDEX V{x.y.z}`.

- [ ] **Step 1: index.html**

Remplacer les blocs `.footer` et `.legal`/`.version` par (dans `.main`, après `#list`) :

```html
      <div class="footer">
        <span class="save-state" id="saveState" data-i18n="autoSave">Autosave ● local</span>
        <span class="fsep"></span>
        <button class="tool-btn" id="exportBtn" data-i18n="exportBtn">⇩ Export</button>
        <button class="tool-btn" id="importBtn" data-i18n="importBtn">⇧ Import</button>
        <input type="file" id="importFile" accept="application/json,.json" hidden>
        <span class="fsep"></span>
        <button class="reset-btn" id="resetBtn" data-i18n="resetBtn">Reset registry</button>
      </div>
      <div class="legal" data-i18n-html="legal">…contenu actuel inchangé…</div>
      <div class="version" id="appVersion"></div>
```

La sync-bar est déjà en haut (Task 2) — vérifier qu'aucun doublon de `#loginBtn` etc. ne subsiste. Le format de version dans app.js : chercher l'affectation de `#appVersion` et la passer à `'DROIDEX V'+APP_VERSION` (assert existant `[14]` : regex à adapter → `/^DROIDEX V\d+\.\d+\.\d+$/`).

- [ ] **Step 2: i18n**

EN / FR :

```js
    autoSave: 'Autosave ● local',        // FR : 'Auto-save ● local'
    saved: 'Saved ● local',              // FR : 'Enregistré ● local'
    exportBtn: '⇩ Export',               // FR : '⇩ Exporter'
    importBtn: '⇧ Import',               // FR : '⇧ Importer'
    resetBtn: 'Reset registry',          // FR : 'Réinitialiser le registre'
    empty: 'No signal — no droid matches', // FR : 'Aucun signal — aucun droïde trouvé'
```

(La clé `saved` existe — valeur mise à jour ; vérifier dans app.js/sync.js les endroits qui posent `saveState.textContent` pour qu'ils utilisent bien `t('saved')`/`t('autoSave')`.) Adapter dans les tests tout assert sur ces textes (chercher `'Registry saved'`, `'No droid matches'` etc. — remplacer par les nouvelles valeurs EN).

- [ ] **Step 3: CSS**

```css
.footer{display:flex;align-items:center;gap:8px;font-family:var(--font-hud);font-size:8.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--n-500);justify-content:center;margin-top:12px;flex-wrap:wrap}
.fsep{width:1px;height:10px;background:rgba(var(--acc-rgb),.3)}
.tool-btn{background:none;border:1px solid var(--n-700);color:var(--n-300);padding:6px 11px;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;font-family:var(--font-hud)}
.tool-btn:hover{border-color:var(--accent);color:var(--accent-300)}
.reset-btn{background:none;border:none;color:var(--n-500);font:inherit;letter-spacing:inherit;cursor:pointer;padding:0}
.reset-btn:hover{color:var(--danger)}
.save-state{font-size:inherit}
.save-state.err{color:var(--danger)}
.legal{margin-top:18px;padding-top:13px;border-top:1px solid rgba(var(--acc-rgb),.18);font-size:10.5px;line-height:1.6;color:var(--n-400)}
.legal a{color:var(--n-400);text-decoration:underline}
.legal a:hover{color:var(--accent-300)}
.version{margin:9px 0 24px;font-family:var(--font-hud);font-size:9px;letter-spacing:.1em;color:var(--n-500)}
#loading{font-family:var(--font-hud);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--n-400);text-align:center;padding:30px 0}
```

Balayage final du styles.css : supprimer toute règle orpheline du thème Tatooine (classes plus présentes dans le DOM — vérifier avec `grep -o 'class="[^"]*"' site/index.html | sort -u` croisé avec les sélecteurs restants) et les alias `--sand/--sand-dim/--line/--jawa` s'ils ne sont plus référencés.

- [ ] **Step 4: Tests + visuel + commit**

`cd tests && node test-droidex.js` → `✅`. Visuel complet vs les trois captures.

```bash
git add site/index.html site/app.js site/i18n.js site/styles.css tests/test-droidex.js
git commit -m "Nocturne footer, legal, empty/loading states; drop Tatooine leftovers

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Release v1.3.0 — version, CHANGELOG, textes périmés, docs

**Files:**
- Modify: `site/version.js` (`1.2.5` → `1.3.0`)
- Modify: `CHANGELOG.md`
- Modify: `site/index.html` (JSON-LD l. 29 + noscript l. 108 : « the 23 rebirth levels » → « the 27 rebirth levels across 4 cycles »)
- Modify: `site/llms.txt` (même correction « 23 » → « 27 × 4 cycles », deux occurrences)
- Modify: `CLAUDE.md` (scénario canonique : « ✓ RB10 · Gold »/« ✓ RB10 · Or » → « ✓ RB10·GLD » dans les deux langues, format unique)

**Interfaces:** clôture des Tasks 1-6.

- [ ] **Step 1: version + CHANGELOG**

`site/version.js` : `const APP_VERSION = '1.3.0';`
`CHANGELOG.md`, en tête :

```markdown
## 1.3.0 — 2026-07-18

- **Nocturne redesign** — full visual overhaul from the Claude Design handoff (dark futuristic HUD): Chakra Petch + IBM Plex Sans (self-hosted), purple accent palette, bracket-framed target panel, scanline textures, desktop sidebar layout (≥980px)
- Segmented progress bar with `012/317`-style counter; per-filter counts; animated "✓ Rebirth ready" badge; class icons and credit icons on cards; colored tier lamps (`BAS/GLD/DIA/RBW/BSK`)
- Requirement badge format is now `RB10·GLD` (semantics unchanged); flawless toggle glyph is now ✦
- Fixed stale copy: rebirth count corrected to 27 levels × 4 cycles in page metadata and llms.txt
```

- [ ] **Step 2: corrections de textes** — les trois fichiers listés ci-dessus (index.html JSON-LD + noscript, llms.txt ×2, CLAUDE.md scénario canonique).

- [ ] **Step 3: Suite complète + visuel final**

`cd tests && node test-droidex.js` → `✅ Tous les tests passent`.
Comparaison finale aux trois captures de `~/Downloads/redesign-app-futuriste/SCREENSHOT/` (desktop ≥980px, mobile, cartes) via le compose local, dans les DEUX langues (sélecteur EN/FR).

- [ ] **Step 4: Screenshots README**

Si l'environnement le permet (`docker compose -f docker-compose.local.yml up -d` + Playwright dispo) : `NODE_PATH=<node_modules avec playwright> node tests/screenshots.js` puis vérifier `docs/screenshot-main.png`/`docs/screenshot-rebirth.png`. Sinon, noter dans le rapport que la régénération reste à faire manuellement (suivi CLAUDE.md).

- [ ] **Step 5: Commit**

```bash
git add site/version.js CHANGELOG.md site/index.html site/llms.txt CLAUDE.md docs/
git commit -m "v1.3.0: Nocturne redesign release — version, changelog, stale copy fixes

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Après le plan (hors implémentation)

- Push + PR + déploiement VPS sur demande de Julien (procédure CLAUDE.md ; APP_VERSION 1.3.0 invalidera le cache offline).
- Suivis toujours ouverts (inchangés) : perk/classe C-3PO ; clamp `targetCycle`/`targetRB` ; test du chemin confirm()=false ; unification du pattern persistState silencieux.
