/* Configuration du serveur de synchronisation (PocketBase).
   - Mettre PB_URL à '' pour désactiver la synchronisation (site 100 % statique,
     l'interface de compte disparaît).
   - Convention par défaut : en local, PocketBase écoute sur le port 8090 ;
     en production, sur le sous-domaine api.<domaine du site>. */
const PB_URL = (['localhost','127.0.0.1'].includes(location.hostname))
  ? 'http://localhost:8090'
  : 'https://api.' + location.hostname;
