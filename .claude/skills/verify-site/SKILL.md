---
name: verify-site
description: Use when asked to verify, screenshot, or smoke-test the Droidex site in a real browser (prod after a deploy, or the local compose), or when a UI change needs proof beyond the jsdom tests.
---

# Vérifier le site Droidex dans un vrai navigateur (Playwright)

## Commandes

Le driver committé fait tout (compteurs, cartes fusion, D-O, tap réel, captures) :

```bash
cd tests
npm install --no-save playwright            # non listé dans package.json (npm install léger, comme screenshots.js)
npx playwright install chromium-headless-shell   # navigateurs en cache ~/Library/Caches/ms-playwright
node verify-site.js                         # prod (https://droidex.nackz.dev)
node verify-site.js http://localhost:8080   # compose local (docker compose -f docker-compose.local.yml up -d --build)
```

Sortie : ✓/✗ par vérification, code de sortie ≠ 0 si échec, captures dans `tests/verify-out/` (gitignoré) — **regarder les captures**, une page blanche est un échec de rendu même si les asserts passent.

## Ce que le driver vérifie (assertions structurelles, pas de totaux en dur)

- `version.js` expose APP_VERSION (affichée dans le rapport — comparer à la release attendue) ;
- compteur principal = 7 × cartes standard + cartes iconiques (dérivé du DOM, survit aux patchs qui ajoutent des droïdes) ;
- compteur Flawless sur les standard ; chaque carte fusion porte une recette « ⚗ A + B + C » ;
- un tap sur une variante incrémente le compteur (interaction réelle, contexte navigateur jetable — rien de persisté côté compte) ;
- D-O rendu en carte Iconique (toggles, zéro pastille).

## Pièges connus

- `chromium-headless-shell` absent → erreur « Executable doesn't exist » : relancer `npx playwright install chromium-headless-shell` (Playwright épingle une version de navigateur par version de paquet).
- Une capture Chrome `--headless --window-size=390` n'émule PAS un viewport mobile — pour du vrai mobile, TOUJOURS passer par Playwright (piège vécu : le texte semble déborder sur toutes les pages et on « corrige » un bug inexistant).
- Vérifier la prod juste après un déploiement : attendre ~15-30 s (fenêtre 404 Traefik).
- Captures README : c'est `tests/screenshots.js` (registre démo préchargé), pas ce driver.
