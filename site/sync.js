/* =========================================================================
   Synchronisation de compte via PocketBase (connexion Google).
   Optionnelle : si PB_URL est vide ou si le SDK n'est pas chargé, le site
   fonctionne exactement comme avant (localStorage seul).

   Modèle : localStorage reste le cache local (et le mode hors ligne) ;
   le serveur est la référence entre appareils, dernière écriture gagne.
   ========================================================================= */

let pb = null;
let syncRecordId = null;
let syncPushTimer = null;
/* `updated` PocketBase de la dernière version serveur vue par CET appareil :
   la garde anti-écrasement du push compare avant d'écrire (v1.9.0) */
let syncLastServerUpdated = null;

/* Quelle version est la plus fraîche ? savedAt (horodaté à chaque écriture,
   v1.9.0) ; repli sur le `updated` PocketBase pour les sauvegardes serveur
   d'avant ; un état local sans savedAt s'incline devant le compte (référence). */
function syncNewerSide(serverState, serverUpdated, localState){
  const serverAt = Date.parse((serverState && serverState.savedAt) ||
    String(serverUpdated || '').replace(' ', 'T')) || 0;
  const localAt = Date.parse(localState && localState.savedAt) || 0;
  return localAt > serverAt ? 'local' : 'server';
}

/* Filet de récupération : la version écartée par la résolution automatique
   est gardée localement (une seule case, écrasée à chaque résolution). */
function syncStashReplaced(replacedState, side){
  try{
    localStorage.setItem('droidex-rescue', JSON.stringify({
      side, at: new Date().toISOString(), state: replacedState
    }));
  }catch(e){ /* stockage plein : le filet saute, la synchro continue */ }
}

function syncHasLocalData(){
  return Object.keys(state.owned).length > 0 || Object.keys(state.inBase).length > 0;
}
function syncStatesEqual(a, b){
  /* normaliser les DEUX côtés avant de comparer : une sauvegarde serveur
     d'un ancien format (ex. 5 variantes avant la Galactique) est équivalente
     à l'état local migré — sans ça, le dialogue de conflit boucle à chaque
     visite tant que le serveur n'a pas été réécrit */
  const norm = s => {
    const n = normalizeParsedState(s || {});
    return JSON.stringify({
      owned:n.owned, inBase:n.inBase, targetRB:n.targetRB,
      targetCycle:n.targetCycle, flawless:n.flawless, wish:n.wish
    });
  };
  return norm(a) === norm(b);
}
function syncSetStatus(msg, isErr){
  const el = document.getElementById('syncStatus');
  const textEl = document.getElementById('syncStatusText');
  if(textEl) textEl.textContent = msg;
  else if(el) el.textContent = msg;
  if(el) el.classList.toggle('err', !!isErr);
}
function syncUpdateUI(){
  const logged = pb.authStore.isValid;
  document.getElementById('loginBtn').hidden = logged;
  document.getElementById('logoutBtn').hidden = !logged;
  document.getElementById('deleteAccountBtn').hidden = !logged;
  const lamp = document.getElementById('syncLamp');
  if(lamp) lamp.classList.toggle('on', logged);
  if(logged){
    const email = (pb.authStore.record && pb.authStore.record.email) || '';
    syncSetStatus(t('syncSynced') + ' · ' + email);
  }else{
    syncSetStatus(t('syncNotLogged'));
  }
}

/* Appelé par persistState() (app.js) à chaque modification locale. */
function syncNotifyLocalChange(){
  if(!pb || !pb.authStore.isValid) return;
  clearTimeout(syncPushTimer);
  syncPushTimer = setTimeout(syncPush, 1000);
}

async function syncPush(skipGuard){
  if(!pb || !pb.authStore.isValid) return;
  const userId = pb.authStore.record.id;
  const payload = { user: userId, data: state };
  try{
    if(syncRecordId){
      /* garde anti-écrasement : si le serveur a changé depuis la dernière
         synchro de CET appareil (autre appareil passé entre-temps), on
         réconcilie par fraîcheur au lieu d'écraser en aveugle */
      if(!skipGuard){
        try{
          const cur = await pb.collection('saves').getOne(syncRecordId);
          if(syncLastServerUpdated && cur.updated !== syncLastServerUpdated){
            await syncReconcile();
            return;
          }
        }catch(e){ if(e.status !== 404) throw e; }
      }
      try{
        const rec = await pb.collection('saves').update(syncRecordId, payload);
        syncLastServerUpdated = rec.updated;
      }catch(e){
        if(e.status === 404){ // supprimé ailleurs : on recrée
          syncRecordId = null;
          const rec = await pb.collection('saves').create(payload);
          syncRecordId = rec.id;
          syncLastServerUpdated = rec.updated;
        }else throw e;
      }
    }else{
      const rec = await pb.collection('saves').create(payload);
      syncRecordId = rec.id;
      syncLastServerUpdated = rec.updated;
    }
    syncUpdateUI();
  }catch(e){
    syncSetStatus(t('syncPushFailed'), true);
  }
}

async function syncFetchRecord(){
  const userId = pb.authStore.record.id;
  try{
    const rec = await pb.collection('saves').getFirstListItem('user="' + userId + '"');
    syncRecordId = rec.id;
    syncLastServerUpdated = rec.updated;
    return rec;
  }catch(e){
    if(e.status === 404) return null;
    throw e;
  }
}

function syncWhen(ts){
  const d = new Date(ts);
  if(isNaN(d)) return '—';
  return d.toLocaleString(LANG === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

/* Réconciliation à la connexion / au démarrage (v1.9.0 : plus de dialogue) :
   - serveur vide  -> le registre local devient la sauvegarde du compte ;
   - local vide    -> la sauvegarde du compte est chargée ;
   - les deux pleins et différents -> LA PLUS RÉCENTE GAGNE (savedAt, repli
     sur updated PocketBase), la version écartée est gardée en local dans
     droidex-rescue — aucune question posée, aucune perte silencieuse. */
async function syncReconcile(){
  const rec = await syncFetchRecord();
  const server = rec && rec.data && typeof rec.data === 'object' ? rec.data : null;
  if(!server || (!Object.keys(server.owned||{}).length && !Object.keys(server.inBase||{}).length)){
    if(syncHasLocalData() || !rec) await syncPush(true);
    return;
  }
  if(!syncHasLocalData() || syncStatesEqual(server, state)){
    applyParsedState(server);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderAll();
    return;
  }
  if(syncNewerSide(server, rec.updated, state) === 'server'){
    syncStashReplaced(state, 'local');
    applyParsedState(server);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderAll();
    syncSetStatus(t('syncNewerLoaded', syncWhen(server.savedAt || rec.updated)));
  }else{
    syncStashReplaced(server, 'server');
    await syncPush(true);
    syncSetStatus(t('syncNewerSent', syncWhen(state.savedAt)));
  }
}

async function syncLogin(){
  syncSetStatus(t('syncInProgress'));
  try{
    await pb.collection('users').authWithOAuth2({ provider: 'google' });
    syncUpdateUI();          /* avant la réconciliation : son message d'issue doit rester visible */
    await syncReconcile();
  }catch(e){
    syncSetStatus(t('syncLoginFailed'), true);
    setTimeout(syncUpdateUI, 4000);
  }
}
function syncLogout(){
  pb.authStore.clear();
  syncRecordId = null;
  syncUpdateUI();
}
async function syncDeleteAccount(){
  if(!confirm(t('syncDeleteConfirm'))) return;
  try{
    await pb.collection('users').delete(pb.authStore.record.id); // la sauvegarde est supprimée en cascade
    pb.authStore.clear();
    syncRecordId = null;
    syncUpdateUI();
    syncSetStatus(t('syncDeleted'));
  }catch(e){
    syncSetStatus(t('syncDeleteFailed'), true);
  }
}

(function initSync(){
  if(typeof PB_URL === 'undefined' || !PB_URL || typeof PocketBase === 'undefined') return;
  pb = new PocketBase(PB_URL);
  document.getElementById('loginBtn').addEventListener('click', syncLogin);
  document.getElementById('logoutBtn').addEventListener('click', syncLogout);
  document.getElementById('deleteAccountBtn').addEventListener('click', syncDeleteAccount);
  syncUpdateUI();
  if(pb.authStore.isValid){
    // rafraîchit le jeton et tire la sauvegarde du compte
    pb.collection('users').authRefresh()
      .then(()=>{ syncUpdateUI(); return syncReconcile(); })
      .catch(e=>{
        if(e && (e.status === 401 || e.status === 403)){ pb.authStore.clear(); syncUpdateUI(); }
        else syncSetStatus(t('syncOffline'), true);
      });
  }
})();
