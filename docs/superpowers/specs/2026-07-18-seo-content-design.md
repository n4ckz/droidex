# Design — SEO/GEO : quick wins + pages de contenu statiques (v1.4.0)

Date : 2026-07-18 · Issu de l'audit SEO validé par Julien (items 4-7 délégués ;
items 1-3 — Discord, wiki, Search Console — sont côté Julien).

## Contexte (audit du 18/07/2026)

droidex.nackz.dev est invisible en recherche organique (0 apparition sur 9
requêtes joueur, 0 backlink, 0 mention tierce). Causes on-site : surface
indexable ~150 mots (SPA), title sans mots-clés, og:image = icône. Les
concurrents qui rankent (tycoon-tools, droidtycoonguide) servent des pages
HTML statiques mono-sujet de 1 300-2 000 mots. Contrainte de Julien :
**ne pas changer le design de l'app**.

## 1. Quick wins (app shell, invisibles à l'écran)

- `<title>` : « Droidex — Star Wars: Droid Tycoon Collection Tracker (Fortnite) »
  (og:title/twitter:title alignés). Le h1 caché et le libellé visible DROIDEX
  ne changent pas.
- Image OG dédiée : `site/og/og-1200x630.png` (capture Nocturne desktop,
  exactement 1200×630) + `site/og/og-1200x1200.png` (carrée, pour
  WhatsApp/Discord). `og:image` + `og:image:width/height` + `twitter:card`
  passe à `summary_large_image`. Captures fournies par le contrôleur
  (Playwright sur le site local, registre seedé réaliste).
- `<noscript>` enrichi : ~250-300 mots EN reprenant le contenu de llms.txt
  (ce que fait l'app, les 3 états, la mécanique rebirth 27×4, Flawless,
  bonus de collection, gratuit/open source/self-host) + liens vers les 3
  nouvelles pages et GitHub.

## 2. Pages de contenu statiques (le vrai levier)

Trois pages EN, générées depuis `site/data.js` :

- **`site/value-list/index.html`** — « Droid Tycoon Value List — Income &
  Beskar Costs (All 69 Droids) » : tableau complet (droïde, classe, rareté,
  revenus/s des 5 variantes, coût Beskar, perk), groupé par rareté ;
  iconiques listés avec leur perk (+15%/s). Paragraphe d'intro (~120 mots)
  et notes (variante supérieure valide l'inférieure, source communautaire,
  date de recoupage).
- **`site/rebirth-requirements/index.html`** — « Droid Tycoon Rebirth
  Requirements — All 27 Levels × 4 Cycles » : par cycle, tableau
  RB → crédits → les 3 droïdes requis (avec variante minimale) → déblocage
  (cycle 1). Intro sur la super-renaissance (dès RB12, ce qui est
  conservé/perdu — contenu déjà validé en jeu).
- **`site/faq/index.html`** — « Droid Tycoon FAQ — Droidex, Flawless,
  Super Rebirth » : 8-10 Q/R issues des règles métier du projet (états des
  variantes, à garder, Flawless 1/1000→1/100, bonus de collection +1 %,
  super-renaissance, comment suivre sa collection…) avec données
  structurées **FAQPage** (JSON-LD).

Caractéristiques communes :
- **Générées par `tools/generate-seo-pages.js`** (Node sans dépendance : il
  charge version.js/i18n.js/data.js dans un contexte vm pour lire les
  données, comme le harnais de tests). Déterministe et reproductible : la
  date affichée = la date « recoupées le » de data.js, jamais Date.now().
- Habillage Nocturne : les pages référencent `../styles.css` + un petit
  fichier `site/seo-pages.css` dédié (tables, prose) — AUCUNE modification
  des styles de l'app. En-tête simple : marque DROIDEX (lien vers l'app),
  nav entre les 3 pages, CTA « Open the tracker ». Footer : légal + GitHub.
- SEO : title/meta description/canonical par page, JSON-LD (Dataset pour
  les 2 tableaux, FAQPage pour la FAQ), maillage interne entre les 3 pages
  et vers l'app.
- Découverte : 3 liens discrets ajoutés dans le bloc `.legal` de l'app
  (« Value list · Rebirth requirements · FAQ ») — seule modification
  visible, ~1 ligne de texte dans le footer existant, style du bloc légal
  inchangé.

## 3. Sitemap, service worker, veille

- `sitemap.xml` généré par le même script : 4 URLs (/, /value-list/,
  /rebirth-requirements/, /faq/), lastmod = date de recoupage data.js.
- Service worker : les pages SEO ne sont PAS ajoutées au SHELL (inutiles
  offline) ; le fetch handler existant les cache à la visite, comportement
  inchangé. Garde cross-origin intacte.
- Workflow `gamedata-check.yml` : après régénération de data.js, lancer
  aussi `node tools/generate-seo-pages.js` pour que les pages restent
  synchrones ; checklist de la PR mise à jour.
- llms.txt : ajouter les 3 pages dans la section Links.

## 4. Versions, tests

- `APP_VERSION` → **1.4.0**, CHANGELOG.
- Tests : nouvelle section jsdom-free dans `tests/test-droidex.js` (fs) :
  les 3 pages existent, contiennent des sentinelles (« Strike-Orb » dans la
  value list, « 32T » dans les rebirths, balise FAQPage dans la FAQ),
  sitemap contient 4 `<loc>`. Le générateur relancé deux fois produit un
  résultat identique (déterminisme).
- Hors périmètre (acté) : pages par droïde (69 URLs — plus tard si les 3
  pages font leurs preuves), versions FR des pages, hreflang.
