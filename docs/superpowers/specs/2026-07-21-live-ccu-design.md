# Design — Compteur de joueurs en direct (Ecosystem API Epic)

Date : 2026-07-21 · Statut : validé (emplacement choisi par Julien : en-tête)

## Quoi

Badge « ● 12,5K en jeu » / « ● 12.5K in game » dans la zone des compteurs de
l'en-tête (à côté du bonus de collection et du compteur Galactique), alimenté
par l'API officielle et publique d'Epic :
`https://api.fortnite.com/ecosystem/v1/islands/7865-8305-9184/metrics/minute`
→ `peakCCU` = tranches de 10 min, dernier point non-null = joueurs actuels.
CORS ouvert (`access-control-allow-origin: *`), vérifié le 21/07/2026.

## Comportement

- Fetch au chargement + rafraîchissement toutes les 5 min.
- Valeur mémorisée dans `liveCcu` (module app.js) ; rendu par `renderLiveCcu()`,
  aussi appelé par `renderProgress()` pour suivre les bascules de langue.
- Échec réseau / API / hors-ligne / valeurs toutes null → badge `hidden`,
  aucun message d'erreur. Le service worker n'intercepte pas le cross-origin
  (garde existante) : hors-ligne, le fetch échoue proprement.
- Format via `fmtInc` existant (12505 → « 12.5K »).

## Fichiers

- `site/index.html` : `<span class="collection-bonus live-ccu" id="liveCcu" hidden>`
  après `#galacticCount`.
- `site/app.js` : `liveCcu` + `renderLiveCcu()` + `refreshLiveCcu()` +
  setInterval 5 min dans init ; appel de `renderLiveCcu()` dans `renderProgress`.
- `site/i18n.js` : clé `liveCcu` (« ● {0} in game » / « ● {0} en jeu »), 2 langues.
- `site/styles.css` : `.live-ccu` en vert « ok » du DS.
- `deploy/security-headers.conf` : `connect-src` += `https://api.fortnite.com`.
- `site/llms.txt` + noscript : mention de la fonctionnalité (visibilité IA).
- `tests/test-droidex.js` : stub de `window.fetch` pour api.fortnite.com dans
  `boot()` (fixture peakCCU, dernier bucket null comme en réel) ; asserts :
  badge rendu « ● 12.5K in game », caché si l'API échoue. Aucun appel réseau
  réel dans les tests.
- `site/version.js` 1.6.0 + CHANGELOG + pages SEO régénérées (footer versionné).

## Hors périmètre

Graphiques/historique de CCU, autres métriques (plays, rétention), affichage
hors en-tête. La veille (watch-signals) n'est pas concernée.
