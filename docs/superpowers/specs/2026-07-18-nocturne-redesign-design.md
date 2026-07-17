# Design — Refonte visuelle « Nocturne » (v1.3.0)

Date : 2026-07-18 · Validé par Julien (brainstorming en session)

## Contexte et sources

Julien a conçu la refonte dans Claude Design (projet « Nocturne », design system
+ prototypes). Le handoff est exporté dans `~/Downloads/redesign-app-futuriste/` :

- `project/Droidex Prototype.dc.html` — **la référence pixel-perfect** (lu en
  entier). Re-peau complète de l'app avec la même logique métier, variantes
  desktop/mobile, i18n EN/FR embarquée (libellés à reprendre).
- `project/_ds/nocturne-…/styles.css` + `theme` — tokens du design system.
- `project/site/fonts/` — Chakra Petch 500/600/700 + IBM Plex Sans variable
  (woff2, à auto-héberger).
- `ICONES/` — icônes fournies par Julien (classes Worker/Astromech/Battle en
  .webp, crédits, rebirth, super rebirth). **Choix acté par Julien** : on les
  embarque, servies depuis notre domaine (jamais de hotlink).
- `SCREENSHOT/` — rendus de référence (desktop.png, mobile.png,
  mobile-cards.png) pour la vérification visuelle finale.
- `project/Droidex Explorations.dc.html` — pistes non retenues (rails, IDs
  techniques, long-press, scanline animée) : **hors périmètre**, acté.

## Décisions actées

1. **Périmètre = le prototype tel quel**, y compris ses nouveautés
   fonctionnelles ; rien des explorations.
2. **Approche = re-skin en place** : app.js/i18n.js/sync.js/data.js gardent
   leurs rôles ; styles.css réécrit ; index.html adapté ; app.js étendu pour
   les nouveautés. Le code du prototype n'est PAS porté (runtime de maquette) —
   il sert de spécification visuelle et comportementale.
3. **Sémantique métier intacte, libellés relookés** : uppercase + abréviations
   de variantes `BAS/GLD/DIA/RBW/BSK`. Le scénario canonique de CLAUDE.md
   devient « ✓ RB10·GLD » (EN) — même sémantique vert/barré/⚠, nouveau format.
   **Validé explicitement par Julien** ; CLAUDE.md sera mis à jour après
   livraison.
4. Release unique **v1.3.0**.

## 1. Direction visuelle (tokens)

- Fond page `#101120` + halo `radial-gradient(ellipse at 50% -10%,
  rgba(145,132,217,.09), #101120 55%)` fixe.
- Accent `#9184d9`, clair `#c5bdea` (accent-300), déclinaisons Nocturne
  (accent-700/800 pour bordures). Vert succès `#8fbf8f`, or flawless
  `#E3B341`, rouge destructif `#d98a8a`.
- Variantes : Basic `#8d90a0`, Or `#E3B341`, Diamant `#7FD4E8`,
  Arc-en-ciel `#D98CE0`, Beskar `#C8CDD4` (variables CSS `--tier-0`…`--tier-4`).
- Typo : Chakra Petch 600/700 (titres, boutons, chips, badges — letter-spacing
  large, uppercase), IBM Plex Sans variable (corps). Auto-hébergées,
  `font-display: swap`. Les polices actuelles du site sont remplacées.
- Texture : scanlines statiques subtiles (`repeating-linear-gradient`) sur le
  panneau cible et les cartes ; angles « brackets » du panneau cible en
  pseudo-éléments + `clip-path` (repris du prototype).
- Pas de coins arrondis (esthétique console) sauf éléments ronds (lampes, ★).

## 2. Layout

- **Breakpoint 980px** (aligné sur le prototype).
- Desktop : `.main` en grille `310px minmax(0,1fr)`, gap 22, max-width 1280
  centré. Sidebar sticky (panneau cible + liste verticale de filtres avec
  compteurs alignés à droite). Cartes en 2 colonnes.
- Mobile : pile max-width 560 centrée ; header compact sur 2 lignes ; panneau
  cible en tête de colonne ; barre recherche+tri sticky (fond opaque = même
  gradient que la page) avec chips en wrap dessous ; cartes 1 colonne.

## 3. Composants (référence : prototype, sections desktop ET mobile)

- **Header** : « DROIDEX » (Chakra Petch 700, text-shadow glow) + sous-titre
  « ▸ Droid Tycoon // Registry » ; **barre de progression segmentée**
  (10 segments, allumés = accent + glow, éteints = accent 15 %) ; compteur
  `done/total` en `padStart(3,'0')` (ex. `012/317`) ; bonus collection
  (`N DISTINCTS · BONUS +N%`) ; sélecteur de langue EN/FR.
- **Barre sync/actions** : lampe d'état (verte glow si connecté, grise sinon)
  + texte statut ; boutons ⇩ EXPORT / ⇧ IMPORT / connexion Google (bordure
  accent + « G » cerclé) / déconnexion / suppression de compte (hover rouge).
  Libellés courts sur mobile (`CONNEXION`, `SAUVEGARDE LOCALE`).
- **Panneau cible** (brackets + scanlines) : titre « CIBLE · RENAISSANCE »
  avec icône rebirth ; badge d'état — `x / 3 PRÊTS` (bordure pointillée
  accent) ou **« ✓ RENAISSANCE PRÊTE » pulsant** (animation `pulseGlow`,
  bordure verte) quand toutes les exigences sont en base ; sélecteurs
  `CYC 1-4` et `RB 1-27` ; bouton **SUPER RB** (bordure pointillée, icône
  super rebirth) — même confirmation/comportement qu'aujourd'hui ; 3 lignes
  d'exigences : liseré gauche 2px + fond dégradé (vert = en base, accent =
  possédé pas en base, gris = manquant), icône ✓/⚠/✗, nom, note
  `VARIANTE · ÉTAT` ; crédits requis en gros (icône crédits + montant,
  glow) + « DÉBLOQUE : … » (cycle 1).
- **Recherche/tri** : champ « Scanner le registre… (ex. R6) » avec glyphe ⌕,
  select RARETÉ/REVENU, pastille « i » (tooltip title = aide des tap/toggles).
- **Filtres** (8) : TOUS, GARDER, MANQUANTS, EN BASE, WISH ★, WORKER,
  ASTROMECH, BATTLE — **chaque entrée affiche son compteur** (nombre de
  droïdes correspondants, la recherche courante s'applique). Sidebar
  verticale à liseré actif (desktop) / chips (mobile).
- **Liste** : groupée par rareté avec en-têtes de section « ◈ RARETÉ · NN »
  et filet dégradé (tri RARETÉ) ; en tri REVENU, une seule section
  « Par revenu » triée par revenu Beskar décroissant.
- **Cartes droïde** : nom uppercase + icône de classe (webp, 15px,
  drop-shadow) ; ★/☆ wishlist, ✦ flawless (or + glow si actif) ; badge
  « GARDER » (fond accent plein, texte sombre) ; badges d'exigences
  `RB{n}·{TIER}` (vert ✓ / ⚠ accent clair / accent fond léger ; barrés +
  opacité 0,5 si rb < cible) ; ligne valeur : icône crédits +
  `{inc0}/s → {inc4}/s · BSK {coût} · {PERK}` (iconiques : `+15%/s · {PERK}`) ;
  **rangée 5 variantes** : boutons à lampe horizontale (16×4px — bordure
  colorée si état 0, pleine + glow si ≥ 1), libellé abrégé coloré par tier,
  fond `color-mix` 8 % (possédé) / 16 % + inner-glow (en base), préfixe `⌂ `
  si en base ; liseré gauche accent + inner-glow sur la carte si exigence
  non satisfaite (comme le « à garder » actuel). Iconiques : deux boutons
  POSSÉDÉ / ⌂ EN BASE à lampe ronde.
- **Footer** : `AUTOSAVE ● LOCAL` (→ `ENREGISTRÉ ● LOCAL` 2 s après
  sauvegarde), séparateurs fins, RESET (hover rouge), mention légale
  existante, lien GitHub, `DROIDEX V{version}`.

## 4. Nouveautés fonctionnelles (venant du prototype)

- Compteurs par filtre (calculés à chaque rendu).
- Filtres par classe Worker/Astromech/Battle (`d.t === filtre`).
- Badge « renaissance prête » avec compteur x/3 et état pulsant.
- Barre de progression segmentée (10 segments) remplaçant la barre continue.
- Sections par rareté avec compteurs (le tri actuel « rareté » devient
  groupé ; le tri « revenu » reste plat).
- Format compteur `012/317` (padStart).

Tout le reste est iso-fonctionnel : états/tap-cycle, keep, badges, super-
renaissance, import/export, reset, sync PocketBase, RGPD, PWA offline.

## 5. Contraintes techniques

- **CSP** (vérifiée dans `deploy/security-headers.conf`) : `script-src 'self'`
  (aucun script inline — contrainte dure) ; `style-src 'self' 'unsafe-inline'`
  (les styles inline et `element.style` sont permis). On traduit néanmoins le
  style du prototype en classes dans `site/styles.css` réécrit — par
  maintenabilité et pour garder index.html lisible — en tolérant les
  manipulations `element.style` en JS pour les valeurs réellement dynamiques
  (comme le fait déjà app.js).
- **i18n** : toutes les nouvelles chaînes (libellés uppercase, statuts sync,
  sections, filtres, aide) via le dictionnaire `I18N` existant, EN + FR,
  reprises du prototype (il embarque déjà les deux langues). `TIERS` /
  `TIER_SHORT` / `RARITY_LABELS` restent les globales réassignées par
  `setLang()` ; `TIER_SHORT` prend les valeurs abrégées BAS/GLD/DIA/RBW/BSK
  (identiques dans les deux langues, comme dans le prototype).
- **Assets** : icônes de `ICONES/` copiées dans `site/icons/game/` ; polices
  du bundle dans `site/fonts/` (remplacement des actuelles) ; tout référencé
  en relatif, jamais de ressource externe.
- **État/stockage** : clé `droidex-tracker-v1` inchangée, aucun changement de
  schéma, aucune migration, sync intacte.
- **PWA** : liste de cache du service worker mise à jour (nouvelles polices,
  icônes) ; `APP_VERSION` → `1.3.0` ; CHANGELOG.
- **SEO/perf** : pas de changement d'URL ni de contenu indexable notable ;
  `<noscript>` et JSON-LD conservés.

## 6. Tests et vérification

- Adapter les asserts existants aux nouveaux libellés EN : compteur
  `012/317`-style, badge canonique « ✓ RB10·GLD » (cible 10, vert non barré ;
  barré à cible 11 — sémantique du scénario Strike-Orb conservée), textes de
  boutons/chips uppercase.
- Nouveaux asserts : compteurs de filtres (valeurs exactes sur état seedé),
  filtre par classe, en-têtes de sections par rareté (+ section unique en tri
  revenu), badge « REBIRTH READY » (présence/état selon 3/3), 10 segments de
  progression (nombre d'allumés selon l'état).
- Vérification visuelle finale : rendu local comparé aux trois captures de
  `SCREENSHOT/` (desktop, mobile, cartes), puis régénération des captures
  README via `tests/screenshots.js` (solde aussi le suivi « screenshots
  périmés »).
- Après livraison : mettre à jour le scénario canonique dans CLAUDE.md.
