/* =========================================================================
   Pages de contenu : détection de langue, alignée sur l'app (index).
   - À l'arrivée sur une page ANGLAISE : si l'utilisateur a EXPLICITEMENT
     choisi le français (localStorage droidex-lang, clé partagée avec l'app),
     on bascule vers la version /fr/. Si son navigateur est simplement
     francophone sans choix enregistré, on SUGGÈRE la version française via
     un bandeau — plus de redirection automatique : Google recommande de
     suggérer plutôt que rediriger, et une redirection déclenchée par la
     locale est un signal ambigu pour l'indexation (décision v1.15.0, prise
     pendant l'élagage d'index du 28-29/07/2026 même si le script a été mis
     hors de cause).
   - JAMAIS de redirection ni de bandeau depuis les pages françaises :
     Googlebot navigue en anglais ; un anglophone sur /fr/ a le sélecteur EN.
   - Le sélecteur EN/FR et le bandeau persistent le choix explicite dans la
     MÊME clé que l'app : changer de langue ici change aussi le tracker.
   ========================================================================= */
(function () {
  'use strict';
  var KEY = 'droidex-lang';
  var here = document.documentElement.lang;

  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}

  /* chemin FR équivalent, relatif à l'hôte courant : l'hreflang pointe vers
     l'instance officielle en absolu, mais on doit rester sur l'hôte courant
     (local, auto-hébergement) */
  function frPath() {
    var alt = document.querySelector('link[rel="alternate"][hreflang="fr"]');
    if (!alt) return null;
    var u = new URL(alt.getAttribute('href'), location.href);
    return u.pathname + location.search + location.hash;
  }

  if (here === 'en' && stored === 'fr') {
    var p = frPath();
    if (p) { location.replace(p); return; }
  }

  document.addEventListener('DOMContentLoaded', function () {
    /* choix explicite via le sélecteur EN/FR de l'en-tête */
    var links = document.querySelectorAll('a[data-setlang]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () {
        try { localStorage.setItem(KEY, this.getAttribute('data-setlang')); } catch (e) {}
      });
    }

    /* navigateur francophone sans choix enregistré : bandeau de suggestion */
    var frBrowser = (navigator.language || '').toLowerCase().indexOf('fr') === 0;
    if (here !== 'en' || stored || !frBrowser) return;
    var p2 = frPath();
    if (!p2) return;
    try { if (sessionStorage.getItem('droidex-lang-hint')) return; } catch (e) {}

    var bar = document.createElement('div');
    bar.id = 'langBanner';
    bar.style.cssText = 'position:sticky;top:0;z-index:50;display:flex;align-items:center;' +
      'justify-content:center;gap:12px;padding:9px 14px;background:#181a2e;color:#c9cbe0;' +
      'border-bottom:1px solid rgba(157,107,255,.35);font-size:13px';
    var link = document.createElement('a');
    link.href = p2;
    link.textContent = 'Cette page existe en français — la lire en français →';
    link.style.cssText = 'color:#d2cefd;text-decoration:underline';
    link.addEventListener('click', function () {
      try { localStorage.setItem(KEY, 'fr'); } catch (e) {}
    });
    var close = document.createElement('button');
    close.type = 'button';
    close.textContent = '✕';
    close.setAttribute('aria-label', 'Fermer');
    close.style.cssText = 'background:none;border:none;color:#8a8ca8;cursor:pointer;font-size:13px;padding:2px 6px';
    close.addEventListener('click', function () {
      bar.remove();
      try { sessionStorage.setItem('droidex-lang-hint', '1'); } catch (e) {}
    });
    bar.appendChild(link);
    bar.appendChild(close);
    document.body.insertBefore(bar, document.body.firstChild);
  });
})();
