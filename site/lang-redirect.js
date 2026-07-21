/* =========================================================================
   Pages de contenu : détection de langue, alignée sur l'app (index).
   - À l'arrivée sur une page ANGLAISE : si l'utilisateur a choisi le
     français dans l'app (localStorage droidex-lang) ou si son navigateur
     est francophone sans choix enregistré, on bascule vers la version /fr/.
   - JAMAIS de redirection depuis les pages françaises : Googlebot navigue
     en anglais et serait éjecté — les pages FR ne seraient jamais indexées.
     Un anglophone qui atterrit sur /fr/ a le sélecteur EN dans l'en-tête.
   - Le sélecteur EN/FR persiste le choix explicite dans la MÊME clé que
     l'app : changer de langue ici change aussi la langue du tracker.
   ========================================================================= */
(function () {
  'use strict';
  var KEY = 'droidex-lang';
  var here = document.documentElement.lang;

  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  var want = stored || (((navigator.language || '').toLowerCase().indexOf('fr') === 0) ? 'fr' : 'en');

  if (here === 'en' && want === 'fr') {
    var alt = document.querySelector('link[rel="alternate"][hreflang="fr"]');
    if (alt) {
      /* ne garder que le CHEMIN : l'hreflang pointe vers l'instance officielle
         en absolu, mais la redirection doit rester sur l'hôte courant
         (local, auto-hébergement) */
      var u = new URL(alt.getAttribute('href'), location.href);
      location.replace(u.pathname + location.search + location.hash);
      return;
    }
  }

  /* choix explicite via le sélecteur EN/FR de l'en-tête */
  document.addEventListener('DOMContentLoaded', function () {
    var links = document.querySelectorAll('a[data-setlang]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () {
        try { localStorage.setItem(KEY, this.getAttribute('data-setlang')); } catch (e) {}
      });
    }
  });
})();
