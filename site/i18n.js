/* =========================================================================
   Internationalisation. Anglais par défaut, français via le sélecteur.
   - Textes statiques : attributs data-i18n / data-i18n-html /
     data-i18n-placeholder / data-i18n-aria / data-i18n-title dans index.html.
   - Textes dynamiques : t('clé') dans app.js et sync.js.
   - Labels de variantes/raretés : globales TIERS / TIER_SHORT / RARITY_LABELS
     réassignées à chaque changement de langue.
   ========================================================================= */

/* Icône « en base » : maison monochrome, épouse la couleur de la variante
   (stroke=currentColor). Définie une fois, réutilisée par les pips (app.js). */
const BASE_ICON = '<svg class="ico-base" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11.5l8-7.5 8 7.5"/><path d="M6 10v9h12v-9"/></svg>';

const I18N = {
  en: {
    _tiers: ['Basic','Gold','Diamond','Rainbow','Beskar','Galactic'],
    _tierShort: ['BAS','GLD','DIA','RBW','BSK','GLC'],
    _rarities: {Common:'Common',Rare:'Rare',Epic:'Epic',Legendary:'Legendary',Mythic:'Mythic',Iconic:'Iconic'},
    title: "Droidex — Star Wars: Droid Tycoon Collection Tracker (Fortnite)",
    h1: "Droidex — Droidsmith's Registry",
    h1short: 'DROIDEX',
    eyebrow: '▸ Droid Tycoon // Registry',
    rbTitle: 'Target · Rebirth',
    rbAria: 'Targeted rebirth',
    cycleAria: 'Rebirth cycle',
    readyCount: '{0} / {1} ready',
    rebirthReady: '✓ Rebirth ready',
    cycleShort: 'CYC',
    rbShort: 'RB',
    unlocks: 'Unlock: {0}',
    collectionBonus: '{0} distinct · bonus +{1}%',
    galacticCount: '✧ Galactic {0}/{1}',
    liveCcu: '● {0} in game',
    filterWish: 'Wish ★',
    sortRarity: 'Rarity',
    sortIncome: 'Income',
    sortAria: 'Sort',
    byIncome: 'By Beskar income',
    wishAria: 'Wishlist',
    flawAria: 'Flawless',
    searchPlaceholder: 'Scan registry… (e.g. R6)',
    searchAria: 'Search',
    filtersHead: '◈ Filters',
    hintFull: '1 tap = owned (Droidex) · 2 taps = in base · 3 taps = clear · ★ = wishlist · ✦ = Flawless unlocked (rare permanent drop)',
    wishTip: 'Add to wishlist (droids you are hunting for)',
    flawTip: 'Flawless unlocked: rare permanent drop (1/1000 Basic → 1/100 Beskar), kept in your Droidex forever',
    filterAll: 'All',
    filterKeep: 'Keep',
    filterMissing: 'Missing',
    filterBase: 'In base',
    filterWorker: 'Worker',
    filterAstromech: 'Astromech',
    filterBattle: 'Battle',
    loading: 'LOADING REGISTRY…',
    autoSave: 'Autosave ● local',
    exportBtn: '⇩ Export',
    importBtn: '⇧ Import',
    resetBtn: 'Reset registry',
    saved: 'Saved ● local',
    saveFailed: 'Save failed — try again',
    exported: 'Backup exported (droidex-backup.json)',
    imported: 'Registry imported',
    importInvalid: 'Invalid file — expected a Droidex export',
    importUnreadable: 'Could not read the file',
    importConfirm: 'Replace the current registry with the imported file?',
    resetConfirm: 'Erase the whole registry? This cannot be undone.',
    superRebirthBtn: 'SUPER RB',
    superRebirthAria: 'Apply a super rebirth',
    superRebirthConfirm: 'Apply a super rebirth? Droids in your base drop back to "owned (Droidex)", Iconic droids leave your base (their unlock is kept — buy-back at the Nova crystal shop), the targeted rebirth returns to 1 and the targeted cycle advances. Flawless and wishlist are kept.',
    empty: 'No signal — no droid matches',
    keepTag: 'Keep',
    owned: 'Owned',
    notOwned: 'Not owned',
    inBase: '⌂ In base',
    notInBase: 'Not in base',
    ariaInBase: 'in base',
    ariaOwned: 'owned',
    ariaAbsent: 'absent',
    minInBase: '· in base',
    minNotInBase: '· not in base',
    minimum: 'min',
    credits: 'Credits required',
    syncNotLogged: 'Not signed in — local save only',
    syncLoginBtn: 'Sign in with Google',
    syncLogoutBtn: 'Sign out',
    syncDeleteBtn: 'Delete my account',
    syncSynced: 'Synced',
    syncInProgress: 'Signing in…',
    syncLoginFailed: 'Sign-in cancelled or failed',
    syncPushFailed: 'Sync failed — data kept locally',
    syncOffline: 'Offline — using local save',
    syncConflict: 'A different backup exists on this account.\n\nOK: load the account backup (replaces this device’s registry)\nCancel: keep this device’s registry and upload it to the account',
    syncDeleteConfirm: 'Delete your account and its server backup?\nThe registry will remain on this device.',
    syncDeleted: 'Account deleted — local save kept',
    syncDeleteFailed: 'Deletion failed — try again',
    legal: 'Fan project not affiliated with Epic Games, Lucasfilm or Disney. Star Wars is a trademark of Lucasfilm Ltd. ' +
      'Droid Tycoon is a Fortnite mode created by FOAD/Blzn Studios. ' +
      '· <a href="https://github.com/n4ckz/droidex" rel="noopener">Source code on GitHub</a> ' +
      '· <a href="value-list/">Value list</a> ' +
      '· <a href="rebirth-requirements/">Rebirth requirements</a> ' +
      '· <a href="stats/">Live stats</a> ' +
      '· <a href="faq/">FAQ</a> ' +
      '· Without an account, everything stays in your browser. With an optional account, only your email ' +
      'and your registry are stored on our server, deletable at any time via “Delete my account”.'
  },
  fr: {
    _tiers: ['Basic','Or','Diamant','Arc-en-ciel','Beskar','Galactique'],
    _tierShort: ['BAS','GLD','DIA','RBW','BSK','GLC'],
    _rarities: {Common:'Commun',Rare:'Rare',Epic:'Épique',Legendary:'Légendaire',Mythic:'Mythique',Iconic:'Iconique'},
    title: 'Droidex — Tracker de collection Star Wars: Droid Tycoon (Fortnite)',
    h1: 'Droidex — Registre du droïdesmith',
    h1short: 'DROIDEX',
    eyebrow: '▸ Droid Tycoon // Registry',
    rbTitle: 'Cible · Renaissance',
    rbAria: 'Renaissance visée',
    cycleAria: 'Cycle de renaissance',
    readyCount: '{0} / {1} prêts',
    rebirthReady: '✓ Renaissance prête',
    cycleShort: 'CYC',
    rbShort: 'RB',
    unlocks: 'Débloque : {0}',
    collectionBonus: '{0} distincts · bonus +{1}%',
    galacticCount: '✧ Galactique {0}/{1}',
    liveCcu: '● {0} en jeu',
    filterWish: 'Wish ★',
    sortRarity: 'Rareté',
    sortIncome: 'Revenu',
    sortAria: 'Tri',
    byIncome: 'Par revenu Beskar',
    wishAria: 'Liste de recherche',
    flawAria: 'Flawless',
    searchPlaceholder: 'Scanner le registre… (ex. R6)',
    searchAria: 'Recherche',
    filtersHead: '◈ Filtres',
    hintFull: '1 tap = possédé (Droidex) · 2 taps = en base · 3 taps = vide · ★ = wishlist · ✦ = Flawless débloqué (drop permanent rare)',
    wishTip: 'Ajouter à la wishlist (droïdes que tu chasses)',
    flawTip: 'Flawless obtenu : drop rare permanent (1/1000 Basic → 1/100 Beskar), conservé à vie dans le Droidex',
    filterAll: 'Tous',
    filterKeep: 'Garder',
    filterMissing: 'Manquants',
    filterBase: 'En base',
    filterWorker: 'Worker',
    filterAstromech: 'Astromech',
    filterBattle: 'Battle',
    loading: 'CHARGEMENT DU REGISTRE…',
    autoSave: 'Auto-save ● local',
    exportBtn: '⇩ Exporter',
    importBtn: '⇧ Importer',
    resetBtn: 'Réinitialiser le registre',
    saved: 'Enregistré ● local',
    saveFailed: 'Échec de sauvegarde — réessaie',
    exported: 'Sauvegarde exportée (droidex-backup.json)',
    imported: 'Registre importé',
    importInvalid: 'Fichier invalide — export Droidex attendu',
    importUnreadable: 'Lecture du fichier impossible',
    importConfirm: 'Remplacer le registre actuel par le contenu du fichier importé ?',
    resetConfirm: 'Effacer tout le registre ? Cette action est définitive.',
    superRebirthBtn: 'SUPER RB',
    superRebirthAria: 'Appliquer une super-renaissance',
    superRebirthConfirm: 'Appliquer une super-renaissance ? Les droïdes de ta base repassent en « possédé (Droidex) », les iconiques quittent la base (déverrouillage conservé — rachat à la boutique de cristaux Nova), la renaissance visée revient à 1 et le cycle visé avance. Flawless et wishlist sont conservés.',
    empty: 'Aucun signal — aucun droïde trouvé',
    keepTag: 'Garder',
    owned: 'Possédé',
    notOwned: 'Non possédé',
    inBase: '⌂ En base',
    notInBase: 'Hors base',
    ariaInBase: 'en base',
    ariaOwned: 'possédé',
    ariaAbsent: 'absent',
    minInBase: '· en base',
    minNotInBase: '· hors base',
    minimum: 'min',
    credits: 'Crédits requis',
    syncNotLogged: 'Non connecté — sauvegarde locale uniquement',
    syncLoginBtn: 'Se connecter avec Google',
    syncLogoutBtn: 'Se déconnecter',
    syncDeleteBtn: 'Supprimer mon compte',
    syncSynced: 'Synchronisé',
    syncInProgress: 'Connexion en cours…',
    syncLoginFailed: 'Connexion annulée ou impossible',
    syncPushFailed: 'Synchronisation impossible — données gardées en local',
    syncOffline: 'Hors ligne — sauvegarde locale utilisée',
    syncConflict: 'Une sauvegarde différente existe sur ce compte.\n\nOK : charger la sauvegarde du compte (remplace le registre de cet appareil)\nAnnuler : garder le registre de cet appareil et l’envoyer sur le compte',
    syncDeleteConfirm: 'Supprimer ton compte et sa sauvegarde sur le serveur ?\nLe registre restera sur cet appareil.',
    syncDeleted: 'Compte supprimé — sauvegarde locale conservée',
    syncDeleteFailed: 'Suppression impossible — réessaie',
    legal: 'Projet de fan non affilié à Epic Games, Lucasfilm ou Disney. Star Wars est une marque de Lucasfilm Ltd. ' +
      'Droid Tycoon est un mode Fortnite créé par FOAD/Blzn Studios. ' +
      '· <a href="https://github.com/n4ckz/droidex" rel="noopener">Code source sur GitHub</a> ' +
      '· <a href="value-list/">Liste des valeurs</a> ' +
      '· <a href="rebirth-requirements/">Exigences de renaissance</a> ' +
      '· <a href="stats/">Stats en direct</a> ' +
      '· <a href="faq/">FAQ</a> ' +
      '· Sans compte, tout reste dans votre navigateur. Avec un compte (optionnel), seuls votre email ' +
      'et votre registre sont stockés sur notre serveur, supprimables à tout moment via « Supprimer mon compte ».'
  }
};

const LANG_KEY = 'droidex-lang';
let LANG = 'en';
let TIERS, TIER_SHORT, RARITY_LABELS;

function t(key, ...subs){
  let s = (I18N[LANG] && I18N[LANG][key]) || I18N.en[key] || key;
  subs.forEach((v,i)=>{ s = s.replace('{'+i+'}', v); });
  return s;
}

function applyStaticTexts(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{ el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el=>{ el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{ el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>{ el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.querySelectorAll('[data-i18n-title]').forEach(el=>{ el.setAttribute('title', t(el.dataset.i18nTitle)); });
  document.title = t('title');
  document.documentElement.lang = LANG;
}

function setLang(lang){
  LANG = I18N[lang] ? lang : 'en';
  try{ localStorage.setItem(LANG_KEY, LANG); }catch(e){}
  TIERS = I18N[LANG]._tiers;
  TIER_SHORT = I18N[LANG]._tierShort;
  RARITY_LABELS = I18N[LANG]._rarities;
  const sel = document.getElementById('langSelect');
  if(sel) sel.value = LANG;
  applyStaticTexts();
  if(typeof renderAll === 'function') renderAll();
  if(typeof syncUpdateUI === 'function' && typeof pb !== 'undefined' && pb) syncUpdateUI();
}

(function initLang(){
  let saved = null;
  try{ saved = localStorage.getItem(LANG_KEY); }catch(e){}
  /* première visite (aucun choix enregistré) : préselectionne le français
     pour les navigateurs francophones, anglais sinon */
  const detected = (navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en';
  LANG = I18N[saved] ? saved : detected;
  TIERS = I18N[LANG]._tiers;
  TIER_SHORT = I18N[LANG]._tierShort;
  RARITY_LABELS = I18N[LANG]._rarities;
  applyStaticTexts();
  const sel = document.getElementById('langSelect');
  sel.value = LANG;
  sel.addEventListener('change', ()=>setLang(sel.value));
})();
