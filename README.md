# Droidex — Registre du droïdesmith

Tracker de collection communautaire pour **Star Wars: Droid Tycoon**, le mode Fortnite créé par FOAD/Blzn Studios (sorti le 1ᵉʳ mai 2026).

Le jeu propose un Droidex de 200+ droïdes à collectionner en 5 variantes (Basic, Or, Diamant, Arc-en-ciel, Beskar) et 23 niveaux de Renaissance exigeant chacun 3 droïdes spécifiques **physiquement présents dans votre base**, plus des crédits. Devant la boutique du Sandcrawler, le jeu n'offre aucun moyen de savoir ce qu'on possède déjà — ce tracker comble ce manque.

> 📱 Pensé pour être utilisé sur téléphone, à côté de la console. Installable comme application (PWA).

<!-- TODO : ajouter des captures d'écran
![Vue principale](docs/screenshot-main.png)
![Panneau de renaissance](docs/screenshot-rebirth.png)
-->

## Fonctionnalités

- **Suivi par variante** en 3 états cyclables au tap : jamais eu → possédé (entrée Droidex) → 🏠 en base (présence physique) → effacer.
- **Règle des variantes supérieures** : un droïde Diamant valide toujours une exigence « Or ».
- **Panneau « Prochaine renaissance visée »** (1–23) : les 3 droïdes requis avec leur statut (✗ pas possédé, ⚠ possédé mais pas en base, ✓ prêt) et les crédits nécessaires.
- **Badges d'exigence** sur chaque droïde (ex. « RB9 · Or ») : barrés uniquement quand la renaissance est passée, jamais une exigence future même satisfaite.
- **Tag « À garder »** tant qu'une renaissance future dépend du droïde ; liseré orange si une action est nécessaire.
- **Filtres** : Tous / À garder / Manquants requis / En base / Worker / Astromech / Battle, plus recherche.
- **Droïdes Iconiques** (BB-8, Mister Bones, IG-11 Marshal, DJ R-3X, R2-D2) : simple toggle possédé + en base, sans variantes.
- **Synchronisation entre appareils (optionnelle)** : connexion avec un compte Google, le registre suit le compte. Sans compte, tout reste dans le navigateur (`localStorage`) — pas de tracking, pas d'inscription obligatoire.
- **Export/import JSON** en secours ou pour rester 100 % hors ligne.

## Utilisation

### En ligne

Ouvrez simplement le site, cochez vos droïdes. Sur mobile, utilisez « Ajouter à l'écran d'accueil » pour l'installer comme application (fonctionne hors ligne ensuite).

### Synchronisation entre appareils

Deux options :

- **Compte Google** (recommandé) : bouton « Se connecter avec Google » en bas de page. Le registre est alors sauvegardé sur le serveur et rechargé automatiquement sur tout appareil connecté au même compte. Dernière écriture gagne ; « Supprimer mon compte » efface tout côté serveur.
- **Manuel** : **Exporter la sauvegarde** → télécharge `droidex-backup.json` → transférez le fichier (AirDrop, mail…) → **Importer** sur l'autre appareil.

## Auto-hébergement (Docker)

Deux conteneurs :

- **droidex** : le site statique (nginx).
- **pocketbase** : l'API de synchronisation ([PocketBase](https://pocketbase.io) 0.39, un binaire + SQLite). Optionnel — sans lui, le site fonctionne en mode local pur.

### Test local

```bash
docker compose -f docker-compose.local.yml up -d
# Site : http://localhost:8080 — API : http://localhost:8090
```

### VPS derrière Traefik v2

Prérequis : un Traefik existant avec un entrypoint `websecure`, un résolveur de certificats `letsencrypt` et un réseau Docker externe nommé `proxy`. Deux entrées DNS vers le VPS : `droidex.mondomaine.fr` et `api.droidex.mondomaine.fr`.

```bash
git clone https://github.com/n4ckz/droidex.git && cd droidex
cp .env.example .env        # renseigner DROIDEX_DOMAIN=droidex.mondomaine.fr
docker compose up -d

# créer le compte admin PocketBase (une seule fois)
docker compose exec pocketbase /pb/pocketbase superuser upsert VOTRE@EMAIL.fr VOTRE_MOT_DE_PASSE --dir=/pb/pb_data
```

Les deux conteneurs exposent un healthcheck HTTP, visible via `docker ps`. Les données PocketBase vivent dans `./pb_data` (à inclure dans vos sauvegardes du VPS).

### Activer la connexion Google (une fois le site en ligne)

1. [Google Cloud Console](https://console.cloud.google.com/) → créez un projet → **APIs & Services › OAuth consent screen** : type « External », renseignez nom et email. Seuls les scopes de base (email, profil) sont utilisés : **aucune vérification Google n'est requise** ; passez l'application « In production ».
2. **Credentials › Create credentials › OAuth client ID** → type « Web application ». Dans **Authorized redirect URIs**, ajoutez :
   - `https://api.droidex.mondomaine.fr/api/oauth2-redirect`
   - `http://localhost:8090/api/oauth2-redirect` (pour les tests locaux)
3. Ouvrez la console PocketBase `https://api.droidex.mondomaine.fr/_/`, connectez-vous avec le compte admin, puis **Collections › users › ⚙ Options › OAuth2** : activez **Google** et collez le Client ID et le Client Secret.

C'est tout : le bouton « Se connecter avec Google » du site devient fonctionnel. La collection `saves` (une sauvegarde par utilisateur, lisible/modifiable uniquement par son propriétaire) est créée automatiquement par migration au premier démarrage.

### Sans Traefik / sans synchronisation

Servez le dossier `site/` avec n'importe quel serveur statique. Pour désactiver complètement la synchronisation (et masquer l'interface de compte), mettez `PB_URL` à `''` dans [`site/config.js`](site/config.js). Par convention, le front cherche l'API sur `api.<domaine du site>` (modifiable dans ce même fichier).

## Structure du projet

```
site/               Le site statique complet
  index.html
  styles.css        Thème Tatooine sombre
  data.js           ⚠ Données de jeu (droïdes, exigences, crédits) — SEUL fichier à
                    modifier quand le jeu ajoute du contenu
  app.js            Logique (états, rendu, persistance, export/import)
  config.js         URL de l'API de synchronisation ('' pour désactiver)
  sync.js           Synchronisation de compte (PocketBase, optionnelle)
  vendor/           SDK JS PocketBase auto-hébergé (0.27.0)
  manifest.json     PWA
  sw.js             Service worker (cache offline du shell — incrémenter
                    CACHE_VERSION à chaque mise à jour du site)
  fonts/            Polices auto-hébergées (pas de requête vers Google Fonts)
  icons/            Icônes PWA
deploy/
  nginx.conf              Config nginx (cache, gzip, sw.js jamais mis en cache)
  pocketbase.Dockerfile   Image PocketBase (version épinglée)
  pb_migrations/          Migration créant la collection « saves »
tests/                    Suites de tests (voir ci-dessous)
Dockerfile                Image du site statique
docker-compose.yml        Production (Traefik) : site + API
docker-compose.local.yml  Test local
```

## Tests

```bash
docker compose -f docker-compose.local.yml up -d
docker compose -f docker-compose.local.yml exec pocketbase /pb/pocketbase superuser upsert admin@test.local testpass1234 --dir=/pb/pb_data

cd tests && npm install
npm run test:app    # logique du tracker (jsdom, sans serveur) : persistance, badges, migration, filtres
npm run test:sync   # end-to-end contre le PocketBase local : push/pull, isolation entre comptes, suppression RGPD
```

Le test de synchronisation crée ses utilisateurs de test (`alice@test.local`, `bob@test.local`) et vide la collection `saves` à chaque exécution — ne le lancez jamais contre une instance de production.

### Modèle de synchronisation

`localStorage` reste le cache local et le mode hors ligne. Connecté, chaque modification est poussée (débounce 1 s) vers la collection `saves` ; au chargement, la sauvegarde du compte est tirée. En cas de divergence entre l'appareil et le compte à la connexion, l'utilisateur choisit lequel garder. Dernière écriture gagne entre appareils.

### Données personnelles (RGPD)

Le compte est optionnel. S'il est créé : PocketBase stocke l'email Google, le nom du profil et le registre de collection — rien d'autre, aucun tracking. Le bouton « Supprimer mon compte » efface le compte **et** sa sauvegarde (suppression en cascade), sans intervention de l'administrateur. Pensez à adapter la mention de contact du footer si vous hébergez une instance publique.

## Données de jeu et limites connues

Les données (68 droïdes suivis dont 5 Iconiques, exigences des renaissances 1–23, coûts en crédits) sont maintenues dans [`site/data.js`](site/data.js) à partir des sources communautaires :

- [Droidex complet (Insider Gaming)](https://insider-gaming.com/fortnite-star-wars-droid-tycoon-droidex-all-droids/)
- [Renaissances 1–23 (wiki communautaire)](https://star-wars-droid-tycoon.fandom.com/wiki/Rebirths)
- [Les 11 droïdes Mythiques (fdaytalk)](https://www.fdaytalk.com/fortnite-droid-tycoon-mythic-droids/)
- [Wiki général du mode](https://fortnite.fandom.com/wiki/Droid_Tycoon) et [wiki dédié](https://star-wars-droid-tycoon.fandom.com/wiki/)
- [Événements et Iconiques](https://droidtycoonguide.com/events/)

**Incertitudes connues :**

- Les classes de 4 Mythiques (Snow Mouse, RIC, MO-TRAK, DRFT-R) sont des attributions plausibles **non confirmées** par la communauté.
- Les renaissances **21–23** (palier Beskar) ne sont pas totalement vérifiées.
- Le jeu est mis à jour fréquemment : les exigences des renaissances 11–18 ont déjà été rééquilibrées par patch. Si vous constatez un écart, ouvrez une issue ou une PR sur `site/data.js`.

## Licence et mentions

Code sous [licence MIT](LICENSE).

Projet de fan non affilié à Epic Games, Lucasfilm ou Disney. Star Wars est une marque de Lucasfilm Ltd. Droid Tycoon est un mode Fortnite créé par FOAD/Blzn Studios. Aucun asset du jeu n'est utilisé.
