# Design — Synchro résolue par fraîcheur (v1.9.0)

Date : 2026-07-21 · Statut : implémenté (PR #12) · Décisions : Julien

## L'incident qui a motivé le chantier

Le 21/07/2026 au soir, un appareil secondaire (PWA restée sur une version en
cache d'avant la migration Galactique, avec un état local vieux de plusieurs
jours) a ouvert l'app, vu l'ancien dialogue de conflit, et le choix « garder
cet appareil » a **rétrogradé la sauvegarde du compte** (cycle 2 · RB 7 →
cycle 1 · RB 17, format 5 variantes). L'appareil principal a ensuite adopté
cette version rétrogradée via « OK ».

Cause racine : le protocole de synchro n'avait **aucune notion du temps**.
Sans horodatage, ni la machine ni l'utilisateur ne pouvaient savoir quelle
version était la plus récente — le dialogue posait une question à laquelle il
était impossible de répondre correctement.

## Décisions (Julien, 21/07/2026)

1. **Horodater chaque sauvegarde** : obligatoire.
2. **Aucun dialogue** : « pourquoi proposer un choix ? il faut mettre la
   version la plus récente » → résolution automatique par fraîcheur.
3. Le cache local n'est PAS le problème (c'est le moteur offline/PWA) ;
   c'est l'absence de temps qui l'était.

## Mécanique (site/sync.js + site/app.js)

- `persistState()` écrit `state.savedAt = ISO(now)` à chaque sauvegarde.
- `syncNewerSide(server, rec.updated, local)` : compare `savedAt` des deux
  côtés ; replis : sauvegarde serveur pré-v1.9 → `updated` PocketBase ;
  état local sans `savedAt` → le compte (référence) gagne.
- Réconciliation (`syncReconcile`) : cas vides inchangés ; égalité (normalisée
  par les migrations, cf. v1.8.1) → adoption silencieuse ; divergence → la
  plus récente est appliquée, **la version écartée est stashée** dans
  localStorage `droidex-rescue` (`{side, at, state}`, une seule case), et la
  barre de statut annonce l'issue (`syncNewerLoaded` / `syncNewerSent`).
- **Garde anti-écrasement** (`syncPush`) : l'appareil mémorise le `updated`
  PocketBase de la dernière version serveur qu'il a vue
  (`syncLastServerUpdated`) ; avant d'écrire, il relit l'enregistrement — si
  le serveur a bougé entre-temps, il re-réconcilie par fraîcheur au lieu
  d'écraser. `syncPush(true)` (depuis la réconciliation) court-circuite la
  garde pour éviter la boucle.

## Limites connues

- **Horloge d'appareil déréglée** : la résolution automatique peut se tromper
  — c'est le rôle du filet `droidex-rescue` (rien n'est perdu, récupération
  manuelle possible).
- **Vieux clients en cache** (PWA cache-first) : un appareil qui n'a pas
  rouvert l'app depuis avant la v1.9.0 exécute l'ancien code sans garde
  jusqu'à sa 2ᵉ ouverture. Fenêtre de risque transitoire, s'éteint d'elle-même.
- Résolution par **snapshot entier** (pas de fusion par droïde) : si deux
  appareils progressent hors-ligne en parallèle, le moins récent est écarté
  (mais stashé). Une fusion fine (CRDT par variante) serait surdimensionnée.

## Tests

- jsdom section [24] : horodatage, `savedAt` ignoré par la comparaison
  d'égalité, matrice de `syncNewerSide` (5 cas dont replis), stash.
- e2e `test-sync.js` : inchangé et vert (le schéma PocketBase ne change pas —
  `savedAt` vit dans le JSON `data`).
