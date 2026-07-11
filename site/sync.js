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

function syncHasLocalData(){
  return Object.keys(state.owned).length > 0 || Object.keys(state.inBase).length > 0;
}
function syncStatesEqual(a, b){
  const norm = s => JSON.stringify({
    owned:s.owned||{}, inBase:s.inBase||{}, targetRB:s.targetRB||1,
    targetCycle:s.targetCycle||1, flawless:s.flawless||{}, wish:s.wish||{}
  });
  return norm(a) === norm(b);
}
function syncSetStatus(msg, isErr){
  const el = document.getElementById('syncStatus');
  el.textContent = msg;
  el.classList.toggle('err', !!isErr);
}
function syncUpdateUI(){
  const bar = document.getElementById('syncBar');
  bar.hidden = false;
  const logged = pb.authStore.isValid;
  document.getElementById('loginBtn').hidden = logged;
  document.getElementById('logoutBtn').hidden = !logged;
  document.getElementById('deleteAccountBtn').hidden = !logged;
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

async function syncPush(){
  if(!pb || !pb.authStore.isValid) return;
  const userId = pb.authStore.record.id;
  const payload = { user: userId, data: state };
  try{
    if(syncRecordId){
      try{
        await pb.collection('saves').update(syncRecordId, payload);
      }catch(e){
        if(e.status === 404){ // supprimé ailleurs : on recrée
          syncRecordId = null;
          const rec = await pb.collection('saves').create(payload);
          syncRecordId = rec.id;
        }else throw e;
      }
    }else{
      const rec = await pb.collection('saves').create(payload);
      syncRecordId = rec.id;
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
    return rec;
  }catch(e){
    if(e.status === 404) return null;
    throw e;
  }
}

/* Réconciliation à la connexion / au démarrage :
   - serveur vide  -> le registre local devient la sauvegarde du compte ;
   - local vide    -> la sauvegarde du compte est chargée ;
   - les deux pleins et différents -> l'utilisateur choisit. */
async function syncReconcile(interactive){
  const rec = await syncFetchRecord();
  const server = rec && rec.data && typeof rec.data === 'object' ? rec.data : null;
  if(!server || (!Object.keys(server.owned||{}).length && !Object.keys(server.inBase||{}).length)){
    if(syncHasLocalData() || !rec) await syncPush();
    return;
  }
  if(!syncHasLocalData() || syncStatesEqual(server, state)){
    applyParsedState(server);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderAll();
    return;
  }
  const useServer = !interactive || confirm(t('syncConflict'));
  if(useServer){
    applyParsedState(server);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderAll();
  }else{
    await syncPush();
  }
}

async function syncLogin(){
  syncSetStatus(t('syncInProgress'));
  try{
    await pb.collection('users').authWithOAuth2({ provider: 'google' });
    await syncReconcile(true);
    syncUpdateUI();
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
      .then(()=>syncReconcile(true))
      .then(syncUpdateUI)
      .catch(e=>{
        if(e && (e.status === 401 || e.status === 403)){ pb.authStore.clear(); syncUpdateUI(); }
        else syncSetStatus(t('syncOffline'), true);
      });
  }
})();
