/* =========================================================================
   Internationalisation. Anglais par défaut, français via le sélecteur.
   - Textes statiques : attributs data-i18n / data-i18n-html /
     data-i18n-placeholder / data-i18n-aria dans index.html.
   - Textes dynamiques : t('clé') dans app.js et sync.js.
   - Labels de variantes/raretés : globales TIERS / TIER_SHORT / RARITY_LABELS
     réassignées à chaque changement de langue.
   ========================================================================= */

/* Icône « en base » : maison monochrome, épouse la couleur de la variante
   (stroke=currentColor). Définie une fois, réutilisée par les pips (app.js)
   et par la légende ci-dessous. */
const BASE_ICON = '<svg class="ico-base" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11.5l8-7.5 8 7.5"/><path d="M6 10v9h12v-9"/></svg>';

const I18N = {
  en: {
    _tiers: ['Basic','Gold','Diamond','Rainbow','Beskar'],
    _tierShort: ['BAS','GLD','DIA','RBW','BSK'],
    _rarities: {Common:'Common',Rare:'Rare',Epic:'Epic',Legendary:'Legendary',Mythic:'Mythic',Iconic:'Iconic'},
    title: "Droidex — Droidsmith's Registry",
    h1: "Droidex — Droidsmith's Registry",
    rbTitle: 'Next targeted rebirth',
    rbAria: 'Targeted rebirth',
    rebirth: 'Rebirth',
    cycle: 'Cycle',
    cycleAria: 'Rebirth cycle',
    unlocks: 'Unlocks: {0}',
    collectionBonus: '{0} distinct droids owned · collection bonus +{1}% income',
    filterWish: 'Wishlist',
    sortRarity: 'Sort: rarity',
    sortIncome: 'Sort: income',
    sortAria: 'Sort',
    byIncome: 'By Beskar income',
    wishAria: 'Wishlist',
    flawAria: 'Flawless',
    searchPlaceholder: 'Search a droid… (e.g. R6)',
    searchAria: 'Search',
    hint: '1 tap = owned (Droidex) · 2 taps = ' + BASE_ICON + ' in base · 3 taps = clear',
    legendIcons: '★ = wishlist · ✨ = Flawless unlocked (rare permanent drop)',
    wishTip: 'Add to wishlist (droids you are hunting for)',
    flawTip: 'Flawless unlocked: rare permanent drop (1/1000 Basic → 1/100 Beskar), kept in your Droidex forever',
    filterAll: 'All',
    filterKeep: 'Keep',
    filterMissing: 'Missing required',
    filterBase: 'In base',
    loading: 'LOADING REGISTRY…',
    autoSave: 'Auto-save enabled (in this browser)',
    exportBtn: 'Export backup',
    importBtn: 'Import',
    resetBtn: 'Reset registry',
    saved: 'Registry saved',
    saveFailed: 'Save failed — try again',
    exported: 'Backup exported (droidex-backup.json)',
    imported: 'Registry imported',
    importInvalid: 'Invalid file — expected a Droidex export',
    importUnreadable: 'Could not read the file',
    importConfirm: 'Replace the current registry with the imported file?',
    resetConfirm: 'Erase the whole registry? This cannot be undone.',
    variants: 'variants',
    empty: 'No droid matches. Adjust your search or filter.',
    keepTag: 'Keep',
    owned: 'Owned',
    notOwned: 'Not owned',
    inBase: 'In base',
    notInBase: 'Not in base',
    ariaInBase: 'in base',
    ariaOwned: 'owned',
    ariaAbsent: 'absent',
    minInBase: 'min · in base',
    minNotInBase: 'min · not in base',
    minimum: 'minimum',
    credits: 'Credits required: <b>{0}</b> · a higher variant always satisfies the requirement',
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
      '· Without an account, everything stays in your browser. With an optional account, only your email ' +
      'and your registry are stored on our server, deletable at any time via “Delete my account”.'
  },
  fr: {
    _tiers: ['Basic','Or','Diamant','Arc-en-ciel','Beskar'],
    _tierShort: ['BAS','OR','DIA','ARC','BSK'],
    _rarities: {Common:'Commun',Rare:'Rare',Epic:'Épique',Legendary:'Légendaire',Mythic:'Mythique',Iconic:'Iconique'},
    title: 'Droidex — Registre du droïdesmith',
    h1: 'Droidex — Registre du droïdesmith',
    rbTitle: 'Prochaine renaissance visée',
    rbAria: 'Renaissance visée',
    rebirth: 'Renaissance',
    cycle: 'Cycle',
    cycleAria: 'Cycle de renaissance',
    unlocks: 'Débloque : {0}',
    collectionBonus: '{0} droïdes distincts possédés · bonus de collection +{1}% de revenus',
    filterWish: 'Recherchés',
    sortRarity: 'Tri : rareté',
    sortIncome: 'Tri : revenus',
    sortAria: 'Tri',
    byIncome: 'Par revenu Beskar',
    wishAria: 'Liste de recherche',
    flawAria: 'Flawless',
    searchPlaceholder: 'Chercher un droïde… (ex : R6)',
    searchAria: 'Recherche',
    hint: '1 appui = possédé (Droidex) · 2 appuis = ' + BASE_ICON + ' en base · 3 appuis = effacer',
    legendIcons: '★ = recherché (wishlist) · ✨ = Flawless obtenu (drop rare permanent)',
    wishTip: 'Ajouter à la wishlist (droïdes que tu chasses)',
    flawTip: 'Flawless obtenu : drop rare permanent (1/1000 Basic → 1/100 Beskar), conservé à vie dans le Droidex',
    filterAll: 'Tous',
    filterKeep: 'À garder',
    filterMissing: 'Manquants requis',
    filterBase: 'En base',
    loading: 'CHARGEMENT DU REGISTRE…',
    autoSave: 'Sauvegarde automatique activée (dans ce navigateur)',
    exportBtn: 'Exporter la sauvegarde',
    importBtn: 'Importer',
    resetBtn: 'Réinitialiser le registre',
    saved: 'Registre sauvegardé',
    saveFailed: 'Échec de sauvegarde — réessaie',
    exported: 'Sauvegarde exportée (droidex-backup.json)',
    imported: 'Registre importé',
    importInvalid: 'Fichier invalide — export Droidex attendu',
    importUnreadable: 'Lecture du fichier impossible',
    importConfirm: 'Remplacer le registre actuel par le contenu du fichier importé ?',
    resetConfirm: 'Effacer tout le registre ? Cette action est définitive.',
    variants: 'variantes',
    empty: 'Aucun droïde ne correspond. Modifie la recherche ou le filtre.',
    keepTag: 'À garder',
    owned: 'Possédé',
    notOwned: 'Non possédé',
    inBase: 'En base',
    notInBase: 'Pas en base',
    ariaInBase: 'en base',
    ariaOwned: 'possédé',
    ariaAbsent: 'absent',
    minInBase: 'min · en base',
    minNotInBase: 'min · pas en base',
    minimum: 'minimum',
    credits: 'Crédits requis : <b>{0}</b> · une variante supérieure valide toujours l’exigence',
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
