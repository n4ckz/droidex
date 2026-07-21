# Design — Variante Galactique (6ᵉ palier) + RB28

Date : 2026-07-21 · Statut : validé (approche A actée par Julien)

## Contexte

Mise à jour du jeu (~mi-juillet 2026) : nouveau palier de variante **Galactic**
au-dessus de Beskar. Constats croisés (captures en jeu de Julien + tycoon-tools
+ droidtrakr) :

- Le jeu affiche un onglet « Galactique » dans le Droidex, mais le compteur
  principal reste **228/317** → le Galactique n'entre PAS dans le total Droidex.
- tycoon-tools a ajouté un **28ᵉ palier de renaissance** à chacun des 4 cycles
  (coût 45T, crédits non documentés), exigeant chacun **1 droïde Galactique** :
  - Cycle 1 : Galactique Proto-Roller + Arc-en-ciel MO-TRAK + Beskar DRFT-R
  - Cycle 2 : Galactique Mecha-Droid + Arc-en-ciel Snow Mouse + Beskar TRI-TEK
  - Cycle 3 : Galactique BB9 + Arc-en-ciel RIC + Beskar MO-TRAK
  - Cycle 4 : Galactique Opti-STRK + Arc-en-ciel IG + Beskar KX
- La colonne de revenus Galactic de la value list est **partielle** (~9/62
  documentés, le reste à « — »).
- Obtention en jeu : spawn horaire à :45 (droidtrakr) — info contextuelle,
  sans impact tracker.
- Graphies tycoon-tools modifiées : « BB-8 » (ex-BB8) et « C-3P0 » (zéro) —
  alias déjà ajoutés à NAME2ID (aucun nouveau droïde ; toujours 69 droïdes,
  7 Iconiques).

Inconnues assumées (à confirmer en jeu plus tard) : bonus de revenus lié au
Galactique (multiplicateur par galactique possédé ?), comportement exact à la
super-renaissance. Défauts retenus ci-dessous.

## Décisions métier (validées par Julien)

1. **Approche A** : le Galactique est la 6ᵉ entrée du tableau de variantes
   (`owned[id] = [int ×6]`, tap-cycle 0/1/2, index 5). Pas de dictionnaire
   séparé.
2. **Compteur principal inchangé : /317** (index 0-4 + Iconiques), fidèle à
   l'écran du jeu. **Compteur Galactique séparé : x/62**, affiché à côté du
   bonus de collection.
3. Intégration **maintenant**, avec données de revenus partielles.

## Règles métier étendues (prolongent les règles intangibles, sans les modifier)

- Variante supérieure valide l'inférieure : le Galactique (5) satisfait toute
  exigence ≤ Beskar. Mécanique existante, aucune exception.
- Badges d'exigence : RB28 suit exactement la sémantique actuelle
  (barré si rb < cible ; ✓/⚠/orange sinon). Libellé court : **GLC**
  (identique EN/FR, comme GLD/BSK).
- Super-renaissance : le Galactique suit la règle des autres variantes
  (2→1, possession Droidex conservée) — hypothèse « comme la mécanique des
  autres » de Julien ; `applySuperRebirth` mappe déjà tout le tableau.
- Bonus de collection (+1 %/droïde distinct) : un droïde possédé uniquement en
  Galactique compte comme distinct (`some(v>=1)` sur les 6 entrées — naturel).
- Non-régression canonique inchangée : Strike-Orb Diamant en base, cible 10 →
  « ✓ RB10·GLD » vert ; cible 11 → barré.

## Modifications par fichier

### tools/update-gamedata.py (générateur)

- `TIER_WORDS` += `'GALACTIC': 5`.
- Value list : parser la 6ᵉ colonne de revenus ; « — » → `null` dans `inc`
  (le parseur `parse_income` renvoie déjà None). `inc` passe à
  `[Basic, Or, Diamant, Arc-en-ciel, Beskar, Galactique|null]`.
- Renaissances : accepter 28 paliers/cycle ; `RB_CREDITS` jusqu'à 28, valeur
  manquante → `null` (l'app affiche déjà « — »).
- Injection statique C-3PO (`setdefault`) conservée : elle s'efface
  d'elle-même maintenant que la source distante a le droïde.
- Commentaire d'en-tête de data.js mis à jour (6 variantes, 4×28).

### site/data.js (régénéré)

Aucune édition manuelle — sortie du générateur, diff relu.

### site/i18n.js

- `_tiers` : + « Galactic » (EN) / « Galactique » (FR).
- `_tierShort` : + « GLC » (les deux langues).
- Nouvelles clés : libellé/aria du compteur galactique (ex. `galacticCount`),
  aide (encart tap-cycle mentionne la 6ᵉ pastille), dans les DEUX langues.

### site/app.js

- `ownedTiers` : défaut `[0,0,0,0,0,0]`.
- `meetsReq`/`inBaseReq` : borne `5` → `TIERS.length` (6).
- `applyParsedState` : **migration** — padding des tableaux existants à 6
  entrées (`while(arr.length<6) arr.push(0)`) ; la promotion « en base »
  historique parcourt depuis `arr.length-1`.
- `renderProgress` : compteur principal sur les index **0-4 uniquement**
  (total reste 317) ; nouveau compteur Galactique `x/62` (non-iconiques avec
  `o[5]>=1`) rendu à côté de `collectionBonus`.
- `renderRBPanel` : bornes du sélecteur RB dérivées des données
  (`max(Object.keys(REBIRTHS[cycle]))` = 28) au lieu du 27 en dur.
- `renderDroid` : la 6ᵉ pastille sort automatiquement de la boucle
  `TIER_SHORT.forEach` ; la ligne de valeur reste `inc[0] → inc[4]` tant que
  la colonne Galactique est trouée ; tri par revenu inchangé (`inc[4]`).
- `applySuperRebirth` : inchangé (couvre les 6 entrées par construction).

### site/index.html + site/style.css

- Élément du compteur Galactique près du bonus de collection.
- Style de la 6ᵉ pastille : lampe **violette/magenta** (couleur du palier en
  jeu), déclinée dans le thème Nocturne ; vérifier que la grille `.tiers`
  absorbe 6 cellules sur mobile 390px.

### site/version.js + CHANGELOG.md

- `APP_VERSION` → **1.5.0** (nouvelle fonctionnalité + migration de schéma).

### tools/generate-seo-pages.js + pages

- Vérifier la génération avec `inc` à 6 colonnes (trous « — ») et 28 paliers ;
  régénérer /value-list/, /rebirth-requirements/, /faq/ (chiffres : 6 variantes,
  28 paliers ; le total affiché reste 317 + mention du Galactique).

### tests/test-droidex.js

Nouveaux asserts (textes attendus en ANGLAIS, langue par défaut) :
- Migration : sauvegarde 5 entrées → padding à 6, rien d'autre ne bouge.
- Badge RB28 : Proto-Roller Galactique en base, cycle 1, cible 28 →
  « ✓ RB28·GLC » vert ; cible > 28 impossible (borne 28).
- Compteurs : principal « xxx/317 » inchangé ; galactique « 0/62 » puis
  incrément quand `o[5]` passe à 1.
- Galactique satisfait une exigence Beskar/inférieure.
- Super-renaissance : `o[5]` 2→1.
- Non-régression Strike-Orb (déjà en place — doit rester verte).
- RB_CREDITS[28] absent → affichage « — ».

## Hors périmètre (YAGNI, à revoir avec les retours du jeu)

- Multiplicateur de revenus galactique (inconnu en jeu à ce jour).
- Affichage du revenu Galactique sur les cartes (colonne trop trouée).
- Compteur Flawless x/62 (autre sujet, non demandé).
- Timer de spawn :45 (gadget, hors mission du tracker).

## Rituel de release

Bump 1.5.0 → CHANGELOG → `node tools/generate-seo-pages.js` → tests verts →
PR → merge → tag `v1.5.0` + Release GitHub → déploiement VPS → vérif en ligne
(fenêtre 404 Traefik ~10-15 s).
