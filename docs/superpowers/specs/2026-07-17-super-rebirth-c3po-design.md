# Design — Super-renaissance + ajout de C-3PO

Date : 2026-07-17 · Validé par Julien (brainstorming en session)

## Contexte

Deux captures du jeu (17/07/2026) apportent des informations nouvelles :

1. **Écran « Super Rebirth »** — précise la sémantique du reset. Perdus :
   progression de base, droïdes, devises, rang de renaissance, niveau de
   pioche, blueprints. Conservés : Droïdex, niveau de fabricant, cosmétiques,
   déverrouillages parfaits (Flawless), cristaux Nova + améliorations,
   déverrouillage des droïdes emblématiques (rachetables à la boutique Nova).
2. **Boutique « Droïdes emblématiques »** — 7 iconiques : BB-8, Mister Bones,
   IG-11 Marshal, CB-23, DJ R-3X, R2-D2 et **C-3PO** (absent du tracker).
   Vérifié le 17/07 : C-3PO est absent de la value list tycoon-tools et de
   droidtycoonguide.com — les sources communautaires sont en retard sur le jeu.

## 1. Données — ajout de C-3PO

- `tools/update-gamedata.py` :
  - ajouter `'C-3PO': 'c3po'` à `NAME2ID` et `'c3po': 'C-3PO'` à `DISPLAY`
    (prêt pour le jour où tycoon-tools le référencera) ;
  - après `parse_values()`, injection statique : si `c3po` absent des données
    distantes, l'ajouter avec `{rarity: 'Iconic', type: 'Worker', perk: None,
    inc: [None]*5, beskarCost: None}`.
- Régénérer `site/data.js` → 7ᵉ iconique. Le compteur de progression est
  dynamique : il passe automatiquement de 316 à **317 variantes**.
- **Incertitude assumée** : classe `Worker` supposée (droïde de protocole,
  comme DJ R-3X) ; perk inconnu (comme R2-D2). À compléter quand Julien
  verra la fiche en jeu ou quand tycoon-tools publiera l'info.

## 2. Bouton « Super-renaissance »

- **Placement** : barre d'outils, à côté du sélecteur de cycle
  (`#cycleSelect` dans `site/index.html`).
- **Comportement** : au clic, `confirm(t('superRebirthConfirm'))` (pattern
  identique au reset/import existants), puis transition atomique :
  - non-iconiques : toute variante à l'état `2` (en base) → état `1`
    (possédé au Droïdex) — le Droïdex survit, la base non ;
  - iconiques : `inBase[id]` décoché, `owned` conservé (déverrouillage
    gardé, droïde rachetable en boutique Nova) ;
  - `targetRB` → `1` ;
  - `targetCycle` → `+1`, avec boucle `4 → 1` ;
  - `flawless` et `wish` intacts ;
  - `persistState()` (déclenche la synchro PocketBase si active).
- **Hors périmètre** (choix acté) : pas de modélisation des conditions
  d'accès (rang 12, variante requise) ni de l'écran de gains (cristaux
  Nova, bonus permanents).

## 3. i18n, version, tests

- Clés `I18N` nouvelles, dans les deux langues : libellé du bouton, texte
  de confirmation, aria-label.
- `APP_VERSION` → `1.2.5` (`site/version.js`), entrée CHANGELOG.
- Tests jsdom (`tests/test-droidex.js`) :
  - assertion du compteur : « 0 / 316 variants » → « 0 / 317 variants » ;
  - nouveau bloc super-renaissance : état riche (variantes en base,
    iconique en base, flawless/wish posés, cible RB > 1) → déclenchement →
    vérifier les `2→1`, iconiques décochés, `targetRB === 1`, cycle
    incrémenté, et la boucle `4 → 1` ; `owned`/`flawless`/`wish` intacts.
- Rappel déploiement : redéployer le VPS après merge (procédure CLAUDE.md).
