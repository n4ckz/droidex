# SEO/GEO v1.4.0 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre Droidex découvrable : title/OG/noscript optimisés + 3 pages de contenu statiques générées depuis data.js (value list, rebirth requirements, FAQ) + sitemap/veille synchronisés.

**Architecture:** L'app ne change pas visuellement (seuls 3 liens texte s'ajoutent au bloc légal). Un générateur Node sans dépendance (`tools/generate-seo-pages.js`) lit version.js/i18n.js/data.js via `vm` (même technique que le harnais jsdom : concaténation + évaluation) et écrit des pages HTML statiques stylées Nocturne + le sitemap. Déterministe (date = « recoupées le » de data.js).

**Tech Stack:** HTML statique, CSS (réutilise styles.css + seo-pages.css), Node vanilla, tests fs dans test-droidex.js.

**Spec:** `docs/superpowers/specs/2026-07-18-seo-content-design.md`

## Global Constraints

- **Aucun changement de design de l'app** : pas de modification de styles.css ni du DOM visible, à l'unique exception des 3 liens ajoutés DANS le bloc `.legal` existant (même style que le lien GitHub déjà présent).
- Générateur déterministe : jamais `Date.now()`/`new Date()` — la date vient de l'en-tête de data.js (`recoupées le JJ/MM/AAAA`). Deux exécutions successives → fichiers identiques (`git diff` vide).
- Pages EN uniquement (marché de recherche visé) ; l'app reste FR/EN.
- Aucune ressource externe sur les pages (CSP `style-src 'self'` s'applique : styles via fichiers CSS, PAS de `<style>` inline dans les pages générées ; pas de JS du tout sur ces pages).
- Chiffres exacts à utiliser : 69 droïdes, 317 variantes, 27 renaissances × 4 cycles, super-renaissance dès RB12, Flawless 1/1000 Basic → 1/100 Beskar, bonus de collection +1 %/droïde distinct, crédits jusqu'à 32T.
- Tests : `cd tests && node test-droidex.js` → `✅ Tous les tests passent`.
- `APP_VERSION` → `1.4.0` en Task 3 uniquement. Commits avec `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Quick wins — title, OG, noscript

**Files:**
- Modify: `site/index.html` (title, metas OG/twitter, noscript, liens .legal)
- Create: `site/og/og-1200x630.png`, `site/og/og-1200x1200.png` (DÉJÀ générés par le contrôleur, présents non commités dans site/og/ — les committer tels quels)
- Modify: `site/sw.js` (rien — les OG ne vont pas au SHELL), `site/llms.txt` (section Links)
- Test: `tests/test-droidex.js` (aucun assert existant ne teste title/metas — vérifier que la suite reste verte)

**Interfaces:**
- Produces: les URLs relatives `value-list/`, `rebirth-requirements/`, `faq/` référencées dans le noscript et le bloc légal (les pages elles-mêmes arrivent en Task 2 — liens en place d'abord, c'est accepté sur la branche).

- [ ] **Step 1: index.html — title + metas**

Remplacer :
```html
<title>Droidex — Star Wars: Droid Tycoon Collection Tracker (Fortnite)</title>
```
`og:title`/`twitter:title` : même texte. `og:image` → `https://droidex.nackz.dev/og/og-1200x630.png` + ajouter `<meta property="og:image:width" content="1200">`, `<meta property="og:image:height" content="630">`. `twitter:card` → `summary_large_image`, `twitter:image` → même URL OG. Le JSON-LD `name` reste « Droidex — Droidsmith's Registry » (marque) mais ajouter `"alternateName": ["Droidex", "Droid Tycoon Tracker"]`.

- [ ] **Step 2: noscript enrichi + liens légaux**

Remplacer le paragraphe `<noscript>` par ~4 paragraphes (~280 mots EN) couvrant : ce que fait le tracker (69 droids, 317 variants, 5 variants Basic→Beskar) ; les 3 états par variante et la règle « higher variant satisfies lower » ; la planification des 27 rebirths × 4 cycles et la super-renaissance (RB12+) ; Flawless (1/1000→1/100) et bonus de collection (+1%/distinct droid) ; gratuit/sans pub/open source/PWA offline/self-host ; liens : `<a href="value-list/">value list</a>`, `<a href="rebirth-requirements/">rebirth requirements</a>`, `<a href="faq/">FAQ</a>`, GitHub.

Dans le bloc `.legal`, après le lien GitHub existant, ajouter (même style) :
```html
    · <a href="value-list/">Value list</a>
    · <a href="rebirth-requirements/">Rebirth requirements</a>
    · <a href="faq/">FAQ</a>
```
(dans la valeur i18n `legal` des DEUX dictionnaires — le bloc est `data-i18n-html="legal"` : vérifier où vit ce HTML (i18n.js) et l'y ajouter, libellés FR « Liste des valeurs · Exigences de renaissance · FAQ » pour le dictionnaire FR.)

- [ ] **Step 3: llms.txt** — ajouter à `## Links` les 3 pages avec une ligne de description chacune.

- [ ] **Step 4: Tests + commit**

`cd tests && node test-droidex.js` → vert (si un assert casse sur le legal, l'adapter).
```bash
git add site/index.html site/llms.txt site/i18n.js site/og
git commit -m "SEO quick wins: keyword title, real OG images, rich noscript, content-page links

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Générateur + 3 pages statiques + sitemap

**Files:**
- Create: `tools/generate-seo-pages.js` (Node sans dépendance)
- Create: `site/seo-pages.css`
- Create (générés): `site/value-list/index.html`, `site/rebirth-requirements/index.html`, `site/faq/index.html`, `site/sitemap.xml` (remplacé)
- Test: `tests/test-droidex.js` (nouvelle section fs)

**Interfaces:**
- Consumes: `site/data.js` (DROIDS/RB_CREDITS/REBIRTHS/RB_UNLOCKS/RARITY_ORDER), `site/version.js`, labels EN de `site/i18n.js` (_tiers/_rarities du dict EN).
- Produces: `node tools/generate-seo-pages.js` régénère les 4 fichiers de façon déterministe. Sentinelles testées : « Strike-Orb » (value-list), « 32T » (rebirths), `"@type": "FAQPage"` (faq), 4 `<loc>` (sitemap).

- [ ] **Step 1: Tests (rouge)** — nouvelle section en fin de test-droidex.js (avant le résumé) :

```js
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
```
Run → FAIL (fichiers absents).

- [ ] **Step 2: Générateur**

`tools/generate-seo-pages.js` : lit `site/version.js` + `site/i18n.js` + `site/data.js`, les concatène et les évalue dans `vm.runInNewContext` pour récupérer `DROIDS`, `RB_CREDITS`, `REBIRTHS`, `RB_UNLOCKS`, `RARITY_ORDER` et le dict EN (labels tiers/raretés longs). Extrait la date `recoupées le (\d{2}/\d{2}/\d{4})` de data.js → date affichée et `lastmod` sitemap (convertie en AAAA-MM-JJ). Fonction `page(slug, title, description, jsonld, bodyHtml)` produisant le gabarit commun :
- `<head>` : charset/viewport/title/meta description/canonical `https://droidex.nackz.dev/{slug}/`/`<link rel="stylesheet" href="../styles.css">` + `href="../seo-pages.css"`/icônes/JSON-LD.
- Header : `<a class="brand" href="../">DROIDEX</a>` + sous-titre + nav 3 pages + bouton « Open the tracker → » (lien vers `../`).
- Footer : mention légale (reprendre le texte EN du bloc légal de l'app) + lien GitHub + version.
- AUCUN `<script>` dans les pages, aucun style inline.

Contenus :
- value-list : intro ~120 mots (ce qu'est la value list, source communautaire recoupée le {date}, la règle « higher variant satisfies lower ») ; un `<h2>` par rareté (labels EN longs) ; tableau `<table>` colonnes Droid / Class / Basic / Gold / Diamond / Rainbow / Beskar (revenus « n/s », format `fmtInc`-like : ≥1000 → « xK/s ») / Beskar cost / Perk ; iconiques : ligne « +15%/s » + perk. JSON-LD `Dataset`.
- rebirth-requirements : intro ~120 mots (27 niveaux × 4 cycles, crédits identiques par niveau, super-renaissance dès RB12 avec ce qui est conservé : Droidex/fabricant/cosmétiques/Flawless/cristaux Nova/déverrouillages iconiques) ; un `<h2>Cycle N</h2>` par cycle ; tableau colonnes Rebirth / Credits / Required droids (3 × « Nom (Variante min) ») / Unlock (colonne seulement cycle 1). JSON-LD `Dataset`.
- faq : 9 Q/R EN (~60-90 mots chacune) : What is Droidex? · How do I track variants (3 states)? · Does a higher variant satisfy a lower requirement? (yes) · What are rebirth requirements? · What is a Super Rebirth and what do you keep/lose? · What is Flawless? · What is the collection bonus? · Is Droidex free / does it need an account? · Can I self-host it? — chaque réponse factuelle depuis la spec/llms.txt. JSON-LD `FAQPage` avec les 9 `Question`/`acceptedAnswer`.
- sitemap.xml : 4 URLs, `lastmod` = date data, `changefreq` weekly.

- [ ] **Step 3: seo-pages.css** — styles Nocturne pour ces pages uniquement (préfixe `.seo-` ou balises scoped sous `.seo-page`) : conteneur max-width 960, prose lisible (IBM Plex Sans 15px/1.7), h1/h2 Chakra Petch uppercase avec ◈, tables (bordures `rgba(145,132,217,.25)`, en-têtes HUD 10px uppercase, zébrage léger, `overflow-x:auto` sur wrapper mobile), nav/CTA réutilisant l'esthétique tool-btn. NE PAS toucher styles.css.

- [ ] **Step 4: Générer + déterminisme + tests verts**

`node tools/generate-seo-pages.js` (2×, `git diff` identique entre les deux) puis suite verte.

- [ ] **Step 5: Commit**

```bash
git add tools/generate-seo-pages.js site/seo-pages.css site/value-list site/rebirth-requirements site/faq site/sitemap.xml tests/test-droidex.js
git commit -m "Static SEO pages generated from data.js: value list, rebirth requirements, FAQ (+sitemap)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Veille, version, release

**Files:**
- Modify: `.github/workflows/gamedata-check.yml` (étape régénération pages + checklist PR)
- Modify: `README.md` (mentionner les pages + le générateur dans l'arborescence/sections outils)
- Modify: `site/version.js` (`1.4.0`), `CHANGELOG.md`

- [ ] **Step 1: Workflow** — dans le job qui régénère data.js et ouvre la PR : ajouter `node tools/generate-seo-pages.js` après la régénération, inclure les fichiers générés dans le commit de la PR, et ajouter à la checklist « SEO pages regenerated (value list / rebirths / FAQ / sitemap) ».
- [ ] **Step 2: README** — courte sous-section (Content pages générées, commande `node tools/generate-seo-pages.js`, régénérées par la veille).
- [ ] **Step 3: version 1.4.0 + CHANGELOG** :

```markdown
## 1.4.0 — 2026-07-18

- **SEO/discoverability**: keyword page title, real Open Graph images (1200×630 + square), ~280-word crawlable noscript fallback
- **Three static content pages generated from the game data** (auto-refreshed by the scheduled data watch): [value list](https://droidex.nackz.dev/value-list/), [rebirth requirements](https://droidex.nackz.dev/rebirth-requirements/), [FAQ](https://droidex.nackz.dev/faq/) — English, no JS, Nocturne-styled, linked from the app footer
- Sitemap now lists the 4 pages with data-driven lastmod; llms.txt links the new pages
```

- [ ] **Step 4: Suite complète + commit**

```bash
git add .github/workflows/gamedata-check.yml README.md site/version.js CHANGELOG.md
git commit -m "v1.4.0: SEO content release — data watch regenerates pages, docs, changelog

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

## Après le plan

Merge + déploiement délégués (validés par Julien pour ce chantier), vérification en ligne des 4 URLs, resoumission du sitemap dans Search Console = action Julien (avec son GSC).
